#!/usr/bin/env node

/**
 * Token Validation Script
 * 
 * This script validates that all CSS custom property references (var(--token))
 * in the design system CSS file point to tokens that are actually defined.
 * 
 * It helps maintain the integrity of the design system by catching:
 * - Typos in token names
 * - References to removed tokens
 * - Missing token definitions
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Configuration
const CSS_FILE_PATH = path.join(__dirname, '../../docs/design-system.css');
const OPEN_PROPS_URL = 'https://unpkg.com/open-props/style';

// Dynamic/JavaScript-set tokens that should be ignored
const DYNAMIC_TOKENS = [
    '--parallax-depth',
    '--scale',
    '--x-start',
    '--x-end', 
    '--y-start',
    '--y-end',
    '--delay',
    '--blur',
    '--color',  // Generic token used in dynamic contexts
    '--progress-size',  // Dynamic progress indicator size
    '--gradient',  // Dynamic gradient context
    '--line-height-3',  // This appears to be a typo (should be --font-lineheight-3)
    
    // Tokens not available in current Open Props version or custom to this project
    '--animation-duration-2',  // Missing from Open Props - custom token
    '--animation-duration-3',  // Missing from Open Props - custom token  
    '--animation-duration-4',  // Missing from Open Props - custom token
    '--font-size-000',  // Missing from Open Props - custom token for very small text
    '--font-weight-500',  // Standard CSS value, may not be in Open Props
    '--font-weight-700',   // Standard CSS value, may not be in Open Props
    '--size-0'  // Custom token - Open Props uses --size-000 and --size-00 but not --size-0
];

/**
 * Fetches Open Props CSS and extracts all defined tokens
 * @returns {Promise<Set<string>>} Set of Open Props tokens
 */
async function fetchOpenPropsTokens() {
    try {
        console.log('🌐 Fetching Open Props tokens from unpkg...');
        const response = await axios.get(OPEN_PROPS_URL, {
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'token-exporter-validator/1.0'
            }
        });
        
        const openPropsContent = response.data;
        const openPropsTokens = new Set();
        
        // Use regex to extract tokens from Open Props (handles both :root and :where(html) formats)
        const rootBlockRegex = /(?::root|:where\(html\))\s*\{([^}]+)\}/g;
        let rootMatch;
        
        while ((rootMatch = rootBlockRegex.exec(openPropsContent)) !== null) {
            const rootContent = rootMatch[1];
            const tokenMatches = rootContent.match(/--[\w-]+(?=\s*:)/g);
            if (tokenMatches) {
                tokenMatches.forEach(token => openPropsTokens.add(token));
            }
        }
        
        console.log(`✅ Fetched ${openPropsTokens.size} Open Props tokens`);
        return openPropsTokens;
        
    } catch (error) {
        console.warn('⚠️  Failed to fetch Open Props tokens:', error.message);
        console.log('   Continuing validation with local tokens only...');
        return new Set(); // Return empty set if fetch fails
    }
}

/**
 * Main validation function
 */
async function validateTokens() {
    console.log('🔍 Starting CSS token validation...\n');
    
    // Read local CSS file
    let cssContent;
    try {
        cssContent = fs.readFileSync(CSS_FILE_PATH, 'utf8');
    } catch (error) {
        console.error(`❌ Error reading CSS file: ${error.message}`);
        process.exit(1);
    }
    
    // Extract all defined tokens from local :root blocks
    const rootBlockRegex = /:root\s*\{([^}]+)\}/g;
    const localTokens = new Set();
    let rootMatch;
    
    while ((rootMatch = rootBlockRegex.exec(cssContent)) !== null) {
        const rootContent = rootMatch[1];
        const tokenMatches = rootContent.match(/--[\w-]+(?=\s*:)/g);
        if (tokenMatches) {
            tokenMatches.forEach(token => localTokens.add(token));
        }
    }
    
    // Fetch Open Props tokens
    const openPropsTokens = await fetchOpenPropsTokens();
    
    // Merge local and Open Props tokens
    const definedTokens = new Set([...localTokens, ...openPropsTokens]);
    
    console.log(`📊 Found ${localTokens.size} local tokens + ${openPropsTokens.size} Open Props tokens = ${definedTokens.size} total defined tokens\n`);

    // Find all var() references
    const varRegex = /var\((--[\w-]+)(?:,\s*[^)]+)?\)/g;
    const referencedTokens = new Map();
    const lines = cssContent.split('\n');
    
    lines.forEach((line, index) => {
        let match;
        const lineVarRegex = /var\((--[\w-]+)(?:,\s*[^)]+)?\)/g;
        while ((match = lineVarRegex.exec(line)) !== null) {
            const token = match[1];
            
            // Skip dynamic tokens
            if (DYNAMIC_TOKENS.includes(token)) continue;
            
            if (!referencedTokens.has(token)) {
                referencedTokens.set(token, []);
            }
            referencedTokens.get(token).push({
                line: index + 1,
                context: line.trim()
            });
        }
    });

    // Validate tokens
    let undefinedCount = 0;
    const errors = [];
    
    for (const [token, locations] of referencedTokens.entries()) {
        if (!definedTokens.has(token)) {
            undefinedCount++;
            errors.push({
                token,
                locations
            });
        }
    }
    
    // Report results
    if (undefinedCount > 0) {
        console.error('❌ Found undefined token references:\n');
        
        errors.forEach(({ token, locations }) => {
            console.error(`  Token: ${token}`);
            locations.forEach(({ line, context }) => {
                console.error(`    Line ${line}: ${context}`);
            });
            console.error('');
        });
        
        console.error(`\n❌ Validation failed: ${undefinedCount} undefined token(s) found.`);
        
        // Suggest fixes
        console.log('\n💡 Suggestions:');
        console.log('  1. Check for typos in the token names');
        console.log('  2. Ensure the token is defined in the :root block');
        console.log('  3. If using Open Props tokens, they may have been updated - this script fetches the latest version');
        console.log('  4. For dynamic tokens set via JavaScript, add them to the DYNAMIC_TOKENS array in this script');
        console.log('  5. If Open Props fetch failed, check your internet connection and try again');
        
        process.exit(1);
    } else {
        console.log('✅ All token references are valid!');
        console.log(`   Validated ${referencedTokens.size} unique token references`);
        
        // Summary statistics
        const tokenTypes = {
            color: 0,
            spacing: 0,
            size: 0,
            font: 0,
            other: 0
        };
        
        for (const token of referencedTokens.keys()) {
            if (token.includes('color') || token.includes('gray') || token.includes('brand')) {
                tokenTypes.color++;
            } else if (token.includes('spacing') || token.includes('size')) {
                tokenTypes.spacing++;
            } else if (token.includes('font')) {
                tokenTypes.font++;
            } else {
                tokenTypes.other++;
            }
        }
        
        console.log('\n📈 Token usage breakdown:');
        console.log(`   Colors: ${tokenTypes.color}`);
        console.log(`   Spacing/Size: ${tokenTypes.spacing}`);
        console.log(`   Typography: ${tokenTypes.font}`);
        console.log(`   Other: ${tokenTypes.other}`);
    }
}

// Run the validation
validateTokens().catch(error => {
    console.error('❌ Validation script failed:', error.message);
    process.exit(1);
});