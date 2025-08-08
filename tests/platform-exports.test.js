/**
 * Platform Export Tests
 * 
 * Tests real platform export functionality using actual functions from src/code.js
 * Validates all 7 platform formats with real color conversions and naming conventions.
 */

// Mock figma global before importing code.js
global.figma = {
    showUI: jest.fn(),
    variables: {
        getLocalVariablesAsync: jest.fn().mockResolvedValue([]),
        getLocalVariableCollectionsAsync: jest.fn().mockResolvedValue([])
    },
    ui: {
        postMessage: jest.fn(),
        resize: jest.fn(),
        onmessage: null
    },
    notify: jest.fn(),
    openExternal: jest.fn()
};

global.__html__ = 'mock-html';

// Import real functions from src/code.js
const {
    generateFormatContentManual,
    sanitizeName,
    generateNamingVariants,
    ValidationError
} = require('../src/code.js');

describe('Platform Export Tests - Real Code', () => {
    
    describe('Color Conversion Tests', () => {
        // Test data with real design tokens structure
        const testTokens = {
            brand: {
                primary: {
                    value: '#D2FF37',
                    type: 'color',
                    raw: { r: 0.823529411764706, g: 1.0, b: 0.21568627450980393, a: 1 }
                },
                secondary: {
                    value: 'rgba(255, 182, 193, 0.8)',
                    type: 'color',
                    raw: { r: 1.0, g: 0.7137254901960784, b: 0.7568627450980392, a: 0.8 }
                }
            },
            spacing: {
                xl: {
                    value: '32px',
                    type: 'dimension',
                    raw: 32
                }
            },
            typography: {
                fontWeight: {
                    bold: {
                        value: 700,
                        type: 'number',
                        raw: 700
                    }
                }
            }
        };

        test('should convert #D2FF37 (lime) correctly to all platforms', () => {
            const formats = ['css', 'swift', 'android', 'flutter', 'w3c', 'tailwind', 'typescript'];
            
            formats.forEach(format => {
                const result = generateFormatContentManual(testTokens, format);
                expect(result).not.toBeNull();
                expect(result.filename).toBeDefined();
                expect(result.content).toBeDefined();
                
                // Verify lime color appears in some form in each format
                switch (format) {
                    case 'css':
                        expect(result.content).toContain('#D2FF37');
                        break;
                    case 'swift':
                        // Should contain RGB values for lime: r:0.824, g:1.0, b:0.216
                        expect(result.content).toContain('red: 0.824');
                        expect(result.content).toContain('green: 1.000');
                        expect(result.content).toContain('blue: 0.216');
                        break;
                    case 'android':
                        expect(result.content).toContain('#D2FF37');
                        break;
                    case 'flutter':
                        // Flutter uses ARGB hex: 0xFFD2FF37 for lime
                        expect(result.content).toContain('0xFFD2FF37');
                        break;
                    case 'w3c':
                        expect(result.content).toContain('#D2FF37');
                        break;
                    case 'tailwind':
                        expect(result.content).toContain('#D2FF37');
                        break;
                    case 'typescript':
                        expect(result.content).toContain('#D2FF37');
                        break;
                }
            });
        });

        test('should handle RGBA with transparency correctly', () => {
            // Focus on formats that handle alpha differently
            const alphaFormats = ['android', 'flutter', 'css'];
            
            alphaFormats.forEach(format => {
                const result = generateFormatContentManual(testTokens, format);
                expect(result).not.toBeNull();
                
                switch (format) {
                    case 'android':
                        // Android uses AARRGGBB format - should have alpha prefix
                        expect(result.content).toContain('#ccffb6c1'); // AARRGGBB format with alpha
                        break;
                    case 'flutter':
                        // Flutter should use Color.fromARGB or 0xAARRGGBB
                        expect(result.content).toContain('0xCC'); // Alpha component
                        break;
                    case 'css':
                        // CSS should preserve rgba() format
                        expect(result.content).toContain('rgba(255, 182, 193, 0.8)');
                        break;
                }
            });
        });

        test('should generate correct filenames for each platform', () => {
            const expectedFilenames = {
                'css': 'tokens.css',
                'swift': 'tokens.swift',
                'android': 'resources.xml',
                'flutter': 'app_tokens.dart',
                'w3c': 'tokens.json',
                'tailwind': 'tailwind.config.js',
                'typescript': 'tokens.ts'
            };

            Object.entries(expectedFilenames).forEach(([format, expectedFilename]) => {
                const result = generateFormatContentManual(testTokens, format);
                expect(result).not.toBeNull();
                expect(result.filename).toBe(expectedFilename);
            });
        });
    });

    describe('Naming Convention Tests', () => {
        const testPath = ['brand', 'colors', 'primary-accent'];

        test('should generate correct camelCase for iOS/Swift', () => {
            const variants = generateNamingVariants(testPath);
            expect(variants.camel).toBe('brandColorsPrimaryAccent');
            
            // Test sanitizeName directly
            const swiftName = sanitizeName('primary-accent', 'swift');
            expect(swiftName).toBe('primaryAccent');
        });

        test('should generate correct snake_case for Android', () => {
            const variants = generateNamingVariants(testPath);
            expect(variants.snake).toBe('brand_colors_primary_accent');
            
            // Test sanitizeName directly
            const androidName = sanitizeName('primary-accent', 'android');
            expect(androidName).toBe('primary_accent');
        });

        test('should generate correct kebab-case for CSS', () => {
            const variants = generateNamingVariants(testPath);
            expect(variants.kebab).toBe('brand-colors-primary-accent');
            
            // Test sanitizeName directly
            const cssName = sanitizeName('Primary Accent!', 'css');
            expect(cssName).toBe('primary-accent');
        });

        test('should handle numbers in names correctly', () => {
            // Names starting with numbers should be prefixed for Swift/Flutter
            const numberName = sanitizeName('2xl-spacing', 'swift');
            expect(numberName).toBe('_2xlSpacing');
            
            const flutterName = sanitizeName('2xl-spacing', 'flutter');
            expect(flutterName).toBe('_2xlSpacing');
            
            // CSS and Android should handle numbers normally
            const cssName = sanitizeName('2xl-spacing', 'css');
            expect(cssName).toBe('2xl-spacing');
            
            const androidName = sanitizeName('2xl-spacing', 'android');
            expect(androidName).toBe('2xl_spacing');
        });

        test('should handle special characters and sanitize properly', () => {
            const specialName = 'Special! @#$% Name (test)';
            
            const platforms = ['css', 'swift', 'android', 'flutter'];
            platforms.forEach(platform => {
                const sanitized = sanitizeName(specialName, platform);
                expect(sanitized).not.toContain('!');
                expect(sanitized).not.toContain('@');
                expect(sanitized).not.toContain('#');
                expect(sanitized).not.toContain('$');
                expect(sanitized).not.toContain('%');
                expect(sanitized).not.toContain('(');
                expect(sanitized).not.toContain(')');
            });
        });
    });

    describe('Platform-Specific Format Tests', () => {
        const simpleTokens = {
            color: {
                primary: {
                    value: '#FF0000',
                    type: 'color',
                    raw: { r: 1, g: 0, b: 0, a: 1 }
                }
            },
            spacing: {
                medium: {
                    value: '16px',
                    type: 'dimension',
                    raw: 16
                }
            }
        };

        test('CSS format should generate CSS custom properties', () => {
            const result = generateFormatContentManual(simpleTokens, 'css');
            expect(result).not.toBeNull();
            expect(result.content).toContain(':root {');
            expect(result.content).toContain('--color-primary: #FF0000;');
            expect(result.content).toContain('--spacing-medium: 16px;');
            expect(result.content).toContain('}');
        });

        test('Swift format should generate UIColor properties', () => {
            const result = generateFormatContentManual(simpleTokens, 'swift');
            expect(result).not.toBeNull();
            expect(result.content).toContain('import UIKit');
            expect(result.content).toContain('struct AppTokens {');
            expect(result.content).toContain('static let colorPrimary = UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.000)');
            expect(result.content).toContain('static let spacingMedium: CGFloat = 16');
            expect(result.content).toContain('}');
        });

        test('Android format should generate XML resources', () => {
            const result = generateFormatContentManual(simpleTokens, 'android');
            expect(result).not.toBeNull();
            expect(result.content).toContain('<?xml version="1.0" encoding="utf-8"?>');
            expect(result.content).toContain('<resources>');
            expect(result.content).toContain('<color name="color_primary">#FF0000</color>');
            expect(result.content).toContain('<dimen name="spacing_medium">16dp</dimen>');
            expect(result.content).toContain('</resources>');
        });

        test('Flutter format should generate Dart constants', () => {
            const result = generateFormatContentManual(simpleTokens, 'flutter');
            expect(result).not.toBeNull();
            expect(result.content).toContain('import \'package:flutter/material.dart\';');
            expect(result.content).toContain('class AppTokens {');
            expect(result.content).toContain('static const Color colorPrimary = Color(0xFFFF0000);');
            expect(result.content).toContain('static const double spacingMedium = 16;');
            expect(result.content).toContain('}');
        });

        test('W3C format should generate JSON tokens', () => {
            const result = generateFormatContentManual(simpleTokens, 'w3c');
            expect(result).not.toBeNull();
            
            // Should be valid JSON
            expect(() => JSON.parse(result.content)).not.toThrow();
            
            const parsed = JSON.parse(result.content);
            expect(parsed.token).toBeDefined();
            expect(parsed.token.color.primary.$type).toBe('color');
            expect(parsed.token.color.primary.$value).toBe('#FF0000');
            expect(parsed.token.spacing.medium.$type).toBe('dimension');
            expect(parsed.token.spacing.medium.$value).toBe(16);
        });

        test('Tailwind format should generate config file', () => {
            const result = generateFormatContentManual(simpleTokens, 'tailwind');
            expect(result).not.toBeNull();
            expect(result.content).toContain('module.exports = {');
            expect(result.content).toContain('theme: {');
            expect(result.content).toContain('extend:');
            expect(result.content).toContain('colors');
            expect(result.content).toContain('spacing');
            expect(result.content).toContain('}');
        });

        test('TypeScript format should generate type definitions', () => {
            const result = generateFormatContentManual(simpleTokens, 'typescript');
            expect(result).not.toBeNull();
            expect(result.content).toContain('export interface DesignTokens {');
            expect(result.content).toContain('export const DESIGN_TOKENS: DesignTokens = {');
            expect(result.content).toContain('colorPrimary: "#FF0000"');
            expect(result.content).toContain('spacingMedium: "16px"');
            expect(result.content).toContain('export default DESIGN_TOKENS;');
        });
    });

    describe('Complex Token Structure Tests', () => {
        const complexTokens = {
            theme: {
                light: {
                    background: {
                        primary: {
                            value: '#FFFFFF',
                            type: 'color',
                            raw: { r: 1, g: 1, b: 1, a: 1 }
                        },
                        secondary: {
                            value: '#F5F5F5',
                            type: 'color',
                            raw: { r: 0.9607843137254902, g: 0.9607843137254902, b: 0.9607843137254902, a: 1 }
                        }
                    }
                }
            },
            typography: {
                heading: {
                    large: {
                        fontSize: {
                            value: '32px',
                            type: 'dimension',
                            raw: 32
                        },
                        fontWeight: {
                            value: 700,
                            type: 'number',
                            raw: 700
                        }
                    }
                }
            }
        };

        test('should handle deeply nested token structures', () => {
            const formats = ['css', 'swift', 'android'];
            
            formats.forEach(format => {
                const result = generateFormatContentManual(complexTokens, format);
                expect(result).not.toBeNull();
                expect(result.content).toBeDefined();
                
                // Should contain deeply nested token names
                switch (format) {
                    case 'css':
                        expect(result.content).toContain('--theme-light-background-primary');
                        expect(result.content).toContain('--typography-heading-large-fontsize');
                        break;
                    case 'swift':
                        expect(result.content).toContain('themeLightBackgroundPrimary');
                        expect(result.content).toContain('typographyHeadingLargeFontsize');
                        break;
                    case 'android':
                        expect(result.content).toContain('theme_light_background_primary');
                        expect(result.content).toContain('typography_heading_large_fontsize');
                        break;
                }
            });
        });
    });

    describe('Error Handling Tests', () => {
        test('should handle invalid format gracefully', () => {
            const result = generateFormatContentManual({}, 'invalid-format');
            expect(result).toBeNull();
        });

        test('should handle empty token object', () => {
            const result = generateFormatContentManual({}, 'css');
            expect(result).not.toBeNull();
            expect(result.content).toBe(':root {\n\n}');
        });

        test('should throw ValidationError for invalid names', () => {
            expect(() => sanitizeName(null, 'css')).toThrow(ValidationError);
            expect(() => sanitizeName(123, 'css')).toThrow(ValidationError);
            expect(() => sanitizeName('test', 'invalid-platform')).toThrow(ValidationError);
        });

        test('should handle edge cases in naming', () => {
            // Empty string should return default
            const emptyName = sanitizeName('', 'css');
            expect(emptyName).toBe('unnamed-token');
            
            // Whitespace only should return default
            const whitespaceName = sanitizeName('   ', 'css');
            expect(whitespaceName).toBe('unnamed-token');
            
            // Special characters only should return default
            const specialName = sanitizeName('!@#$%', 'css');
            expect(specialName).toBe('unnamed-token');
        });
    });

    describe('Real-world Integration Tests', () => {
        const realWorldTokens = {
            brand: {
                primary: {
                    value: '#D2FF37',
                    type: 'color',
                    raw: { r: 0.823529411764706, g: 1.0, b: 0.21568627450980393, a: 1 }
                }
            },
            semantic: {
                success: {
                    value: '#10B981',
                    type: 'color',
                    raw: { r: 0.06274509803921569, g: 0.7254901960784313, b: 0.5058823529411764, a: 1 }
                },
                warning: {
                    value: 'rgba(251, 191, 36, 0.9)',
                    type: 'color',
                    raw: { r: 0.984313725490196, g: 0.7490196078431373, b: 0.1411764705882353, a: 0.9 }
                }
            },
            spacing: {
                xs: { value: '4px', type: 'dimension', raw: 4 },
                sm: { value: '8px', type: 'dimension', raw: 8 },
                md: { value: '16px', type: 'dimension', raw: 16 },
                lg: { value: '24px', type: 'dimension', raw: 24 },
                xl: { value: '32px', type: 'dimension', raw: 32 }
            },
            typography: {
                fontSize: {
                    caption: { value: '12px', type: 'dimension', raw: 12 },
                    body: { value: '16px', type: 'dimension', raw: 16 },
                    heading: { value: '24px', type: 'dimension', raw: 24 }
                },
                fontWeight: {
                    normal: { value: 400, type: 'number', raw: 400 },
                    medium: { value: 500, type: 'number', raw: 500 },
                    bold: { value: 700, type: 'number', raw: 700 }
                }
            }
        };

        test('should export complete design system to all formats', () => {
            const formats = ['css', 'swift', 'android', 'flutter', 'w3c', 'tailwind', 'typescript'];
            
            formats.forEach(format => {
                const result = generateFormatContentManual(realWorldTokens, format);
                expect(result).not.toBeNull();
                expect(result.filename).toBeDefined();
                expect(result.content).toBeDefined();
                expect(result.content.length).toBeGreaterThan(0);
                
                // Verify key tokens exist in each format
                const content = result.content.toLowerCase();
                expect(content).toContain('brand');
                expect(content).toContain('spacing');
                expect(content).toContain('typography');
            });
        });

        test('should maintain consistent token counts across formats', () => {
            const cssResult = generateFormatContentManual(realWorldTokens, 'css');
            const swiftResult = generateFormatContentManual(realWorldTokens, 'swift');
            
            // Count CSS variables (--token-name)
            const cssTokenCount = (cssResult.content.match(/--[\w-]+:/g) || []).length;
            
            // Count Swift properties (static let)
            const swiftTokenCount = (swiftResult.content.match(/static let \w+/g) || []).length;
            
            expect(cssTokenCount).toBeGreaterThan(0);
            expect(swiftTokenCount).toBeGreaterThan(0);
            // Should have same number of tokens (allowing for format differences)
            expect(Math.abs(cssTokenCount - swiftTokenCount)).toBeLessThanOrEqual(2);
        });
    });
});