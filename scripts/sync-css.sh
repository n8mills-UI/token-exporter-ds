#!/bin/bash
# scripts/sync-css.sh

echo "🔄 Syncing CSS from docs/ to src/ui.html..."

# Define paths relative to the project root
CSS_SOURCE_FILE="docs/design-system.css"
UI_HTML_FILE="src/ui.html"

# Validate source file exists
if [ ! -f "$CSS_SOURCE_FILE" ]; then
    echo "❌ Error: Source file not found at $CSS_SOURCE_FILE"
    exit 1
fi

# Validate target file exists
if [ ! -f "$UI_HTML_FILE" ]; then
    echo "❌ Error: Target file not found at $UI_HTML_FILE"
    exit 1
fi

# Create backup
cp "$UI_HTML_FILE" "$UI_HTML_FILE.backup"

# Prepare CSS content for insertion
{
    echo "  <style>"
    echo "  /* === SYNCED FROM $CSS_SOURCE_FILE | $(date) === */"
    sed 's/^/  /' "$CSS_SOURCE_FILE"
    echo "  /* === END SYNCED CSS === */"
    echo "  </style>"
} > temp-style-block.txt

# Replace content between style markers in ui.html
awk '
BEGIN { p=1 }
// { print; system("cat temp-style-block.txt"); p=0 }
// { p=1 }
p { print }
' "$UI_HTML_FILE" > "$UI_HTML_FILE.new"

# Replace original file and cleanup
mv "$UI_HTML_FILE.new" "$UI_HTML_FILE"
rm temp-style-block.txt

echo "✅ CSS successfully synced to ui.html"
echo "📁 Backup saved as $UI_HTML_FILE.backup"