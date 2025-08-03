#!/usr/bin/env node

/**
 * Style Dictionary Build Integration
 * Generates transformation functions at build time for bundling into the plugin
 * Part of the Style Dictionary integration strategy (Phase 2)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractTokensFromCSS, convertToStyleDictionaryFormat } from './validate-tokens.js';

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
 * Generate transformation functions based on Style Dictionary patterns
 * These will be bundled into the plugin for runtime use
 */
function generateTransformationFunctions() {
    return `
/**
 * Style Dictionary-compatible transformation functions
 * Generated at build time for Figma plugin compatibility
 */

// Color transformations
const colorTransforms = {
    // Convert hex to iOS RGB values (0-1 range)
    hexToIosRgb: function(hexValue) {
        const hex = hexValue.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const a = hex.length === 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
        
        return {
            red: parseFloat(r.toFixed(3)),
            green: parseFloat(g.toFixed(3)),
            blue: parseFloat(b.toFixed(3)),
            alpha: parseFloat(a.toFixed(3))
        };
    },
    
    // Convert hex to Android format
    hexToAndroid: function(hexValue) {
        return hexValue.toUpperCase();
    },
    
    // Convert CSS color to Flutter Color
    cssToFlutter: function(cssValue) {
        if (cssValue.startsWith('#')) {
            const hex = cssValue.replace('#', '');
            const color = hex.length === 6 ? 'FF' + hex : hex;
            return \`Color(0x\${color.toUpperCase()})\`;
        }
        return cssValue;
    }
};

// Size/dimension transformations
const sizeTransforms = {
    // Convert rem/px to iOS points
    cssToIosPoints: function(cssValue) {
        if (cssValue.endsWith('rem')) {
            return parseFloat(cssValue) * 16; // Assuming 16px base
        }
        if (cssValue.endsWith('px')) {
            return parseFloat(cssValue);
        }
        return cssValue;
    },
    
    // Convert CSS size to Android dp
    cssToAndroidDp: function(cssValue) {
        if (cssValue.endsWith('rem')) {
            return parseFloat(cssValue) * 16 + 'dp';
        }
        if (cssValue.endsWith('px')) {
            return parseFloat(cssValue) + 'dp';
        }
        return cssValue;
    },
    
    // Convert CSS to Flutter logical pixels
    cssToFlutter: function(cssValue) {
        if (cssValue.endsWith('rem')) {
            return parseFloat(cssValue) * 16.0;
        }
        if (cssValue.endsWith('px')) {
            return parseFloat(cssValue);
        }
        return cssValue;
    }
};

// Font weight transformations
const fontWeightTransforms = {
    // Convert CSS font-weight to iOS
    cssToIos: function(cssValue) {
        const weightMap = {
            '100': 'ultralight',
            '200': 'thin',
            '300': 'light',
            '400': 'regular',
            '500': 'medium',
            '600': 'semibold',
            '700': 'bold',
            '800': 'heavy',
            '900': 'black'
        };
        return weightMap[cssValue] || cssValue;
    },
    
    // Android uses numeric values
    cssToAndroid: function(cssValue) {
        return cssValue;
    }
};

// Export format generators
const formatGenerators = {
    css: function(tokens) {
        let output = ':root {\\n';
        Object.entries(tokens).forEach(([name, value]) => {
            output += \`  --\${name}: \${value};\\n\`;
        });
        output += '}';
        return output;
    },
    
    swift: function(tokens) {
        let output = 'import UIKit\\n\\nstruct DesignTokens {\\n';
        Object.entries(tokens).forEach(([name, value]) => {
            const swiftName = name.replace(/-(.)/g, (_, letter) => letter.toUpperCase());
            if (value.startsWith('#')) {
                const rgb = colorTransforms.hexToIosRgb(value);
                output += \`    static let \${swiftName} = UIColor(red: \${rgb.red}, green: \${rgb.green}, blue: \${rgb.blue}, alpha: \${rgb.alpha})\\n\`;
            } else {
                output += \`    static let \${swiftName} = "\${value}"\\n\`;
            }
        });
        output += '}';
        return output;
    },
    
    android: function(tokens) {
        let output = '<?xml version="1.0" encoding="utf-8"?>\\n<resources>\\n';
        Object.entries(tokens).forEach(([name, value]) => {
            const androidName = name.replace(/-/g, '_');
            if (value.startsWith('#')) {
                output += \`    <color name="\${androidName}">\${colorTransforms.hexToAndroid(value)}</color>\\n\`;
            } else {
                output += \`    <dimen name="\${androidName}">\${sizeTransforms.cssToAndroidDp(value)}</dimen>\\n\`;
            }
        });
        output += '</resources>';
        return output;
    },
    
    flutter: function(tokens) {
        let output = 'import \\'package:flutter/material.dart\\';\\n\\nclass DesignTokens {\\n';
        Object.entries(tokens).forEach(([name, value]) => {
            const flutterName = name.replace(/-(.)/g, (_, letter) => letter.toUpperCase());
            if (value.startsWith('#')) {
                output += \`  static const \${flutterName} = \${colorTransforms.cssToFlutter(value)};\\n\`;
            } else {
                output += \`  static const \${flutterName} = \${sizeTransforms.cssToFlutter(value)};\\n\`;
            }
        });
        output += '}';
        return output;
    },
    
    w3c: function(tokens) {
        const w3cTokens = {};
        Object.entries(tokens).forEach(([name, value]) => {
            w3cTokens[name] = { value, type: 'other' };
        });
        return JSON.stringify(w3cTokens, null, 2);
    },
    
    tailwind: function(tokens) {
        const config = { theme: { extend: {} } };
        Object.entries(tokens).forEach(([name, value]) => {
            const category = name.split('-')[0];
            if (!config.theme.extend[category]) {
                config.theme.extend[category] = {};
            }
            config.theme.extend[category][name] = value;
        });
        return \`module.exports = \${JSON.stringify(config, null, 2)}\`;
    }
};

// Main transform function that will be bundled into plugin
window.styleTransforms = {
    colorTransforms,
    sizeTransforms,
    fontWeightTransforms,
    formatGenerators
};
`;
}

/**
 * Build Style Dictionary integration
 */
async function buildStyleDictionaryIntegration() {
    console.log(`\n${colors.blue}🔧 Building Style Dictionary Integration...${colors.reset}\n`);
    
    try {
        const cssFile = path.join(projectRoot, 'docs/design-system.css');
        const buildDir = path.join(projectRoot, 'build');
        const outputFile = path.join(buildDir, 'style-dictionary-transforms.js');
        
        // Ensure build directory exists
        if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
        }
        
        // Generate transformation functions
        console.log(`${colors.cyan}→${colors.reset} Generating transformation functions...`);
        const transformCode = generateTransformationFunctions();
        
        // Write to build directory
        fs.writeFileSync(outputFile, transformCode);
        console.log(`  ${colors.green}✓${colors.reset} Generated ${path.relative(projectRoot, outputFile)}`);
        
        // Extract and validate tokens for reference
        console.log(`${colors.cyan}→${colors.reset} Extracting current tokens...`);
        const flatTokens = extractTokensFromCSS(cssFile);
        const nestedTokens = convertToStyleDictionaryFormat(flatTokens);
        
        // Write reference tokens
        const tokensFile = path.join(buildDir, 'current-tokens.json');
        fs.writeFileSync(tokensFile, JSON.stringify(nestedTokens, null, 2));
        console.log(`  ${colors.green}✓${colors.reset} Current tokens: ${Object.keys(flatTokens).length}`);
        
        console.log(`\n${colors.green}✨ Style Dictionary Integration Built${colors.reset}`);
        console.log(`   Transform functions: ${path.relative(projectRoot, outputFile)}`);
        console.log(`   Reference tokens: ${path.relative(projectRoot, tokensFile)}`);
        
        return {
            transformsFile: outputFile,
            tokensFile: tokensFile,
            tokenCount: Object.keys(flatTokens).length
        };
        
    } catch (error) {
        console.error(`\n${colors.red}✗ Build failed: ${error.message}${colors.reset}`);
        throw error;
    }
}

// Export for use in main build script
export { buildStyleDictionaryIntegration, generateTransformationFunctions };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    buildStyleDictionaryIntegration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}