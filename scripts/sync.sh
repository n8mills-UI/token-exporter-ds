#!/bin/bash
# Token Exporter Unified Build Script (v1.5 - Definitive)
# This script is the single source of truth for building all project assets.
# It bundles CSS, intelligently builds different HTML targets, and injects
# reusable HTML partials to ensure consistency across the project.

# --- CONFIGURATION ---
# The 'set -e' command ensures that the script will exit immediately if any command fails.
# This is a critical safety measure to prevent partial or broken builds.
set -e

# Define the primary source file for all styles. All paths are relative to the project root.
CSS_SOURCE_FILE="docs/design-system.css"
# Define the name for the temporary, bundled CSS file created during the build.
TEMP_CSS_BUNDLE="temp_css_bundle.css"

# Define the source templates. These are the files you, the developer, will edit.
UI_TEMPLATE="src/ui.template.html"
GUIDE_TEMPLATE="docs/design-system-guide.template.html"

# --- CLEANUP FUNCTION & TRAP ---
# This 'trap' is a powerful Bash feature. It ensures that no matter how the script exits
# (on success or on error), the cleanup function will be called. This prevents
# temporary files from being left in the project directory.
cleanup() {
  echo "   -> Running cleanup..."
  rm -f "$TEMP_CSS_BUNDLE"
  find . -name "*.temp" -type f -delete
  echo "   -> Cleanup complete."
}
trap cleanup EXIT

echo "🚀 Starting Token Exporter build process (v1.5)..."

# --- STAGE 1: CSS BUNDLING ---
echo "   [1/3] Bundling CSS for the plugin..."
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

# --- Build the Plugin UI (Strategy: Wrap and Inject) ---
# For the plugin, we must inject all CSS directly into a <style> tag to comply with Figma's security policy.
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

# --- Build the Design System Guide (Strategy: Copy and Link) ---
# For the guide, we can use a standard <link> tag, which is more efficient for browsers.
GUIDE_OUTPUT="docs/design-system-guide.html"
echo "     - Building design system guide: $GUIDE_OUTPUT"
# The .template.html file already contains the correct <link> tag, so we just copy it.
cp "$GUIDE_TEMPLATE" "$GUIDE_OUTPUT"
echo "       - Copied template. Now injecting partials..."

# --- Inject HTML Partials into BOTH generated files ---
# This loop runs on both output files, ensuring all @include tags are processed.
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