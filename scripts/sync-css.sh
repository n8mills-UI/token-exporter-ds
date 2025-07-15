#!/bin/bash
# scripts/sync-css.sh (v4.3 - Final with -L flag)

echo "🔄 Building ui.html from template..."

# --- File Paths ---
TEMPLATE_FILE="src/ui.template.html"
CSS_SOURCE_FILE="docs/design-system.css"
OUTPUT_FILE="src/ui.html"
TEMP_BUNDLE_FILE="temp-bundle.css"

# --- Validation ---
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi
if [ ! -f "$CSS_SOURCE_FILE" ]; then
    echo "❌ Error: CSS source file not found at $CSS_SOURCE_FILE"
    exit 1
fi

# --- Automated Bundling ---
echo "📦 Bundling CSS from external imports..."

# URLs that point to the raw CSS files
URL_SHOEALACE="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.12.0/cdn/themes/dark.css"
URL_OPENPROPS_STYLE="https://unpkg.com/open-props/open-props.min.css"
URL_OPENPROPS_NORMALIZE="https://unpkg.com/open-props/normalize.min.css"
URL_OPENPROPS_BUTTONS="https://unpkg.com/open-props/buttons.min.css"

# Clear or create the temporary bundle file
> "$TEMP_BUNDLE_FILE"

# Fetch external CSS content and append to the temporary file.
# The -L flag is CRITICAL to follow redirects from unpkg.com
echo "   - Fetching Shoelace..."
curl -sL "$URL_SHOEALACE" >> "$TEMP_BUNDLE_FILE"
echo "   - Fetching Open Props (Style)..."
curl -sL "$URL_OPENPROPS_STYLE" >> "$TEMP_BUNDLE_FILE"
echo "   - Fetching Open Props (Normalize)..."
curl -sL "$URL_OPENPROPS_NORMALIZE" >> "$TEMP_BUNDLE_FILE"
echo "   - Fetching Open Props (Buttons)..."
curl -sL "$URL_OPENPROPS_BUTTONS" >> "$TEMP_BUNDLE_FILE"

# Append your local CSS, but exclude the @import lines using grep -v
echo "   - Appending local styles from $CSS_SOURCE_FILE..."
grep -v '@import' "$CSS_SOURCE_FILE" >> "$TEMP_BUNDLE_FILE"

echo "✅ CSS bundling complete."

# --- Build Process ---
# 1. Create the new ui.html file with the <head> section
cat > "$OUTPUT_FILE" << EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Exporter v4.0.6</title>
    
    <!-- External Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js"></script>
    
    <!-- Injected CSS -->
    <style>
    /* === SYNCED & BUNDLED | $(date) === */
EOL

# 2. Inject the content of the temporary bundled CSS file
cat "$TEMP_BUNDLE_FILE" >> "$OUTPUT_FILE"

# 3. Close the <style> and <head> tags
echo "    </style>" >> "$OUTPUT_FILE"
echo "</head>" >> "$OUTPUT_FILE"

# 4. Directly append the entire template file, which contains the <body>
cat "$TEMPLATE_FILE" >> "$OUTPUT_FILE"

# 5. Append the final closing </html> tag
echo "</html>" >> "$OUTPUT_FILE"


# --- Cleanup ---
rm "$TEMP_BUNDLE_FILE"
echo "🧹 Cleaned up temporary files."

FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
echo "✅ Build complete: $OUTPUT_FILE (${FILE_SIZE} bytes)"
