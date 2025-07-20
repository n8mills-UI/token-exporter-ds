#!/bin/bash
# Token Exporter Build Script (v2.1 - Unified Build Logic)
# This version uses a consistent, from-scratch build process for all HTML files.

# Exit on any error, undefined variable, or pipe failure
set -euo pipefail

# --- CONFIGURATION ---
CSS_SOURCE_FILE="docs/design-system.css"
TEMP_CSS_BUNDLE="temp_css_bundle.css"
UI_TEMPLATE="src/ui.template.html"
GUIDE_TEMPLATE="docs/design-system-guide.template.html"
UI_OUTPUT="src/ui.html"
GUIDE_OUTPUT="docs/design-system-guide.html"

# --- CLEANUP FUNCTION ---
cleanup() {
    rm -f "$TEMP_CSS_BUNDLE"
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
echo "   [1/3] Bundling CSS for the plugin UI..."
> "$TEMP_CSS_BUNDLE"
grep -v '@import' "$CSS_SOURCE_FILE" >> "$TEMP_CSS_BUNDLE"
while IFS= read -r url; do
    if [ -n "$url" ]; then
        echo "     - Fetching: $url"
        curl -sSL --max-time 30 "$url" >> "$TEMP_CSS_BUNDLE" && echo "" >> "$TEMP_CSS_BUNDLE" || echo "       ✗ Failed to fetch"
    fi
done < <(grep '@import url(' "$CSS_SOURCE_FILE" | grep -o 'https://[^")]*')
echo "   ✅ CSS bundled successfully."

# --- STAGE 2: HTML GENERATION (FROM TEMPLATES) ---
echo "   [2/3] Generating final HTML from templates..."
# Create temporary, empty output files
> "$UI_OUTPUT"
> "$GUIDE_OUTPUT"

# Process the UI template first
process_template "$UI_TEMPLATE" "$UI_OUTPUT.temp"
# Process the Guide template second
process_template "$GUIDE_TEMPLATE" "$GUIDE_OUTPUT.temp"

# --- STAGE 3: FINAL ASSEMBLY ---
echo "   [3/3] Assembling final files..."

# Assemble ui.html (with inlined CSS)
{
    # Read the processed template line by line until the </head> tag
    awk '/<\/head>/ {exit} {print}' "$UI_OUTPUT.temp"
    # Inject the bundled CSS
    echo "    <style>"
    cat "$TEMP_CSS_BUNDLE"
    echo "    </style>"
    # Print the rest of the file from </head> onwards
    awk 'BEGIN {p=0} /<\/head>/ {p=1} p' "$UI_OUTPUT.temp"
} > "$UI_OUTPUT"
echo "   ✅ Assembled plugin UI: $UI_OUTPUT"

# Assemble design-system-guide.html (just move the processed file)
mv "$GUIDE_OUTPUT.temp" "$GUIDE_OUTPUT"
echo "   ✅ Assembled design system guide: $GUIDE_OUTPUT"

echo ""
echo "🎉 Build complete!"