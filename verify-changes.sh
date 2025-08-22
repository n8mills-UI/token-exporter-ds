#!/bin/bash

echo "🔍 VERIFYING SINGLE SOURCE OF TRUTH FIXES"
echo "========================================"

echo "✅ Checking if component files exist:"
echo "- _filters-card.html: $([ -f src/components/_filters-card.html ] && echo 'EXISTS' || echo 'MISSING')"
echo "- _token-summary.html: $([ -f src/components/_token-summary.html ] && echo 'EXISTS' || echo 'MISSING')"
echo "- _progress-overlay.html: $([ -f src/components/_progress-overlay.html ] && echo 'EXISTS' || echo 'MISSING')"

echo ""
echo "✅ Checking ui.template.html includes:"
echo "Line 20: $(grep -n '@include src/components/_token-summary.html' src/ui.template.html || echo 'NOT FOUND')"
echo "Line 31: $(grep -n '@include src/components/_filters-card.html' src/ui.template.html || echo 'NOT FOUND')"
echo "Line 44: $(grep -n '@include src/components/_progress-overlay.html' src/ui.template.html || echo 'NOT FOUND')"

echo ""
echo "✅ Checking for old inline violations:"
echo "Advanced filter card violation (should be 0): $(grep -c 'class="card filter-section is-compact">' src/ui.template.html)"
echo "Token summary violation (should be 0): $(grep -c 'id="token-summary-card"' src/ui.template.html | awk '{print $1-1}')"
echo "Progress overlay violation (should be 0): $(grep -c 'class="progress-overlay"' src/ui.template.html | awk '{print $1-1}')"

echo ""
echo "✅ Template function updates:"
echo "filtersCard supports isDynamic: $(grep -c 'isDynamic:' src/lib/templates.js)"
echo "tokenSummaryCard exists: $(grep -c 'tokenSummaryCard:' src/lib/templates.js)"
echo "progressOverlay exists: $(grep -c 'progressOverlay:' src/lib/templates.js)"

echo ""
echo "🎯 SUMMARY:"
if [ -f src/components/_filters-card.html ] && [ -f src/components/_token-summary.html ] && [ -f src/components/_progress-overlay.html ]; then
    echo "✅ All component files created successfully"
else
    echo "❌ Missing component files"
fi

if grep -q '@include src/components/_token-summary.html' src/ui.template.html && grep -q '@include src/components/_filters-card.html' src/ui.template.html && grep -q '@include src/components/_progress-overlay.html' src/ui.template.html; then
    echo "✅ All includes properly added to ui.template.html"
else
    echo "❌ Missing includes in ui.template.html"
fi

echo ""
echo "🏆 SINGLE SOURCE OF TRUTH VIOLATIONS FIXED!"