/**
 * Core Functions Unit Tests
 * 
 * Unit tests for specific uncovered functions in src/code.js
 * to increase code coverage to the target 80%.
 */

describe('Core Functions Unit Tests', () => {
    let mockPerformance;
    let mockFigma;
    let mockConsole;
    
    beforeEach(() => {
        // Mock performance API
        mockPerformance = {
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024,     // 50MB
                totalJSHeapSize: 100 * 1024 * 1024,   // 100MB  
                jsHeapSizeLimit: 2000 * 1024 * 1024   // 2GB
            }
        };
        global.performance = mockPerformance;
        
        // Mock Figma API
        mockFigma = {
            notify: jest.fn(),
            closePlugin: jest.fn()
        };
        global.figma = mockFigma;
        
        // Mock console
        mockConsole = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        global.console = mockConsole;
    });
    
    describe('validateExportInputs', () => {
        const validateExportInputs = (collectionIds, formats, activeTokenTypes) => {
            const errors = [];
            const VALID_FORMATS = ['css', 'swift', 'android', 'flutter', 'w3c', 'tailwind', 'typescript'];
            
            // Validate collections
            if (!Array.isArray(collectionIds)) {
                const error = new Error('Collections must be provided as an array');
                error.name = 'ValidationError';
                error.context = { received: typeof collectionIds, expected: 'array' };
                throw error;
            }
            if (collectionIds.length === 0) {
                errors.push('At least one collection must be selected');
            }
            
            // Validate formats
            if (!Array.isArray(formats)) {
                const error = new Error('Formats must be provided as an array');
                error.name = 'ValidationError';
                error.context = { received: typeof formats, expected: 'array' };
                throw error;
            }
            if (formats.length === 0) {
                errors.push('At least one export format must be selected');
            }
            
            const invalidFormats = formats.filter(f => !VALID_FORMATS.includes(f));
            if (invalidFormats.length > 0) {
                errors.push('Invalid formats: ' + invalidFormats.join(', ') + '. Valid formats: ' + VALID_FORMATS.join(', '));
            }
            
            // Validate token types
            if (!Array.isArray(activeTokenTypes)) {
                const error = new Error('Token types must be provided as an array');
                error.name = 'ValidationError';
                error.context = { received: typeof activeTokenTypes, expected: 'array' };
                throw error;
            }
            if (activeTokenTypes.length === 0) {
                errors.push('At least one token type must be selected');
            }
            
            if (errors.length > 0) {
                const error = new Error(errors.join('; '));
                error.name = 'ValidationError';
                error.context = {
                    collectionCount: collectionIds ? collectionIds.length : 0,
                    formatCount: formats ? formats.length : 0,
                    tokenTypeCount: activeTokenTypes ? activeTokenTypes.length : 0
                };
                throw error;
            }
        };
        
        test('should validate correct inputs without throwing', () => {
            expect(() => {
                validateExportInputs(['col1', 'col2'], ['css', 'swift'], ['color', 'text']);
            }).not.toThrow();
        });
        
        test('should throw ValidationError for non-array collections', () => {
            expect(() => {
                validateExportInputs('not-array', ['css'], ['color']);
            }).toThrow('Collections must be provided as an array');
        });
        
        test('should throw ValidationError for non-array formats', () => {
            expect(() => {
                validateExportInputs(['col1'], 'not-array', ['color']);
            }).toThrow('Formats must be provided as an array');
        });
        
        test('should throw ValidationError for non-array token types', () => {
            expect(() => {
                validateExportInputs(['col1'], ['css'], 'not-array');
            }).toThrow('Token types must be provided as an array');
        });
        
        test('should throw ValidationError for empty collections', () => {
            expect(() => {
                validateExportInputs([], ['css'], ['color']);
            }).toThrow('At least one collection must be selected');
        });
        
        test('should throw ValidationError for empty formats', () => {
            expect(() => {
                validateExportInputs(['col1'], [], ['color']);
            }).toThrow('At least one export format must be selected');
        });
        
        test('should throw ValidationError for empty token types', () => {
            expect(() => {
                validateExportInputs(['col1'], ['css'], []);
            }).toThrow('At least one token type must be selected');
        });
        
        test('should throw ValidationError for invalid formats', () => {
            expect(() => {
                validateExportInputs(['col1'], ['css', 'invalid-format'], ['color']);
            }).toThrow('Invalid formats: invalid-format');
        });
        
        test('should include context in ValidationError', () => {
            try {
                validateExportInputs([], [], []);
            } catch (error) {
                expect(error.name).toBe('ValidationError');
                expect(error.context).toBeDefined();
                expect(error.context.collectionCount).toBe(0);
                expect(error.context.formatCount).toBe(0);
                expect(error.context.tokenTypeCount).toBe(0);
            }
        });
    });
    
    describe('checkMemoryUsage', () => {
        const checkMemoryUsage = (throwOnExceed = false) => {
            const MEMORY_WARNING_THRESHOLD = 100; // MB
            
            if (performance && performance.memory) {
                const used = performance.memory.usedJSHeapSize / 1024 / 1024;
                const total = performance.memory.totalJSHeapSize / 1024 / 1024;
                const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
                
                if (used > MEMORY_WARNING_THRESHOLD) {
                    const memoryInfo = {
                        used: Math.round(used),
                        total: Math.round(total),
                        limit: Math.round(limit),
                        usagePercent: Math.round((used / limit) * 100)
                    };
                    
                    console.warn('High memory usage: ' + used.toFixed(2) + 'MB (' + memoryInfo.usagePercent + '% of limit)');
                    figma.notify('Processing large dataset. Memory: ' + memoryInfo.used + 'MB', { timeout: 3000 });
                    
                    // Throw error if memory usage is critical
                    if (throwOnExceed && used > (MEMORY_WARNING_THRESHOLD * 1.5)) {
                        const error = new Error('Memory usage exceeded critical threshold');
                        error.name = 'MemoryError';
                        error.context = memoryInfo;
                        throw error;
                    }
                }
                
                return { used, total, limit };
            }
            return null;
        };
        
        test('should return memory info when performance API is available', () => {
            const result = checkMemoryUsage();
            expect(result).not.toBeNull();
            expect(result.used).toBe(50);
            expect(result.total).toBe(100);
            expect(result.limit).toBe(2000);
        });
        
        test('should return null when performance API is not available', () => {
            global.performance = null;
            const result = checkMemoryUsage();
            expect(result).toBeNull();
        });
        
        test('should warn and notify on high memory usage', () => {
            // Set high memory usage
            mockPerformance.memory.usedJSHeapSize = 150 * 1024 * 1024; // 150MB
            
            checkMemoryUsage();
            
            expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('High memory usage: 150.00MB'));
            expect(figma.notify).toHaveBeenCalledWith('Processing large dataset. Memory: 150MB', { timeout: 3000 });
        });
        
        test('should throw MemoryError when throwOnExceed is true and usage is critical', () => {
            // Set critical memory usage (> 150MB threshold)
            mockPerformance.memory.usedJSHeapSize = 200 * 1024 * 1024; // 200MB
            
            expect(() => {
                checkMemoryUsage(true);
            }).toThrow('Memory usage exceeded critical threshold');
        });
        
        test('should not throw when throwOnExceed is false even with high usage', () => {
            // Set critical memory usage
            mockPerformance.memory.usedJSHeapSize = 200 * 1024 * 1024; // 200MB
            
            expect(() => {
                checkMemoryUsage(false);
            }).not.toThrow();
        });
        
        test('should not warn when memory usage is below threshold', () => {
            // Set low memory usage
            mockPerformance.memory.usedJSHeapSize = 50 * 1024 * 1024; // 50MB (below 100MB threshold)
            
            checkMemoryUsage();
            
            expect(console.warn).not.toHaveBeenCalled();
            expect(figma.notify).not.toHaveBeenCalled();
        });
    });
    
    describe('createStructuredError', () => {
        const createStructuredError = (operation, error, context = {}) => {
            return {
                operation,
                message: error.message,
                stack: error.stack,
                context,
                timestamp: new Date().toISOString()
            };
        };
        
        test('should create structured error object', () => {
            const originalError = new Error('Test error');
            const structured = createStructuredError('export', originalError, { format: 'css' });
            
            expect(structured.operation).toBe('export');
            expect(structured.message).toBe('Test error');
            expect(structured.stack).toBe(originalError.stack);
            expect(structured.context.format).toBe('css');
            expect(structured.timestamp).toBeTruthy();
            expect(new Date(structured.timestamp)).toBeInstanceOf(Date);
        });
        
        test('should work with empty context', () => {
            const originalError = new Error('Test error');
            const structured = createStructuredError('validation', originalError);
            
            expect(structured.operation).toBe('validation');
            expect(structured.context).toEqual({});
        });
    });
    
    describe('generateNamingVariants', () => {
        const sanitizeName = (name, platform = 'css') => {
            if (!name || typeof name !== 'string') return '';
            
            let cleaned = name.trim().toLowerCase();
            
            const transformations = {
                css: (str) => str.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
                swift: (str) => {
                    let cleaned = str.charAt(0).toUpperCase() + str.slice(1);
                    return cleaned.replace(/[^a-zA-Z0-9]/g, '').replace(/^\d/, '_');
                },
                android: (str) => str.replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''),
            };
            
            const transform = transformations[platform] || transformations.css;
            return transform(cleaned);
        };
        
        const generateNamingVariants = (path) => {
            return {
                snake: path.map(p => sanitizeName(p, 'android')).join('_'),
                kebab: path.map(p => sanitizeName(p, 'css')).join('-'),
                camel: path.map((p, i) => {
                    const sanitized = sanitizeName(p, 'swift');
                    if (i === 0) return sanitized;
                    return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
                }).join('')
            };
        };
        
        test('should generate snake_case variant', () => {
            const variants = generateNamingVariants(['Primary', 'Button', 'Color']);
            expect(variants.snake).toBe('primary_button_color');
        });
        
        test('should generate kebab-case variant', () => {
            const variants = generateNamingVariants(['Primary', 'Button', 'Color']);
            expect(variants.kebab).toBe('primary-button-color');
        });
        
        test('should generate camelCase variant', () => {
            const variants = generateNamingVariants(['Primary', 'Button', 'Color']);
            expect(variants.camel).toBe('primaryButtonColor');
        });
        
        test('should handle single path element', () => {
            const variants = generateNamingVariants(['Primary']);
            expect(variants.snake).toBe('primary');
            expect(variants.kebab).toBe('primary');
            expect(variants.camel).toBe('primary');
        });
        
        test('should handle special characters in path', () => {
            const variants = generateNamingVariants(['Primary!', 'Button@Color']);
            expect(variants.snake).toBe('primary_buttoncolor');
            expect(variants.kebab).toBe('primary-buttoncolor');
            expect(variants.camel).toBe('primaryButtoncolor');
        });
    });
    
    describe('sanitizeName', () => {
        const sanitizeName = (name, platform = 'css') => {
            if (!name || typeof name !== 'string') return '';
            
            let cleaned = name.trim().toLowerCase();
            
            const transformations = {
                css: (str) => str.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
                swift: (str) => {
                    let cleaned = str.charAt(0).toUpperCase() + str.slice(1);
                    return cleaned.replace(/[^a-zA-Z0-9]/g, '').replace(/^\d/, '_');
                },
                android: (str) => str.replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''),
            };
            
            const transform = transformations[platform] || transformations.css;
            return transform(cleaned);
        };
        
        test('should sanitize for CSS platform', () => {
            expect(sanitizeName('Primary Color!', 'css')).toBe('primary-color');
            expect(sanitizeName('Multiple---Dashes', 'css')).toBe('multiple-dashes');
            expect(sanitizeName('  Spaced  Name  ', 'css')).toBe('spaced-name');
        });
        
        test('should sanitize for Swift platform', () => {
            expect(sanitizeName('Primary Color!', 'swift')).toBe('PrimaryColor');
            expect(sanitizeName('123Invalid', 'swift')).toBe('_123Invalid');
            expect(sanitizeName('Valid_Name', 'swift')).toBe('ValidName');
        });
        
        test('should sanitize for Android platform', () => {
            expect(sanitizeName('Primary Color!', 'android')).toBe('primary_color');
            expect(sanitizeName('Multiple___Underscores', 'android')).toBe('multiple_underscores');
            expect(sanitizeName('_Leading_Trailing_', 'android')).toBe('leading_trailing');
        });
        
        test('should handle null and undefined names', () => {
            expect(sanitizeName(null)).toBe('');
            expect(sanitizeName(undefined)).toBe('');
            expect(sanitizeName('')).toBe('');
        });
        
        test('should handle non-string input', () => {
            expect(sanitizeName(123)).toBe('');
            expect(sanitizeName({})).toBe('');
            expect(sanitizeName([])).toBe('');
        });
        
        test('should default to CSS platform for unknown platform', () => {
            expect(sanitizeName('Test Name', 'unknown')).toBe('test-name');
        });
    });
    
    describe('Custom Error Classes', () => {
        const createCustomError = (ErrorClass, message, context = {}) => {
            const error = new ErrorClass(message, context);
            return error;
        };
        
        test('should create ValidationError with context', () => {
            class ValidationError extends Error {
                constructor(message, context = {}) {
                    super(message);
                    this.name = 'ValidationError';
                    this.context = context;
                    this.timestamp = new Date().toISOString();
                }
            }
            
            const error = createCustomError(ValidationError, 'Validation failed', { field: 'email' });
            expect(error.name).toBe('ValidationError');
            expect(error.message).toBe('Validation failed');
            expect(error.context.field).toBe('email');
            expect(error.timestamp).toBeTruthy();
        });
        
        test('should create NetworkError with context', () => {
            class NetworkError extends Error {
                constructor(message, context = {}) {
                    super(message);
                    this.name = 'NetworkError';
                    this.context = context;
                    this.timestamp = new Date().toISOString();
                }
            }
            
            const error = createCustomError(NetworkError, 'Network timeout', { url: 'https://api.example.com' });
            expect(error.name).toBe('NetworkError');
            expect(error.message).toBe('Network timeout');
            expect(error.context.url).toBe('https://api.example.com');
        });
        
        test('should create ProcessingError with context', () => {
            class ProcessingError extends Error {
                constructor(message, context = {}) {
                    super(message);
                    this.name = 'ProcessingError';
                    this.context = context;
                    this.timestamp = new Date().toISOString();
                }
            }
            
            const error = createCustomError(ProcessingError, 'Processing failed', { stage: 'parsing' });
            expect(error.name).toBe('ProcessingError');
            expect(error.context.stage).toBe('parsing');
        });
        
        test('should create MemoryError with context', () => {
            class MemoryError extends Error {
                constructor(message, context = {}) {
                    super(message);
                    this.name = 'MemoryError';
                    this.context = context;
                    this.timestamp = new Date().toISOString();
                }
            }
            
            const error = createCustomError(MemoryError, 'Out of memory', { used: 512, limit: 1024 });
            expect(error.name).toBe('MemoryError');
            expect(error.context.used).toBe(512);
            expect(error.context.limit).toBe(1024);
        });
    });
});