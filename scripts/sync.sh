#!/bin/bash
# Token Exporter Build Script (v2.1 - Unified Build Logic)
# This version uses a consistent, from-scratch build process for all HTML files.

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
# A robust function to process a template and inject all partials.
# It reads the template and writes the final, processed output to a new file.
process_template() {
    local template_file="$1"
    local output_file="$2"

    # Ensure the template exists
    if [ ! -f "$template_file" ]; then
        echo "   ❌ ERROR: Template file not found: $template_file"
        return 1
    fi

    # Create a temporary file for processing
    local temp_processed_file="${output_file}.temp"
    cp "$template_file" "$temp_processed_file"

    # Find and inject each partial
    while IFS= read -r placeholder; do
        if [ -z "$placeholder" ]; then continue; fi

        local partial_file
        partial_file=$(echo "$placeholder" | sed -n 's/.*<!-- @include \(.*\) -->.*/\1/p' | xargs)

        if [ -z "$partial_file" ]; then
            echo "       ⚠️  WARNING: Could not extract file from: $placeholder"
            continue
        fi

        if [ -f "$partial_file" ]; then
            # Use awk for safe, line-by-line replacement
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
            # Do not exit, just report. Allows build to continue if one partial is missing.
        fi
    done < <(grep "<!-- @include .* -->" "$temp_processed_file" || true)

    # Move the final processed file to its destination
    mv "$temp_processed_file" "$output_file"
    echo "       ✓ Processed template and injected partials into $(basename "$output_file")"
}


# --- MAIN BUILD PROCESS ---
echo "🚀 Starting Token Exporter build process (v2.1)..."

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

# --- STAGE 2: JAVASCRIPT BUNDLING ---
echo "   [2/4] Bundling JavaScript for the plugin UI..."
> "$TEMP_JS_BUNDLE"
echo "       DEBUG: Looking for script tags in $UI_TEMPLATE"
script_urls=$(grep '<script src=' "$UI_TEMPLATE" | grep -o 'https://[^"]*' || echo "")
if [ -z "$script_urls" ]; then
    echo "       ⚠️  No external script URLs found"
else
    echo "$script_urls" | while IFS= read -r url; do
        if [ -n "$url" ]; then
            echo "     - Fetching: $url"
            if curl -sSL --max-time 30 "$url" >> "$TEMP_JS_BUNDLE"; then
                echo "" >> "$TEMP_JS_BUNDLE"
                echo "       ✓ Successfully fetched $url"
            else
                echo "       ✗ Failed to fetch $url"
            fi
        fi
    done
fi
echo "   ✅ JavaScript bundling stage completed. Bundle size: $(wc -c < "$TEMP_JS_BUNDLE" 2>/dev/null || echo "0") bytes"

# --- STAGE 3: HTML GENERATION (FROM TEMPLATES) ---
echo "   [3/4] Generating final HTML from templates..."
# Create temporary, empty output files
> "$UI_OUTPUT"
> "$GUIDE_OUTPUT"

# Process the UI template first
process_template "$UI_TEMPLATE" "$UI_OUTPUT.temp"
# Process the Guide template second
process_template "$GUIDE_TEMPLATE" "$GUIDE_OUTPUT.temp"

# --- STAGE 4: FINAL ASSEMBLY ---
echo "   [4/4] Assembling final files..."

# Assemble ui.html (with inlined CSS and JS)
{
    # Start with basic HTML structure
    echo "<!DOCTYPE html>"
    echo "<html lang=\"en\">"
    echo "<head>"
    echo "    <meta charset=\"UTF-8\">"
    echo "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
    echo "    <title>Token Exporter</title>"
    echo "    <style>"
    cat "$TEMP_CSS_BUNDLE"
    echo "    </style>"
    echo "    <script>"
    cat "$TEMP_JS_BUNDLE"
    echo "    </script>"
    echo "</head>"
    # Remove the external script tag and print the body
    sed '/<script src=/d' "$UI_OUTPUT.temp"
    echo "</html>"
} > "$UI_OUTPUT"
echo "   ✅ Assembled plugin UI: $UI_OUTPUT"

# Assemble design-system-guide.html (with inlined CSS)
{
    # Process line by line, replacing CSS link with inline styles
    while IFS= read -r line; do
        if [[ "$line" =~ \<link.*stylesheet.*href=\"design-system\.css\"\> ]]; then
            echo "        <style>"
            cat "$CSS_SOURCE_FILE"
            echo "        </style>"
        else
            echo "$line"
        fi
    done < "$GUIDE_OUTPUT.temp"
} > "$GUIDE_OUTPUT"
echo "   ✅ Assembled design system guide with inlined CSS: $GUIDE_OUTPUT"

echo ""
echo "🎉 Build complete!"