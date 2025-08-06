
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
            return `Color(0x${color.toUpperCase()})`;
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
        let output = ':root {\n';
        Object.entries(tokens).forEach(([name, value]) => {
            output += `  --${name}: ${value};\n`;
        });
        output += '}';
        return output;
    },
    
    swift: function(tokens) {
        let output = 'import UIKit\n\nstruct DesignTokens {\n';
        Object.entries(tokens).forEach(([name, value]) => {
            const swiftName = name.replace(/-(.)/g, (_, letter) => letter.toUpperCase());
            if (value.startsWith('#')) {
                const rgb = colorTransforms.hexToIosRgb(value);
                output += `    static let ${swiftName} = UIColor(red: ${rgb.red}, green: ${rgb.green}, blue: ${rgb.blue}, alpha: ${rgb.alpha})\n`;
            } else {
                output += `    static let ${swiftName} = "${value}"\n`;
            }
        });
        output += '}';
        return output;
    },
    
    android: function(tokens) {
        let output = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n';
        Object.entries(tokens).forEach(([name, value]) => {
            const androidName = name.replace(/-/g, '_');
            if (value.startsWith('#')) {
                output += `    <color name="${androidName}">${colorTransforms.hexToAndroid(value)}</color>\n`;
            } else {
                output += `    <dimen name="${androidName}">${sizeTransforms.cssToAndroidDp(value)}</dimen>\n`;
            }
        });
        output += '</resources>';
        return output;
    },
    
    flutter: function(tokens) {
        let output = 'import \'package:flutter/material.dart\';\n\nclass DesignTokens {\n';
        Object.entries(tokens).forEach(([name, value]) => {
            const flutterName = name.replace(/-(.)/g, (_, letter) => letter.toUpperCase());
            if (value.startsWith('#')) {
                output += `  static const ${flutterName} = ${colorTransforms.cssToFlutter(value)};\n`;
            } else {
                output += `  static const ${flutterName} = ${sizeTransforms.cssToFlutter(value)};\n`;
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
        return `module.exports = ${JSON.stringify(config, null, 2)}`;
    },
    
    typescript: function(tokens) {
        // Helper to convert kebab-case to camelCase
        const toCamelCase = function(str) {
            return str.replace(/-([a-z])/g, function(_, letter) {
                return letter.toUpperCase();
            });
        };
        
        // Categorize tokens by type
        const categorized = {
            colors: {},
            spacing: {},
            typography: {},
            shadows: {},
            borders: {},
            animations: {},
            other: {}
        };
        
        Object.entries(tokens).forEach(([name, value]) => {
            const category = name.split('-')[0];
            const camelName = toCamelCase(name);
            
            if (name.includes('color') || value.startsWith('#') || value.startsWith('rgb')) {
                categorized.colors[camelName] = value;
            } else if (name.includes('spacing') || name.includes('size') || name.includes('gap')) {
                categorized.spacing[camelName] = value;
            } else if (name.includes('font') || name.includes('text')) {
                categorized.typography[camelName] = value;
            } else if (name.includes('shadow')) {
                categorized.shadows[camelName] = value;
            } else if (name.includes('border')) {
                categorized.borders[camelName] = value;
            } else if (name.includes('animation') || name.includes('transition')) {
                categorized.animations[camelName] = value;
            } else {
                categorized.other[camelName] = value;
            }
        });
        
        // Build TypeScript output
        let output = '/**\n * Design Tokens - TypeScript Definitions\n * Generated from Figma design tokens\n */\n\n';
        
        // Generate interfaces
        if (Object.keys(categorized.colors).length > 0) {
            output += 'export interface ColorTokens {\n';
            Object.entries(categorized.colors).forEach(([name, value]) => {
                const originalName = Object.keys(tokens).find(k => toCamelCase(k) === name);
                output += `  /** Original token: ${originalName} */\n`;
                output += `  ${name}: string;\n`;
            });
            output += '}\n\n';
        }
        
        if (Object.keys(categorized.spacing).length > 0) {
            output += 'export interface SpacingTokens {\n';
            Object.entries(categorized.spacing).forEach(([name, value]) => {
                const originalName = Object.keys(tokens).find(k => toCamelCase(k) === name);
                output += `  /** Original token: ${originalName} */\n`;
                output += `  ${name}: string;\n`;
            });
            output += '}\n\n';
        }
        
        // Generate const objects
        if (Object.keys(categorized.colors).length > 0) {
            output += 'export const COLOR_TOKENS: ColorTokens = {\n';
            Object.entries(categorized.colors).forEach(([name, value]) => {
                output += `  ${name}: '${value}',\n`;
            });
            output = output.slice(0, -2) + '\n} as const;\n\n';
        }
        
        if (Object.keys(categorized.spacing).length > 0) {
            output += 'export const SPACING_TOKENS: SpacingTokens = {\n';
            Object.entries(categorized.spacing).forEach(([name, value]) => {
                output += `  ${name}: '${value}',\n`;
            });
            output = output.slice(0, -2) + '\n} as const;\n\n';
        }
        
        // Generate main tokens object
        output += '// All tokens as a flat object\n';
        output += 'export const DESIGN_TOKENS = {\n';
        Object.entries(tokens).forEach(([name, value]) => {
            const camelName = toCamelCase(name);
            output += `  ${camelName}: '${value}',\n`;
        });
        output = output.slice(0, -2) + '\n} as const;\n\n';
        
        // Generate token type
        output += '// Type for all token keys\n';
        output += 'export type TokenKey = keyof typeof DESIGN_TOKENS;\n\n';
        
        // Generate utility function
        output += '// Utility function to get token value\n';
        output += 'export function getToken(key: TokenKey): string {\n';
        output += '  return DESIGN_TOKENS[key];\n';
        output += '}\n';
        
        return output;
    }
};

// Main transform function that will be bundled into plugin
window.styleTransforms = {
    colorTransforms,
    sizeTransforms,
    fontWeightTransforms,
    formatGenerators
};
