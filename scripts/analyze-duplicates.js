#!/usr/bin/env node

/**
 * Duplicate Analysis Script
 * 
 * Analyzes the design system CSS for hardcoded values that could be replaced
 * with existing design tokens to improve consistency and maintainability.
 * 
 * This script helps identify opportunities to:
 * - Replace hardcoded colors with existing token references
 * - Replace hardcoded sizes with existing spacing tokens
 * - Improve overall design system consistency
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CSS_FILE_PATH = path.join(__dirname, '../docs/design-system.css');

console.log('🔍 Analyzing for hardcoded values that could be tokens...\n');

// Read CSS file
let cssContent;
try {
    cssContent = fs.readFileSync(CSS_FILE_PATH, 'utf8');
} catch (error) {
    console.error(`❌ Error reading CSS file: ${error.message}`);
    process.exit(1);
}

// Extract all defined tokens from :root blocks
const tokenMap = new Map();
const rootBlockRegex = /:root\s*\{([^}]+)\}/g;
let rootMatch;

while ((rootMatch = rootBlockRegex.exec(cssContent)) !== null) {
    const rootContent = rootMatch[1];
    const tokenRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let tokenMatch;
    
    while ((tokenMatch = tokenRegex.exec(rootContent)) !== null) {
        const tokenName = tokenMatch[1];
        const tokenValue = tokenMatch[2].trim();
        tokenMap.set(tokenValue, tokenName);
    }
}

console.log(`📊 Found ${tokenMap.size} defined tokens to check against\n`);

// Look for hardcoded values that match existing tokens
const hardcodedValueRegex = /(?<!var\()(#(?:[0-9a-fA-F]{3}){1,2}|(?:[1-9]\d*|\d)px|rgba?\([^)]+\))/g;
const lines = cssContent.split('\n');
let suggestions = 0;
const foundIssues = [];

lines.forEach((line, index) => {
    // Skip :root definitions and comments
    if (line.includes(':root') || line.trim().startsWith('/*') || line.trim().startsWith('*')) return;
    
    let match;
    const lineRegex = /(?<!var\()(#(?:[0-9a-fA-F]{3}){1,2}|(?:[1-9]\d*|\d)px|rgba?\([^)]+\))/g;
    
    while ((match = lineRegex.exec(line)) !== null) {
        const value = match[0];
        
        if (tokenMap.has(value)) {
            foundIssues.push({
                line: index + 1,
                content: line.trim(),
                value: value,
                tokenName: tokenMap.get(value)
            });
            suggestions++;
        }
    }
});

// Report results
if (suggestions === 0) {
    console.log('✅ No obvious hardcoded values found that match existing tokens.');
    console.log('   Your design system maintains good token consistency!');
} else {
    console.log('💡 Found opportunities to replace hardcoded values with tokens:\n');
    
    foundIssues.forEach(issue => {
        console.log(`  Line ${issue.line}: ${issue.content}`);
        console.log(`  - Replace "${issue.value}" with "var(${issue.tokenName})"\n`);
    });
    
    console.log(`📈 Summary: Found ${suggestions} potential improvements.`);
    console.log('💡 Suggestions:');
    console.log('   1. Replace hardcoded values with var() references');
    console.log('   2. This improves maintainability and design consistency');
    console.log('   3. Changes will automatically inherit token updates');
}

console.log('\n🎯 Analysis complete!');