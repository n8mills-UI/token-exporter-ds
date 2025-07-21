#!/bin/bash
# Token Exporter Build Script (v2.2 - JS Bundling & Full HTML Assembly)
# This version fetches and inlines both CSS and JS, and correctly builds
# the ui.html file from a partial template.

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# --- CONFIGURATION ---
CSS_SOURCE_FILE="docs/design-system.css"
TEMP_CSS_BUNDLE="temp_css_bundle.css"
TEMP_JS_BUNDLE="temp_js_bundle.js"
UI_TEMPLATE="src/ui.template.html"
GUIDE_TEMPLATE="docs/design-system-guide.template.html"
UI_OUTPUT="src/ui.html"
GUIDE_OUTPUT="docs/design-system-guide.html"

# --- CLEANUP FUNCTION ---
cleanup() {
    rm -f "$TEMP_CSS_BUNDLE"
    rm -f "$TEMP_JS_BUNDLE"
    find . -name "*.temp" -type f -delete
}
trap cleanup EXIT HUP INT QUIT TERM

# --- HELPER: INJECT PARTIALS ---
process_template() {
    local template_file="$1"
    local output_file="$2"
    if [ ! -f "$template_file" ]; then
        echo "   ❌ ERROR: Template file not found: $template_file"
        return 1
    fi
    local temp_processed_file="${output_file}.temp"
    cp "$template_file" "$temp_processed_file"
    while IFS= read -r placeholder; do
        if [ -z "$placeholder" ]; then continue; fi
        local partial_file
        partial_file=$(echo "$placeholder" | sed -n 's/.*<!-- @include \(.*\) -->.*/\1/p' | xargs)
        if [ -z "$partial_file" ]; then
            echo "       ⚠️  WARNING: Could not extract file from: $placeholder"
            continue
        fi
        if [ -f "$partial_file" ]; then
            awk -v pf="$partial_file" -v ph="$placeholder" '
                $0 == ph {
                    while ((getline line < pf) > 0) { print line }
                    close(pf)
                    next
                }
                { print }
            ' "$temp_processed_file" > "${temp_processed_file}.new"
            mv "${temp_processed_file}.new" "$temp_processed_file"
        else
            echo "       ❌ ERROR: Partial not found: $partial_file"
        fi
    done < <(grep "<!-- @include .* -->" "$temp_processed_file" || true)
    mv "$temp_processed_file" "$output_file"
    echo "       ✓ Processed template and injected partials into $(basename "$output_file")"
}

# --- MAIN BUILD PROCESS ---
echo "🚀 Starting Token Exporter build process (v2.2)..."

# --- STAGE 1: CSS BUNDLING ---
echo "   [1/4] Bundling CSS for the plugin UI..."
> "$TEMP_CSS_BUNDLE"
grep -v '@import' "$CSS_SOURCE_FILE" >> "$TEMP_CSS_BUNDLE"
while IFS= read -r url; do
    if [ -n "$url" ]; then
        echo "     - Fetching: $url"
        curl -sSL --max-time 30 "$url" >> "$TEMP_CSS_BUNDLE" && echo "" >> "$TEMP_CSS_BUNDLE" || echo "       ✗ Failed to fetch"
    fi
done < <(grep '@import url(' "$CSS_SOURCE_FILE" | grep -o 'https://[^")]*')
echo "   ✅ CSS bundled successfully."

# --- STAGE 2: JAVASCRIPT BUNDLING (NEW) ---
echo "   [2/4] Bundling JavaScript for the plugin UI..."
> "$TEMP_JS_BUNDLE"
while IFS= read -r url; do
    if [ -n "$url" ]; then
        echo "     - Fetching: $url"
        curl -sSL --max-time 30 "$url" >> "$TEMP_JS_BUNDLE" && echo "" >> "$TEMP_JS_BUNDLE" || echo "       ✗ Failed to fetch"
    fi
done < <(grep '<script src=' "$UI_TEMPLATE" | grep -o 'https://[^"]*')
echo "   ✅ JavaScript bundled successfully."

# --- STAGE 3: HTML GENERATION (FROM TEMPLATES) ---
echo "   [3/4] Generating final HTML from templates..."
> "$UI_OUTPUT"
> "$GUIDE_OUTPUT"
process_template "$UI_TEMPLATE" "$UI_OUTPUT.temp"
process_template "$GUIDE_TEMPLATE" "$GUIDE_OUTPUT.temp"

# --- STAGE 4: FINAL ASSEMBLY ---
echo "   [4/4] Assembling final files..."

# Assemble ui.html (CORRECTED LOGIC)
{
    echo "<!DOCTYPE html>"
    echo "<html lang=\"en\">"
    echo "<head>"
    echo "    <meta charset=\"UTF-8\">"
    echo "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
    echo "    <title>Token Exporter</title>"
    echo "    <style>"
    cat "$TEMP_CSS_BUNDLE"
    echo "    </style>"
    # Inject the bundled JS into the head
    echo "    <script>"
    cat "$TEMP_JS_BUNDLE"
    echo "    </script>"
    echo "</head>"
    # Now, append the processed body content from the template
    sed '/<script src=/d' "$UI_OUTPUT.temp" # This removes the original <script src> line
    echo "</html>"
} > "$UI_OUTPUT"
echo "   ✅ Assembled plugin UI: $UI_OUTPUT"

# Assemble design-system-guide.html
mv "$GUIDE_OUTPUT.temp" "$GUIDE_OUTPUT"
echo "   ✅ Assembled design system guide: $GUIDE_OUTPUT"

echo ""
echo "🎉 Build complete!"