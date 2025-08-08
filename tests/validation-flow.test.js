/**
 * Validation Flow Test Suite - Fixed Version
 * 
 * Tests the actual src/code.js functions instead of mock implementations.
 * Focuses on real platform export validation and functionality.
 */

// Mock figma global before importing code.js to prevent side effects
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

// Import the real code functions to test
const {
    ValidationError,
    NetworkError,
    ProcessingError,
    MemoryError,
    validateExportInputs,
    sanitizeName,
    generateNamingVariants,
    generateFormatContentManual,
    checkMemoryUsage,
    createStructuredError
} = require('../src/code.js');

// Mock Figma environment for testing
const mockFigmaEnvironment = () => {
    // Mock parent.postMessage for Figma communication
    global.parent = {
        postMessage: jest.fn()
    };
    
    // Mock Figma API
    global.figma = {
        variables: {
            getLocalVariablesAsync: jest.fn().mockResolvedValue([]),
            getLocalVariableCollectionsAsync: jest.fn().mockResolvedValue([])
        },
        ui: {
            postMessage: jest.fn(),
            resize: jest.fn()
        },
        notify: jest.fn(),
        openExternal: jest.fn()
    };
};

describe('Platform Export Tests - Real Code Coverage', () => {
    beforeEach(() => {
        mockFigmaEnvironment();
        jest.clearAllMocks();
    });
    
    describe('Input Validation Tests', () => {
        test('should validate export inputs correctly', () => {
            // Test the real validateExportInputs function
            expect(() => {
                validateExportInputs(['collection-1'], ['css'], ['color']);
            }).not.toThrow();
            
            // Test validation errors
            expect(() => {
                validateExportInputs([], ['css'], ['color']);
            }).toThrow(ValidationError);
            
            expect(() => {
                validateExportInputs(['collection-1'], [], ['color']);
            }).toThrow(ValidationError);
            
            expect(() => {
                validateExportInputs(['collection-1'], ['css'], []);
            }).toThrow(ValidationError);
            
            // Test invalid formats
            expect(() => {
                validateExportInputs(['collection-1'], ['invalid-format'], ['color']);
            }).toThrow(ValidationError);
        });
        
        test('should throw ValidationError for invalid input types', () => {
            expect(() => {
                validateExportInputs('not-array', ['css'], ['color']);
            }).toThrow(ValidationError);
            
            expect(() => {
                validateExportInputs(['collection'], 'not-array', ['color']);
            }).toThrow(ValidationError);
            
            expect(() => {
                validateExportInputs(['collection'], ['css'], 'not-array');
            }).toThrow(ValidationError);
        });
    });
    
    describe('Name Sanitization Tests', () => {
        test('should sanitize names for different platforms', () => {
            // Test the real sanitizeName function
            expect(sanitizeName('Primary Color', 'css')).toBe('primary-color');
            expect(sanitizeName('Primary Color', 'swift')).toBe('primaryColor');
            expect(sanitizeName('Primary Color', 'android')).toBe('primary_color');
            expect(sanitizeName('Primary Color', 'flutter')).toBe('primaryColor');
            
            // Test edge cases
            expect(sanitizeName('2x Large', 'swift')).toBe('_2xLarge');
            expect(sanitizeName('2x Large', 'flutter')).toBe('_2xLarge');
            expect(sanitizeName('', 'css')).toBe('unnamed-token');
            expect(sanitizeName('   ', 'css')).toBe('unnamed-token');
            expect(sanitizeName('Invalid/Path\\\\Name (old)', 'css')).toBe('invalid-pathname');
        });
        
        test('should handle null and undefined names', () => {
            expect(() => sanitizeName(null)).toThrow(ValidationError);
            expect(() => sanitizeName(undefined)).toThrow(ValidationError);
            expect(() => sanitizeName(123)).toThrow(ValidationError);
        });
        
        test('should throw ValidationError for invalid platform', () => {
            expect(() => sanitizeName('test', 'invalid-platform')).toThrow(ValidationError);
        });
        
        test('should generate naming variants correctly', () => {
            // Test the real generateNamingVariants function
            const variants = generateNamingVariants(['primary', 'color', 'base']);
            expect(variants.snake).toBe('primary_color_base');
            expect(variants.kebab).toBe('primary-color-base');
            expect(variants.camel).toBe('primaryColorBase');
        });
    });
    
    describe('Platform Export Generation Tests', () => {
        const mockTokens = {
            primary: {
                value: '#FF0000',
                type: 'color',
                raw: { r: 1, g: 0, b: 0, a: 1 }
            },
            secondary: {
                value: 'rgba(0, 255, 0, 0.5)',
                type: 'color',
                raw: { r: 0, g: 1, b: 0, a: 0.5 }
            },
            spacing: {
                large: {
                    value: '24px',
                    type: 'dimension',
                    raw: 24
                }
            },
            fontSize: {
                heading: {
                    value: '32px',
                    type: 'dimension',
                    raw: 32
                }
            },
            fontWeight: {
                bold: {
                    value: 700,
                    type: 'number',
                    raw: 700
                }
            },
            isEnabled: {
                value: true,
                type: 'boolean',
                raw: true
            },
            title: {
                value: '"App Title"',
                type: 'string',
                raw: 'App Title'
            }
        };
        
        test('should generate CSS format content', () => {
            const result = generateFormatContentManual(mockTokens, 'css');
            expect(result).not.toBeNull();
            expect(result.filename).toBe('tokens.css');
            expect(result.content).toContain(':root {');
            expect(result.content).toContain('--primary: #FF0000;');
            expect(result.content).toContain('--spacing-large: 24px;');
            expect(result.content).toContain('--fontweight-bold: 700;');
            expect(result.content).toContain('}');
        });
        
        test('should generate Swift format content', () => {
            const result = generateFormatContentManual(mockTokens, 'swift');
            expect(result).not.toBeNull();
            expect(result.filename).toBe('tokens.swift');
            expect(result.content).toContain('import UIKit');
            expect(result.content).toContain('struct AppTokens');
            expect(result.content).toContain('static let primary = UIColor(red: 1.000, green: 0.000, blue: 0.000, alpha: 1.000)');
            expect(result.content).toContain('static let secondary = UIColor(red: 0.000, green: 1.000, blue: 0.000, alpha: 0.500)');
            expect(result.content).toContain('static let fontsizeHeading: CGFloat = 32');
            expect(result.content).toContain('static let fontweightBold: Double = 700');
            expect(result.content).toContain('static let isenabled: Bool = true');
            expect(result.content).toContain('static let title: String = "App Title"');
        });
        
        test('should generate Android format content', () => {
            const result = generateFormatContentManual(mockTokens, 'android');
            expect(result).not.toBeNull();
            expect(result.filename).toBe('resources.xml');
            expect(result.content).toContain('<?xml version="1.0" encoding="utf-8"?>');
            expect(result.content).toContain('<resources>');
            expect(result.content).toContain('<color name="primary">#FF0000</color>');
            expect(result.content).toContain('<color name="secondary">'); // Alpha format handling varies
            expect(result.content).toContain('<dimen name="spacing_large">24dp</dimen>');
            expect(result.content).toContain('<string name="title">App Title</string>');
            expect(result.content).toContain('<bool name="isenabled">true</bool>');
            expect(result.content).toContain('</resources>');
        });
        
        test('should generate Flutter format content', () => {
            const result = generateFormatContentManual(mockTokens, 'flutter');
            expect(result).not.toBeNull();
            expect(result.filename).toBe('app_tokens.dart');
            expect(result.content).toContain("import 'package:flutter/material.dart'");
            expect(result.content).toContain('class AppTokens');
            expect(result.content).toContain('static const Color primary = Color(0xFFFF0000);');
            expect(result.content).toContain('static const Color secondary = Color('); // Alpha format
            expect(result.content).toContain('static const double spacingLarge = 24;');
            expect(result.content).toContain('static const double fontweightBold = 700;');
            expect(result.content).toContain('static const bool isenabled = true;');
            expect(result.content).toContain('static const String title = "App Title";');
        });
        
        test('should generate TypeScript format content', () => {
            const result = generateFormatContentManual(mockTokens, 'typescript');
            expect(result).not.toBeNull();
            expect(result.filename).toBe('tokens.ts');
            expect(result.content).toContain('export interface DesignTokens');
            expect(result.content).toContain('export const DESIGN_TOKENS: DesignTokens');
            expect(result.content).toContain('primary: "#FF0000"');
            expect(result.content).toContain('fontweightBold: 700');
            expect(result.content).toContain('isenabled: true');
            expect(result.content).toContain('export default DESIGN_TOKENS');
        });
        
        test('should generate W3C format content', () => {
            const result = generateFormatContentManual(mockTokens, 'w3c');
            expect(result).not.toBeNull();
            expect(result.filename).toBe('tokens.json');
            const parsed = JSON.parse(result.content);
            expect(parsed.token.primary.$type).toBe('color');
            expect(parsed.token.primary.$value).toBe('#FF0000');
            expect(parsed.token.spacing.large.$type).toBe('dimension');
            expect(parsed.token.spacing.large.$value).toBe(24);
            expect(parsed.token.fontWeight.bold.$type).toBe('number');
            expect(parsed.token.fontWeight.bold.$value).toBe(700);
        });
        
        test('should generate Tailwind format content', () => {
            const result = generateFormatContentManual(mockTokens, 'tailwind');
            expect(result).not.toBeNull();
            expect(result.filename).toBe('tailwind.config.js');
            expect(result.content).toContain('module.exports = {');
            expect(result.content).toContain('theme: {');
            expect(result.content).toContain('extend:');
            expect(result.content).toContain('"primary": "#FF0000"');
            expect(result.content).toContain('"spacing-large": "24px"');
        });
    });
    
    describe('Error Handling Tests', () => {
        test('should create custom error instances with context', () => {
            const validationError = new ValidationError('Test message', { field: 'test' });
            expect(validationError).toBeInstanceOf(ValidationError);
            expect(validationError.name).toBe('ValidationError');
            expect(validationError.context.field).toBe('test');
            expect(validationError.timestamp).toBeDefined();
            
            const networkError = new NetworkError('Network failed');
            expect(networkError).toBeInstanceOf(NetworkError);
            expect(networkError.name).toBe('NetworkError');
        });
        
        test('should create structured error objects', () => {
            const error = new Error('Test error');
            const structured = createStructuredError('test-operation', error, { param: 'value' });
            
            expect(structured.operation).toBe('test-operation');
            expect(structured.message).toBe('Test error');
            expect(structured.context.param).toBe('value');
            expect(structured.timestamp).toBeDefined();
            expect(structured.stack).toBeDefined();
        });
        
        test('should handle empty token objects gracefully', () => {
            const result = generateFormatContentManual({}, 'css');
            expect(result).not.toBeNull();
            expect(result.content).toBe(':root {\n\n}');
        });
        
        test('should handle unsupported formats', () => {
            const mockTokens = {
                primary: {
                    value: '#FF0000',
                    type: 'color',
                    raw: { r: 1, g: 0, b: 0, a: 1 }
                }
            };
            
            const result = generateFormatContentManual(mockTokens, 'unsupported-format');
            expect(result).toBeNull();
        });
    });
    
    describe('Memory Usage Tests', () => {
        test('should check memory usage without throwing', () => {
            // Mock performance.memory for testing
            global.performance = {
                memory: {
                    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
                    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
                    jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
                }
            };
            
            const result = checkMemoryUsage(false);
            expect(result).toBeDefined();
            expect(result.used).toBeCloseTo(50);
            expect(result.total).toBeCloseTo(100);
            expect(result.limit).toBeCloseTo(200);
        });
        
        test('should throw MemoryError when threshold exceeded and flag is set', () => {
            global.performance = {
                memory: {
                    usedJSHeapSize: 200 * 1024 * 1024, // 200MB (exceeds threshold)
                    totalJSHeapSize: 300 * 1024 * 1024,
                    jsHeapSizeLimit: 400 * 1024 * 1024
                }
            };
            
            expect(() => checkMemoryUsage(true)).toThrow(MemoryError);
        });
    });
    
    describe('Edge Cases and Complex Scenarios', () => {
        test('should handle nested token structures', () => {
            const nestedTokens = {
                colors: {
                    brand: {
                        primary: {
                            value: '#FF0000',
                            type: 'color',
                            raw: { r: 1, g: 0, b: 0, a: 1 }
                        }
                    }
                }
            };
            
            const result = generateFormatContentManual(nestedTokens, 'css');
            expect(result.content).toContain('--colors-brand-primary: #FF0000;');
        });
        
        test('should handle special characters in token names', () => {
            const specialTokens = {
                'color/primary (main)': {
                    value: '#FF0000',
                    type: 'color',
                    raw: { r: 1, g: 0, b: 0, a: 1 }
                }
            };
            
            const result = generateFormatContentManual(specialTokens, 'css');
            // Should be sanitized to valid CSS variable name
            expect(result.content).toContain('--color-primary: #FF0000;');
        });
        
        test('should handle tokens with zero or negative values', () => {
            const edgeCaseTokens = {
                zeroSpacing: {
                    value: '0px',
                    type: 'dimension',
                    raw: 0
                },
                negativeMargin: {
                    value: '-8px',
                    type: 'dimension', 
                    raw: -8
                }
            };
            
            const result = generateFormatContentManual(edgeCaseTokens, 'css');
            expect(result.content).toContain('--zerospacing: 0px;');
            expect(result.content).toContain('--negativemargin: -8px;');
        });
    });
});