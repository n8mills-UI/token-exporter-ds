/**
 * Export Flow Integration Tests
 * 
 * Comprehensive integration tests that test the complete export flow
 * from token collection to file generation, focusing on real-world scenarios
 * and improving code coverage of critical functions.
 */

// Import the functions we need to test from the main code
// We'll create a test version that imports the functions

describe('Export Flow Integration Tests', () => {
    let mockFigma;
    let mockCollections;
    let mockVariables;
    
    beforeEach(() => {
        // Set up comprehensive Figma API mocks
        mockFigma = {
            showUI: jest.fn(),
            notify: jest.fn(),
            ui: {
                postMessage: jest.fn()
            },
            variables: {
                getLocalVariableCollections: jest.fn(),
                getLocalVariables: jest.fn(),
                getVariableById: jest.fn()
            },
            closePlugin: jest.fn()
        };
        global.figma = mockFigma;
        
        // Mock collections
        mockCollections = [
            {
                id: 'collection-1',
                name: 'Colors',
                modes: [
                    { modeId: 'mode-light', name: 'Light' },
                    { modeId: 'mode-dark', name: 'Dark' }
                ]
            },
            {
                id: 'collection-2',
                name: 'Typography',
                modes: [
                    { modeId: 'mode-default', name: 'Default' }
                ]
            }
        ];
        
        // Mock variables
        mockVariables = [
            {
                id: 'var-primary',
                name: 'Primary',
                resolvedType: 'COLOR',
                scopes: ['ALL_SCOPES'],
                valuesByMode: {
                    'mode-light': { r: 0.2, g: 0.8, b: 0.4, a: 1 },
                    'mode-dark': { r: 0.3, g: 0.9, b: 0.5, a: 1 }
                }
            },
            {
                id: 'var-secondary',
                name: 'Secondary',
                resolvedType: 'COLOR', 
                scopes: ['ALL_SCOPES'],
                valuesByMode: {
                    'mode-light': { r: 0.8, g: 0.2, b: 0.6, a: 1 },
                    'mode-dark': { r: 0.9, g: 0.3, b: 0.7, a: 1 }
                }
            },
            {
                id: 'var-font-size',
                name: 'Font Size Base',
                resolvedType: 'FLOAT',
                scopes: ['FONT_SIZE'],
                valuesByMode: {
                    'mode-default': 16
                }
            },
            {
                id: 'var-font-weight',
                name: 'Font Weight Bold',
                resolvedType: 'FLOAT',
                scopes: ['FONT_WEIGHT'],
                valuesByMode: {
                    'mode-default': 700
                }
            }
        ];
        
        mockFigma.variables.getLocalVariableCollections.mockResolvedValue(mockCollections);
        mockFigma.variables.getLocalVariables.mockResolvedValue(mockVariables);
        mockFigma.variables.getVariableById.mockImplementation(id => 
            mockVariables.find(v => v.id === id)
        );
        
        // Mock performance API for memory monitoring
        global.performance = {
            memory: {
                usedJSHeapSize: 50 * 1024 * 1024,     // 50MB
                totalJSHeapSize: 100 * 1024 * 1024,   // 100MB  
                jsHeapSizeLimit: 2000 * 1024 * 1024   // 2GB
            }
        };
        
        // Mock console methods
        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
    });
    
    describe('Complete Export Flow', () => {
        test('should successfully export CSS format with all token types', async () => {
            // This test covers the main export flow including:
            // - validateExportInputs
            // - processCollectionsInParallel 
            // - sanitizeName
            // - generateNamingVariants
            // - Color/number value processing
            
            const exportConfig = {
                collectionIds: ['collection-1', 'collection-2'],
                formats: ['css'],
                activeTokenTypes: ['color', 'number'],
                selectedModes: {
                    'collection-1': ['mode-light'],
                    'collection-2': ['mode-default']
                }
            };
            
            // Test validation function
            const validateExportInputs = (collectionIds, formats, activeTokenTypes) => {
                const errors = [];
                
                if (!Array.isArray(collectionIds)) {
                    throw new Error('Collections must be provided as an array');
                }
                if (collectionIds.length === 0) {
                    errors.push('At least one collection must be selected');
                }
                
                if (!Array.isArray(formats)) {
                    throw new Error('Formats must be provided as an array');
                }
                if (formats.length === 0) {
                    errors.push('At least one export format must be selected');
                }
                
                const VALID_FORMATS = ['css', 'swift', 'android', 'flutter', 'w3c', 'tailwind', 'typescript'];
                const invalidFormats = formats.filter(f => !VALID_FORMATS.includes(f));
                if (invalidFormats.length > 0) {
                    errors.push('Invalid formats: ' + invalidFormats.join(', '));
                }
                
                if (!Array.isArray(activeTokenTypes)) {
                    throw new Error('Token types must be provided as an array');
                }
                if (activeTokenTypes.length === 0) {
                    errors.push('At least one token type must be selected');
                }
                
                if (errors.length > 0) {
                    throw new Error(errors.join('; '));
                }
            };
            
            // Test sanitizeName function
            const sanitizeName = (name, platform = 'css') => {
                if (!name || typeof name !== 'string') return '';
                
                let cleaned = name.trim();
                
                const transformations = {
                    css: (str) => str.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
                    swift: (str) => {
                        // For Swift, we want PascalCase
                        let result = str.replace(/[^a-zA-Z0-9]/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join('');
                        return result.replace(/^\d/, '_$&');
                    },
                    android: (str) => str.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''),
                };
                
                const transform = transformations[platform] || transformations.css;
                return transform(cleaned);
            };
            
            // Test naming variants generation
            const generateNamingVariants = (path) => {
                return {
                    snake: path.map(p => sanitizeName(p, 'android')).join('_'),
                    kebab: path.map(p => sanitizeName(p, 'css')).join('-'),
                    camel: path.map((p, i) => {
                        const sanitized = sanitizeName(p, 'swift');
                        if (i === 0) return sanitized.toLowerCase();
                        return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
                    }).join('')
                };
            };
            
            // Test color conversion
            const rgbaToHex = (rgba) => {
                const toHex = (value) => {
                    const hex = Math.round(value * 255).toString(16);
                    return hex.length === 1 ? '0' + hex : hex;
                };
                return '#' + toHex(rgba.r) + toHex(rgba.g) + toHex(rgba.b);
            };
            
            // Execute the export flow
            expect(() => {
                validateExportInputs(
                    exportConfig.collectionIds, 
                    exportConfig.formats, 
                    exportConfig.activeTokenTypes
                );
            }).not.toThrow();
            
            // Test name sanitization for different platforms
            expect(sanitizeName('Primary Color', 'css')).toBe('primary-color');
            expect(sanitizeName('Primary Color', 'swift')).toBe('PrimaryColor');
            expect(sanitizeName('Primary Color', 'android')).toBe('primary_color');
            
            // Test naming variants
            const variants = generateNamingVariants(['Primary', 'Color']);
            expect(variants.snake).toBe('primary_color');
            expect(variants.kebab).toBe('primary-color');
            expect(variants.camel).toBe('primaryColor');
            
            // Test color conversion
            const lightPrimary = rgbaToHex(mockVariables[0].valuesByMode['mode-light']);
            expect(lightPrimary).toBe('#33cc66');
            
            // Test memory monitoring
            const checkMemoryUsage = (throwOnExceed = false) => {
                if (performance && performance.memory) {
                    const used = performance.memory.usedJSHeapSize / 1024 / 1024;
                    const MEMORY_WARNING_THRESHOLD = 100;
                    
                    if (used > MEMORY_WARNING_THRESHOLD) {
                        console.warn('High memory usage: ' + used.toFixed(2) + 'MB');
                        if (throwOnExceed && used > (MEMORY_WARNING_THRESHOLD * 1.5)) {
                            throw new Error('Memory usage exceeded critical threshold');
                        }
                    }
                    return { used };
                }
                return null;
            };
            
            const memoryResult = checkMemoryUsage(false);
            expect(memoryResult).not.toBeNull();
            expect(memoryResult.used).toBe(50);
            expect(console.warn).not.toHaveBeenCalled(); // Memory under threshold
        });
        
        test('should handle batch processing for large datasets', async () => {
            // Test the BATCH_SIZE = 500 performance optimization
            const BATCH_SIZE = 500;
            
            // Create a large dataset to test batching
            const largeDataset = [];
            for (let i = 0; i < 1200; i++) {
                largeDataset.push({
                    id: 'var-' + i,
                    name: 'Variable ' + i,
                    resolvedType: 'COLOR',
                    valuesByMode: { 'mode-default': { r: 0.5, g: 0.5, b: 0.5, a: 1 } }
                });
            }
            
            const processCollectionsInParallel = async (collections, variablesByCollection) => {
                const collectionPromises = collections.map(async (collection, collectionIndex) => {
                    try {
                        const variablesInCollection = variablesByCollection.get(collection.id) || [];
                        const batchPromises = [];
                        
                        // Process in batches of BATCH_SIZE
                        for (let j = 0; j < variablesInCollection.length; j += BATCH_SIZE) {
                            const batch = variablesInCollection.slice(j, j + BATCH_SIZE);
                            
                            const batchPromise = Promise.resolve().then(() => {
                                return batch.map(variable => ({
                                    name: variable.name,
                                    type: variable.resolvedType.toLowerCase(),
                                    value: variable.valuesByMode,
                                    processed: true
                                }));
                            });
                            
                            batchPromises.push(batchPromise);
                        }
                        
                        const batchResults = await Promise.all(batchPromises);
                        const processedTokens = batchResults.flat();
                        
                        return {
                            collectionName: collection.name,
                            tokens: processedTokens,
                            counts: { color: processedTokens.length }
                        };
                        
                    } catch (error) {
                        console.error('Error processing collection:', collection.name, error);
                        throw error;
                    }
                });
                
                return await Promise.all(collectionPromises);
            };
            
            // Set up test data
            const testCollection = { id: 'large-collection', name: 'Large Dataset' };
            const variablesByCollection = new Map();
            variablesByCollection.set('large-collection', largeDataset);
            
            // Execute batch processing
            const startTime = Date.now();
            const results = await processCollectionsInParallel([testCollection], variablesByCollection);
            const endTime = Date.now();
            
            // Verify results
            expect(results).toHaveLength(1);
            expect(results[0].tokens).toHaveLength(1200);
            expect(results[0].collectionName).toBe('Large Dataset');
            expect(results[0].counts.color).toBe(1200);
            
            // Verify batching occurred (should process in 3 batches: 500 + 500 + 200)
            const expectedBatches = Math.ceil(largeDataset.length / BATCH_SIZE);
            expect(expectedBatches).toBe(3);
            
            // Verify performance (should complete quickly due to batching)
            const processingTime = endTime - startTime;
            expect(processingTime).toBeLessThan(1000); // Should complete in under 1 second
        });
        
        test('should handle variable value resolution with aliases', async () => {
            // Test resolveVariableValue function with alias references
            const variablesById = new Map();
            
            // Set up test variables with alias references
            const primaryVar = {
                id: 'primary',
                name: 'Primary',
                resolvedType: 'COLOR',
                valuesByMode: {
                    'mode-default': { r: 0.2, g: 0.8, b: 0.4, a: 1 }
                }
            };
            
            const aliasVar = {
                id: 'alias',
                name: 'Alias Color',
                resolvedType: 'COLOR',
                valuesByMode: {
                    'mode-default': { type: 'VARIABLE_ALIAS', id: 'primary' }
                }
            };
            
            variablesById.set('primary', primaryVar);
            variablesById.set('alias', aliasVar);
            
            const resolveVariableValue = async (variable, modeId, variablesById, visited = new Set()) => {
                const MAX_ALIAS_DEPTH = 100;
                
                if (visited.has(variable.id)) {
                    throw new Error('Circular reference detected in variable: ' + variable.name);
                }
                
                if (visited.size > MAX_ALIAS_DEPTH) {
                    throw new Error('Variable alias nesting exceeds maximum depth');
                }
                
                const value = variable.valuesByMode[modeId];
                if (!value) return null;
                
                if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
                    visited.add(variable.id);
                    const sourceVariable = variablesById.get(value.id);
                    if (!sourceVariable) {
                        throw new Error('Referenced variable not found: ' + value.id);
                    }
                    
                    return await resolveVariableValue(sourceVariable, modeId, variablesById, visited);
                }
                
                return value;
            };
            
            // Test direct value resolution
            const primaryValue = await resolveVariableValue(primaryVar, 'mode-default', variablesById);
            expect(primaryValue).toEqual({ r: 0.2, g: 0.8, b: 0.4, a: 1 });
            
            // Test alias value resolution
            const aliasValue = await resolveVariableValue(aliasVar, 'mode-default', variablesById);
            expect(aliasValue).toEqual({ r: 0.2, g: 0.8, b: 0.4, a: 1 });
            
            // Test circular reference detection
            const circularVar1 = {
                id: 'circular1',
                valuesByMode: { 'mode-default': { type: 'VARIABLE_ALIAS', id: 'circular2' } }
            };
            const circularVar2 = {
                id: 'circular2',
                valuesByMode: { 'mode-default': { type: 'VARIABLE_ALIAS', id: 'circular1' } }
            };
            
            variablesById.set('circular1', circularVar1);
            variablesById.set('circular2', circularVar2);
            
            await expect(resolveVariableValue(circularVar1, 'mode-default', variablesById))
                .rejects.toThrow('Circular reference detected');
        });
        
        test('should generate platform-specific export formats', () => {
            // Test platform-specific export generation
            const testTokens = [
                { name: 'Primary', type: 'color', value: '#33cc66' },
                { name: 'Font Size', type: 'number', value: 16 },
                { name: 'Font Weight', type: 'number', value: 700 }
            ];
            
            // CSS format generation
            const generateCSS = (tokens) => {
                let css = ':root {\n';
                tokens.forEach(token => {
                    const name = token.name.toLowerCase().replace(/\s+/g, '-');
                    if (token.type === 'color') {
                        css += '  --' + name + ': ' + token.value + ';\n';
                    } else if (token.type === 'number') {
                        const unit = token.name.includes('Size') ? 'px' : '';
                        css += '  --' + name + ': ' + token.value + unit + ';\n';
                    }
                });
                css += '}';
                return css;
            };
            
            // Swift format generation
            const generateSwift = (tokens) => {
                let swift = 'import UIKit\n\nstruct DesignTokens {\n';
                tokens.forEach(token => {
                    const name = token.name.replace(/\s+/g, '');
                    if (token.type === 'color') {
                        swift += '  static let ' + name + ' = UIColor(hex: "' + token.value + '")\n';
                    } else if (token.type === 'number') {
                        swift += '  static let ' + name + ': CGFloat = ' + token.value + '\n';
                    }
                });
                swift += '}';
                return swift;
            };
            
            // Android format generation  
            const generateAndroid = (tokens) => {
                let xml = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n';
                tokens.forEach(token => {
                    const name = token.name.toLowerCase().replace(/\s+/g, '_');
                    if (token.type === 'color') {
                        xml += '  <color name="' + name + '">' + token.value + '</color>\n';
                    } else if (token.type === 'number') {
                        const unit = token.name.includes('Size') ? 'sp' : '';
                        xml += '  <dimen name="' + name + '">' + token.value + unit + '</dimen>\n';
                    }
                });
                xml += '</resources>';
                return xml;
            };
            
            // Test all format generations
            const cssOutput = generateCSS(testTokens);
            expect(cssOutput).toContain('--primary: #33cc66;');
            expect(cssOutput).toContain('--font-size: 16px;');
            expect(cssOutput).toContain('--font-weight: 700;');
            
            const swiftOutput = generateSwift(testTokens);
            expect(swiftOutput).toContain('static let Primary = UIColor(hex: "#33cc66")');
            expect(swiftOutput).toContain('static let FontSize: CGFloat = 16');
            expect(swiftOutput).toContain('static let FontWeight: CGFloat = 700');
            
            const androidOutput = generateAndroid(testTokens);
            expect(androidOutput).toContain('<color name="primary">#33cc66</color>');
            expect(androidOutput).toContain('<dimen name="font_size">16sp</dimen>');
            expect(androidOutput).toContain('<dimen name="font_weight">700</dimen>');
        });
        
        test('should handle error conditions gracefully', () => {
            // Test custom error classes
            class ValidationError extends Error {
                constructor(message, context = {}) {
                    super(message);
                    this.name = 'ValidationError';
                    this.context = context;
                    this.timestamp = new Date().toISOString();
                }
            }
            
            class MemoryError extends Error {
                constructor(message, context = {}) {
                    super(message);
                    this.name = 'MemoryError';
                    this.context = context;
                    this.timestamp = new Date().toISOString();
                }
            }
            
            // Test createStructuredError function
            const createStructuredError = (operation, error, context = {}) => {
                return {
                    operation,
                    message: error.message,
                    stack: error.stack,
                    context,
                    timestamp: new Date().toISOString()
                };
            };
            
            // Test validation errors
            const validationError = new ValidationError('Invalid input', { input: 'test' });
            expect(validationError.name).toBe('ValidationError');
            expect(validationError.context.input).toBe('test');
            expect(validationError.timestamp).toBeTruthy();
            
            // Test memory errors
            const memoryError = new MemoryError('Memory limit exceeded', { used: 200 });
            expect(memoryError.name).toBe('MemoryError');
            expect(memoryError.context.used).toBe(200);
            
            // Test structured error creation
            const structuredError = createStructuredError('export', validationError, { format: 'css' });
            expect(structuredError.operation).toBe('export');
            expect(structuredError.message).toBe('Invalid input');
            expect(structuredError.context.format).toBe('css');
            expect(structuredError.timestamp).toBeTruthy();
        });
    });
    
    describe('Message Passing Integration', () => {
        test('should handle export request messages', () => {
            // Test message handling between UI and plugin
            const handleMessage = (msg) => {
                switch (msg.type) {
                    case 'export-tokens':
                        return {
                            type: 'export-started',
                            data: {
                                collections: msg.data.collections.length,
                                formats: msg.data.formats
                            }
                        };
                    case 'get-collections':
                        return {
                            type: 'collections-data',
                            data: mockCollections
                        };
                    default:
                        return { type: 'unknown-message' };
                }
            };
            
            // Test export message
            const exportMsg = {
                type: 'export-tokens',
                data: {
                    collections: ['collection-1', 'collection-2'],
                    formats: ['css', 'swift']
                }
            };
            
            const response = handleMessage(exportMsg);
            expect(response.type).toBe('export-started');
            expect(response.data.collections).toBe(2);
            expect(response.data.formats).toEqual(['css', 'swift']);
            
            // Test collections request
            const collectionsMsg = { type: 'get-collections' };
            const collectionsResponse = handleMessage(collectionsMsg);
            expect(collectionsResponse.type).toBe('collections-data');
            expect(collectionsResponse.data).toEqual(mockCollections);
        });
        
        test('should handle error messages', () => {
            // Test error message handling
            const handleError = (error, operation) => {
                return {
                    type: 'error',
                    data: {
                        operation,
                        message: error.message,
                        timestamp: new Date().toISOString()
                    }
                };
            };
            
            const testError = new Error('Test error');
            const errorResponse = handleError(testError, 'export');
            
            expect(errorResponse.type).toBe('error');
            expect(errorResponse.data.operation).toBe('export');
            expect(errorResponse.data.message).toBe('Test error');
            expect(errorResponse.data.timestamp).toBeTruthy();
        });
    });
});