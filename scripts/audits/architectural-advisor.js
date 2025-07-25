#!/usr/bin/env node

/**
 * Architectural Advisor Script
 * 
 * Acts as a "Design System Architect" by identifying opportunities to strengthen
 * the system's semantic structure. Goes beyond simple duplicate detection to provide
 * intelligent architectural guidance.
 * 
 * Features:
 * - Composite value analysis for complex CSS properties
 * - Contextual awareness of CSS property-value relationships
 * - Frequency analysis for repeated value combinations
 * - Ambiguity resolution for multi-token matches
 * - Semantic token recommendations
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CSS_FILE_PATH = path.join(__dirname, '../../docs/design-system.css');

console.log('🏗️  Design System Architectural Analysis\n');

// Read CSS file
let cssContent;
try {
    cssContent = fs.readFileSync(CSS_FILE_PATH, 'utf8');
} catch (error) {
    console.error(`❌ Error reading CSS file: ${error.message}`);
    process.exit(1);
}

// Extract all defined tokens from :root blocks
const tokenMap = new Map(); // value -> [tokenNames]
const tokensByProperty = new Map(); // propertyContext -> [tokens]
const rootBlockRegex = /:root\s*\{([^}]+)\}/g;
let rootMatch;

while ((rootMatch = rootBlockRegex.exec(cssContent)) !== null) {
    const rootContent = rootMatch[1];
    const tokenRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let tokenMatch;
    
    while ((tokenMatch = tokenRegex.exec(rootContent)) !== null) {
        const tokenName = tokenMatch[1];
        const tokenValue = tokenMatch[2].trim();
        
        // Handle multiple tokens with same value
        if (!tokenMap.has(tokenValue)) {
            tokenMap.set(tokenValue, []);
        }
        tokenMap.get(tokenValue).push(tokenName);
        
        // Categorize tokens by likely property context
        categorizeTokenByContext(tokenName, tokenValue, tokensByProperty);
    }
}

function categorizeTokenByContext(tokenName, tokenValue, tokensByProperty) {
    const name = tokenName.toLowerCase();
    
    // Categorize tokens by semantic context
    const contexts = [];
    
    if (name.includes('color') || name.includes('brand') || tokenValue.match(/^#|rgb|hsl/)) {
        contexts.push('color');
    }
    if (name.includes('size') || name.includes('spacing') || name.includes('gap') || tokenValue.match(/^\d+(\.\d+)?(px|rem|em)$/)) {
        contexts.push('spacing');
    }
    if (name.includes('border') || name.includes('stroke')) {
        contexts.push('border');
    }
    if (name.includes('shadow')) {
        contexts.push('shadow');
    }
    if (name.includes('font') || name.includes('text')) {
        contexts.push('typography');
    }
    
    contexts.forEach(context => {
        if (!tokensByProperty.has(context)) {
            tokensByProperty.set(context, []);
        }
        tokensByProperty.get(context).push({ name: tokenName, value: tokenValue });
    });
}

// Remove :root blocks to analyze only component CSS
const componentCSS = cssContent.replace(/:root\s*\{[^}]+\}/g, '');

// Analyze CSS for architectural opportunities
const recommendations = [];

// 1. COMPOSITE VALUE ANALYSIS
analyzeCompositeValues(componentCSS, recommendations);

// 2. CONTEXTUAL PROPERTY ANALYSIS  
analyzeContextualProperties(componentCSS, recommendations);

// 3. FREQUENCY ANALYSIS
analyzeFrequency(componentCSS, recommendations);

// 4. AMBIGUOUS REPLACEMENT ANALYSIS
analyzeAmbiguousReplacements(componentCSS, recommendations);

// 5. PATTERN CONSISTENCY ANALYSIS
analyzePatternConsistency(componentCSS, recommendations);

function analyzeCompositeValues(css, recommendations) {
    const compositePatterns = [
        {
            property: 'border',
            pattern: /border\s*:\s*([^;]+);/g,
            minOccurrences: 3
        },
        {
            property: 'padding',
            pattern: /padding\s*:\s*([^;]+);/g,
            minOccurrences: 3
        },
        {
            property: 'margin', 
            pattern: /margin\s*:\s*([^;]+);/g,
            minOccurrences: 3
        },
        {
            property: 'box-shadow',
            pattern: /box-shadow\s*:\s*([^;]+);/g,
            minOccurrences: 2
        },
        {
            property: 'font',
            pattern: /font\s*:\s*([^;]+);/g,
            minOccurrences: 2
        }
    ];
    
    compositePatterns.forEach(({ property, pattern, minOccurrences }) => {
        const valueFrequency = new Map();
        let match;
        
        while ((match = pattern.exec(css)) !== null) {
            const value = match[1].trim();
            
            // Skip if already using variables
            if (value.includes('var(')) continue;
            
            valueFrequency.set(value, (valueFrequency.get(value) || 0) + 1);
        }
        
        valueFrequency.forEach((count, value) => {
            if (count >= minOccurrences) {
                recommendations.push({
                    type: 'NEW_COMPOSITE_TOKEN',
                    property: property,
                    value: value,
                    occurrences: count,
                    suggestion: `Create a semantic token '--${property}-${generateTokenSuffix(value)}' for this repeated ${property} combination.`,
                    proposedToken: generateCompositeToken(property, value)
                });
            }
        });
    });
}

function analyzeContextualProperties(css, recommendations) {
    const contextualPatterns = [
        {
            properties: ['background-color', 'background'],
            context: 'color',
            suggestion: 'background colors'
        },
        {
            properties: ['color'],
            context: 'color', 
            suggestion: 'text colors'
        },
        {
            properties: ['border-color'],
            context: 'color',
            suggestion: 'border colors'
        }
    ];
    
    contextualPatterns.forEach(({ properties, context, suggestion }) => {
        properties.forEach(property => {
            const pattern = new RegExp(`${property}\\s*:\\s*([^;]+);`, 'g');
            let match;
            
            while ((match = pattern.exec(css)) !== null) {
                const value = match[1].trim();
                
                // Skip if already using variables
                if (value.includes('var(')) continue;
                
                // Check if this value has multiple token options
                if (tokenMap.has(value) && tokenMap.get(value).length > 1) {
                    const contextualTokens = tokenMap.get(value).filter(token => 
                        tokensByProperty.has(context) && 
                        tokensByProperty.get(context).some(t => t.name === token)
                    );
                    
                    if (contextualTokens.length > 0) {
                        recommendations.push({
                            type: 'CONTEXTUAL_RECOMMENDATION',
                            property: property,
                            value: value,
                            context: suggestion,
                            suggestion: `For ${property}, prefer contextually appropriate tokens for ${suggestion}.`,
                            recommendedTokens: contextualTokens,
                            allTokens: tokenMap.get(value)
                        });
                    }
                }
            }
        });
    });
}

function analyzeFrequency(css, recommendations) {
    // Find repeated hardcoded values across all properties
    const valueFrequency = new Map();
    const propertyValuePattern = /([\w-]+)\s*:\s*([^;]+);/g;
    let match;
    
    while ((match = propertyValuePattern.exec(css)) !== null) {
        const property = match[1].trim();
        const value = match[2].trim();
        
        // Skip if already using variables or is a complex value
        if (value.includes('var(') || value.includes('calc(') || value.includes('url(')) continue;
        
        // Focus on values that look like they could be tokens
        if (value.match(/^#[\da-fA-F]{3,8}$|^\d+(\.\d+)?(px|rem|em|%)$|^rgba?\(|^hsla?\(/)) {
            const key = `${property}:${value}`;
            valueFrequency.set(key, (valueFrequency.get(key) || 0) + 1);
        }
    }
    
    valueFrequency.forEach((count, key) => {
        if (count >= 4) { // Higher threshold for individual properties
            const [property, value] = key.split(':');
            
            recommendations.push({
                type: 'HIGH_FREQUENCY_VALUE',
                property: property,
                value: value,
                occurrences: count,
                suggestion: `This ${property} value appears ${count} times. Consider creating a semantic token.`,
                proposedToken: generateSemanticToken(property, value)
            });
        }
    });
}

function analyzeAmbiguousReplacements(css, recommendations) {
    const lines = css.split('\n');
    
    lines.forEach((line, index) => {
        const propertyMatch = line.match(/([\w-]+)\s*:\s*([^;]+);/);
        if (!propertyMatch) return;
        
        const property = propertyMatch[1].trim();
        const value = propertyMatch[2].trim();
        
        // Skip if already using variables
        if (value.includes('var(')) return;
        
        // Check if this value matches multiple tokens
        if (tokenMap.has(value) && tokenMap.get(value).length > 1) {
            const tokens = tokenMap.get(value);
            
            recommendations.push({
                type: 'AMBIGUOUS_REPLACEMENT',
                property: property,
                value: value,
                location: `line ${index + 1}`,
                lineContent: line.trim(),
                suggestion: 'This value matches multiple tokens. Choose the most semantically appropriate option:',
                options: tokens,
                contextualGuidance: getContextualGuidance(property, tokens)
            });
        }
    });
}

function generateTokenSuffix(value) {
    // Generate a meaningful suffix from the value
    const cleaned = value.replace(/[^\w\d]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return cleaned.toLowerCase().substring(0, 20);
}

function generateCompositeToken(property, value) {
    const suffix = generateTokenSuffix(value);
    return `--${property}-${suffix}`;
}

function generateSemanticToken(property, value) {
    const contextMap = {
        'color': 'color',
        'background-color': 'background',
        'border-color': 'border',
        'padding': 'spacing',
        'margin': 'spacing',
        'width': 'size',
        'height': 'size'
    };
    
    const context = contextMap[property] || property;
    const suffix = generateTokenSuffix(value);
    return `--${context}-${suffix}`;
}

function analyzePatternConsistency(css, recommendations) {
    // Find component patterns and check for consistency across variants
    const componentPatterns = [
        {
            name: 'badge',
            selector: /\.badge(?:\.[\w-]+)*\s*\{[^}]+\}/g,
            requiredProperties: ['background-color', 'color', 'padding', 'border-radius'],
            variantPattern: /\.badge\.([\w-]+)/,
            description: 'Badge component variants'
        },
        {
            name: 'button',
            selector: /\.btn(?:\.[\w-]+)*\s*\{[^}]+\}/g,
            requiredProperties: ['background-color', 'color', 'padding', 'border-radius'],
            variantPattern: /\.btn\.([\w-]+)/,
            description: 'Button component variants'
        },
        {
            name: 'card',
            selector: /\.card(?:\.[\w-]+)*\s*\{[^}]+\}/g,
            requiredProperties: ['background-color', 'border', 'border-radius', 'padding'],
            variantPattern: /\.card\.([\w-]+)/,
            description: 'Card component variants'
        }
    ];

    componentPatterns.forEach(({ name, selector, requiredProperties, variantPattern, description }) => {
        const variants = new Map(); // variant -> properties
        let match;

        // Find all component variants
        while ((match = selector.exec(css)) !== null) {
            const ruleBlock = match[0];
            const variantMatch = ruleBlock.match(variantPattern);
            const variantName = variantMatch ? variantMatch[1] : 'default';
            
            // Extract properties from this variant
            const properties = new Map();
            requiredProperties.forEach(prop => {
                const propRegex = new RegExp(`${prop}\\s*:\\s*([^;]+);`, 'g');
                const propMatch = propRegex.exec(ruleBlock);
                if (propMatch) {
                    properties.set(prop, propMatch[1].trim());
                }
            });

            variants.set(variantName, properties);
        }

        // Check for missing properties across variants
        if (variants.size > 1) {
            const allVariants = Array.from(variants.keys());
            const inconsistencies = [];

            requiredProperties.forEach(requiredProp => {
                const variantsWithProp = [];
                const variantsWithoutProp = [];

                allVariants.forEach(variant => {
                    const props = variants.get(variant);
                    if (props.has(requiredProp)) {
                        variantsWithProp.push({
                            variant,
                            value: props.get(requiredProp)
                        });
                    } else {
                        variantsWithoutProp.push(variant);
                    }
                });

                // Flag missing properties
                if (variantsWithoutProp.length > 0 && variantsWithProp.length > 0) {
                    inconsistencies.push({
                        property: requiredProp,
                        issue: 'missing_property',
                        variantsWithProperty: variantsWithProp,
                        variantsWithoutProperty: variantsWithoutProp
                    });
                }

                // Flag value inconsistencies (e.g., different patterns)
                if (variantsWithProp.length > 1) {
                    const valuePatterns = new Map();
                    variantsWithProp.forEach(({ variant, value }) => {
                        // Check if using var() or hardcoded values
                        const pattern = value.includes('var(') ? 'token' : 'hardcoded';
                        if (!valuePatterns.has(pattern)) {
                            valuePatterns.set(pattern, []);
                        }
                        valuePatterns.get(pattern).push({ variant, value });
                    });

                    if (valuePatterns.size > 1) {
                        inconsistencies.push({
                            property: requiredProp,
                            issue: 'mixed_patterns',
                            patterns: Object.fromEntries(valuePatterns),
                            description: 'Some variants use tokens while others use hardcoded values'
                        });
                    }
                }
            });

            // Generate recommendations for inconsistencies
            if (inconsistencies.length > 0) {
                recommendations.push({
                    type: 'PATTERN_CONSISTENCY',
                    component: name,
                    description: description,
                    variants: allVariants,
                    inconsistencies: inconsistencies,
                    suggestion: `${description} show inconsistent patterns. Ensure all variants follow the same structural approach.`,
                    impact: 'Visual inconsistency and maintenance burden'
                });
            }
        }
    });
}

function getContextualGuidance(property, tokens) {
    const guidance = [];
    
    tokens.forEach(token => {
        const name = token.toLowerCase();
        if (property.includes('background') && (name.includes('background') || name.includes('surface'))) {
            guidance.push(`${token} - Good for background contexts`);
        } else if (property.includes('color') && name.includes('text')) {
            guidance.push(`${token} - Good for text contexts`);
        } else if (property.includes('border') && name.includes('border')) {
            guidance.push(`${token} - Good for border contexts`);
        } else {
            guidance.push(`${token} - General purpose`);
        }
    });
    
    return guidance.length > 0 ? guidance : tokens.map(token => `${token} - Context unclear`);
}

// Output results
const results = {
    summary: {
        totalTokens: Array.from(tokenMap.values()).flat().length,
        uniqueValues: tokenMap.size,
        recommendations: recommendations.length
    },
    recommendations: recommendations
};

console.log(JSON.stringify(results, null, 2));

// Exit with appropriate code
process.exit(recommendations.length > 0 ? 1 : 0);