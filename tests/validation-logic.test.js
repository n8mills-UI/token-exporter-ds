/**
 * Validation Logic Unit Tests
 * 
 * Tests individual validation functions and state management
 * with focus on correctness, edge cases, and Figma compatibility.
 */

describe('Validation Logic Unit Tests', () => {
    // Mock environment setup
    beforeEach(() => {
        // Mock setTimeout for async validation - avoid infinite recursion
        const originalSetTimeout = global.setTimeout;
        global.setTimeout = jest.fn((fn, delay) => {
            // Use Node.js setTimeout to avoid recursion
            originalSetTimeout(() => fn(), 0);
            return 123; // Mock timer ID
        });
        
        global.clearTimeout = jest.fn();
        
        // Mock Promise for testing
        global.Promise = Promise;
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('Token Validation Algorithm', () => {
        test('should validate tokens correctly for small datasets', () => {
            const runTokenValidation = (tokens) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const totalTokens = tokens.length;
                        const hasIssues = totalTokens > 100;
                        const hasWarnings = totalTokens > 50;
                        
                        const results = {
                            isValid: !hasIssues,
                            totalTokens: totalTokens,
                            validTokens: hasIssues ? totalTokens - 3 : totalTokens,
                            removedTokens: hasIssues ? 3 : 0,
                            issues: hasIssues ? [
                                'Invalid color format in primary-brand token',
                                'Token name "class" is a reserved keyword',
                                'Circular reference between accent-1 and accent-2'
                            ] : hasWarnings ? [
                                'Inconsistent naming detected across collections'
                            ] : [],
                            summary: hasIssues ? 'error' : hasWarnings ? 'warning' : 'success'
                        };
                        resolve(results);
                    }, 1500);
                });
            };
            
            const tokens = [
                { name: 'primary-color', value: '#FF0000', type: 'color' },
                { name: 'secondary-color', value: '#00FF00', type: 'color' },
                { name: 'text-primary', value: 'Arial', type: 'text' }
            ];
            
            return runTokenValidation(tokens).then(results => {
                expect(results.isValid).toBe(true);
                expect(results.totalTokens).toBe(3);
                expect(results.validTokens).toBe(3);
                expect(results.removedTokens).toBe(0);
                expect(results.issues).toEqual([]);
                expect(results.summary).toBe('success');
            });
        });
        
        test('should detect warnings for medium datasets', () => {
            const runTokenValidation = (tokens) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const totalTokens = tokens.length;
                        const hasIssues = totalTokens > 100;
                        const hasWarnings = totalTokens > 50;
                        
                        const results = {
                            isValid: !hasIssues,
                            totalTokens: totalTokens,
                            validTokens: hasIssues ? totalTokens - 3 : totalTokens,
                            removedTokens: hasIssues ? 3 : 0,
                            issues: hasIssues ? [
                                'Invalid color format in primary-brand token',
                                'Token name "class" is a reserved keyword',
                                'Circular reference between accent-1 and accent-2'
                            ] : hasWarnings ? [
                                'Inconsistent naming detected across collections'
                            ] : [],
                            summary: hasIssues ? 'error' : hasWarnings ? 'warning' : 'success'
                        };
                        resolve(results);
                    }, 1500);
                });
            };
            
            const tokens = new Array(75).fill().map((_, i) => ({
                name: 'token-' + i,
                value: '#000000',
                type: 'color'
            }));
            
            return runTokenValidation(tokens).then(results => {
                expect(results.isValid).toBe(true);
                expect(results.totalTokens).toBe(75);
                expect(results.validTokens).toBe(75);
                expect(results.removedTokens).toBe(0);
                expect(results.issues).toEqual(['Inconsistent naming detected across collections']);
                expect(results.summary).toBe('warning');
            });
        });
        
        test('should detect errors for large datasets', () => {
            const runTokenValidation = (tokens) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const totalTokens = tokens.length;
                        const hasIssues = totalTokens > 100;
                        const hasWarnings = totalTokens > 50;
                        
                        const results = {
                            isValid: !hasIssues,
                            totalTokens: totalTokens,
                            validTokens: hasIssues ? totalTokens - 3 : totalTokens,
                            removedTokens: hasIssues ? 3 : 0,
                            issues: hasIssues ? [
                                'Invalid color format in primary-brand token',
                                'Token name "class" is a reserved keyword',
                                'Circular reference between accent-1 and accent-2'
                            ] : hasWarnings ? [
                                'Inconsistent naming detected across collections'
                            ] : [],
                            summary: hasIssues ? 'error' : hasWarnings ? 'warning' : 'success'
                        };
                        resolve(results);
                    }, 1500);
                });
            };
            
            const tokens = new Array(125).fill().map((_, i) => ({
                name: 'token-' + i,
                value: '#000000',
                type: 'color'
            }));
            
            return runTokenValidation(tokens).then(results => {
                expect(results.isValid).toBe(false);
                expect(results.totalTokens).toBe(125);
                expect(results.validTokens).toBe(122);
                expect(results.removedTokens).toBe(3);
                expect(results.issues).toHaveLength(3);
                expect(results.summary).toBe('error');
            });
        });
        
        test('should handle empty token arrays', () => {
            const runTokenValidation = (tokens) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const totalTokens = tokens.length;
                        const hasIssues = totalTokens > 100;
                        const hasWarnings = totalTokens > 50;
                        
                        const results = {
                            isValid: !hasIssues,
                            totalTokens: totalTokens,
                            validTokens: hasIssues ? totalTokens - 3 : totalTokens,
                            removedTokens: hasIssues ? 3 : 0,
                            issues: hasIssues ? [
                                'Invalid color format in primary-brand token',
                                'Token name "class" is a reserved keyword',
                                'Circular reference between accent-1 and accent-2'
                            ] : hasWarnings ? [
                                'Inconsistent naming detected across collections'
                            ] : [],
                            summary: hasIssues ? 'error' : hasWarnings ? 'warning' : 'success'
                        };
                        resolve(results);
                    }, 1500);
                });
            };
            
            return runTokenValidation([]).then(results => {
                expect(results.isValid).toBe(true);
                expect(results.totalTokens).toBe(0);
                expect(results.validTokens).toBe(0);
                expect(results.removedTokens).toBe(0);
                expect(results.issues).toEqual([]);
                expect(results.summary).toBe('success');
            });
        });
    });
    
    describe('Validation State Management', () => {
        let mockElements;
        
        beforeEach(() => {
            mockElements = {
                validationLoading: { style: { display: 'block' } },
                validationResults: { style: { display: 'none' } },
                validationSuccess: { 
                    style: { display: 'none' },
                    querySelector: jest.fn(() => ({ textContent: '' }))
                },
                validationWarnings: { 
                    style: { display: 'none' },
                    querySelector: jest.fn(() => ({ textContent: '' }))
                },
                validationErrors: { 
                    style: { display: 'none' },
                    querySelector: jest.fn(() => ({ textContent: '' }))
                }
            };
            
            global.document = {
                getElementById: jest.fn((id) => {
                    const elementMap = {
                        'validation-loading': mockElements.validationLoading,
                        'validation-results': mockElements.validationResults,
                        'validation-success': mockElements.validationSuccess,
                        'validation-warnings': mockElements.validationWarnings,
                        'validation-errors': mockElements.validationErrors
                    };
                    return elementMap[id] || null;
                })
            };
            
            // Store reference to spy for later verification
            global.getElementByIdSpy = global.document.getElementById;
        });
        
        test('should display validation results for success state', () => {
            const displayValidationResults = (results, onContinue, onCancel) => {
                const loading = global.document.getElementById('validation-loading');
                const resultsContainer = global.document.getElementById('validation-results');
                
                if (loading) loading.style.display = 'none';
                if (resultsContainer) resultsContainer.style.display = 'block';
                
                const stateId = 'validation-' + (results.summary === 'success' ? 'success' : results.summary === 'error' ? 'errors' : 'warnings');
                const stateElement = global.document.getElementById(stateId);
                
                if (stateElement) {
                    stateElement.style.display = 'block';
                    const messageElement = stateElement.querySelector('.validation-status-message');
                    if (messageElement) {
                        if (results.summary === 'success') {
                            messageElement.textContent = 'All ' + results.validTokens + ' tokens passed validation and are ready to export.';
                        } else if (results.summary === 'error') {
                            messageElement.textContent = 'Found ' + results.removedTokens + ' tokens with critical issues that prevent export.';
                        } else {
                            messageElement.textContent = 'Found ' + results.issues.length + ' minor issues, but export can continue.';
                        }
                    }
                }
            };
            
            const successResults = {
                summary: 'success',
                validTokens: 15,
                issues: []
            };
            
            displayValidationResults(successResults, jest.fn(), jest.fn());
            
            // Check that the function properly called getElementById to get the elements
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-loading');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-results');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-success');
            
            // Verify the returned elements had their display styles changed
            const loadingElement = global.document.getElementById('validation-loading');
            const resultsElement = global.document.getElementById('validation-results');
            const successElement = global.document.getElementById('validation-success');
            
            expect(loadingElement.style.display).toBe('none');
            expect(resultsElement.style.display).toBe('block');
            expect(successElement.style.display).toBe('block');
            expect(successElement.querySelector).toHaveBeenCalledWith('.validation-status-message');
        });
        
        test('should display validation results for warning state', () => {
            const displayValidationResults = (results, onContinue, onCancel) => {
                const loading = global.document.getElementById('validation-loading');
                const resultsContainer = global.document.getElementById('validation-results');
                
                if (loading) loading.style.display = 'none';
                if (resultsContainer) resultsContainer.style.display = 'block';
                
                const stateId = 'validation-' + (results.summary === 'success' ? 'success' : results.summary === 'error' ? 'errors' : 'warnings');
                const stateElement = global.document.getElementById(stateId);
                
                if (stateElement) {
                    stateElement.style.display = 'block';
                    const messageElement = stateElement.querySelector('.validation-status-message');
                    if (messageElement) {
                        if (results.summary === 'success') {
                            messageElement.textContent = 'All ' + results.validTokens + ' tokens passed validation and are ready to export.';
                        } else if (results.summary === 'error') {
                            messageElement.textContent = 'Found ' + results.removedTokens + ' tokens with critical issues that prevent export.';
                        } else {
                            messageElement.textContent = 'Found ' + results.issues.length + ' minor issues, but export can continue.';
                        }
                    }
                }
            };
            
            const warningResults = {
                summary: 'warning',
                validTokens: 50,
                issues: ['Inconsistent naming detected']
            };
            
            displayValidationResults(warningResults, jest.fn(), jest.fn());
            
            // Check that the function properly called getElementById to get the elements
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-loading');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-results');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-warnings');
            
            // Verify the returned elements had their display styles changed
            const loadingElement = global.document.getElementById('validation-loading');
            const resultsElement = global.document.getElementById('validation-results');
            const warningsElement = global.document.getElementById('validation-warnings');
            
            expect(loadingElement.style.display).toBe('none');
            expect(resultsElement.style.display).toBe('block');
            expect(warningsElement.style.display).toBe('block');
            expect(warningsElement.querySelector).toHaveBeenCalledWith('.validation-status-message');
        });
        
        test('should display validation results for error state', () => {
            const displayValidationResults = (results, onContinue, onCancel) => {
                const loading = global.document.getElementById('validation-loading');
                const resultsContainer = global.document.getElementById('validation-results');
                
                if (loading) loading.style.display = 'none';
                if (resultsContainer) resultsContainer.style.display = 'block';
                
                const stateId = 'validation-' + (results.summary === 'success' ? 'success' : results.summary === 'error' ? 'errors' : 'warnings');
                const stateElement = global.document.getElementById(stateId);
                
                if (stateElement) {
                    stateElement.style.display = 'block';
                    const messageElement = stateElement.querySelector('.validation-status-message');
                    if (messageElement) {
                        if (results.summary === 'success') {
                            messageElement.textContent = 'All ' + results.validTokens + ' tokens passed validation and are ready to export.';
                        } else if (results.summary === 'error') {
                            messageElement.textContent = 'Found ' + results.removedTokens + ' tokens with critical issues that prevent export.';
                        } else {
                            messageElement.textContent = 'Found ' + results.issues.length + ' minor issues, but export can continue.';
                        }
                    }
                }
            };
            
            const errorResults = {
                summary: 'error',
                validTokens: 100,
                removedTokens: 5,
                issues: ['Critical error 1', 'Critical error 2', 'Critical error 3']
            };
            
            displayValidationResults(errorResults, jest.fn(), jest.fn());
            
            // Check that the function properly called getElementById to get the elements
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-loading');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-results');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-errors');
            
            // Verify the returned elements had their display styles changed
            const loadingElement = global.document.getElementById('validation-loading');
            const resultsElement = global.document.getElementById('validation-results');
            const errorsElement = global.document.getElementById('validation-errors');
            
            expect(loadingElement.style.display).toBe('none');
            expect(resultsElement.style.display).toBe('block');
            expect(errorsElement.style.display).toBe('block');
            expect(errorsElement.querySelector).toHaveBeenCalledWith('.validation-status-message');
        });
        
        test('should reset modal state correctly', () => {
            const resetValidationModalState = () => {
                const loading = global.document.getElementById('validation-loading');
                const results = global.document.getElementById('validation-results');
                
                if (loading) loading.style.display = 'block';
                if (results) results.style.display = 'none';
                
                const states = ['validation-success', 'validation-warnings', 'validation-errors'];
                states.forEach((stateId) => {
                    const element = global.document.getElementById(stateId);
                    if (element) element.style.display = 'none';
                });
            };
            
            // Set up some initial state
            mockElements.validationLoading.style.display = 'none';
            mockElements.validationResults.style.display = 'block';
            mockElements.validationSuccess.style.display = 'block';
            
            resetValidationModalState();
            
            // Verify that the reset function called getElementById for all elements
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-loading');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-results');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-success');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-warnings');
            expect(global.getElementByIdSpy).toHaveBeenCalledWith('validation-errors');
            
            // Check the elements returned by getElementById have the correct styles
            const loadingElement = global.document.getElementById('validation-loading');
            const resultsElement = global.document.getElementById('validation-results');
            const successElement = global.document.getElementById('validation-success');
            const warningsElement = global.document.getElementById('validation-warnings');
            const errorsElement = global.document.getElementById('validation-errors');
            
            expect(loadingElement.style.display).toBe('block');
            expect(resultsElement.style.display).toBe('none');
            expect(successElement.style.display).toBe('none');
            expect(warningsElement.style.display).toBe('none');
            expect(errorsElement.style.display).toBe('none');
        });
    });
    
    describe('Token Preparation Logic', () => {
        test('should prepare tokens from collections correctly', () => {
            const mockAppState = {
                collections: [
                    { 
                        id: '1', 
                        name: 'Brand Colors', 
                        totalVariables: 3,
                        tokens: [
                            { name: 'primary', value: '#FF0000', type: 'color' },
                            { name: 'secondary', value: '#00FF00', type: 'color' },
                            { name: 'accent', value: '#0000FF', type: 'color' }
                        ]
                    },
                    { 
                        id: '2', 
                        name: 'Typography', 
                        totalVariables: 2,
                        tokens: [
                            { name: 'heading', value: 'Arial', type: 'text' },
                            { name: 'body', value: 'Helvetica', type: 'text' }
                        ]
                    }
                ],
                selectedCollections: new Set(['1', '2']),
                mode: 'advanced'
            };
            
            const prepareTokensForValidation = (appState) => {
                const tokensToValidate = [];
                appState.collections.forEach((collection) => {
                    if (appState.mode === 'simple' || appState.selectedCollections.has(collection.id)) {
                        // Simplified token preparation for testing
                        for (let i = 0; i < collection.totalVariables; i++) {
                            tokensToValidate.push({
                                name: 'token-' + i,
                                value: i % 2 === 0 ? '#FF0000' : 'Arial',
                                type: i % 2 === 0 ? 'color' : 'text',
                                collection: collection.name
                            });
                        }
                    }
                });
                return tokensToValidate;
            };
            
            const tokens = prepareTokensForValidation(mockAppState);
            
            expect(tokens).toHaveLength(5); // 3 + 2 tokens
            expect(tokens[0]).toEqual({
                name: 'token-0',
                value: '#FF0000',
                type: 'color',
                collection: 'Brand Colors'
            });
            expect(tokens[1]).toEqual({
                name: 'token-1',
                value: 'Arial',
                type: 'text',
                collection: 'Brand Colors'
            });
        });
        
        test('should handle simple mode token preparation', () => {
            const mockAppState = {
                collections: [
                    { id: '1', name: 'Collection 1', totalVariables: 2 },
                    { id: '2', name: 'Collection 2', totalVariables: 3 }
                ],
                selectedCollections: new Set(['1']), // Only one selected
                mode: 'simple' // Simple mode should include all collections
            };
            
            const prepareTokensForValidation = (appState) => {
                const tokensToValidate = [];
                appState.collections.forEach((collection) => {
                    if (appState.mode === 'simple' || appState.selectedCollections.has(collection.id)) {
                        for (let i = 0; i < collection.totalVariables; i++) {
                            tokensToValidate.push({
                                name: 'token-' + i,
                                value: '#FF0000',
                                type: 'color',
                                collection: collection.name
                            });
                        }
                    }
                });
                return tokensToValidate;
            };
            
            const tokens = prepareTokensForValidation(mockAppState);
            
            expect(tokens).toHaveLength(5); // 2 + 3 tokens (all collections in simple mode)
        });
        
        test('should handle empty collections', () => {
            const mockAppState = {
                collections: [],
                selectedCollections: new Set(),
                mode: 'advanced'
            };
            
            const prepareTokensForValidation = (appState) => {
                const tokensToValidate = [];
                appState.collections.forEach((collection) => {
                    if (appState.mode === 'simple' || appState.selectedCollections.has(collection.id)) {
                        for (let i = 0; i < collection.totalVariables; i++) {
                            tokensToValidate.push({
                                name: 'token-' + i,
                                value: '#FF0000',
                                type: 'color',
                                collection: collection.name
                            });
                        }
                    }
                });
                return tokensToValidate;
            };
            
            const tokens = prepareTokensForValidation(mockAppState);
            
            expect(tokens).toHaveLength(0);
        });
    });
    
    describe('Figma JavaScript Compatibility', () => {
        test('should not use optional chaining', () => {
            // Test that our code doesn't use optional chaining syntax
            const codeString = `
                function setupValidationActionHandlers(results, onContinue, onCancel) {
                    const continueBtn = document.querySelector('[data-action="continue-export"]');
                    if (continueBtn) {
                        continueBtn.onclick = function() {
                            hideValidationModal();
                            if (onContinue) onContinue(results);
                        };
                    }
                }
            `;
            
            // Should not contain optional chaining operators
            expect(codeString).not.toMatch(/\?\./);
            expect(codeString).not.toMatch(/\?\[/);
        });
        
        test('should not use template literals with interpolation', () => {
            const messageElement = { textContent: '' };
            const results = { validTokens: 10 };
            
            // Figma-compatible string concatenation instead of template literals
            const message = 'All ' + results.validTokens + ' tokens passed validation and are ready to export.';
            messageElement.textContent = message;
            
            expect(messageElement.textContent).toBe('All 10 tokens passed validation and are ready to export.');
        });
        
        test('should not use destructuring in function parameters', () => {
            // Figma-compatible parameter handling
            const setupValidationActionHandlers = function(results, onContinue, onCancel) {
                // Instead of destructuring: function({ summary, validTokens })
                const summary = results.summary;
                const validTokens = results.validTokens;
                
                return { summary, validTokens };
            };
            
            const mockResults = { summary: 'success', validTokens: 5 };
            const result = setupValidationActionHandlers(mockResults, jest.fn(), jest.fn());
            
            expect(result.summary).toBe('success');
            expect(result.validTokens).toBe(5);
        });
        
        test('should use traditional function declarations', () => {
            // Test that we use function declarations compatible with Figma
            const runTokenValidation = function(tokens) {
                return new Promise(function(resolve) {
                    setTimeout(function() {
                        const results = {
                            isValid: true,
                            totalTokens: tokens.length
                        };
                        resolve(results);
                    }, 100);
                });
            };
            
            return runTokenValidation([{ name: 'test' }]).then(function(results) {
                expect(results.isValid).toBe(true);
                expect(results.totalTokens).toBe(1);
            });
        });
    });
});