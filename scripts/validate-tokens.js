#!/usr/bin/env node

/**
 * Token Validation Script
 * Validates that our token output is compatible with Style Dictionary
 * Part of the Style Dictionary integration strategy
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

/**
 * Extract tokens from CSS file
 */
function extractTokensFromCSS(cssFile) {
    if (!fs.existsSync(cssFile)) {
        throw new Error(`CSS file not found: ${cssFile}`);
    }
    
    const cssContent = fs.readFileSync(cssFile, 'utf8');
    const tokens = {};
    
    // Extract :root tokens (primitives)
    const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/s);
    if (rootMatch) {
        const rootContent = rootMatch[1];
        const tokenMatches = rootContent.matchAll(/--([^:]+):\s*([^;]+);/g);
        
        for (const match of tokenMatches) {
            const [, name, value] = match;
            const cleanName = name.trim();
            const cleanValue = value.trim();
            
            // Skip CSS calculations and other non-primitive values
            if (!cleanValue.includes('var(') && !cleanValue.includes('calc(')) {
                tokens[cleanName] = {
                    value: cleanValue,
                    type: inferTokenType(cleanName, cleanValue)
                };
            }
        }
    }
    
    return tokens;
}

/**
 * Infer token type from name and value
 */
function inferTokenType(name, value) {
    // Color detection
    if (value.match(/^#[0-9a-fA-F]{3,8}$/) || 
        value.match(/^rgb\(/) || 
        value.match(/^hsl\(/) ||
        name.includes('color') ||
        name.includes('bg') ||
        name.includes('border')) {
        return 'color';
    }
    
    // Size/dimension detection
    if (value.match(/^\d+(\.\d+)?(px|rem|em|%)$/) ||
        name.includes('size') ||
        name.includes('space') ||
        name.includes('radius') ||
        name.includes('width') ||
        name.includes('height')) {
        return 'dimension';
    }
    
    // Font family
    if (name.includes('font') && !name.includes('size') && !name.includes('weight')) {
        return 'fontFamily';
    }
    
    // Font weight
    if (name.includes('weight') || value.match(/^\d{3}$/)) {
        return 'fontWeight';
    }
    
    // Duration
    if (value.match(/^\d+(\.\d+)?m?s$/)) {
        return 'duration';
    }
    
    // Default to other
    return 'other';
}

/**
 * Convert flat tokens to nested Style Dictionary format
 */
function convertToStyleDictionaryFormat(flatTokens) {
    const nested = {};
    
    for (const [name, tokenData] of Object.entries(flatTokens)) {
        const parts = name.split('-');
        let current = nested;
        
        // Navigate/create nested structure
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        
        // Set the final value
        const finalKey = parts[parts.length - 1];
        current[finalKey] = {
            value: tokenData.value,
            type: tokenData.type
        };
    }
    
    return nested;
}

/**
 * Validate Style Dictionary compatibility
 */
function validateStyleDictionaryCompatibility(tokens) {
    const issues = [];
    
    function validateNode(obj, path = []) {
        for (const [key, value] of Object.entries(obj)) {
            const currentPath = [...path, key];
            
            if (value && typeof value === 'object') {
                if (value.value !== undefined) {
                    // This is a token node
                    if (!value.type) {
                        issues.push(`Missing type for token: ${currentPath.join('.')}`);
                    }
                    
                    if (typeof value.value !== 'string' && typeof value.value !== 'number') {
                        issues.push(`Invalid value type for token: ${currentPath.join('.')} (expected string or number)`);
                    }
                } else {
                    // This is a group node, recurse
                    validateNode(value, currentPath);
                }
            }
        }
    }
    
    validateNode(tokens);
    return issues;
}

/**
 * Main validation function
 */
async function validateTokens() {
    console.log(`\n${colors.blue}🔍 Validating Token Compatibility...${colors.reset}\n`);
    
    const cssFile = path.join(projectRoot, 'docs/design-system.css');
    const outputDir = path.join(projectRoot, 'tokens');
    
    try {
        // Extract tokens from CSS
        console.log(`${colors.cyan}→${colors.reset} Extracting tokens from CSS...`);
        const flatTokens = extractTokensFromCSS(cssFile);
        const tokenCount = Object.keys(flatTokens).length;
        console.log(`  ${colors.green}✓${colors.reset} Found ${tokenCount} primitive tokens`);
        
        // Convert to Style Dictionary format
        console.log(`${colors.cyan}→${colors.reset} Converting to Style Dictionary format...`);
        const nestedTokens = convertToStyleDictionaryFormat(flatTokens);
        console.log(`  ${colors.green}✓${colors.reset} Converted to nested structure`);
        
        // Validate compatibility
        console.log(`${colors.cyan}→${colors.reset} Validating Style Dictionary compatibility...`);
        const issues = validateStyleDictionaryCompatibility(nestedTokens);
        
        if (issues.length > 0) {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} issues:`);
            issues.forEach(issue => console.log(`    ${colors.red}•${colors.reset} ${issue}`));
            return false;
        } else {
            console.log(`  ${colors.green}✓${colors.reset} All tokens are Style Dictionary compatible`);
        }
        
        // Ensure tokens directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write validation output
        const outputFile = path.join(outputDir, 'extracted-tokens.json');
        fs.writeFileSync(outputFile, JSON.stringify(nestedTokens, null, 2));
        console.log(`  ${colors.green}✓${colors.reset} Tokens written to ${path.relative(projectRoot, outputFile)}`);
        
        // Summary
        console.log(`\n${colors.green}✨ Validation Complete${colors.reset}`);
        console.log(`   Primitive tokens: ${tokenCount}`);
        console.log(`   Compatible: ${colors.green}✓${colors.reset}`);
        console.log(`   Output: ${path.relative(projectRoot, outputFile)}`);
        
        return true;
        
    } catch (error) {
        console.error(`\n${colors.red}✗ Validation failed: ${error.message}${colors.reset}`);
        return false;
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validateTokens()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
            process.exit(1);
        });
}

export { validateTokens, extractTokensFromCSS, convertToStyleDictionaryFormat };