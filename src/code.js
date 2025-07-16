// Main plugin code for Token Exporter - v4.0.0
// Addresses performance, error handling, code quality, and JS compatibility issues

// Show the UI. The window is resizable by the user by default in Figma.
figma.showUI(__html__, { title: "Token Exporter", width: 380, height: 650 });

let globalTokenCounts = { color: 0, text: 0, states: 0, number: 0 };

// --- CONSTANTS ---
const BATCH_SIZE = 100;
const CHUNK_SIZE = 10;
const MEMORY_WARNING_THRESHOLD = 100; // MB
const MAX_EXPORT_SIZE = 50 * 1024 * 1024; // 50MB
const VALID_FORMATS = ['css', 'swift', 'android', 'flutter', 'w3c', 'tailwind'];
const UNITLESS_SCOPES = ['FONT_WEIGHT', 'OPACITY', 'LINE_HEIGHT'];

// --- UTILITY FUNCTIONS ---

/**
 * Validates export inputs and returns any errors found
 * @param {string[]} collectionIds - Collection IDs to validate
 * @param {string[]} formats - Export formats to validate
 * @param {string[]} activeTokenTypes - Token types to validate
 * @returns {string[]} Array of error messages
 */
function validateExportInputs(collectionIds, formats, activeTokenTypes) {
    const errors = [];
    
    if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
        errors.push('At least one collection must be selected');
    }
    
    if (!Array.isArray(formats) || formats.length === 0) {
        errors.push('At least one export format must be selected');
    }
    
    const invalidFormats = formats.filter(f => !VALID_FORMATS.includes(f));
    if (invalidFormats.length > 0) {
        errors.push(`Invalid formats: ${invalidFormats.join(', ')}`);
    }
    
    if (!Array.isArray(activeTokenTypes) || activeTokenTypes.length === 0) {
        errors.push('At least one token type must be selected');
    }
    
    return errors;
}

/**
 * Monitors memory usage and warns if threshold exceeded
 */
function checkMemoryUsage() {
    if (performance && performance.memory) {
        const used = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (used > MEMORY_WARNING_THRESHOLD) {
            console.warn(`High memory usage: ${used.toFixed(2)}MB`);
            figma.notify('Processing large dataset. This may take longer than usual.', 
                { timeout: 3000 });
        }
    }
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
async function resolveVariableValue(variable, modeId, allVariables, visited = new Set()) {
    try {
        if (!variable || visited.has(variable.id)) {
            return null;
        }
        visited.add(variable.id);
        
        // Safety check for deep nesting
        if (visited.size > 100) {
            console.warn('Deep alias nesting detected for variable:', variable.name);
            return null;
        }
        
        const value = variable.valuesByMode[modeId];
        if (!value) {
            return null;
        }
        
        // If the value is an alias, recursively resolve it.
        if (value.type === 'VARIABLE_ALIAS') {
            const sourceVariable = allVariables.find(v => v.id === value.id);
            if (sourceVariable) {
                return await resolveVariableValue(sourceVariable, modeId, allVariables, visited);
            }
        }
        
        return value;
    } catch (error) {
        console.error('Error resolving variable:', createStructuredError('resolveVariableValue', error, {
            // FIX: Replaced optional chaining (?.) with a standard conditional check
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
function sanitizeName(name, platform = 'css') {
    // Handle empty or invalid names
    if (!name || typeof name !== 'string') {
        return 'unnamed-token';
    }
    
    // First, do base cleanup
    let cleaned = name.trim()
        .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses
        .replace(/[^\w\s\/-]/g, '')       // Keep only alphanumeric, spaces, slashes, hyphens
        .replace(/\//g, '-')              // Replace slashes with hyphens
        .replace(/\s+/g, '-')             // Replace spaces with hyphens
        .replace(/-+/g, '-')              // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens

    if (!cleaned) {
        cleaned = 'unnamed-token';
    }

    // Handle names starting with numbers for platforms that don't support it
    if (/^\d/.test(cleaned) && ['swift', 'flutter'].includes(platform)) {
        cleaned = '_' + cleaned;
    }

    // Platform-specific transformations
    switch(platform) {
        case 'css':
        case 'tailwind':
        case 'w3c':
            return cleaned.toLowerCase();
                    
        case 'swift':
        case 'flutter':
            return cleaned.toLowerCase()
                .split('-')
                .map((part, i) => {
                    if (i === 0) return part;
                    return part.charAt(0).toUpperCase() + part.slice(1);
                })
                .join('');
                        
        case 'android':
            return cleaned.toLowerCase().replace(/-/g, '_');
                    
        default:
            return cleaned.toLowerCase();
    }
}

// --- CORE LOGIC ---

/**
 * Fetches all local variable collections and massages the data for the UI.
 * Enhanced with better error handling and performance monitoring.
 */
async function getCollectionsForUI() {
    try {
        checkMemoryUsage();
        
        // Add a minimum delay to prevent flashing
        const [collections] = await Promise.all([
            figma.variables.getLocalVariableCollectionsAsync(),
            new Promise(resolve => setTimeout(resolve, 300))
        ]);

        if (!collections.length) {
             figma.ui.postMessage({ type: 'all-collections', collections: [] });
             return;
        }

        const allVariables = await figma.variables.getLocalVariablesAsync();
        
        // Create collection ID to variables map for better performance
        const variablesByCollection = {};
        for (const variable of allVariables) {
            const collectionId = variable.variableCollectionId;
            if (!variablesByCollection[collectionId]) {
                variablesByCollection[collectionId] = [];
            }
            variablesByCollection[collectionId].push(variable);
        }
        
        // Process collections in chunks to avoid blocking
        const results = [];
        
        for (let i = 0; i < collections.length; i += CHUNK_SIZE) {
            const chunk = collections.slice(i, i + CHUNK_SIZE);
            const chunkResults = await Promise.all(chunk.map(async (collection) => {
                try {
                    const variablesInCollection = variablesByCollection[collection.id] || [];
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
                    console.error(`Error processing collection ${collection.name}:`, 
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
            
            results.push(...chunkResults);
            
            // Update progress for very large datasets
            if (collections.length > 20) {
                const progress = Math.round((i + chunk.length) / collections.length * 100);
                figma.notify(`Processing collections: ${progress}%`, { timeout: 500 });
            }
        }
        
        // Calculate global totals
        globalTokenCounts = { color: 0, text: 0, states: 0, number: 0 };
        results.forEach(collection => {
            Object.keys(collection.counts).forEach(type => {
                globalTokenCounts[type] += collection.counts[type];
            });
        });

        figma.ui.postMessage({ 
            type: 'all-collections', 
            collections: results,
            globalCounts: globalTokenCounts
        });

    } catch (error) {
        const structuredError = createStructuredError('getCollectionsForUI', error);
        console.error('Error fetching collections:', structuredError);
        
        const userMessage = error.name === 'NetworkError' 
            ? 'Network connection failed. Please check your internet connection.'
            : 'Unable to load variable collections. Please try refreshing the plugin.';
            
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
        const validationErrors = validateExportInputs(collectionIds, formats, activeTokenTypes);
        if (validationErrors.length > 0) {
            figma.notify(validationErrors.join('; '), { error: true, timeout: 5000 });
            figma.ui.postMessage({ type: 'export-result', data: [] });
            return [];
        }
        checkMemoryUsage();
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay

        // --- Stage 2: Fetching & Filtering (25% -> 50%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 25 });
        const allVariables = await figma.variables.getLocalVariablesAsync();
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        const variablesToProcess = allVariables.filter(v => {
            if (!collectionIds.includes(v.variableCollectionId)) return false;
            switch (v.resolvedType) {
                case 'COLOR': return activeTokenTypes.includes('color');
                case 'STRING': return activeTokenTypes.includes('text');
                case 'BOOLEAN': return activeTokenTypes.includes('states');
                case 'FLOAT': return activeTokenTypes.includes('number');
                default: return false;
            }
        });
        await new Promise(resolve => setTimeout(resolve, 750)); // Increased delay

        // --- Stage 3: Processing Tokens (50% -> 75%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 50 });
        const designTokens = {};
        for (const v of variablesToProcess) {
            const collection = collections.find(c => c.id === v.variableCollectionId);
            if (!collection) continue;
            
            const modeId = collection.defaultModeId || (collection.modes.length > 0 ? collection.modes[0].modeId : null);
            if (!modeId) continue;

            const value = await resolveVariableValue(v, modeId, allVariables);
            if (value === null) continue;

            // BUG FIX: Scoped tokenData to this loop iteration to prevent data corruption.
            let tokenData = null; 
            const primitiveValue = value;

            if (v.resolvedType === 'COLOR' && activeTokenTypes.includes('color')) {
                const { r, g, b, a } = primitiveValue;
                const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, '0');
                const colorValue = a < 1 ? `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(3)})` : `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                tokenData = { value: colorValue, type: 'color', raw: primitiveValue };
            } else if (v.resolvedType === 'STRING' && activeTokenTypes.includes('text')) {
                tokenData = { value: `"${primitiveValue}"`, type: 'string', raw: primitiveValue };
            } else if (v.resolvedType === 'BOOLEAN' && activeTokenTypes.includes('states')) {
                tokenData = { value: primitiveValue, type: 'boolean', raw: primitiveValue };
            } else if (v.resolvedType === 'FLOAT' && activeTokenTypes.includes('number')) {
                const isUnitless = v.scopes.some(scope => UNITLESS_SCOPES.includes(scope));
                tokenData = { value: isUnitless ? primitiveValue : `${primitiveValue}px`, type: isUnitless ? 'number' : 'dimension', raw: primitiveValue };
            }

            if (tokenData) {
                const path = v.name.split('/');
                let currentLevel = designTokens;
                path.forEach((p, j) => {
                    const key = sanitizeName(p, 'w3c');
                    if (j === path.length - 1) {
                        currentLevel[key] = tokenData;
                    } else {
                        currentLevel[key] = currentLevel[key] || {};
                        currentLevel = currentLevel[key];
                    }
                });
            }
        }
        await new Promise(resolve => setTimeout(resolve, 750)); // Increased delay

        // --- Stage 4: Generating Files (75% -> 95%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 75 });
        if (Object.keys(designTokens).length === 0) {
            figma.notify('No tokens found matching the selected criteria.', { error: true });
            figma.ui.postMessage({ type: 'export-result', data: [] });
            return [];
        }
        const exportFiles = formats.map(format => generateFormatContent(designTokens, format)).filter(Boolean);
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay

        // --- Stage 5: Finalizing (95% -> 100%) ---
        figma.ui.postMessage({ type: 'export-progress', percent: 95 });
        const totalSize = exportFiles.reduce((sum, file) => sum + file.content.length, 0);
        if (totalSize > MAX_EXPORT_SIZE) {
            figma.notify('Export too large (>50MB). Try selecting fewer collections.', { error: true });
            figma.ui.postMessage({ type: 'export-result', data: [] });
            return [];
        }
        
        // This is the final step before returning data to the UI message handler.
        figma.ui.postMessage({ type: 'export-progress', percent: 100 });
        return exportFiles;

    } catch (error) {
        const structuredError = createStructuredError('generateExportData', error, { collectionIds, formats, activeTokenTypes });
        console.error('Error generating export data:', structuredError);
        figma.notify('Failed to generate export data. Please try again.', { error: true });
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
        let filename = `tokens.${format}`;

        // Recursive function to process tokens for code generation
        const processTokensForCode = (obj, path = []) => {
            let lines = [];
            for (const key in obj) {
                const currentPath = [...path, key];
                const currentObj = obj[key];

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
                                lines.push(`  --${names.kebab}: ${rawValue};`);
                            } else {
                                lines.push(`  --${names.kebab}: ${value};`);
                            }
                            break;
                        case 'swift':
                            if (type === 'color') {
                                lines.push(`    static let ${names.camel} = UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: ${a.toFixed(3)})`);
                            } else if (type === 'string') {
                                lines.push(`    static let ${names.camel}: String = ${value}`);
                            } else if (type === 'boolean') {
                                lines.push(`    static let ${names.camel}: Bool = ${rawValue}`);
                            } else if (type === 'dimension') {
                                lines.push(`    static let ${names.camel}: CGFloat = ${rawValue}`);
                            } else if (type === 'number') {
                                lines.push(`    static let ${names.camel}: Double = ${rawValue}`);
                            }
                            break;
                        case 'android':
                            if (type === 'color') {
                                if (a < 1) {
                                    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
                                    const redHex = Math.round(r * 255).toString(16).padStart(2, '0');
                                    const greenHex = Math.round(g * 255).toString(16).padStart(2, '0');
                                    const blueHex = Math.round(b * 255).toString(16).padStart(2, '0');
                                    lines.push(`    <color name="${names.snake}">#${alphaHex}${redHex}${greenHex}${blueHex}</color>`);
                                } else {
                                    lines.push(`    <color name="${names.snake}">${value}</color>`);
                                }
                            } else if (type === 'string') {
                                lines.push(`    <string name="${names.snake}">${rawValue}</string>`);
                            } else if (type === 'boolean') {
                                lines.push(`    <bool name="${names.snake}">${rawValue}</bool>`);
                            } else if (type === 'dimension') {
                                if (names.snake.includes('line_height')) {
                                    lines.push(`    <item name="${names.snake}" type="float">${rawValue}</item>`);
                                } else {
                                    lines.push(`    <dimen name="${names.snake}">${rawValue}dp</dimen>`);
                                }
                            } else if (type === 'number') {
                                lines.push(`    <item name="${names.snake}" type="float">${rawValue}</item>`);
                            }
                            break;
                        case 'flutter':
                            if (type === 'color') {
                                const alphaHex = Math.round((a !== undefined ? a : 1) * 255).toString(16).padStart(2, '0').toUpperCase();
                                const hexColor = value.replace('#', '').toUpperCase();
                                lines.push(`  static const Color ${names.camel} = Color(0x${alphaHex}${hexColor});`);
                            } else if (type === 'string') {
                                lines.push(`  static const String ${names.camel} = ${value};`);
                            } else if (type === 'boolean') {
                                lines.push(`  static const bool ${names.camel} = ${rawValue};`);
                            } else if (type === 'dimension' || type === 'number') {
                                lines.push(`  static const double ${names.camel} = ${rawValue};`);
                            }
                            break;
                        case 'tailwind': 
                            break; // Handled separately
                    }
                } else { // It's a category
                    const sectionName = key.charAt(0).toUpperCase() + key.slice(1);
                    switch(format) {
                        case 'swift': lines.push(`\n    // MARK: - ${sectionName}`); break;
                        case 'flutter': lines.push(`\n  // --- ${sectionName} ---`); break;
                        case 'css': lines.push(`\n  /* ${sectionName} */`); break;
                        case 'android': lines.push(`\n    `); break;
                    }
                    lines.push(...processTokensForCode(currentObj, currentPath));
                }
            }
            return lines;
        };

        // Generate final content based on format
        switch(format) {
            case 'w3c':
                filename = 'tokens.json';
                const buildW3cTokens = (obj) => {
                    let result = {};
                    for (const key in obj) {
                        const currentObj = obj[key];
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
            case 'css': 
                content = `:root {\n${processTokensForCode(designTokens).join('\n')}\n}`;
                break;
            case 'swift': 
                content = `import UIKit\n\nstruct AppTokens {\n${processTokensForCode(designTokens).join('\n')}\n}`;
                break;
            case 'android':
                filename = 'resources.xml';
                content = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${processTokensForCode(designTokens).join('\n')}\n</resources>`;
                break;
            case 'flutter':
                filename = 'app_tokens.dart';
                content = `import 'package:flutter/material.dart';\n\nclass AppTokens {\n  AppTokens._();\n${processTokensForCode(designTokens).join('\n')}\n}`;
                break;
            case 'tailwind':
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
                        for (const key in obj) {
                            const currentPath = [...path, sanitizeName(key, 'tailwind')];
                            const currentObj = obj[key];

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
                    Object.keys(tailwindTheme).forEach(key => {
                        if (Object.keys(tailwindTheme[key]).length === 0) {
                            delete tailwindTheme[key];
                        }
                    });

                    return tailwindTheme;
                };
                
                const tailwindTokens = buildTailwindTokens(designTokens);
                content = `module.exports = {\n  theme: {\n    extend: ${JSON.stringify(tailwindTokens, null, 4)}\n  }\n}`;
                break;
            default: 
                return null;
        }
        
        return { filename, content };
    } catch (error) {
        console.error(`Error generating ${format} content:`, createStructuredError('generateFormatContent', error, { format }));
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
            case 'open-url':
                // Validate URL before opening
                try {
                    new URL(msg.url);
                    figma.openExternal(msg.url);
                } catch (urlError) {
                    console.error('Invalid URL:', msg.url);
                    figma.notify('Invalid URL provided', { error: true });
                }
                break;
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