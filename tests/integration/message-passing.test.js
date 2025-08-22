/**
 * Message Passing Integration Tests
 * 
 * Tests for communication between UI and plugin, including
 * message handling, async operations, and error handling.
 */

describe('Message Passing Integration Tests', () => {
    let mockFigma;
    let messageHandlers;
    
    beforeEach(() => {
        // Set up Figma API mock
        mockFigma = {
            showUI: jest.fn(),
            notify: jest.fn(),
            closePlugin: jest.fn(),
            ui: {
                postMessage: jest.fn(),
                on: jest.fn(),
                off: jest.fn()
            },
            variables: {
                getLocalVariableCollections: jest.fn(),
                getLocalVariables: jest.fn(),
                getVariableById: jest.fn()
            }
        };
        global.figma = mockFigma;
        
        // Mock message handlers
        messageHandlers = new Map();
        
        // Mock figma.ui.on to capture message handlers
        mockFigma.ui.on.mockImplementation((event, handler) => {
            messageHandlers.set(event, handler);
        });
        
        // Mock console
        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
    });
    
    describe('Plugin Initialization', () => {
        test('should initialize UI and set up message handlers', () => {
            // Simulate plugin initialization
            const initializePlugin = () => {
                figma.showUI('__html__', {title: "Token Exporter", width: 340, height: 480});
                
                figma.ui.on('message', (msg) => {
                    console.log('Received message:', msg.type);
                });
                
                return true;
            };
            
            const initialized = initializePlugin();
            
            expect(initialized).toBe(true);
            expect(figma.showUI).toHaveBeenCalledWith('__html__', {
                title: "Token Exporter",
                width: 340,
                height: 480
            });
            expect(figma.ui.on).toHaveBeenCalledWith('message', expect.any(Function));
        });
    });
    
    describe('Message Handler Registration', () => {
        test('should register message handler for export requests', () => {
            const handleMessage = (msg) => {
                switch (msg.type) {
                    case 'export-tokens':
                        return handleExportTokens(msg.data);
                    case 'get-collections':
                        return handleGetCollections();
                    case 'validate-input':
                        return handleValidateInput(msg.data);
                    default:
                        console.warn('Unknown message type:', msg.type);
                        return { type: 'error', message: 'Unknown message type' };
                }
            };
            
            const handleExportTokens = (data) => {
                console.log('Exporting tokens with config:', data);
                return { type: 'export-started', timestamp: new Date().toISOString() };
            };
            
            const handleGetCollections = () => {
                return { 
                    type: 'collections-data', 
                    data: [
                        { id: 'col1', name: 'Colors' },
                        { id: 'col2', name: 'Typography' }
                    ]
                };
            };
            
            const handleValidateInput = (data) => {
                const errors = [];
                if (!data.collections || data.collections.length === 0) {
                    errors.push('No collections selected');
                }
                if (!data.formats || data.formats.length === 0) {
                    errors.push('No formats selected');
                }
                
                return {
                    type: 'validation-result',
                    isValid: errors.length === 0,
                    errors
                };
            };
            
            // Register handler
            figma.ui.on('message', handleMessage);
            
            // Verify handler was registered
            expect(figma.ui.on).toHaveBeenCalledWith('message', handleMessage);
            
            // Test export message
            const exportResponse = handleMessage({
                type: 'export-tokens',
                data: { collections: ['col1'], formats: ['css'] }
            });
            expect(exportResponse.type).toBe('export-started');
            expect(console.log).toHaveBeenCalledWith('Exporting tokens with config:', { collections: ['col1'], formats: ['css'] });
            
            // Test collections message
            const collectionsResponse = handleMessage({ type: 'get-collections' });
            expect(collectionsResponse.type).toBe('collections-data');
            expect(collectionsResponse.data).toHaveLength(2);
            
            // Test validation message
            const validationResponse = handleMessage({
                type: 'validate-input',
                data: { collections: [], formats: ['css'] }
            });
            expect(validationResponse.type).toBe('validation-result');
            expect(validationResponse.isValid).toBe(false);
            expect(validationResponse.errors).toContain('No collections selected');
            
            // Test unknown message
            const unknownResponse = handleMessage({ type: 'unknown' });
            expect(unknownResponse.type).toBe('error');
            expect(console.warn).toHaveBeenCalledWith('Unknown message type:', 'unknown');
        });
    });
    
    describe('Async Message Processing', () => {
        test('should handle async export process with progress updates', async () => {
            const processExportAsync = async (config) => {
                // Simulate progress updates
                const progress = [
                    { stage: 'validation', progress: 0 },
                    { stage: 'collection-loading', progress: 25 },
                    { stage: 'variable-processing', progress: 50 },
                    { stage: 'format-generation', progress: 75 },
                    { stage: 'complete', progress: 100 }
                ];
                
                for (const update of progress) {
                    figma.ui.postMessage({ type: 'export-progress', data: update });
                    
                    // Simulate async work
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                
                return { type: 'export-complete', data: { files: config.formats.length } };
            };
            
            const config = { collections: ['col1'], formats: ['css', 'swift'] };
            const result = await processExportAsync(config);
            
            expect(result.type).toBe('export-complete');
            expect(result.data.files).toBe(2);
            
            // Verify progress messages were sent
            expect(figma.ui.postMessage).toHaveBeenCalledTimes(5);
            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'export-progress',
                data: { stage: 'validation', progress: 0 }
            });
            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'export-progress',
                data: { stage: 'complete', progress: 100 }
            });
        });
        
        test('should handle export errors and send error messages', async () => {
            const processExportWithError = async (config) => {
                try {
                    if (!config.collections || config.collections.length === 0) {
                        throw new Error('No collections provided');
                    }
                    
                    // Simulate processing
                    figma.ui.postMessage({ 
                        type: 'export-progress', 
                        data: { stage: 'processing', progress: 50 }
                    });
                    
                    // Simulate an error during processing
                    throw new Error('Failed to process variables');
                    
                } catch (error) {
                    figma.ui.postMessage({
                        type: 'export-error',
                        data: {
                            message: error.message,
                            stage: 'processing',
                            timestamp: new Date().toISOString()
                        }
                    });
                    throw error;
                }
            };
            
            const config = { collections: ['col1'], formats: ['css'] };
            
            await expect(processExportWithError(config)).rejects.toThrow('Failed to process variables');
            
            // Verify error message was sent
            expect(figma.ui.postMessage).toHaveBeenCalledWith({
                type: 'export-error',
                data: {
                    message: 'Failed to process variables',
                    stage: 'processing',
                    timestamp: expect.any(String)
                }
            });
        });
    });
    
    describe('Variable Collection Message Handling', () => {
        test('should handle get collections request', async () => {
            const mockCollections = [
                {
                    id: 'collection-1',
                    name: 'Colors',
                    modes: [
                        { modeId: 'light', name: 'Light' },
                        { modeId: 'dark', name: 'Dark' }
                    ]
                },
                {
                    id: 'collection-2', 
                    name: 'Typography',
                    modes: [{ modeId: 'default', name: 'Default' }]
                }
            ];
            
            mockFigma.variables.getLocalVariableCollections.mockResolvedValue(mockCollections);
            
            const handleGetCollections = async () => {
                try {
                    const collections = await figma.variables.getLocalVariableCollections();
                    
                    const processedCollections = collections.map(collection => ({
                        id: collection.id,
                        name: collection.name,
                        modeCount: collection.modes.length,
                        modes: collection.modes.map(mode => ({
                            id: mode.modeId,
                            name: mode.name
                        }))
                    }));
                    
                    return {
                        type: 'collections-loaded',
                        data: processedCollections,
                        timestamp: new Date().toISOString()
                    };
                    
                } catch (error) {
                    return {
                        type: 'collections-error',
                        message: error.message,
                        timestamp: new Date().toISOString()
                    };
                }
            };
            
            const result = await handleGetCollections();
            
            expect(result.type).toBe('collections-loaded');
            expect(result.data).toHaveLength(2);
            expect(result.data[0].name).toBe('Colors');
            expect(result.data[0].modeCount).toBe(2);
            expect(result.data[1].name).toBe('Typography');
            expect(result.data[1].modeCount).toBe(1);
        });
        
        test('should handle get variables request', async () => {
            const mockVariables = [
                {
                    id: 'var-1',
                    name: 'Primary',
                    resolvedType: 'COLOR',
                    scopes: ['ALL_SCOPES'],
                    variableCollectionId: 'collection-1',
                    valuesByMode: {
                        'light': { r: 0.2, g: 0.8, b: 0.4, a: 1 },
                        'dark': { r: 0.3, g: 0.9, b: 0.5, a: 1 }
                    }
                },
                {
                    id: 'var-2',
                    name: 'Font Size Base',
                    resolvedType: 'FLOAT',
                    scopes: ['FONT_SIZE'],
                    variableCollectionId: 'collection-2',
                    valuesByMode: {
                        'default': 16
                    }
                }
            ];
            
            mockFigma.variables.getLocalVariables.mockResolvedValue(mockVariables);
            
            const handleGetVariables = async (collectionId) => {
                try {
                    const variables = await figma.variables.getLocalVariables();
                    const filteredVariables = collectionId 
                        ? variables.filter(v => v.variableCollectionId === collectionId)
                        : variables;
                    
                    const processedVariables = filteredVariables.map(variable => ({
                        id: variable.id,
                        name: variable.name,
                        type: variable.resolvedType.toLowerCase(),
                        scopes: variable.scopes,
                        collectionId: variable.variableCollectionId,
                        valueCount: Object.keys(variable.valuesByMode).length
                    }));
                    
                    return {
                        type: 'variables-loaded',
                        data: processedVariables,
                        collectionId,
                        timestamp: new Date().toISOString()
                    };
                    
                } catch (error) {
                    return {
                        type: 'variables-error',
                        message: error.message,
                        collectionId,
                        timestamp: new Date().toISOString()
                    };
                }
            };
            
            // Test getting all variables
            const allVariablesResult = await handleGetVariables();
            expect(allVariablesResult.type).toBe('variables-loaded');
            expect(allVariablesResult.data).toHaveLength(2);
            
            // Test getting variables for specific collection
            const collectionVariablesResult = await handleGetVariables('collection-1');
            expect(collectionVariablesResult.data).toHaveLength(1);
            expect(collectionVariablesResult.data[0].name).toBe('Primary');
            expect(collectionVariablesResult.collectionId).toBe('collection-1');
        });
    });
    
    describe('Export Configuration Message Handling', () => {
        test('should validate export configuration', () => {
            const validateExportConfig = (config) => {
                const errors = [];
                const warnings = [];
                
                // Validate required fields
                if (!config.collections || config.collections.length === 0) {
                    errors.push('At least one collection must be selected');
                }
                
                if (!config.formats || config.formats.length === 0) {
                    errors.push('At least one export format must be selected');
                }
                
                if (!config.tokenTypes || config.tokenTypes.length === 0) {
                    errors.push('At least one token type must be selected');
                }
                
                // Check for potential issues
                if (config.collections && config.collections.length > 10) {
                    warnings.push('Large number of collections selected may impact performance');
                }
                
                if (config.formats && config.formats.includes('w3c') && config.tokenTypes && config.tokenTypes.includes('text')) {
                    warnings.push('W3C format may not support all text token properties');
                }
                
                return {
                    type: 'config-validation',
                    isValid: errors.length === 0,
                    errors,
                    warnings,
                    timestamp: new Date().toISOString()
                };
            };
            
            // Test valid configuration
            const validConfig = {
                collections: ['col1', 'col2'],
                formats: ['css', 'swift'],
                tokenTypes: ['color', 'text']
            };
            
            const validResult = validateExportConfig(validConfig);
            expect(validResult.isValid).toBe(true);
            expect(validResult.errors).toHaveLength(0);
            
            // Test invalid configuration
            const invalidConfig = {
                collections: [],
                formats: [],
                tokenTypes: []
            };
            
            const invalidResult = validateExportConfig(invalidConfig);
            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.errors).toHaveLength(3);
            expect(invalidResult.errors).toContain('At least one collection must be selected');
            
            // Test configuration with warnings
            const warningConfig = {
                collections: Array.from({ length: 15 }, (_, i) => 'col' + i),
                formats: ['w3c'],
                tokenTypes: ['text']
            };
            
            const warningResult = validateExportConfig(warningConfig);
            expect(warningResult.isValid).toBe(true);
            expect(warningResult.warnings).toHaveLength(2);
            expect(warningResult.warnings).toContain('Large number of collections selected may impact performance');
            expect(warningResult.warnings).toContain('W3C format may not support all text token properties');
        });
    });
    
    describe('Plugin Cleanup Message Handling', () => {
        test('should handle cleanup on plugin close', () => {
            const performCleanup = () => {
                const cleanupTasks = [
                    'clearEventListeners',
                    'cancelPendingOperations',
                    'saveUserPreferences',
                    'logSessionEnd'
                ];
                
                const completedTasks = [];
                
                cleanupTasks.forEach(task => {
                    try {
                        switch (task) {
                            case 'clearEventListeners':
                                figma.ui.off('message');
                                completedTasks.push(task);
                                break;
                            case 'cancelPendingOperations':
                                // Simulate canceling operations
                                completedTasks.push(task);
                                break;
                            case 'saveUserPreferences':
                                // Simulate saving preferences
                                completedTasks.push(task);
                                break;
                            case 'logSessionEnd':
                                console.log('Session ended at:', new Date().toISOString());
                                completedTasks.push(task);
                                break;
                        }
                    } catch (error) {
                        console.error('Cleanup task failed:', task, error);
                    }
                });
                
                return {
                    type: 'cleanup-complete',
                    completedTasks,
                    timestamp: new Date().toISOString()
                };
            };
            
            const result = performCleanup();
            
            expect(result.type).toBe('cleanup-complete');
            expect(result.completedTasks).toHaveLength(4);
            expect(figma.ui.off).toHaveBeenCalledWith('message');
            expect(console.log).toHaveBeenCalledWith('Session ended at:', expect.any(String));
        });
    });
    
    describe('Error Recovery Message Handling', () => {
        test('should handle and recover from message processing errors', () => {
            const safeMessageHandler = (msg) => {
                try {
                    // Simulate message processing that might fail
                    if (msg.type === 'invalid-operation') {
                        throw new Error('Invalid operation requested');
                    }
                    
                    if (msg.type === 'export-tokens' && !msg.data) {
                        throw new Error('Export data is required');
                    }
                    
                    // Process normal messages
                    switch (msg.type) {
                        case 'export-tokens':
                            return { type: 'export-started', data: msg.data };
                        case 'get-collections':
                            return { type: 'collections-data', data: [] };
                        default:
                            return { type: 'message-processed' };
                    }
                    
                } catch (error) {
                    console.error('Message processing error:', error.message);
                    figma.notify('Error: ' + error.message, { error: true });
                    
                    return {
                        type: 'message-error',
                        message: error.message,
                        originalType: msg.type,
                        recoverable: true,
                        timestamp: new Date().toISOString()
                    };
                }
            };
            
            // Test normal message processing
            const normalResult = safeMessageHandler({ type: 'get-collections' });
            expect(normalResult.type).toBe('collections-data');
            
            // Test error handling
            const errorResult = safeMessageHandler({ type: 'invalid-operation' });
            expect(errorResult.type).toBe('message-error');
            expect(errorResult.message).toBe('Invalid operation requested');
            expect(errorResult.recoverable).toBe(true);
            expect(console.error).toHaveBeenCalledWith('Message processing error:', 'Invalid operation requested');
            expect(figma.notify).toHaveBeenCalledWith('Error: Invalid operation requested', { error: true });
            
            // Test missing data error
            const missingDataResult = safeMessageHandler({ type: 'export-tokens' });
            expect(missingDataResult.type).toBe('message-error');
            expect(missingDataResult.message).toBe('Export data is required');
        });
    });
});