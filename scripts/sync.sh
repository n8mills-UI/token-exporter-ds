#!/bin/bash
# Token Exporter Unified Build Script (v1.3 - Self-Documenting)
# This script automates the entire build process for the Token Exporter plugin.
# It bundles CSS and injects HTML partials into template files to generate final assets.

# --- CONFIGURATION ---
# Exit immediately if any command fails, preventing partial or broken builds.
set -e

# Define the primary source file for all styles. All paths are relative to the project root.
CSS_SOURCE_FILE="docs/design-system.css"
# Define the name for the temporary, bundled CSS file created during the build.
TEMP_CSS_BUNDLE="temp_css_bundle.css"

# Define the source templates and their final output destinations.
UI_TEMPLATE="src/ui.template.html"
GUIDE_TEMPLATE="docs/design-system-guide.template.html"

# --- CLEANUP FUNCTION ---
# This 'trap' is a powerful Bash feature. It ensures that no matter how the script exits
# (on success or on error), the cleanup function will be called. This prevents
# temporary files from being left in the project directory.
cleanup() {
  echo "   -> Running cleanup..."
  rm -f "$TEMP_CSS_BUNDLE"
  # Also find and remove any stray .temp files that might be left from a failed run.
  find . -name "*.temp" -type f -delete
  echo "   -> Cleanup complete."
}
trap cleanup EXIT

echo "🚀 Starting Token Exporter build process (v1.3)..."

# --- STAGE 1: CSS BUNDLING ---
echo "   [1/3] Bundling all CSS into a single file..."
# Create or clear the temporary bundle file to ensure a fresh build every time.
> "$TEMP_CSS_BUNDLE"

# Find all @import rules in the source CSS, extract the URLs, and fetch their content.
grep '@import url(' "$CSS_SOURCE_FILE" | grep -o 'https://[^)]*' | while read -r url; do
    echo "     - Fetching external style: $url"
    # The -sSL flags make curl silent, show errors, and follow redirects (critical for unpkg).
    curl -sSL "$url" >> "$TEMP_CSS_BUNDLE"
    echo "" >> "$TEMP_CSS_BUNDLE" # Add a newline for readability between bundled files.
done

# Append our local styles, excluding the @import rules which have already been processed.
echo "     - Appending local styles from $CSS_SOURCE_FILE..."
grep -v '@import' "$CSS_SOURCE_FILE" >> "$TEMP_CSS_BUNDLE"
echo "   ✅ CSS bundled successfully."

# --- STAGE 2: HTML GENERATION ---
echo "   [2/3] Building final HTML files from templates..."

# --- Build the Plugin UI (Special Case: Body-only template) ---
UI_OUTPUT="src/ui.html"
echo "     - Building plugin UI: $UI_OUTPUT"
# 1. Create the output file from scratch and write the complete head structure.
#    The bundled CSS content is injected directly inside the <style> tags.
cat > "$UI_OUTPUT" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Exporter</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js"></script>
    <style>
/* --- BUNDLED CSS | $(date) --- */
$(cat $TEMP_CSS_BUNDLE)
    </style>
</head>
EOL
# 2. Append the content of our body-only template file.
cat "$UI_TEMPLATE" >> "$UI_OUTPUT"
# 3. Append the final closing tag to complete the document.
echo "</html>" >> "$UI_OUTPUT"
echo "       - Injected CSS and wrapped with full HTML structure."

# --- Build the Design System Guide (Full HTML template) ---
GUIDE_OUTPUT="docs/design-system-guide.html"
echo "     - Building design system guide: $GUIDE_OUTPUT"
# Start by simply copying the full template file to the output destination.
cp "$GUIDE_TEMPLATE" "$GUIDE_OUTPUT"

# --- Inject HTML Partials into BOTH generated files ---
# This loop processes both output files, ensuring consistency.
for output_file in "$UI_OUTPUT" "$GUIDE_OUTPUT"; do
    if [ ! -f "$output_file" ]; then continue; fi
    
    # Use a temporary file for replacements to avoid issues with reading and writing to the same file.
    temp_build_file="${output_file}.temp"
    mv "$output_file" "$temp_build_file"

    # Loop as long as there are @include placeholders to replace.
    while grep -q "<!-- @include .* -->" "$temp_build_file"; do
        placeholder=$(grep -m 1 "<!-- @include .* -->" "$temp_build_file")
        partial_file=$(echo "$placeholder" | sed -n 's/<!-- @include \(.*\) -->/\1/p')

        if [ -f "$partial_file" ]; then
            echo "       - Injecting partial '$partial_file' into '$output_file'"
            # Use awk for a robust, line-by-line replacement of the placeholder with the partial's content.
            awk -v partial_content="$(cat "$partial_file")" -v p_holder="$placeholder" '
            $0 == p_holder { print partial_content; next }
            { print }' "$temp_build_file" > "$output_file"
            mv "$output_file" "$temp_build_file"
        else
            # If a partial is not found, fail the build loudly and immediately.
            echo "       - ❌ ERROR: Partial not found: $partial_file. Build failed."
            exit 1
        fi
    done
    mv "$temp_build_file" "$output_file"
done
echo "   ✅ HTML generation complete."

# --- STAGE 3: FINAL MESSAGE ---
echo "   [3/3] Build process finished."
# The 'trap' at the top of the script will handle the final cleanup automatically.