// Main plugin code for Token Exporter - v4.0.0
// Addresses performance, error handling, code quality, and JS compatibility issues

// Show the UI. The window is resizable by the user by default in Figma.
figma.showUI(__html__,{title: "Token Exporter", width: 340, height: 480 });

let globalTokenCounts = { color: 0, text: 0, states: 0, number: 0 };

// --- CONSTANTS ---
const BATCH_SIZE = 100;
const CHUNK_SIZE = 10;
const MEMORY_WARNING_THRESHOLD = 100; // MB
const MAX_EXPORT_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ALIAS_DEPTH = 100; // Configurable limit for alias nesting
const VALID_FORMATS = ['css', 'swift', 'android', 'flutter', 'w3c', 'tailwind'];
const UNITLESS_SCOPES = ['FONT_WEIGHT', 'OPACITY', 'LINE_HEIGHT'];

// --- CUSTOM ERROR CLASSES ---

/**
 * Custom error for validation-related failures
 */
class ValidationError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'ValidationError';
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Custom error for network-related failures
 */
class NetworkError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'NetworkError';
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Custom error for processing-related failures
 */
class ProcessingError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'ProcessingError';
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Custom error for memory-related issues
 */
class MemoryError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'MemoryError';
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

// --- UTILITY FUNCTIONS ---

/**
 * Validates export inputs and returns any errors found
 * @param {string[]} collectionIds - Collection IDs to validate
 * @param {string[]} formats - Export formats to validate
 * @param {string[]} activeTokenTypes - Token types to validate
 * @returns {string[]} Array of error messages
 */
/**
 * Enhanced validation with specific error types and better context
 * @param {string[]} collectionIds - Collection IDs to validate
 * @param {string[]} formats - Export formats to validate  
 * @param {string[]} activeTokenTypes - Token types to validate
 * @throws {ValidationError} When validation fails
 */
function validateExportInputs(collectionIds, formats, activeTokenTypes) {
    const errors = [];
    
    // Validate collections
    if (!Array.isArray(collectionIds)) {
        throw new ValidationError('Collections must be provided as an array', { 
            received: typeof collectionIds, 
            expected: 'array' 
        });
    }
    if (collectionIds.length === 0) {
        errors.push('At least one collection must be selected');
    }
    
    // Validate formats
    if (!Array.isArray(formats)) {
        throw new ValidationError('Formats must be provided as an array', { 
            received: typeof formats, 
            expected: 'array' 
        });
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
        throw new ValidationError('Token types must be provided as an array', { 
            received: typeof activeTokenTypes, 
            expected: 'array' 
        });
    }
    if (activeTokenTypes.length === 0) {
        errors.push('At least one token type must be selected');
    }
    
    if (errors.length > 0) {
        throw new ValidationError(errors.join('; '), {
            collectionCount: collectionIds ? collectionIds.length : 0,
            formatCount: formats ? formats.length : 0,
            tokenTypeCount: activeTokenTypes ? activeTokenTypes.length : 0
        });
    }
}

/**
 * Monitors memory usage and warns if threshold exceeded
 */
/**
 * Enhanced memory monitoring with error throwing capability
 * @param {boolean} throwOnExceed - Whether to throw error when threshold exceeded
 * @throws {MemoryError} When memory exceeds critical threshold
 */
function checkMemoryUsage(throwOnExceed = false) {
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
                throw new MemoryError('Memory usage exceeded critical threshold', memoryInfo);
            }
        }
        
        return { used, total, limit };
    }
    return null;
}

/**
 * Creates a structured error object for better debugging
 * @param {string} operation - The operation that failed
 * @param {Error} error - The original error
 * @param {Object} context - Additional context
 * @returns {Object} Structured error object
 */
function createStructuredError(operation, error, context = {}) {
    return {
        operation,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
    };
}

/**
 * Generates all naming variants for a token path
 * @param {string[]} path - Array of path segments
 * @returns {Object} Object containing all naming variants
 */
function generateNamingVariants(path) {
    return {
        snake: path.map(p => sanitizeName(p, 'android')).join('_'),
        kebab: path.map(p => sanitizeName(p, 'css')).join('-'),
        camel: path.map((p, i) => {
            const sanitized = sanitizeName(p, 'swift');
            if (i === 0) return sanitized;
            return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
        }).join('')
    };
}

/**
 * Resolves variable aliases to their final, concrete values.
 * @param {Variable} variable - The variable to resolve.
 * @param {string} modeId - The mode ID to resolve for.
 * @param {Array} allVariables - A complete list of all local variables for lookup.
 * @param {Set} visited - Tracks visited variables to prevent infinite recursion loops.
 * @returns {any} The resolved value (e.g., color object, number).
 */
async function resolveVariableValue(variable, modeId, variablesById, visited = new Set()) {
    try {
        if (!variable || visited.has(variable.id)) {
            return null;
        }
        visited.add(variable.id);
        
        // Safety check for deep nesting
        if (visited.size > MAX_ALIAS_DEPTH) {
            console.warn('Deep alias nesting detected (depth: ' + visited.size + ') for variable: "' + variable.name + '"');
            return null;
        }
        
        const value = variable.valuesByMode[modeId];
        if (!value) {
            return null;
        }
        
        // If the value is an alias, recursively resolve it.
        if (value.type === 'VARIABLE_ALIAS') {
            const sourceVariable = variablesById.get(value.id);
            if (sourceVariable) {
                return await resolveVariableValue(sourceVariable, modeId, variablesById, visited);
            }
        }
        
        return value;
    } catch (error) {
        console.error('Error resolving variable:', createStructuredError('resolveVariableValue', error, {
            // FIX: Replaced optional chaining with standard conditional check
            variableName: variable && variable.name,
            modeId,
            visitedCount: visited.size
        }));
        return null;
    }
}

/**
 * Sanitizes a string to be a valid token name for different platforms.
 * @param {string} name - The original string from Figma.
 * @param {string} platform - The target platform ('css', 'swift', etc.).
 * @returns {string} The sanitized string.
 */
/**
 * Enhanced name sanitization with validation and better error handling
 * @param {string} name - The original string from Figma
 * @param {string} platform - The target platform ('css', 'swift', etc.)
 * @returns {string} The sanitized string
 * @throws {ValidationError} When name cannot be sanitized
 */
function sanitizeName(name, platform = 'css') {
    // Enhanced input validation
    if (name === null || name === undefined) {
        throw new ValidationError('Name cannot be null or undefined');
    }
    
    if (typeof name !== 'string') {
        throw new ValidationError('Name must be a string', { 
            received: typeof name, 
            value: name 
        });
    }
    
    // Validate platform
    const validPlatforms = ['css', 'swift', 'android', 'flutter', 'w3c', 'tailwind'];
    if (!validPlatforms.includes(platform)) {
        throw new ValidationError('Invalid platform specified', { 
            platform, 
            validPlatforms 
        });
    }
    
    // Handle empty or whitespace-only names
    if (!name.trim()) {
        return 'unnamed-token';
    }
    
    // Enhanced cleanup with better regex patterns
    let cleaned = name.trim()
        .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses
        .replace(/[^\w\s/-]/g, '')        // Keep only alphanumeric, spaces, slashes, hyphens
        .replace(/\//g, '-')              // Replace slashes with hyphens
        .replace(/\s+/g, '-')             // Replace spaces with hyphens
        .replace(/-{2,}/g, '-')           // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens

    // Fallback for completely cleaned names
    if (!cleaned) {
        return 'unnamed-token';
    }

    // Handle names starting with numbers for platforms that don't support it
    if (/^\d/.test(cleaned) && ['swift', 'flutter'].includes(platform)) {
        cleaned = '_' + cleaned;
    }

    // Platform-specific transformations with validation
    const transformations = {
        'css': (name) => name.toLowerCase(),
        'tailwind': (name) => name.toLowerCase(),
        'w3c': (name) => name.toLowerCase(),
        
        'swift': (name) => name.toLowerCase()
            .split('-')
            .map((part, index) => index === 0 
                ? part 
                : part.charAt(0).toUpperCase() + part.slice(1)
            )
            .join(''),
            
        'flutter': (name) => name.toLowerCase()
            .split('-')
            .map((part, index) => index === 0 
                ? part 
                : part.charAt(0).toUpperCase() + part.slice(1)
            )
            .join(''),
                        
        'android': (name) => name.toLowerCase().replace(/-/g, '_')
    };

    const result = transformations[platform](cleaned);
    
    // Final validation
    if (!result || result.length === 0) {
        return 'unnamed-token';
    }
    
    return result;
}

// --- HELPER FUNCTIONS FOR PERFORMANCE ---

/**
 * Processes collections sequentially for better memory management with large datasets
 * @param {Array} collections - Collections to process
 * @param {Map} variablesByCollection - Variables grouped by collection
 * @returns {Array} Processed collection results
 */
async function processCollectionsSequentially(collections, variablesByCollection) {
    const results = [];
    
    for (const collection of collections) {
        try {
            const variablesInCollection = variablesByCollection.get(collection.id) || [];
            const counts = { color: 0, text: 0, states: 0, number: 0 };
            
            // Process variables in smaller batches for memory efficiency
            for (let j = 0; j < variablesInCollection.length; j += BATCH_SIZE) {
                const batch = variablesInCollection.slice(j, j + BATCH_SIZE);
                
                for (const v of batch) {
                    switch (v.resolvedType) {
                        case 'COLOR': counts.color++; break;
                        case 'STRING': counts.text++; break;
                        case 'BOOLEAN': counts.states++; break;
                        case 'FLOAT': counts.number++; break;
                    }
                }
                
                // Yield more frequently for large collections
                if (j % 500 === 0 && j > 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            const totalVariables = Object.values(counts).reduce((sum, count) => sum + count, 0);
            
            results.push({ 
                id: collection.id, 
                name: collection.name, 
                counts: counts,
                totalVariables: totalVariables
            });
            
            // Yield control after each collection for large datasets
            await new Promise(resolve => setTimeout(resolve, 0));
            
        } catch (error) {
            console.error('Error processing collection ' + collection.name + ':', 
                createStructuredError('processCollection', error, { collectionId: collection.id }));
            results.push({
                id: collection.id,
                name: collection.name,
                counts: { color: 0, text: 0, states: 0, number: 0 },
                totalVariables: 0,
                error: true
            });
        }
    }
    
    return results;
}

// --- CORE LOGIC ---

/**
 * Fetches all local variable collections and massages the data for the UI.
 * Enhanced with better error handling and performance monitoring.
 */
async function getCollectionsForUI() {
    try {
        checkMemoryUsage();
        
        // Fetch collections with better error handling
        const collectionsResult = await Promise.allSettled([
            figma.variables.getLocalVariableCollectionsAsync(),
            new Promise(resolve => setTimeout(resolve, 300)) // Minimum delay to prevent flashing
        ]);
        
        if (collectionsResult[0].status === 'rejected') {
            const reasonObj = collectionsResult[0].reason;
            const reason = (reasonObj && reasonObj.message) 
                ? reasonObj.message 
                : 'Unknown error';
            throw new NetworkError('Failed to fetch variable collections', { reason });
        }
        
        const collections = collectionsResult[0].value;

        if (!collections.length) {
             figma.ui.postMessage({ type: 'all-collections', collections: [] });
             return;
        }

        let allVariables;
        try {
            allVariables = await figma.variables.getLocalVariablesAsync();
        } catch (error) {
            throw new NetworkError('Failed to fetch variables from Figma', {
                originalError: error.message
            });
        }
        
        // Create optimized Map for better performance with large datasets
        const variablesByCollection = new Map();
        const variablesById = new Map();
        
        for (const variable of allVariables) {
            const collectionId = variable.variableCollectionId;
            
            // Build collection map
            if (!variablesByCollection.has(collectionId)) {
                variablesByCollection.set(collectionId, []);
            }
            variablesByCollection.get(collectionId).push(variable);
            
            // Build ID lookup map for faster alias resolution
            variablesById.set(variable.id, variable);
        }
        
        // Process collections in chunks to avoid blocking
        const results = [];
        const totalVariables = allVariables.length;
        const isLargeDataset = totalVariables > 1000; // Threshold for lazy loading
        
        for (let i = 0; i < collections.length; i += CHUNK_SIZE) {
            const chunk = collections.slice(i, i + CHUNK_SIZE);
            
            // For large datasets, process collections sequentially to manage memory
            const chunkResults = isLargeDataset 
                ? await processCollectionsSequentially(chunk, variablesByCollection)
                : await Promise.all(chunk.map(async (collection) => {
                try {
                    const variablesInCollection = variablesByCollection.get(collection.id) || [];
                    const counts = { color: 0, text: 0, states: 0, number: 0 };
                    
                    // Process in batches to avoid blocking for large collections
                    for (let j = 0; j < variablesInCollection.length; j += BATCH_SIZE) {
                        const batch = variablesInCollection.slice(j, j + BATCH_SIZE);
                        
                        for (const v of batch) {
                            switch (v.resolvedType) {
                                case 'COLOR': counts.color++; break;
                                case 'STRING': counts.text++; break;
                                case 'BOOLEAN': counts.states++; break;
                                case 'FLOAT': counts.number++; break;
                            }
                        }
                        
                        // Yield to prevent blocking
                        if (j % 1000 === 0 && j > 0) {
                            await new Promise(resolve => setTimeout(resolve, 0));
                        }
                    }

                    const totalVariables = Object.values(counts).reduce((sum, count) => sum + count, 0);
                    
                    return { 
                        id: collection.id, 
                        name: collection.name, 
                        counts: counts,
                        totalVariables: totalVariables
                    };
                } catch (error) {
                    console.error('Error processing collection ' + collection.name + ':', 
                        createStructuredError('processCollection', error, { collectionId: collection.id }));
                    return {
                        id: collection.id,
                        name: collection.name,
                        counts: { color: 0, text: 0, states: 0, number: 0 },
                        totalVariables: 0,
                        error: true
                    };
                }
            }));
            
            results.push(...(Array.isArray(chunkResults) ? chunkResults : [chunkResults]));
            
            // Update progress for very large datasets
            if (collections.length > 20 || isLargeDataset) {
                const progress = Math.round((i + chunk.length) / collections.length * 100);
                figma.notify('Processing collections: ' + progress + '%', { timeout: 500 });
                
                // Additional memory check for large datasets
                if (isLargeDataset) {
                    checkMemoryUsage();
                }
            }
        }
        
        // Calculate global totals
        globalTokenCounts = { color: 0, text: 0, states: 0, number: 0 };
        results.forEach(collection => {
            Object.entries(collection.counts).forEach(([type, count]) => {
                globalTokenCounts[type] += count;
            });
        });

        figma.ui.postMessage({ 
            type: 'all-collections', 
            collections: results,
            globalCounts: globalTokenCounts
        });

    } catch (error) {
        let userMessage;
        let structuredError;
        
        if (error instanceof NetworkError) {
            userMessage = 'Network connection failed. Please check your internet connection.';
            structuredError = error;
        } else if (error instanceof MemoryError) {
            userMessage = 'Memory limit exceeded. Try processing fewer collections. (' + error.context.used + 'MB used)';
            structuredError = error;
        } else {
            structuredError = createStructuredError('getCollectionsForUI', error);
            userMessage = 'Unable to load variable collections. Please try refreshing the plugin.';
        }
        
        console.error('Error fetching collections:', structuredError);
            
        figma.notify(userMessage, { error: true, timeout: 5000 });
        figma.ui.postMessage({ type: 'all-collections', collections: [] });
    }
}

/**
 * The main export function. Generates token files based on user selections.
 * Enhanced with better validation, error handling, and performance monitoring.
 */
async function generateExportData(collectionIds, formats, activeTokenTypes) {
    try {
        // --- Stage 1: Validation & Setup (0% -> 25%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 10 });
        
        try {
            validateExportInputs(collectionIds, formats, activeTokenTypes);
        } catch (error) {
            if (error instanceof ValidationError) {
                figma.notify(error.message, { error: true, timeout: 5000 });
                console.error('Validation failed:', error.context);
            } else {
                figma.notify('Validation failed unexpectedly', { error: true, timeout: 5000 });
                console.error('Unexpected validation error:', error);
            }
            figma.ui.postMessage({ type: 'export-result', data: [] });
            return [];
        }
        
        checkMemoryUsage();

        // --- Stage 2: Fetching & Filtering (25% -> 50%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 25 });
        
        // Fetch data with improved error handling
        const dataResults = await Promise.allSettled([
            figma.variables.getLocalVariablesAsync(),
            figma.variables.getLocalVariableCollectionsAsync()
        ]);
        
        // Check for failures
        const failedRequests = dataResults.filter(result => result.status === 'rejected');
        if (failedRequests.length > 0) {
            const failures = failedRequests.map(f => {
                const fReason = f.reason;
                return (fReason && fReason.message) ? fReason.message : 'Unknown error';
            });
            throw new NetworkError('Failed to fetch Figma data', { failures });
        }
        
        const [allVariables, collections] = dataResults.map(result => result.value);
        
        // Create optimized lookup map for alias resolution
        const variablesById = new Map();
        allVariables.forEach(variable => variablesById.set(variable.id, variable));
        // Modern functional approach to filtering variables
        const typeMapping = {
            'COLOR': 'color',
            'STRING': 'text', 
            'BOOLEAN': 'states',
            'FLOAT': 'number'
        };
        
        const variablesToProcess = allVariables.filter(variable => 
            collectionIds.includes(variable.variableCollectionId) && 
            activeTokenTypes.includes(typeMapping[variable.resolvedType])
        );
        // Yield control to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 0));

        // --- Stage 3: Processing Tokens (50% -> 75%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 50 });
        
        // Create collection lookup map for better performance
        const collectionsMap = new Map(collections.map(c => [c.id, c]));
        
        /**
         * Process a single variable into token data
         * @param {Variable} variable - The variable to process
         * @returns {Object|null} Token data or null if processing failed
         */
        const processVariable = async (variable) => {
            const collection = collectionsMap.get(variable.variableCollectionId);
            if (!collection) return null;
            
            const modeId = collection.defaultModeId || (collection.modes[0] && collection.modes[0].modeId);
            if (!modeId) return null;

            const value = await resolveVariableValue(variable, modeId, variablesById);
            if (value === null) return null;

            const primitiveValue = value;
            const tokenProcessors = {
                'COLOR': (v, pv) => activeTokenTypes.includes('color') ? (() => {
                    const { r, g, b, a } = pv;
                    const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, '0');
                    const colorValue = a < 1 
                        ? 'rgba(' + Math.round(r * 255) + ', ' + Math.round(g * 255) + ', ' + Math.round(b * 255) + ', ' + a.toFixed(3) + ')' 
                        : '#' + toHex(r) + toHex(g) + toHex(b);
                    return { value: colorValue, type: 'color', raw: pv };
                })() : null,
                
                'STRING': (v, pv) => activeTokenTypes.includes('text') 
                    ? { value: '"' + pv + '"', type: 'string', raw: pv } : null,
                    
                'BOOLEAN': (v, pv) => activeTokenTypes.includes('states') 
                    ? { value: pv, type: 'boolean', raw: pv } : null,
                    
                'FLOAT': (v, pv) => activeTokenTypes.includes('number') ? (() => {
                    const isUnitless = v.scopes.some(scope => UNITLESS_SCOPES.includes(scope));
                    return { 
                        value: isUnitless ? pv : pv + 'px', 
                        type: isUnitless ? 'number' : 'dimension', 
                        raw: pv 
                    };
                })() : null
            };

            const processor = tokenProcessors[variable.resolvedType];
            const tokenData = processor ? processor(variable, primitiveValue) : null;
            if (!tokenData) return null;

            return {
                path: variable.name.split('/'),
                tokenData
            };
        };
        
        // Process variables with better error handling
        const processedTokens = await Promise.allSettled(
            variablesToProcess.map(processVariable)
        );
        
        const designTokens = {};
        processedTokens
            .filter(result => result.status === 'fulfilled' && result.value)
            .forEach(result => {
                const { path, tokenData } = result.value;
                let currentLevel = designTokens;
                
                path.forEach((pathSegment, index) => {
                    const key = sanitizeName(pathSegment, 'w3c');
                    if (index === path.length - 1) {
                        currentLevel[key] = tokenData;
                    } else {
                        currentLevel[key] = currentLevel[key] || {};
                        currentLevel = currentLevel[key];
                    }
                });
            });
        // Yield control to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 0));

        // --- Stage 4: Generating Files (75% -> 95%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 75 });
        if (Object.keys(designTokens).length === 0) {
            figma.notify('No tokens found matching the selected criteria.', { error: true });
            figma.ui.postMessage({ type: 'export-result', data: [] });
            return [];
        }
        // Generate files with better error handling
        const exportFiles = formats
            .map(format => {
                try {
                    return generateFormatContent(designTokens, format);
                } catch (error) {
                    console.error('Failed to generate ' + format + ' format:', error);
                    return null;
                }
            })
            .filter(Boolean);
        // Yield control to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 0));

        // --- Stage 5: Finalizing (95% -> 100%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 95 });
        // Calculate total size with error handling
        const totalSize = exportFiles.reduce((sum, file) => {
            if (!file || !file.content) {
                console.warn('Invalid file detected:', file);
                return sum;
            }
            return sum + file.content.length;
        }, 0);
        if (totalSize > MAX_EXPORT_SIZE) {
            figma.notify('Export too large (>50MB). Try selecting fewer collections.', { error: true });
            figma.ui.postMessage({ type: 'export-result', data: [] });
            return [];
        }
        
        // This is the final step before returning data to the UI message handler.
        figma.ui.postMessage({ type: 'export-progress', percent: 100 });
        return exportFiles;

    } catch (error) {
        let userMessage;
        let structuredError;
        
        if (error instanceof ValidationError) {
            userMessage = 'Validation error: ' + error.message;
            structuredError = error;
        } else if (error instanceof ProcessingError) {
            userMessage = 'Processing failed: ' + error.message;
            structuredError = error;
        } else if (error instanceof MemoryError) {
            userMessage = 'Memory limit exceeded: ' + error.context.used + 'MB used. Try selecting fewer collections.';
            structuredError = error;
        } else {
            structuredError = createStructuredError('generateExportData', error, { collectionIds, formats, activeTokenTypes });
            userMessage = 'Failed to generate export data. Please try again.';
        }
        
        console.error('Error generating export data:', structuredError);
        figma.notify(userMessage, { error: true });
        figma.ui.postMessage({ type: 'export-result', data: [] });
        return [];
    }
}

/**
 * Generates content for a specific format
 * @param {Object} designTokens - The design tokens object
 * @param {string} format - The target format
 * @returns {Object|null} File object with filename and content
 */
function generateFormatContent(designTokens, format) {
    try {
        let content = '';
        let filename = 'tokens.' + format;

        // Recursive function to process tokens for code generation
        const processTokensForCode = (obj, path = []) => {
            let lines = [];
            for (const [key, currentObj] of Object.entries(obj)) {
                const currentPath = [...path, key];

                if (currentObj.value !== undefined) { // It's a token
                    const names = generateNamingVariants(currentPath);
                    const value = currentObj.value;
                    const rawValue = currentObj.raw;
                    const type = currentObj.type;
                    
                    let r = 0, g = 0, b = 0, a = 1;
                    if (type === 'color' && typeof rawValue === 'object') {
                        r = rawValue.r || 0; 
                        g = rawValue.g || 0; 
                        b = rawValue.b || 0; 
                        a = rawValue.a !== undefined ? rawValue.a : 1;
                    }

                    // Generate code based on format
                    switch(format) {
                        case 'css': 
                            if (type === 'number') {
                                lines.push('  --' + names.kebab + ': ' + rawValue + ';');
                            } else {
                                lines.push('  --' + names.kebab + ': ' + value + ';');
                            }
                            break;
                        case 'swift':
                            if (type === 'color') {
                                lines.push('    static let ' + names.camel + ' = UIColor(red: ' + r.toFixed(3) + ', green: ' + g.toFixed(3) + ', blue: ' + b.toFixed(3) + ', alpha: ' + a.toFixed(3) + ')');
                            } else if (type === 'string') {
                                lines.push('    static let ' + names.camel + ': String = ' + value);
                            } else if (type === 'boolean') {
                                lines.push('    static let ' + names.camel + ': Bool = ' + rawValue);
                            } else if (type === 'dimension') {
                                lines.push('    static let ' + names.camel + ': CGFloat = ' + rawValue);
                            } else if (type === 'number') {
                                lines.push('    static let ' + names.camel + ': Double = ' + rawValue);
                            }
                            break;
                        case 'android':
                            if (type === 'color') {
                                if (a < 1) {
                                    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
                                    const redHex = Math.round(r * 255).toString(16).padStart(2, '0');
                                    const greenHex = Math.round(g * 255).toString(16).padStart(2, '0');
                                    const blueHex = Math.round(b * 255).toString(16).padStart(2, '0');
                                    lines.push('    <color name="' + names.snake + '">#' + alphaHex + redHex + greenHex + blueHex + '</color>');
                                } else {
                                    lines.push('    <color name="' + names.snake + '">' + value + '</color>');
                                }
                            } else if (type === 'string') {
                                lines.push('    <string name="' + names.snake + '">' + rawValue + '</string>');
                            } else if (type === 'boolean') {
                                lines.push('    <bool name="' + names.snake + '">' + rawValue + '</bool>');
                            } else if (type === 'dimension') {
                                if (names.snake.includes('line_height')) {
                                    lines.push('    <item name="' + names.snake + '" type="float">' + rawValue + '</item>');
                                } else {
                                    lines.push('    <dimen name="' + names.snake + '">' + rawValue + 'dp</dimen>');
                                }
                            } else if (type === 'number') {
                                lines.push('    <item name="' + names.snake + '" type="float">' + rawValue + '</item>');
                            }
                            break;
                        case 'flutter':
                            if (type === 'color') {
                                const alphaHex = Math.round((a !== undefined ? a : 1) * 255).toString(16).padStart(2, '0').toUpperCase();
                                const hexColor = value.replace('#', '').toUpperCase();
                                lines.push('  static const Color ' + names.camel + ' = Color(0x' + alphaHex + hexColor + ');');
                            } else if (type === 'string') {
                                lines.push('  static const String ' + names.camel + ' = ' + value + ';');
                            } else if (type === 'boolean') {
                                lines.push('  static const bool ' + names.camel + ' = ' + rawValue + ';');
                            } else if (type === 'dimension' || type === 'number') {
                                lines.push('  static const double ' + names.camel + ' = ' + rawValue + ';');
                            }
                            break;
                        case 'tailwind': 
                            break; // Handled separately
                    }
                } else { // It's a category
                    const sectionName = key.charAt(0).toUpperCase() + key.slice(1);
                    switch(format) {
                        case 'swift': lines.push('\n    // MARK: - ' + sectionName); break;
                        case 'flutter': lines.push('\n  // --- ' + sectionName + ' ---'); break;
                        case 'css': lines.push('\n  /* ' + sectionName + ' */'); break;
                        case 'android': lines.push(`\n    `); break;
                    }
                    lines.push(...processTokensForCode(currentObj, currentPath));
                }
            }
            return lines;
        };

        // Generate final content based on format
        switch(format) {
            case 'w3c': {
                filename = 'tokens.json';
                const buildW3cTokens = (obj) => {
                    let result = {};
                    for (const [key, currentObj] of Object.entries(obj)) {
                        if (currentObj.value !== undefined) {
                            if (currentObj.type === 'dimension' || currentObj.type === 'number') {
                                result[key] = { "$type": currentObj.type, "$value": currentObj.raw };
                            } else {
                                result[key] = { "$type": currentObj.type, "$value": currentObj.value };
                            }
                        } else {
                            result[key] = buildW3cTokens(currentObj);
                        }
                    }
                    return result;
                };
                content = JSON.stringify({ token: buildW3cTokens(designTokens) }, null, 2);
                break;
            }
            case 'css': 
                content = ':root {\n' + processTokensForCode(designTokens).join('\n') + '\n}';
                break;
            case 'swift': 
                content = 'import UIKit\n\nstruct AppTokens {\n' + processTokensForCode(designTokens).join('\n') + '\n}';
                break;
            case 'android':
                filename = 'resources.xml';
                content = '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n' + processTokensForCode(designTokens).join('\n') + '\n</resources>';
                break;
            case 'flutter':
                filename = 'app_tokens.dart';
                content = 'import \'package:flutter/material.dart\';\n\nclass AppTokens {\n  AppTokens._();\n' + processTokensForCode(designTokens).join('\n') + '\n}';
                break;
            case 'tailwind': {
                filename = 'tailwind.config.js';
                const buildTailwindTokens = (tokenObject) => {
                    const tailwindTheme = {
                        colors: {},
                        spacing: {},
                        borderRadius: {},
                        fontSize: {},
                        fontWeight: {},
                        lineHeight: {}
                    };

                    function processLevel(obj, path = []) {
                        for (const [key, currentObj] of Object.entries(obj)) {
                            const currentPath = [...path, sanitizeName(key, 'tailwind')];

                            if (currentObj.value !== undefined) {
                                const finalKey = currentPath.join('-');
                                
                                if (currentObj.type === 'color') {
                                    tailwindTheme.colors[finalKey] = currentObj.value;
                                } else if (currentObj.type === 'dimension') {
                                    if (finalKey.includes('font-size')) {
                                        tailwindTheme.fontSize[finalKey] = currentObj.value;
                                    } else if (finalKey.includes('radius')) {
                                        tailwindTheme.borderRadius[finalKey] = currentObj.value;
                                    } else {
                                        tailwindTheme.spacing[finalKey] = currentObj.value;
                                    }
                                } else if (currentObj.type === 'number') {
                                    if (finalKey.includes('font-weight')) {
                                        tailwindTheme.fontWeight[finalKey] = currentObj.raw.toString();
                                    } else if (finalKey.includes('line-height')) {
                                        tailwindTheme.lineHeight[finalKey] = currentObj.raw.toString();
                                    }
                                }
                            } else {
                                processLevel(currentObj, currentPath);
                            }
                        }
                    }

                    processLevel(tokenObject);

                    // Clean up empty categories
                    Object.entries(tailwindTheme).forEach(([key, value]) => {
                        if (Object.keys(value).length === 0) {
                            delete tailwindTheme[key];
                        }
                    });

                    return tailwindTheme;
                };
                
                const tailwindTokens = buildTailwindTokens(designTokens);
                content = 'module.exports = {\n  theme: {\n    extend: ' + JSON.stringify(tailwindTokens, null, 4) + '\n  }\n}';
                break;
            }
            default: 
                return null;
        }
        
        return { filename, content };
    } catch (error) {
        console.error('Error generating ' + format + ' content:', createStructuredError('generateFormatContent', error, { format }));
        return null;
    }
}

// --- MESSAGE HANDLING ---
figma.ui.onmessage = async (msg) => {
    try {
        switch (msg.type) {
            case 'get-collections':
                await getCollectionsForUI();
                break;
            case 'export-tokens': {
                const { collectionIds, formats, activeTokenTypes } = msg;
                const exportData = await generateExportData(collectionIds, formats, activeTokenTypes);
                figma.ui.postMessage({ type: 'export-result', data: exportData });
                break;
            }
            case 'resize':
                figma.ui.resize(msg.width, msg.height);
                break;
            case 'open-url': {
                // Enhanced URL validation and sanitization
                const validateAndSanitizeUrl = (url) => {
                    if (!url || typeof url !== 'string') {
                        throw new ValidationError('URL must be a non-empty string', { received: typeof url });
                    }
                    
                    // Remove potential harmful characters
                    const sanitized = url.trim().replace(/[<>"']/g, '');
                    
                    // Validate URL format
                    let urlObject;
                    try {
                        urlObject = new URL(sanitized);
                    } catch (error) {
                        throw new ValidationError('Invalid URL format', { url: sanitized, originalError: error.message });
                    }
                    
                    // Only allow safe protocols
                    const allowedProtocols = ['https:', 'http:', 'mailto:'];
                    if (!allowedProtocols.includes(urlObject.protocol)) {
                        throw new ValidationError('Unsafe URL protocol', { 
                            protocol: urlObject.protocol,
                            allowed: allowedProtocols 
                        });
                    }
                    
                    return sanitized;
                };
                
                try {
                    const validUrl = validateAndSanitizeUrl(msg.url);
                    figma.openExternal(validUrl);
                } catch (error) {
                    if (error instanceof ValidationError) {
                        console.error('URL validation failed:', error.context);
                        figma.notify('Invalid URL: ' + error.message, { error: true });
                    } else {
                        console.error('Unexpected URL error:', error);
                        figma.notify('Failed to open URL', { error: true });
                    }
                }
                break;
            }
            case 'notify':
                figma.notify(msg.message, { error: msg.error || false });
                break;
            default:
                console.warn('Unknown message type received:', msg.type);
        }
    } catch (error) {
        const structuredError = createStructuredError('messageHandler', error, { messageType: msg.type });
        console.error("Error in message handler:", structuredError);
        figma.notify('An unexpected error occurred. Please try again.', { error: true });
    }
};