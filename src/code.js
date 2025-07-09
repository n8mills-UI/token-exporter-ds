// Main plugin code for Token Exporter

// Show the UI. The window is resizable by the user by default in Figma.
figma.showUI(__html__, { title: "Token Exporter", width: 380, height: 650 });

let globalTokenCounts = { color: 0, text: 0, states: 0, number: 0 };

// --- UTILITY FUNCTIONS ---

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
            // Base case: prevent infinite loops if there's a circular reference.
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
        
        // Return the concrete value.
        return value;
    } catch (error) {
        console.error('Error resolving variable:', variable.name, error);
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
    
    // First, do base cleanup. This will turn "Spacing/5 (20px)" into "spacing-5".
    let cleaned = name.trim()
        .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses like "(20px)"
        .replace(/[^\w\s\/-]/g, '')       // Keep only alphanumeric, spaces, slashes, hyphens
        .replace(/\//g, '-')              // Replace slashes with hyphens
        .replace(/\s+/g, '-')             // Replace spaces with hyphens
        .replace(/-+/g, '-')              // Replace multiple hyphens with single
        .replace(/^-+|-+$/g, '');         // Remove leading/trailing hyphens

    // If cleaned is empty after processing, provide default
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
            // These platforms support kebab-case
            return cleaned.toLowerCase();
                    
        case 'swift':
        case 'flutter':
            // These platforms use camelCase
            return cleaned.toLowerCase()
                .split('-')
                .map((part, i) => {
                    if (i === 0) return part;
                    return part.charAt(0).toUpperCase() + part.slice(1);
                })
                .join('');
                        
        case 'android':
            // This platform uses snake_case
            return cleaned.toLowerCase().replace(/-/g, '_');
                    
        default:
            return cleaned.toLowerCase();
    }
}


// --- CORE LOGIC ---

/**
 * Fetches all local variable collections and massages the data for the UI.
 * It counts the number of variables of each type within each collection.
 */
async function getCollectionsForUI() {
    try {
        // Add a minimum delay to prevent flashing
        const [collections] = await Promise.all([
            figma.variables.getLocalVariableCollectionsAsync(),
            new Promise(resolve => setTimeout(resolve, 300))
        ]);

        if (!collections.length) {
             figma.ui.postMessage({ type: 'all-collections', collections: [] });
             return;
        }

        // For large datasets, build a map for O(1) lookup
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
        const CHUNK_SIZE = 10;
        const results = [];
        
        for (let i = 0; i < collections.length; i += CHUNK_SIZE) {
            const chunk = collections.slice(i, i + CHUNK_SIZE);
            const chunkResults = await Promise.all(chunk.map(async (collection) => {
                try {
                    const variablesInCollection = variablesByCollection[collection.id] || [];
                    
                    // Count variables by type
                    const counts = { color: 0, text: 0, states: 0, number: 0 };
                    
                    // Process in batches to avoid blocking for large collections
                    const BATCH_SIZE = 100;
                    for (let j = 0; j < variablesInCollection.length; j += BATCH_SIZE) {
                        const batch = variablesInCollection.slice(j, j + BATCH_SIZE);
                        
                        for (const v of batch) {
                            if (v.resolvedType === 'COLOR') {
                                counts.color++;
                            } else if (v.resolvedType === 'STRING') {
                                counts.text++;
                            } else if (v.resolvedType === 'BOOLEAN') {
                                counts.states++;
                            } else if (v.resolvedType === 'FLOAT') {
                                counts.number++;
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
                    console.error(`Error processing collection ${collection.name}:`, error);
                    return {
                        id: collection.id,
                        name: collection.name,
                        counts: { color: 0, typography: 0, spacing: 0, number: 0 },
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
        console.error('Error fetching collections:', error);
        figma.notify('Error fetching variable collections.', { error: true });
        figma.ui.postMessage({ type: 'all-collections', collections: [] });
    }
}

/**
 * The main export function. Generates token files based on user selections.
 * @param {string[]} collectionIds - The IDs of the collections to export.
 * @param {string[]} formats - The file formats to generate (e.g., 'css', 'swift').
 * @param {string[]} activeTokenTypes - The types of tokens to include (e.g., 'color', 'spacing').
 */
async function generateExportData(collectionIds, formats, activeTokenTypes) {
    try {
        // Validate inputs
        if (!collectionIds || collectionIds.length === 0) {
            figma.notify('Please select at least one collection.', { error: true });
            return [];
        }
        
        if (!formats || formats.length === 0) {
            figma.notify('Please select at least one export format.', { error: true });
            return [];
        }

        const allVariables = await figma.variables.getLocalVariablesAsync();
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        
        // PERFORMANCE FIX: Filter variables by type early
        const variablesToProcess = allVariables.filter(v => {
            if (!collectionIds.includes(v.variableCollectionId)) return false;
            
            // Early type filtering to avoid processing unnecessary variables
            if (v.resolvedType === 'COLOR' && !activeTokenTypes.includes('color')) return false;
            if (v.resolvedType === 'STRING' && !activeTokenTypes.includes('text')) return false;
            if (v.resolvedType === 'BOOLEAN' && !activeTokenTypes.includes('states')) return false;
            if (v.resolvedType === 'FLOAT' && !activeTokenTypes.includes('number')) return false;
            
            return true;
        });
        
        // Add bounds checking for large collections
        if (variablesToProcess.length > 1000) {
            figma.notify('Warning: Processing large number of variables. This may take a moment.', { timeout: 3000 });
        }

        const designTokens = {};

        // Process each variable and build a nested token object.
        // Process variables in batches to prevent freezing
        const BATCH_SIZE = 100;
        for (let i = 0; i < variablesToProcess.length; i += BATCH_SIZE) {
            const batch = variablesToProcess.slice(i, i + BATCH_SIZE);
            
            for (const v of batch) {
                const collection = collections.find(c => c.id === v.variableCollectionId);
                if (!collection) continue;
            
                // Better mode handling
                const modeId = collection.defaultModeId || (collection.modes && collection.modes.length > 0 ? collection.modes[0].modeId : null);
                if (!modeId) {
                    console.warn(`No mode found for collection ${collection.name}`);
                    continue;
                }
                
                const value = await resolveVariableValue(v, modeId, allVariables);
                
                // CRITICAL BUG FIX: Handle resolved alias objects for primitive types.
                if (!value) continue;

                let primitiveValue = value;
                if (typeof value === 'object' && value !== null && value.r === undefined) {
                    // This is a non-color object, likely a resolved alias for a number/float.
                    if (typeof value.value === 'number') {
                        primitiveValue = value.value;
                    } else {
                        // It's an object we don't know how to handle.
                        console.warn('Could not resolve variable value for non-color object:', v.name, value);
                        continue;
                    }
                }

                let tokenData = null;

                // Convert Figma variables to a standardized token format.
                if (activeTokenTypes.includes('color') && v.resolvedType === 'COLOR') {
                    const { r, g, b, a } = primitiveValue;
                    const toHex = (c) => Math.round(c * 255).toString(16).padStart(2, '0');
                    
                    // Include alpha channel for CSS when needed
                    let colorValue;
                    if (a !== undefined && a < 1) {
                        colorValue = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a.toFixed(3)})`;
                    } else {
                        colorValue = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                    }
                    
                    tokenData = { value: colorValue, type: 'color', raw: primitiveValue };
                } 
                else if (v.resolvedType === 'STRING' && activeTokenTypes.includes('text')) {
                    tokenData = { value: `"${primitiveValue}"`, type: 'string', raw: primitiveValue };
                } 
                else if (v.resolvedType === 'BOOLEAN' && activeTokenTypes.includes('states')) {
                    tokenData = { value: primitiveValue, type: 'boolean', raw: primitiveValue };
                }
                else if (v.resolvedType === 'FLOAT' && activeTokenTypes.includes('number')) {
                    // *** UNIT-HANDLING FIX ***
                    // Use Figma's variable scopes to determine if a number is unitless.
                    const unitlessScopes = ['FONT_WEIGHT', 'OPACITY', 'LINE_HEIGHT'];
                    const isUnitless = v.scopes.some(scope => unitlessScopes.includes(scope));

                    if (isUnitless) {
                        // This is a unitless number (like line-height: 1.5 or font-weight: 700)
                        tokenData = { value: primitiveValue, type: 'number', raw: primitiveValue };
                    } else {
                        // Default all other numbers to dimensions with 'px' units.
                        tokenData = { value: `${primitiveValue}px`, type: 'dimension', raw: primitiveValue };
                    }
                }

                if (!tokenData) continue;

                // Create nested object structure from variable name (e.g., "color/primary/blue" -> {color: {primary: {blue: ...}}})
                const path = v.name.split('/');
                let currentLevel = designTokens;
                path.forEach((p, i) => {
                    // Sanitize each part of the path *before* creating the key
                    const key = sanitizeName(p, 'w3c'); // Use a neutral format for the object keys
                    if (i === path.length - 1) {
                        currentLevel[key] = tokenData;
                    } else {
                        if (!currentLevel[key]) currentLevel[key] = {};
                        currentLevel = currentLevel[key];
                    }
                });
            }
            
            // Send progress updates
            if (i % 500 === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
                const progress = Math.round(i / variablesToProcess.length * 100);
                figma.ui.postMessage({ 
                    type: 'export-progress', 
                    percent: progress 
                });
            }
        }

        // If no tokens matched the criteria, notify the user.
        if (Object.keys(designTokens).length === 0) {
            figma.notify('No tokens found matching the selected criteria.', { error: true });
            return [];
        }

        // Generate file content for each selected format.
        return formats.map(format => {
            let content = '';
            let filename = `tokens.${format}`;

            // Recursive function to process the token object and generate code lines.
            const processTokensForCode = (obj, path = []) => {
                let lines = [];
                for (const key in obj) {
                    const currentPath = [...path, key];
                    const currentObj = obj[key];

                    if (currentObj.value !== undefined) { // It's a token
                        // Use platform-specific sanitization for the final variable names
                        const varNameSnake = currentPath.map(p => sanitizeName(p, 'android')).join('_');
                        const varNameKebab = currentPath.map(p => sanitizeName(p, 'css')).join('-');
                        const varNameCamel = currentPath.map((p, i) => {
                           const sanitized = sanitizeName(p, 'swift');
                           if (i === 0) return sanitized;
                           return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
                        }).join('');
                        
                        const value = currentObj.value;
                        const rawValue = currentObj.raw;
                        const type = currentObj.type;
                        
                        let r = 0, g = 0, b = 0, a = 1;
                        if (type === 'color' && typeof rawValue === 'object') {
                            r = rawValue.r || 0; g = rawValue.g || 0; b = rawValue.b || 0; a = rawValue.a !== undefined ? rawValue.a : 1;
                        }

                        // Generate code based on the format.
                        switch(format) {
                            case 'css': 
                                // For CSS, unitless numbers and dimensions are handled differently.
                                if (type === 'number') {
                                    lines.push(`  --${varNameKebab}: ${rawValue};`); // Unitless
                                } else {
                                    lines.push(`  --${varNameKebab}: ${value};`); // With units (e.g., '16px') or other values
                                }
                                break;
                            case 'swift':
                                if (type === 'color') lines.push(`    static let ${varNameCamel} = UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: ${a.toFixed(3)})`);
                                else if (type === 'string') lines.push(`    static let ${varNameCamel}: String = ${value}`);
                                else if (type === 'boolean') lines.push(`    static let ${varNameCamel}: Bool = ${rawValue}`);
                                else if (type === 'dimension') lines.push(`    static let ${varNameCamel}: CGFloat = ${rawValue}`);
                                else if (type === 'number') lines.push(`    static let ${varNameCamel}: Double = ${rawValue}`);
                                else lines.push(`    static let ${varNameCamel} = ${rawValue}`);
                                break;
                            case 'android':
                                if (type === 'color') {
                                    // Android uses #AARRGGBB format (alpha first)
                                    if (a < 1) {
                                        const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
                                        const redHex = Math.round(r * 255).toString(16).padStart(2, '0');
                                        const greenHex = Math.round(g * 255).toString(16).padStart(2, '0');
                                        const blueHex = Math.round(b * 255).toString(16).padStart(2, '0');
                                        lines.push(`    <color name="${varNameSnake}">#${alphaHex}${redHex}${greenHex}${blueHex}</color>`);
                                    } else {
                                        lines.push(`    <color name="${varNameSnake}">${value}</color>`);
                                    }
                                }
                                else if (type === 'string') lines.push(`    <string name="${varNameSnake}">${rawValue}</string>`);
                                else if (type === 'boolean') lines.push(`    <bool name="${varNameSnake}">${rawValue}</bool>`);
                                else if (type === 'dimension') {
                                    // Special handling for line-height in Android - use float without units
                                    if (varNameSnake.includes('line_height')) {
                                        lines.push(`    <item name="${varNameSnake}" type="float">${rawValue}</item>`);
                                    } else {
                                        lines.push(`    <dimen name="${varNameSnake}">${rawValue}dp</dimen>`);
                                    }
                                }
                                else if (type === 'number') lines.push(`    <item name="${varNameSnake}" type="float">${rawValue}</item>`);
                                else lines.push(`    <!-- ${varNameSnake}: ${value} -->`);
                                break;
                            case 'flutter':
                                if (type === 'color') {
                                    // Flutter fix: proper alpha handling
                                    const alphaHex = Math.round((a !== undefined ? a : 1) * 255).toString(16).padStart(2, '0').toUpperCase();
                                    const hexColor = value.replace('#', '').toUpperCase();
                                    lines.push(`  static const Color ${varNameCamel} = Color(0x${alphaHex}${hexColor});`);
                                } else if (type === 'string') lines.push(`  static const String ${varNameCamel} = ${value};`);
                                else if (type === 'boolean') lines.push(`  static const bool ${varNameCamel} = ${rawValue};`);
                                else if (type === 'dimension') lines.push(`  static const double ${varNameCamel} = ${rawValue};`);
                                else if (type === 'number') lines.push(`  static const double ${varNameCamel} = ${rawValue};`);
                                else lines.push(`  // ${varNameCamel}: ${value}`);
                                break;
                            case 'tailwind': break; // Handled separately
                        }
                    } else { // It's a category
                        const sectionName = key.charAt(0).toUpperCase() + key.slice(1);
                        switch(format) {
                            case 'swift': lines.push(`\n    // MARK: - ${sectionName}`); break;
                            case 'flutter': lines.push(`\n  // --- ${sectionName} ---`); break;
                            case 'css': lines.push(`\n  /* ${sectionName} */`); break;
                            case 'android': lines.push(`\n    <!-- ${sectionName} -->`); break;
                        }
                        lines.push(...processTokensForCode(currentObj, currentPath));
                    }
                }
                return lines;
            };

            // Assemble the final file content with necessary boilerplate.
            switch(format) {
                case 'w3c':
                    filename = 'tokens.json';
                    const buildW3cTokens = (obj) => {
                        let result = {};
                        for (const key in obj) {
                            const currentObj = obj[key];
                            if (currentObj.value !== undefined) {
                                // FIX: Use the raw value for dimensions and numbers, not the stringified one.
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
                case 'css': content = `:root {\n${processTokensForCode(designTokens).join('\n')}\n}`; break;
                case 'swift': content = `import UIKit\n\nstruct AppTokens {\n${processTokensForCode(designTokens).join('\n')}\n}`; break;
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
                    // ENHANCED: Smart Tailwind builder
                    const buildTailwindTokens = (tokenObject) => {
                        const tailwindTheme = {
                            colors: {},
                            spacing: {},
                            borderRadius: {},
                            fontSize: {},
                            fontWeight: {},
                            lineHeight: {}
                        };

                        // Recursive function to flatten the structure
                        function processLevel(obj, path = []) {
                            for (const key in obj) {
                                const currentPath = [...path, sanitizeName(key, 'tailwind')];
                                const currentObj = obj[key];

                                if (currentObj.value !== undefined) { // It's a token
                                    const finalKey = currentPath.join('-');
                                    
                                    if (currentObj.type === 'color') {
                                        tailwindTheme.colors[finalKey] = currentObj.value;
                                    } else if (currentObj.type === 'dimension') {
                                        // Check for more specific dimension types
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
                                } else { // It's a category
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
                default: return null;
            }
            return { filename, content };
        }).filter(Boolean);

    } catch (error) {
        console.error('Error generating export data:', error);
        figma.notify('Error generating export data.', { error: true });
        return [];
    }
}

// --- MESSAGE HANDLING ---
// Listens for messages from the UI thread.
figma.ui.onmessage = async (msg) => {
    try {
        switch (msg.type) {
            case 'get-collections':
                await getCollectionsForUI();
                break;
            case 'export-tokens': {
                const { collectionIds, formats, activeTokenTypes } = msg;
                const exportData = await generateExportData(collectionIds, formats, activeTokenTypes);
                
                // Check export size before sending
                const totalSize = exportData.reduce((sum, file) => sum + file.content.length, 0);
                if (totalSize > 50 * 1024 * 1024) { // 50MB
                    figma.notify('Export too large (>50MB). Try selecting fewer collections.', { error: true });
                    return;
                }
                
                figma.ui.postMessage({ type: 'export-result', data: exportData });
                break;
            }
            case 'resize':
                figma.ui.resize(msg.width, msg.height);
                break;
            case 'open-url':
                figma.openExternal(msg.url);
                break;
            case 'notify':
                figma.notify(msg.message, { error: msg.error || false });
                break;
            default:
                console.warn('Unknown message type received:', msg.type);
        }
    } catch (error) {
        console.error("Error in message handler:", error);
        figma.notify('An unexpected error occurred.', { error: true });
    }
};