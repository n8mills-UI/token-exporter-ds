#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🎨 Creating bundled CSS with Open Props inlined...\n');

// Read the original CSS with imports
const originalCssPath = path.join(__dirname, '..', 'docs', 'design-system.css');
let cssContent = fs.readFileSync(originalCssPath, 'utf8');

// Save original for backup
const backupPath = path.join(__dirname, '..', 'docs', 'design-system.backup.css');
fs.writeFileSync(backupPath, cssContent);
console.log('📦 Backup created: design-system.backup.css');

// Define the Open Props files to inline
const openPropsFiles = [
    'open-props.min.css',
    'normalize.min.css', 
    'buttons.min.css'
];

// Read all Open Props content
let openPropsContent = '';
for (const file of openPropsFiles) {
    const filePath = path.join(__dirname, '..', 'vendor', 'open-props', file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        openPropsContent += `\n/* === Bundled from ${file} === */\n${content}\n`;
        console.log(`  ✓ Bundled: ${file} (${Math.round(content.length / 1024)}KB)`);
    } else {
        console.log(`  ⚠️  Missing: ${file}`);
    }
}

// Remove the @import statements and add Open Props at the top (after the header)
const importRegex = /@import\s+url\([^)]+\);\s*/g;
cssContent = cssContent.replace(importRegex, '');

// Find where to insert (after the header comments)
const insertPoint = cssContent.indexOf('/* 1. Import Open Props');
if (insertPoint !== -1) {
    const beforeImport = cssContent.substring(0, insertPoint);
    const afterImport = cssContent.substring(insertPoint);
    
    // Skip past the import section to the actual content
    const baseStylesStart = afterImport.indexOf('/* \n==========================================================================');
    const restOfCss = baseStylesStart !== -1 ? afterImport.substring(baseStylesStart) : afterImport;
    
    cssContent = beforeImport + 
                 '/* Open Props - Bundled inline for GitHub Pages compatibility */\n' +
                 openPropsContent + 
                 '\n/* End of Open Props bundle */\n\n' +
                 restOfCss;
}

// Write the bundled CSS
fs.writeFileSync(originalCssPath, cssContent);

// Verify the bundle
const finalSize = Math.round(cssContent.length / 1024);
const varCount = (cssContent.match(/--[\w-]+:/g) || []).length;

console.log(`\n✨ CSS bundling complete!`);
console.log(`  📊 Final size: ${finalSize}KB`);
console.log(`  🎯 CSS variables defined: ${varCount}`);
console.log(`  📁 Output: docs/design-system.css`);
console.log(`\n✅ Ready for deployment to GitHub Pages!`);