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
const CSS_FILE_PATH = path.join(__dirname, '../../docs/design-system.css');

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

// Check for CSS Variables in Media Queries (unsupported)
const mediaQueryVarRegex = /@media[^{]*var\(--[^)]+\)/g;
const mediaQueryIssues = [];
let mediaQueryMatch;

while ((mediaQueryMatch = mediaQueryVarRegex.exec(cssContent)) !== null) {
    const lineIndex = cssContent.substring(0, mediaQueryMatch.index).split('\n').length;
    mediaQueryIssues.push({
        line: lineIndex,
        content: mediaQueryMatch[0].trim(),
        issue: 'CSS variables in media queries are not supported by CSS specification'
    });
}

if (mediaQueryIssues.length > 0) {
    console.log('🚨 CRITICAL: CSS Variables in Media Queries Detected\n');
    console.log('❌ CSS variables cannot be used in media query declarations.\n');
    
    mediaQueryIssues.forEach(issue => {
        console.log(`  Line ${issue.line}: ${issue.content}`);
        console.log(`  ❌ ${issue.issue}`);
        console.log(`  ✅ Solution: Replace with hardcoded pixel value\n`);
    });
    
    console.log('📖 See CLAUDE.md "Critical CSS Limitations" section for details.\n');
}

// Look for hardcoded values that match existing tokens
const hardcodedValueRegex = /(?<!var\()(#(?:[0-9a-fA-F]{3}){1,2}|(?:[0-9]*\.?[0-9]+)(px|rem|em|%|vh|vw|vmin|vmax)|rgba?\([^)]+\))/g;
const lines = cssContent.split('\n');
let suggestions = 0;
const foundIssues = [];

// Track if we're inside a :root block or comment block
let insideRootBlock = false;
let insideCommentBlock = false;
let braceDepth = 0;

lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Track multi-line comments
    if (trimmedLine.includes('/*') && !trimmedLine.includes('*/')) {
        insideCommentBlock = true;
    }
    if (insideCommentBlock && trimmedLine.includes('*/')) {
        insideCommentBlock = false;
        return; // Skip this line too
    }
    
    // Skip single-line and multi-line comments
    if (insideCommentBlock || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) return;
    
    // Track :root blocks
    if (trimmedLine.includes(':root')) {
        insideRootBlock = true;
        braceDepth = 0;
    }
    
    // Track braces to know when we exit :root
    if (insideRootBlock) {
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceDepth += openBraces - closeBraces;
        
        if (braceDepth <= 0) {
            insideRootBlock = false;
        }
    }
    
    // Skip if we're inside a :root block (primitives should stay hardcoded)
    if (insideRootBlock) return;
    
    // Skip media query conditions (hardcoded values are required there)
    if (trimmedLine.includes('@media')) return;
    
    let match;
    const lineRegex = /(?<!var\()(#(?:[0-9a-fA-F]{3}){1,2}|(?:[0-9]*\.?[0-9]+)(px|rem|em|%|vh|vw|vmin|vmax)|rgba?\([^)]+\))/g;
    
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

// ENHANCED: Flag common hardcoded patterns that should use tokens
console.log('\n🔍 Scanning for hardcoded CSS patterns that should use design tokens...\n');

const commonPatterns = [
    { 
        pattern: /font-size:\s*([0-9]*\.?[0-9]+)(rem|em|px)(?!.*var\()/,
        category: 'Typography',
        suggestion: 'Consider using var(--font-size-*) tokens for consistent typography hierarchy'
    },
    {
        pattern: /(?:width|height):\s*([0-9]*\.?[0-9]+)(rem|em|px)(?!.*var\().*(?:icon|lucide|svg)/i,
        category: 'Icon Sizing',
        suggestion: 'Consider using var(--icon-*) tokens for consistent icon sizing'
    },
    {
        pattern: /(?:width|height):\s*([0-9]*\.?[0-9]+)(rem|em|px)(?!.*var\()/,
        category: 'Element Sizing',
        suggestion: 'Consider using var(--size-*) tokens for consistent element dimensions'
    },
    {
        pattern: /(?:margin|padding)(?:-[a-z]+)?:\s*([0-9]*\.?[0-9]+)(rem|em|px)(?!.*var\()/,
        category: 'Spacing',
        suggestion: 'Consider using var(--size-*) tokens for consistent spacing'
    },
    {
        pattern: /gap:\s*([0-9]*\.?[0-9]+)(rem|em|px)(?!.*var\()/,
        category: 'Layout Gap',
        suggestion: 'Consider using var(--size-*) tokens for consistent grid/flex gaps'
    },
    {
        pattern: /border-radius:\s*([0-9]*\.?[0-9]+)(rem|em|px)(?!.*var\()/,
        category: 'Border Radius',
        suggestion: 'Consider using var(--radius-*) tokens for consistent border radius'
    }
];

let patternIssues = 0;
const patternFindings = {};

// Reset tracking variables for pattern scan
insideRootBlock = false;
insideCommentBlock = false;
braceDepth = 0;

lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Track comments and :root blocks (same logic as before)
    if (trimmedLine.includes('/*') && !trimmedLine.includes('*/')) {
        insideCommentBlock = true;
    }
    if (insideCommentBlock && trimmedLine.includes('*/')) {
        insideCommentBlock = false;
        return;
    }
    if (insideCommentBlock || trimmedLine.startsWith('/*') || trimmedLine.startsWith('*')) return;
    
    if (trimmedLine.includes(':root')) {
        insideRootBlock = true;
        braceDepth = 0;
    }
    
    if (insideRootBlock) {
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        braceDepth += openBraces - closeBraces;
        
        if (braceDepth <= 0) {
            insideRootBlock = false;
        }
    }
    
    // Skip :root blocks and media queries
    if (insideRootBlock || trimmedLine.includes('@media')) return;
    
    // Check each pattern
    commonPatterns.forEach(({pattern, category, suggestion}) => {
        const matches = line.match(pattern);
        if (matches) {
            if (!patternFindings[category]) {
                patternFindings[category] = [];
            }
            patternFindings[category].push({
                line: index + 1,
                content: line.trim(),
                value: matches[0],
                suggestion: suggestion
            });
            patternIssues++;
        }
    });
});

if (patternIssues > 0) {
    console.log('⚠️  Found hardcoded patterns that should use design tokens:\n');
    
    // Group findings by category
    Object.keys(patternFindings).forEach(category => {
        console.log(`📂 ${category} Issues (${patternFindings[category].length}):`);
        patternFindings[category].forEach(issue => {
            console.log(`  Line ${issue.line}: ${issue.content}`);
        });
        console.log(`  💡 ${patternFindings[category][0].suggestion}\n`);
    });
    
    console.log(`📊 Pattern Summary: Found ${patternIssues} hardcoded patterns across ${Object.keys(patternFindings).length} categories.`);
    console.log('🎯 Priority: Fix typography and icon sizing patterns first for maximum consistency impact.');
} else {
    console.log('✅ No hardcoded patterns found - excellent design token usage!');
}

console.log('\n🎯 Enhanced analysis complete!');