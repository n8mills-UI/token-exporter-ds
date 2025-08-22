#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import templates - handle both ES6 and CommonJS
let templates;
try {
  // Try ES6 import first
  const templateModule = require('../src/lib/templates.js');
  templates = templateModule.templates;
} catch (error) {
  console.error('Failed to load templates:', error.message);
  process.exit(1);
}

if (!templates) {
  console.error('Templates not found in module export');
  process.exit(1);
}

// Ensure components directory exists
const componentsDir = path.join(__dirname, '../src/components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

console.log('🔧 Building components from templates...');

// Generate filters card with dynamic mode for plugin
const filtersCardDynamic = templates.filtersCard({
  isDynamic: true,
  showBackButton: true,
  showHeader: true
});

fs.writeFileSync(
  path.join(componentsDir, '_filters-card.html'),
  filtersCardDynamic
);
console.log('✅ Generated _filters-card.html (dynamic mode)');

// Generate token summary card with dynamic mode for plugin
const tokenSummaryDynamic = templates.tokenSummaryCard({
  isDynamic: true
});

fs.writeFileSync(
  path.join(componentsDir, '_token-summary.html'),
  tokenSummaryDynamic
);
console.log('✅ Generated _token-summary.html (dynamic mode)');

// Generate progress overlay
const progressOverlay = templates.progressOverlay({
  id: 'progress-overlay',
  isVisible: false
});

fs.writeFileSync(
  path.join(componentsDir, '_progress-overlay.html'),
  progressOverlay
);
console.log('✅ Generated _progress-overlay.html');

console.log('🎉 All components generated successfully!');