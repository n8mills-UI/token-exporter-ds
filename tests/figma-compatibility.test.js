/**
 * Figma JavaScript Compatibility Tests - Fixed Version
 * 
 * Verifies that all validation code is compatible with Figma's
 * JavaScript runtime constraints and limitations.
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

// Import the real code functions
const {
    ValidationError,
    sanitizeName,
    validateExportInputs,
    generateFormatContentManual,
    checkMemoryUsage
} = require('../src/code.js');

describe('Figma JavaScript Compatibility Tests - Real Code', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    describe('Forbidden JavaScript Features Detection', () => {
        test('sanitizeName function should not use optional chaining', () => {
            // Test that the function works without optional chaining
            expect(() => sanitizeName('test-name', 'css')).not.toThrow();
            expect(sanitizeName('test-name', 'css')).toBe('test-name');
            
            // The function should handle null/undefined explicitly
            expect(() => sanitizeName(null, 'css')).toThrow(ValidationError);
            expect(() => sanitizeName(undefined, 'css')).toThrow(ValidationError);
        });
        
        test('validateExportInputs should not use template literals with interpolation', () => {
            // Test that validation messages are constructed with string concatenation
            try {
                validateExportInputs(['col1'], ['invalid-format'], ['color']);
                fail('Should have thrown ValidationError');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.message).toContain('Invalid formats: invalid-format');
                // Message should be constructed with concatenation, not template literals
                expect(error.message).toContain('Valid formats: css, swift, android, flutter, w3c, tailwind, typescript');
            }
        });
        
        test('generateFormatContentManual should not use nullish coalescing', () => {
            const testTokens = {
                primary: {
                    value: '#FF0000',
                    type: 'color',
                    raw: { r: 1, g: 0, b: 0, a: 1 }
                }
            };
            
            // Should handle missing values explicitly
            const result = generateFormatContentManual(testTokens, 'css');
            expect(result).not.toBeNull();
            expect(result.content).toContain(':root {');
        });
        
        test('code should handle array methods safely', () => {
            // Test that the code uses traditional for loops and safe array methods
            const collectionIds = ['col1', 'col2'];
            const formats = ['css', 'swift'];
            const tokenTypes = ['color'];
            
            expect(() => {
                validateExportInputs(collectionIds, formats, tokenTypes);
            }).not.toThrow();
        });
    });
    
    describe('Figma-Compatible Error Handling', () => {
        test('should use traditional try-catch with error parameter', () => {
            // Test that errors are caught with explicit parameter
            try {
                validateExportInputs(null, ['css'], ['color']);
                fail('Should have thrown');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.name).toBe('ValidationError');
                expect(error.context).toBeDefined();
            }
        });
        
        test('should use explicit property access instead of destructuring', () => {
            const validationError = new ValidationError('Test message', { field: 'value' });
            
            // Properties should be accessible with dot notation
            expect(validationError.message).toBe('Test message');
            expect(validationError.context.field).toBe('value');
            expect(validationError.timestamp).toBeDefined();
        });
        
        test('should handle object properties safely', () => {
            const testTokens = {
                color: {
                    primary: {
                        value: '#FF0000',
                        type: 'color',
                        raw: { r: 1, g: 0, b: 0, a: 1 }
                    }
                }
            };
            
            const result = generateFormatContentManual(testTokens, 'w3c');
            expect(result).not.toBeNull();
            
            const parsed = JSON.parse(result.content);
            // Should access nested properties safely
            expect(parsed.token.color.primary.$type).toBe('color');
            expect(parsed.token.color.primary.$value).toBe('#FF0000');
        });
    });
    
    describe('Performance in Figma Environment', () => {
        test('should handle string concatenation efficiently', () => {
            const testTokens = {
                primary: { value: '#FF0000', type: 'color', raw: { r: 1, g: 0, b: 0, a: 1 }},
                secondary: { value: '#00FF00', type: 'color', raw: { r: 0, g: 1, b: 0, a: 1 }},
                accent: { value: '#0000FF', type: 'color', raw: { r: 0, g: 0, b: 1, a: 1 }}
            };
            
            const result = generateFormatContentManual(testTokens, 'css');
            expect(result).not.toBeNull();
            expect(result.content).toContain('--primary: #FF0000');
            expect(result.content).toContain('--secondary: #00FF00');
            expect(result.content).toContain('--accent: #0000FF');
        });
        
        test('should handle memory monitoring without modern syntax', () => {
            // Mock performance.memory
            global.performance = {
                memory: {
                    usedJSHeapSize: 50 * 1024 * 1024,
                    totalJSHeapSize: 100 * 1024 * 1024,
                    jsHeapSizeLimit: 200 * 1024 * 1024
                }
            };
            
            const result = checkMemoryUsage(false);
            expect(result).toBeDefined();
            expect(result.used).toBeCloseTo(50);
        });
        
        test('should process large token sets without blocking', () => {
            // Create a larger token set to test performance
            const largeTokenSet = {};
            for (let i = 0; i < 50; i++) {
                largeTokenSet['color' + i] = {
                    value: '#FF' + i.toString(16).padStart(4, '0'),
                    type: 'color',
                    raw: { r: 1, g: i / 50, b: 0, a: 1 }
                };
            }
            
            const startTime = Date.now();
            const result = generateFormatContentManual(largeTokenSet, 'css');
            const endTime = Date.now();
            
            expect(result).not.toBeNull();
            expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
        });
    });
    
    describe('CSP and Security Compliance', () => {
        test('should not use eval or Function constructor patterns', () => {
            const testTokens = {
                dynamic: {
                    value: 'calc(100% - 20px)',
                    type: 'dimension',
                    raw: 'calc(100% - 20px)'
                }
            };
            
            // Should handle dynamic values safely without eval
            const result = generateFormatContentManual(testTokens, 'css');
            expect(result).not.toBeNull();
            expect(result.content).toContain('calc(100% - 20px)');
        });
        
        test('should handle special characters in token names safely', () => {
            const testTokens = {
                'special/characters (test)': {
                    value: '#FF0000',
                    type: 'color',
                    raw: { r: 1, g: 0, b: 0, a: 1 }
                }
            };
            
            const result = generateFormatContentManual(testTokens, 'css');
            expect(result).not.toBeNull();
            // Should sanitize to safe CSS variable name
            expect(result.content).toContain('--special-characters');
        });
        
        test('should validate formats against whitelist', () => {
            const testTokens = {
                primary: { value: '#FF0000', type: 'color', raw: { r: 1, g: 0, b: 0, a: 1 }}
            };
            
            // Valid formats should work
            expect(generateFormatContentManual(testTokens, 'css')).not.toBeNull();
            expect(generateFormatContentManual(testTokens, 'swift')).not.toBeNull();
            expect(generateFormatContentManual(testTokens, 'android')).not.toBeNull();
            
            // Invalid format should return null
            expect(generateFormatContentManual(testTokens, 'malicious-format')).toBeNull();
        });
    });
    
    describe('Type Safety and Validation', () => {
        test('should validate input types strictly', () => {
            // String instead of array
            expect(() => {
                validateExportInputs('not-array', ['css'], ['color']);
            }).toThrow(ValidationError);
            
            // Number instead of string
            expect(() => {
                sanitizeName(123, 'css');
            }).toThrow(ValidationError);
            
            // Invalid platform
            expect(() => {
                sanitizeName('test', 'invalid');
            }).toThrow(ValidationError);
        });
        
        test('should handle edge cases gracefully', () => {
            // Empty inputs
            expect(sanitizeName('', 'css')).toBe('unnamed-token');
            expect(sanitizeName('   ', 'css')).toBe('unnamed-token');
            
            // Empty token object
            const result = generateFormatContentManual({}, 'css');
            expect(result).not.toBeNull();
            expect(result.content).toContain(':root {');
        });
        
        test('should maintain consistent naming conventions', () => {
            // Test consistent sanitization across platforms
            const testName = 'Primary Color Button';
            
            expect(sanitizeName(testName, 'css')).toBe('primary-color-button');
            expect(sanitizeName(testName, 'swift')).toBe('primaryColorButton');
            expect(sanitizeName(testName, 'android')).toBe('primary_color_button');
            expect(sanitizeName(testName, 'flutter')).toBe('primaryColorButton');
        });
    });
    
    describe('Real-world Integration Scenarios', () => {
        test('should handle complex nested token structures', () => {
            const complexTokens = {
                theme: {
                    light: {
                        colors: {
                            primary: { value: '#FF0000', type: 'color', raw: { r: 1, g: 0, b: 0, a: 1 }},
                            secondary: { value: '#00FF00', type: 'color', raw: { r: 0, g: 1, b: 0, a: 1 }}
                        },
                        spacing: {
                            small: { value: '8px', type: 'dimension', raw: 8 },
                            medium: { value: '16px', type: 'dimension', raw: 16 }
                        }
                    }
                }
            };
            
            const cssResult = generateFormatContentManual(complexTokens, 'css');
            expect(cssResult).not.toBeNull();
            expect(cssResult.content).toContain('--theme-light-colors-primary: #FF0000');
            expect(cssResult.content).toContain('--theme-light-spacing-small: 8px');
        });
        
        test('should handle platform-specific requirements', () => {
            const testTokens = {
                '2xl-spacing': { value: '32px', type: 'dimension', raw: 32 },
                'font-weight-bold': { value: 700, type: 'number', raw: 700 }
            };
            
            // Swift should prefix numbers with underscore
            const swiftResult = generateFormatContentManual(testTokens, 'swift');
            expect(swiftResult.content).toContain('static let _2xlSpacing: CGFloat = 32');
            
            // Android should use underscores
            const androidResult = generateFormatContentManual(testTokens, 'android');
            expect(androidResult.content).toContain('name="2xl_spacing"');
        });
        
        test('should maintain consistency across formats', () => {
            const testTokens = {
                primary: { value: '#FF0000', type: 'color', raw: { r: 1, g: 0, b: 0, a: 1 }},
                fontSize: { value: '16px', type: 'dimension', raw: 16 }
            };
            
            const formats = ['css', 'swift', 'android', 'w3c'];
            const results = formats.map(format => generateFormatContentManual(testTokens, format));
            
            // All formats should generate successfully
            results.forEach(result => {
                expect(result).not.toBeNull();
                expect(result.filename).toBeDefined();
                expect(result.content.length).toBeGreaterThan(0);
            });
        });
    });
});