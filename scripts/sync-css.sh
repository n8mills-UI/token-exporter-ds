#!/bin/bash
# scripts/sync-css.sh

echo "🔄 Syncing design-system.css to ui.html..."

# Validate source file exists
if [ ! -f "design-system.css" ]; then
    echo "❌ Error: design-system.css not found"
    exit 1
fi

# Validate target file exists
if [ ! -f "src/ui.html" ]; then
    echo "❌ Error: src/ui.html not found"
    exit 1
fi

# Create backup
cp src/ui.html src/ui.html.backup

# Prepare CSS content for insertion with indentation
{
    echo "  <style>"
    echo "  /* === SYNCED FROM design-system.css | $(date) === */"
    sed 's/^/  /' design-system.css
    echo "  /* === END SYNCED CSS === */"
    echo "  </style>"
} > temp-style-block.txt

# Replace content between style markers in ui.html
awk '
BEGIN { p=1 }
// { print; system("cat temp-style-block.txt"); p=0 }
// { p=1 }
p { print }
' src/ui.html > src/ui.html.new

# Replace original file and cleanup
mv src/ui.html.new src/ui.html
rm temp-style-block.txt

echo "✅ CSS successfully synced to ui.html"
echo "📁 Backup saved as ui.html.backup"