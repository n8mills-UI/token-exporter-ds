#!/bin/bash
# scripts/sync-css.sh (v3.1 - With safety checks)

echo "🔄 Building ui.html from template..."

# --- File Paths ---
TEMPLATE_FILE="src/ui.template.html"
CSS_SOURCE_FILE="docs/design-system.css"
OUTPUT_FILE="src/ui.html"

# --- Validation ---
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Error: Template file not found at $TEMPLATE_FILE"
    exit 1
fi
if [ ! -f "$CSS_SOURCE_FILE" ]; then
    echo "❌ Error: CSS source file not found at $CSS_SOURCE_FILE"
    exit 1
fi

# --- Optional: Backup existing file ---
if [ -f "$OUTPUT_FILE" ]; then
    cp "$OUTPUT_FILE" "${OUTPUT_FILE}.backup"
    echo "📦 Backed up existing ui.html"
fi

# --- Build Process (your existing code) ---
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
    /* === SYNCED FROM $CSS_SOURCE_FILE | $(date) === */
EOL

cat "$CSS_SOURCE_FILE" >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << EOL
    </style>
</head>
EOL

cat "$TEMPLATE_FILE" >> "$OUTPUT_FILE"
echo "</html>" >> "$OUTPUT_FILE"

# --- Optional: Sanity check file size ---
FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat -c%s "$OUTPUT_FILE" 2>/dev/null)
if [ "$FILE_SIZE" -gt 1048576 ]; then  # 1MB
    echo "⚠️  Warning: Generated file is larger than 1MB (${FILE_SIZE} bytes)"
fi

echo "✅ Build complete: $OUTPUT_FILE (${FILE_SIZE} bytes)"
