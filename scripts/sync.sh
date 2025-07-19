#!/bin/bash
# Token Exporter Unified Build Script (v1.4 - Corrected Guide Build)
# This script automates the entire build process for the Token Exporter plugin.
# It bundles CSS and injects HTML partials into template files to generate final assets.

# --- CONFIGURATION ---
set -e # Exit immediately if any command fails.
CSS_SOURCE_FILE="docs/design-system.css"
TEMP_CSS_BUNDLE="temp_css_bundle.css"
UI_TEMPLATE="src/ui.template.html"
GUIDE_TEMPLATE="docs/design-system-guide.template.html"

# --- CLEANUP FUNCTION ---
cleanup() {
  echo "   -> Running cleanup..."
  rm -f "$TEMP_CSS_BUNDLE"
  find . -name "*.temp" -type f -delete
  echo "   -> Cleanup complete."
}
trap cleanup EXIT

echo "🚀 Starting Token Exporter build process (v1.4)..."

# --- STAGE 1: CSS BUNDLING ---
echo "   [1/3] Bundling CSS for the plugin..."
> "$TEMP_CSS_BUNDLE"
grep '@import url(' "$CSS_SOURCE_FILE" | grep -o 'https://[^)]*' | while read -r url; do
    echo "     - Fetching external style: $url"
    curl -sSL "$url" >> "$TEMP_CSS_BUNDLE"
    echo "" >> "$TEMP_CSS_BUNDLE"
done
echo "     - Appending local styles from $CSS_SOURCE_FILE..."
grep -v '@import' "$CSS_SOURCE_FILE" >> "$TEMP_CSS_BUNDLE"
echo "   ✅ CSS bundled successfully."

# --- STAGE 2: HTML GENERATION ---
echo "   [2/3] Building final HTML files from templates..."

# --- Build the Plugin UI ---
UI_OUTPUT="src/ui.html"
echo "     - Building plugin UI: $UI_OUTPUT"
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
cat "$UI_TEMPLATE" >> "$UI_OUTPUT"
echo "</html>" >> "$UI_OUTPUT"
echo "       - Injected CSS and wrapped with full HTML structure."

# --- Build the Design System Guide ---
GUIDE_OUTPUT="docs/design-system-guide.html"
echo "     - Building design system guide: $GUIDE_OUTPUT"
# This now correctly copies the full template, which already contains the <link> tag.
cp "$GUIDE_TEMPLATE" "$GUIDE_OUTPUT"
echo "       - Copied template. Now injecting partials..."

# --- Inject HTML Partials into BOTH generated files ---
for output_file in "$UI_OUTPUT" "$GUIDE_OUTPUT"; do
    if [ ! -f "$output_file" ]; then continue; fi
    
    temp_build_file="${output_file}.temp"
    mv "$output_file" "$temp_build_file"

    while grep -q "<!-- @include .* -->" "$temp_build_file"; do
        placeholder=$(grep -m 1 "<!-- @include .* -->" "$temp_build_file")
        partial_file=$(echo "$placeholder" | sed -n 's/<!-- @include \(.*\) -->/\1/p')

        if [ -f "$partial_file" ]; then
            echo "       - Injecting partial '$partial_file' into '$output_file'"
            awk -v partial_content="$(cat "$partial_file")" -v p_holder="$placeholder" '
            $0 == p_holder { print partial_content; next }
            { print }' "$temp_build_file" > "$output_file"
            mv "$output_file" "$temp_build_file"
        else
            echo "       - ❌ ERROR: Partial not found: $partial_file. Build failed."
            exit 1
        fi
    done
    mv "$temp_build_file" "$output_file"
done
echo "   ✅ HTML generation complete."

# --- STAGE 3: FINAL MESSAGE ---
echo "   [3/3] Build process finished."