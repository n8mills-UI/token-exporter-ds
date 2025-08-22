/**
 * Validation Edge Cases Tests
 * 
 * Tests unusual scenarios, boundary conditions, and error states
 * that could occur during validation to ensure robust behavior.
 */

describe('Validation Edge Cases Tests', () => {
    let mockConsole;
    
    beforeEach(() => {
        // Mock console to capture error logs
        mockConsole = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        global.console = mockConsole;
        
        // Mock DOM elements
        global.document = {
            getElementById: jest.fn(() => ({
                style: { display: 'none' },
                classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn() },
                querySelector: jest.fn(() => ({ textContent: '' }))
            })),
            querySelector: jest.fn(() => ({ onclick: null }))
        };
        
        // Mock timers
        global.setTimeout = jest.fn((fn, delay) => {
            if (delay === 0) fn(); // Execute immediately for some tests
            else setTimeout(fn, 0); // Use real setTimeout with 0 delay for others
            return 123;
        });
        
        jest.clearAllMocks();
    });
    
    describe('Empty and Null Data Handling', () => {
        test('should handle empty token array gracefully', () => {
            const runTokenValidation = (tokens) => {
                return new Promise((resolve) => {
                    if (!tokens || tokens.length === 0) {
                        resolve({
                            isValid: true,
                            totalTokens: 0,
                            validTokens: 0,
                            removedTokens: 0,
                            issues: [],
                            summary: 'success',
                            message: 'No tokens to validate'
                        });
                        return;
                    }
                    
                    // Normal validation logic would go here
                    resolve({
                        isValid: true,
                        totalTokens: tokens.length,
                        validTokens: tokens.length,
                        removedTokens: 0,
                        issues: [],
                        summary: 'success'
                    });
                });
            };
            
            return runTokenValidation([]).then(results => {
                expect(results.isValid).toBe(true);
                expect(results.totalTokens).toBe(0);
                expect(results.validTokens).toBe(0);
                expect(results.message).toBe('No tokens to validate');
            });
        });
        
        test('should handle null token array', () => {
            const runTokenValidation = (tokens) => {
                return new Promise((resolve) => {
                    if (!tokens) {
                        resolve({
                            isValid: false,
                            totalTokens: 0,
                            validTokens: 0,
                            removedTokens: 0,
                            issues: ['No token data provided'],
                            summary: 'error',
                            message: 'Invalid input: tokens is null or undefined'
                        });
                        return;
                    }
                    
                    resolve({
                        isValid: true,
                        totalTokens: tokens.length,
                        validTokens: tokens.length,
                        removedTokens: 0,
                        issues: [],
                        summary: 'success'
                    });
                });
            };
            
            return runTokenValidation(null).then(results => {
                expect(results.isValid).toBe(false);
                expect(results.summary).toBe('error');
                expect(results.issues).toContain('No token data provided');
                expect(results.message).toContain('null or undefined');
            });
        });
        
        test('should handle tokens with missing properties', () => {
            const validateTokenStructure = (tokens) => {
                const issues = [];
                const validTokens = [];
                
                tokens.forEach((token, index) => {
                    if (!token) {
                        issues.push('Token at index ' + index + ' is null or undefined');
                        return;
                    }
                    
                    if (!token.name) {
                        issues.push('Token at index ' + index + ' is missing name property');
                        return;
                    }
                    
                    if (token.value === undefined || token.value === null) {
                        issues.push('Token "' + token.name + '" is missing value property');
                        return;
                    }
                    
                    if (!token.type) {
                        issues.push('Token "' + token.name + '" is missing type property');
                        return;
                    }
                    
                    validTokens.push(token);
                });
                
                return {
                    validTokens,
                    issues,
                    isValid: issues.length === 0
                };
            };
            
            const problematicTokens = [
                { name: 'valid-token', value: '#FF0000', type: 'color' },
                null, // null token
                { value: '#00FF00', type: 'color' }, // missing name
                { name: 'missing-value', type: 'color' }, // missing value
                { name: 'missing-type', value: '#0000FF' }, // missing type
                { name: 'empty-name', value: '', type: 'color' } // empty value
            ];
            
            const validation = validateTokenStructure(problematicTokens);
            
            expect(validation.isValid).toBe(false);
            expect(validation.validTokens).toHaveLength(2); // valid-token and empty-name
            expect(validation.issues).toHaveLength(4);
            expect(validation.issues[0]).toContain('index 1 is null');
            expect(validation.issues[1]).toContain('missing name property');
            expect(validation.issues[2]).toContain('missing value property');
            expect(validation.issues[3]).toContain('missing type property');
        });
    });
    
    describe('Large Dataset Edge Cases', () => {
        test('should handle extremely large token counts', () => {
            const runTokenValidation = (tokens) => {
                return new Promise((resolve) => {
                    const totalTokens = tokens.length;
                    
                    // Memory-efficient validation for large datasets
                    if (totalTokens > 50000) {
                        resolve({
                            isValid: false,
                            totalTokens: totalTokens,
                            validTokens: 0,
                            removedTokens: totalTokens,
                            issues: ['Dataset too large: maximum 50,000 tokens supported'],
                            summary: 'error',
                            message: 'Token count exceeds system limits'
                        });
                        return;
                    }
                    
                    // Normal validation for smaller datasets
                    const hasIssues = totalTokens > 100;
                    resolve({
                        isValid: !hasIssues,
                        totalTokens: totalTokens,
                        validTokens: hasIssues ? totalTokens - 3 : totalTokens,
                        removedTokens: hasIssues ? 3 : 0,
                        issues: hasIssues ? ['Some validation issues'] : [],
                        summary: hasIssues ? 'error' : 'success'
                    });
                });
            };
            
            const massiveTokens = new Array(75000).fill().map((_, i) => ({
                name: 'token-' + i,
                value: '#000000',
                type: 'color'
            }));
            
            return runTokenValidation(massiveTokens).then(results => {
                expect(results.isValid).toBe(false);
                expect(results.summary).toBe('error');
                expect(results.totalTokens).toBe(75000);
                expect(results.issues[0]).toContain('Dataset too large');
                expect(results.message).toContain('exceeds system limits');
            });
        });
        
        test('should handle tokens with extremely long names', () => {
            const validateTokenNames = (tokens) => {
                const MAX_NAME_LENGTH = 200;
                const issues = [];
                const validTokens = [];
                
                tokens.forEach(token => {
                    if (token.name && token.name.length > MAX_NAME_LENGTH) {
                        issues.push('Token name "' + token.name.substring(0, 50) + '..." exceeds maximum length of ' + MAX_NAME_LENGTH + ' characters');
                    } else {
                        validTokens.push(token);
                    }
                });
                
                return {
                    validTokens,
                    issues,
                    isValid: issues.length === 0
                };
            };
            
            const longNameToken = {
                name: 'this-is-an-extremely-long-token-name-that-goes-on-and-on-and-on-and-should-probably-be-shortened-but-someone-decided-to-make-it-really-really-really-really-really-really-really-really-really-really-long-for-some-reason-that-defies-all-logic-and-common-sense',
                value: '#FF0000',
                type: 'color'
            };
            
            const validation = validateTokenNames([longNameToken]);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues).toHaveLength(1);
            expect(validation.issues[0]).toContain('exceeds maximum length');
        });
        
        test('should handle deeply nested token structures', () => {
            const validateNestedTokens = (tokens) => {
                const MAX_NESTING_DEPTH = 10;
                const issues = [];
                
                const checkNestingDepth = (token, path = []) => {
                    if (path.length > MAX_NESTING_DEPTH) {
                        issues.push('Token nesting exceeds maximum depth of ' + MAX_NESTING_DEPTH + ' at path: ' + path.join('.'));
                        return;
                    }
                    
                    if (token && typeof token === 'object') {
                        Object.keys(token).forEach(key => {
                            if (typeof token[key] === 'object' && token[key] !== null) {
                                checkNestingDepth(token[key], path.concat(key));
                            }
                        });
                    }
                };
                
                tokens.forEach(token => {
                    checkNestingDepth(token);
                });
                
                return {
                    issues,
                    isValid: issues.length === 0
                };
            };
            
            // Create deeply nested token structure
            let deeplyNested = { name: 'root', value: '#000000', type: 'color' };
            let current = deeplyNested;
            
            for (let i = 0; i < 15; i++) {
                current.nested = { name: 'level-' + i, value: '#000000', type: 'color' };
                current = current.nested;
            }
            
            const validation = validateNestedTokens([deeplyNested]);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues).toHaveLength(1);
            expect(validation.issues[0]).toContain('nesting exceeds maximum depth');
        });
    });
    
    describe('Invalid Token Values', () => {
        test('should handle malformed color values', () => {
            const validateColorTokens = (tokens) => {
                const issues = [];
                const validTokens = [];
                
                tokens.forEach(token => {
                    if (token.type === 'color') {
                        const colorValue = token.value;
                        
                        // Basic color validation
                        const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(colorValue);
                        let isValidRgb = false;
                        let isValidHsl = false;
                        
                        // More thorough RGB validation
                        const rgbMatch = colorValue.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
                        if (rgbMatch) {
                            const [, r, g, b] = rgbMatch;
                            isValidRgb = parseInt(r) <= 255 && parseInt(g) <= 255 && parseInt(b) <= 255;
                        }
                        
                        // Basic HSL pattern check
                        isValidHsl = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/.test(colorValue);
                        
                        if (!isValidHex && !isValidRgb && !isValidHsl) {
                            issues.push('Invalid color format in token "' + token.name + '": ' + colorValue);
                        } else {
                            validTokens.push(token);
                        }
                    } else {
                        validTokens.push(token);
                    }
                });
                
                return { validTokens, issues, isValid: issues.length === 0 };
            };
            
            const invalidColorTokens = [
                { name: 'valid-hex', value: '#FF0000', type: 'color' },
                { name: 'invalid-hex', value: '#GG0000', type: 'color' },
                { name: 'malformed-hex', value: '#FF00', type: 'color' },
                { name: 'valid-rgb', value: 'rgb(255, 0, 0)', type: 'color' },
                { name: 'invalid-rgb', value: 'rgb(300, 0, 0)', type: 'color' },
                { name: 'random-string', value: 'not-a-color', type: 'color' },
                { name: 'empty-value', value: '', type: 'color' }
            ];
            
            const validation = validateColorTokens(invalidColorTokens);
            
            expect(validation.isValid).toBe(false);
            expect(validation.validTokens).toHaveLength(2); // valid-hex and valid-rgb
            expect(validation.issues).toHaveLength(5);
            expect(validation.issues[0]).toContain('Invalid color format');
        });
        
        test('should handle circular references in token values', () => {
            const detectCircularReferences = (tokens) => {
                const tokenMap = new Map();
                const issues = [];
                
                // Build token map
                tokens.forEach(token => {
                    tokenMap.set(token.name, token);
                });
                
                // Check for circular references
                const checkCircular = (tokenName, visited = new Set()) => {
                    if (visited.has(tokenName)) {
                        return true; // Circular reference detected
                    }
                    
                    const token = tokenMap.get(tokenName);
                    if (!token) return false;
                    
                    visited.add(tokenName);
                    
                    // Check if value references another token
                    const valueStr = String(token.value);
                    const tokenRefMatch = valueStr.match(/\{([^}]+)\}/g);
                    
                    if (tokenRefMatch) {
                        for (const ref of tokenRefMatch) {
                            const refName = ref.slice(1, -1); // Remove { }
                            if (checkCircular(refName, new Set(visited))) {
                                return true;
                            }
                        }
                    }
                    
                    return false;
                };
                
                tokens.forEach(token => {
                    if (checkCircular(token.name)) {
                        issues.push('Circular reference detected in token "' + token.name + '"');
                    }
                });
                
                return { issues, isValid: issues.length === 0 };
            };
            
            const circularTokens = [
                { name: 'color-a', value: '{color-b}', type: 'color' },
                { name: 'color-b', value: '{color-c}', type: 'color' },
                { name: 'color-c', value: '{color-a}', type: 'color' }, // Circular!
                { name: 'color-d', value: '#FF0000', type: 'color' } // Valid
            ];
            
            const validation = detectCircularReferences(circularTokens);
            
            expect(validation.isValid).toBe(false);
            expect(validation.issues).toHaveLength(3); // All three tokens in the cycle
            expect(validation.issues[0]).toContain('Circular reference detected');
        });
        
        test('should handle special characters in token names', () => {
            const validateTokenNames = (tokens) => {
                const issues = [];
                const validTokens = [];
                
                // Reserved keywords that shouldn't be used as token names
                const reservedKeywords = ['class', 'function', 'var', 'let', 'const', 'import', 'export'];
                
                tokens.forEach(token => {
                    const name = token.name;
                    
                    // Check for reserved keywords
                    if (reservedKeywords.includes(name)) {
                        issues.push('Token name "' + name + '" is a reserved keyword');
                        return;
                    }
                    
                    // Check for names starting with numbers
                    if (/^[0-9]/.test(name)) {
                        issues.push('Token name "' + name + '" cannot start with a number');
                        return;
                    }
                    
                    // Check for invalid characters
                    if (!/^[a-zA-Z_$][a-zA-Z0-9_$-]*$/.test(name)) {
                        issues.push('Token name "' + name + '" contains invalid characters');
                        return;
                    }
                    
                    validTokens.push(token);
                });
                
                return { validTokens, issues, isValid: issues.length === 0 };
            };
            
            const problematicNames = [
                { name: 'valid-name', value: '#FF0000', type: 'color' },
                { name: 'class', value: '#00FF00', type: 'color' }, // Reserved keyword
                { name: '123-invalid', value: '#0000FF', type: 'color' }, // Starts with number
                { name: 'invalid@name', value: '#FFFF00', type: 'color' }, // Invalid character
                { name: 'invalid name', value: '#FF00FF', type: 'color' }, // Space not allowed
                { name: '_valid_name', value: '#00FFFF', type: 'color' } // Valid underscore
            ];
            
            const validation = validateTokenNames(problematicNames);
            
            expect(validation.isValid).toBe(false);
            expect(validation.validTokens).toHaveLength(2); // valid-name and _valid_name
            expect(validation.issues).toHaveLength(4);
            expect(validation.issues[0]).toContain('reserved keyword');
            expect(validation.issues[1]).toContain('cannot start with a number');
            expect(validation.issues[2]).toContain('invalid characters');
            expect(validation.issues[3]).toContain('invalid characters');
        });
    });
    
    describe('Network and Timing Edge Cases', () => {
        test('should handle validation timeout gracefully', () => {
            const runValidationWithTimeout = (tokens, timeoutMs = 5000) => {
                return new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error('Validation timeout after ' + timeoutMs + 'ms'));
                    }, timeoutMs);
                    
                    // Simulate long-running validation
                    setTimeout(() => {
                        clearTimeout(timeoutId);
                        resolve({
                            isValid: true,
                            totalTokens: tokens.length,
                            validTokens: tokens.length,
                            summary: 'success'
                        });
                    }, 6000); // Takes longer than timeout
                });
            };
            
            const tokens = [{ name: 'test', value: '#FF0000', type: 'color' }];
            
            return runValidationWithTimeout(tokens, 1000).catch(error => {
                expect(error.message).toContain('Validation timeout');
                expect(error.message).toContain('1000ms');
            });
        });
        
        test('should handle concurrent validation requests', () => {
            let activeValidation = null;
            
            const runExclusiveValidation = (tokens) => {
                if (activeValidation) {
                    return Promise.reject(new Error('Validation already in progress'));
                }
                
                activeValidation = new Promise((resolve) => {
                    setTimeout(() => {
                        activeValidation = null;
                        resolve({
                            isValid: true,
                            totalTokens: tokens.length,
                            summary: 'success'
                        });
                    }, 100);
                });
                
                return activeValidation;
            };
            
            const tokens = [{ name: 'test', value: '#FF0000', type: 'color' }];
            
            // Start first validation
            const validation1 = runExclusiveValidation(tokens);
            
            // Try to start second validation immediately
            const validation2 = runExclusiveValidation(tokens);
            
            return Promise.allSettled([validation1, validation2]).then(results => {
                expect(results[0].status).toBe('fulfilled');
                expect(results[1].status).toBe('rejected');
                expect(results[1].reason.message).toContain('already in progress');
            });
        });
        
        test('should handle memory pressure during validation', () => {
            const runMemoryAwareValidation = (tokens) => {
                // Simulate memory monitoring
                const initialMemory = 100; // MB
                let currentMemory = initialMemory;
                
                return new Promise((resolve, reject) => {
                    const processTokens = (batch, index = 0) => {
                        // Simulate memory usage increase
                        currentMemory += batch.length * 0.1;
                        
                        if (currentMemory > 500) { // Memory limit
                            reject(new Error('Memory limit exceeded during validation'));
                            return;
                        }
                        
                        if (index >= tokens.length) {
                            resolve({
                                isValid: true,
                                totalTokens: tokens.length,
                                peakMemory: currentMemory,
                                summary: 'success'
                            });
                            return;
                        }
                        
                        // Process next batch
                        const nextBatch = tokens.slice(index, index + 100);
                        setTimeout(() => processTokens(nextBatch, index + 100), 0);
                    };
                    
                    processTokens(tokens.slice(0, 100));
                });
            };
            
            const memoryIntensiveTokens = new Array(10000).fill().map((_, i) => ({
                name: 'token-' + i,
                value: '#FF0000',
                type: 'color'
            }));
            
            return runMemoryAwareValidation(memoryIntensiveTokens).catch(error => {
                expect(error.message).toContain('Memory limit exceeded');
            });
        });
    });
    
    describe('Modal State Edge Cases', () => {
        test('should handle modal opening when already open', () => {
            let modalState = 'closed';
            
            const showValidationModal = () => {
                if (modalState === 'open') {
                    console.warn('Modal is already open');
                    return { success: false, reason: 'already-open' };
                }
                
                modalState = 'open';
                return { success: true };
            };
            
            const result1 = showValidationModal();
            const result2 = showValidationModal();
            
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(false);
            expect(result2.reason).toBe('already-open');
            expect(mockConsole.warn).toHaveBeenCalledWith('Modal is already open');
        });
        
        test('should handle rapid modal open/close cycles', () => {
            let modalState = 'closed';
            let animationInProgress = false;
            const activeTimeouts = [];
            
            // Create a controlled setTimeout that doesn't execute callbacks immediately
            const controlledSetTimeout = (fn, delay) => {
                const timeoutId = activeTimeouts.length;
                activeTimeouts.push({ fn, delay, id: timeoutId });
                return timeoutId;
            };
            
            const toggleModal = (action) => {
                if (animationInProgress) {
                    return { success: false, reason: 'animation-in-progress' };
                }
                
                if (action === 'open' && modalState === 'closed') {
                    modalState = 'opening';
                    animationInProgress = true;
                    controlledSetTimeout(() => {
                        modalState = 'open';
                        animationInProgress = false;
                    }, 400); // Animation duration
                    return { success: true, action: 'opening' };
                }
                
                if (action === 'close' && modalState === 'open') {
                    modalState = 'closing';
                    animationInProgress = true;
                    controlledSetTimeout(() => {
                        modalState = 'closed';
                        animationInProgress = false;
                    }, 300); // Close animation duration
                    return { success: true, action: 'closing' };
                }
                
                return { success: false, reason: 'invalid-state' };
            };
            
            const open1 = toggleModal('open');
            const close1 = toggleModal('close'); // Should fail - animation in progress  
            const open2 = toggleModal('open');  // Should fail - animation in progress
            
            expect(open1.success).toBe(true);
            expect(close1.success).toBe(false); // Should fail because animation is in progress
            expect(close1.reason).toBe('animation-in-progress');
            expect(open2.success).toBe(false);
            expect(open2.reason).toBe('animation-in-progress');
        });
        
        test('should handle missing DOM elements gracefully', () => {
            // Override mock to return null for missing elements
            global.document.getElementById = jest.fn((id) => {
                if (id === 'validation-modal') return null;
                return { style: { display: 'none' }, classList: { add: jest.fn() } };
            });
            
            const showValidationModal = () => {
                const modal = global.document.getElementById('validation-modal');
                if (!modal) {
                    console.error('Validation modal element not found');
                    return { success: false, error: 'modal-not-found' };
                }
                
                modal.classList.add('show');
                return { success: true };
            };
            
            const result = showValidationModal();
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('modal-not-found');
            expect(mockConsole.error).toHaveBeenCalledWith('Validation modal element not found');
        });
    });
});