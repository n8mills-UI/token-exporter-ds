#!/usr/bin/env node

/**
 * Master Build Script for Token Exporter
 * Consolidates all build operations into a single tool
 * 
 * @fileoverview Orchestrates CSS bundling, JavaScript processing, and HTML template compilation
 * @author Nate Mills <nate@natemills.me>
 * @version 4.0.0
 * 
 * Usage:
 *   node scripts/build.js          # Build once
 *   node scripts/build.js --watch  # Watch mode
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { integrateStyleDictionary, validateStyleDictionaryAvailability } from '../src/lib/style-dictionary-integration.js';

// Global watch state
let isCheckRunning = false;
let lastCheckTime = 0;
const CHECK_DEBOUNCE_MS = 1000;

// File cache for avoiding redundant reads
const fileCache = new Map();
const fileMtimes = new Map();

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

/**
 * Cached file reader that checks modification time before reading
 * @param {string} filePath - Path to the file to read
 * @returns {string} File contents
 */
function readFileWithCache(filePath) {
    try {
        const stats = fs.statSync(filePath);
        const mtime = stats.mtime.getTime();
        const cachedMtime = fileMtimes.get(filePath);
        
        // Return cached content if file hasn't changed
        if (cachedMtime === mtime && fileCache.has(filePath)) {
            return fileCache.get(filePath);
        }
        
        // Read and cache the file
        const content = fs.readFileSync(filePath, 'utf8');
        fileCache.set(filePath, content);
        fileMtimes.set(filePath, mtime);
        return content;
    } catch (error) {
        // File doesn't exist or can't be read, return empty
        return '';
    }
}

/**
 * Clear file cache (for cleanup)
 */
function clearFileCache() {
    fileCache.clear();
    fileMtimes.clear();
}

/**
 * @typedef {Object} BuildConfig
 * @property {string} cssSource - Path to main CSS file with imports
 * @property {string} tempCssBundle - Temporary CSS bundle filename
 * @property {string} tempJsBundle - Temporary JavaScript bundle filename
 * @property {string} styleTransformsBundle - Style Dictionary transforms bundle filename
 * @property {Object} templates - Template configuration
 * @property {Object} templates.ui - UI template paths
 * @property {string} templates.ui.source - UI template source file
 * @property {string} templates.ui.output - UI template output file
 * @property {Object} templates.guide - Guide template paths
 * @property {string} templates.guide.source - Guide template source file
 * @property {string} templates.guide.output - Guide template output file
 */

// Configuration
const CONFIG = {
    cssSource: 'docs/design-system.css',
    tempCssBundle: 'temp_css_bundle.css',
    tempJsBundle: 'temp_js_bundle.js',
    styleTransformsBundle: 'temp_style_transforms_bundle.js',
    templates: {
        ui: {
            source: 'src/ui.template.html',
            output: 'src/ui.html'
        },
        guide: {
            source: 'docs/design-system-guide.template.html',
            output: 'docs/design-system-guide.html'
        }
    }
};

/**
 * @typedef {Object} ANSIColors
 * @property {string} reset - Reset all formatting
 * @property {string} bright - Bright/bold text
 * @property {string} red - Red text color
 * @property {string} green - Green text color
 * @property {string} yellow - Yellow text color
 * @property {string} blue - Blue text color
 * @property {string} cyan - Cyan text color
 */

// ANSI colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

/**
 * Clean up temporary files
 * Removes all build artifacts and temporary files
 * @returns {void}
 */
function cleanup() {
    try {
        if (fs.existsSync(CONFIG.tempCssBundle)) fs.unlinkSync(CONFIG.tempCssBundle);
        if (fs.existsSync(CONFIG.tempJsBundle)) fs.unlinkSync(CONFIG.tempJsBundle);
        if (fs.existsSync(CONFIG.styleTransformsBundle)) fs.unlinkSync(CONFIG.styleTransformsBundle);
        
        // Remove any .temp files
        const tempFiles = fs.readdirSync(projectRoot)
            .filter(f => f.endsWith('.temp'))
            .map(f => path.join(projectRoot, f));
        
        tempFiles.forEach(f => {
            if (fs.existsSync(f)) fs.unlinkSync(f);
        });
        
        // Clear file cache
        clearFileCache();
    } catch (error) {
        console.error('Cleanup error:', error.message);
    }
}

// Ensure cleanup on exit
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });

/**
 * Process CSS imports (both local and remote)
 * Resolves @import statements and bundles all CSS into a single file
 * Includes security checks to block external icon libraries
 * 
 * @param {string} cssFile - Path to the main CSS file with imports
 * @param {string} outputBundle - Path where bundled CSS should be written
 * @returns {Promise<string>} The bundled CSS content
 * @throws {Error} When external icon libraries are detected
 */
async function processCssImports(cssFile, outputBundle) {
    const cssContent = readFileWithCache(cssFile);
    let bundledCss = '';
    
    // Extract non-import content
    const nonImportLines = cssContent
        .split('\n')
        .filter(line => !line.trim().startsWith('@import'))
        .join('\n');
    
    // Process imports
    const importLines = cssContent
        .split('\n')
        .filter(line => line.trim().startsWith('@import'));
    
    for (const importLine of importLines) {
        // Extract URL from import
        const urlMatch = importLine.match(/url\(["']?([^"')]+)["']?\)/);
        if (!urlMatch) continue;
        
        const url = urlMatch[1];
        
        if (url.startsWith('vendor/') || url.startsWith('../vendor/') || url.startsWith('src/vendor/') || url.startsWith('../src/vendor/')) {
            // Local file - handle both old and new paths
            let localPath;
            if (url.includes('src/vendor/')) {
                // Legacy path - redirect to new location
                localPath = path.join(projectRoot, url.replace(/\.\.\/src\/vendor\/|src\/vendor\//, 'vendor/open-props/'));
            } else {
                localPath = url.startsWith('../') 
                    ? path.join(projectRoot, url.replace('../', ''))
                    : path.join(projectRoot, url);
            }
                
            if (fs.existsSync(localPath)) {
                console.log(`  ${colors.cyan}↓${colors.reset} Reading local: ${path.basename(localPath)}`);
                bundledCss += readFileWithCache(localPath) + '\n';
            } else {
                console.error(`  ${colors.red}✗${colors.reset} File not found: ${localPath}`);
            }
        } else if (url.startsWith('https://')) {
            // Remote file - CHECK FOR ICON LIBRARIES
            const iconLibraries = ['lucide', 'fontawesome', 'heroicons', 'feather', 'tabler'];
            const isIconLibrary = iconLibraries.some(lib => url.toLowerCase().includes(lib));
            
            if (isIconLibrary) {
                console.error(`\n  ${colors.red}✗ BLOCKED: External icon library detected in CSS!${colors.reset}`);
                console.error(`    ${colors.yellow}${url}${colors.reset}`);
                console.error(`    ${colors.red}Use internal icon system only. See CLAUDE.md#icon-system${colors.reset}\n`);
                process.exit(1);
            }
            
            console.log(`  ${colors.cyan}↓${colors.reset} Fetching: ${url.substring(0, 50)}...`);
            try {
                const response = await fetch(url);
                if (response.ok) {
                    bundledCss += await response.text() + '\n';
                } else {
                    console.error(`  ${colors.red}✗${colors.reset} Failed to fetch: ${response.status}`);
                }
            } catch (error) {
                console.error(`  ${colors.red}✗${colors.reset} Network error: ${error.message}`);
            }
        }
    }
    
    // Add non-import content last
    bundledCss += nonImportLines;
    
    fs.writeFileSync(outputBundle, bundledCss);
    return bundledCss;
}


/**
 * Process JavaScript bundles from script tags
 * Extracts and bundles JavaScript files referenced in HTML templates
 * Includes security checks to block external icon libraries
 * 
 * @param {string} templateFile - Path to the HTML template file
 * @param {string} outputBundle - Path where bundled JavaScript should be written
 * @returns {Promise<string>} The bundled JavaScript content
 * @throws {Error} When external icon libraries are detected
 */
async function processJavaScriptBundles(templateFile, outputBundle) {
    const templateContent = readFileWithCache(templateFile);
    let bundledJs = '';
    
    // Find all script tags (both external and local)
    const scriptMatches = [...templateContent.matchAll(/<script\s+src="([^"]+)"/g)];
    
    for (const match of scriptMatches) {
        const src = match[1];
        
        if (src.startsWith('https://')) {
            // External script - CHECK FOR ICON LIBRARIES
            const iconLibraries = ['lucide', 'fontawesome', 'heroicons', 'feather', 'tabler'];
            const isIconLibrary = iconLibraries.some(lib => src.toLowerCase().includes(lib));
            
            if (isIconLibrary) {
                console.error(`\n  ${colors.red}✗ BLOCKED: External icon library detected!${colors.reset}`);
                console.error(`    ${colors.yellow}${src}${colors.reset}`);
                console.error(`    ${colors.red}Use internal icon system only. See CLAUDE.md#icon-system${colors.reset}\n`);
                process.exit(1);
            }
            
            console.log(`  ${colors.cyan}↓${colors.reset} Fetching JS: ${src.substring(0, 50)}...`);
            try {
                const response = await fetch(src);
                if (response.ok) {
                    bundledJs += await response.text() + '\n';
                } else {
                    console.error(`  ${colors.red}✗${colors.reset} Failed to fetch: ${response.status}`);
                }
            } catch (error) {
                console.error(`  ${colors.red}✗${colors.reset} Network error: ${error.message}`);
            }
        } else {
            // Local script
            const scriptPath = path.resolve(path.dirname(templateFile), src);
            console.log(`  ${colors.cyan}↓${colors.reset} Reading local: ${path.basename(src)}`);
            try {
                if (fs.existsSync(scriptPath)) {
                    bundledJs += readFileWithCache(scriptPath) + '\n';
                } else {
                    console.error(`  ${colors.red}✗${colors.reset} File not found: ${scriptPath}`);
                }
            } catch (error) {
                console.error(`  ${colors.red}✗${colors.reset} Read error: ${error.message}`);
            }
        }
    }
    
    fs.writeFileSync(outputBundle, bundledJs);
    return bundledJs;
}

/**
 * Bundle Style Dictionary transforms for plugin UI
 * Creates a browser-compatible bundle of Style Dictionary transforms
 * Provides fallback transforms if Style Dictionary is unavailable
 * 
 * @returns {string} The bundled transforms JavaScript content
 */
function bundleStyleTransforms() {
    try {
        const transformsPath = path.join(projectRoot, 'build/style-dictionary-transforms.js');
        
        if (!fs.existsSync(transformsPath)) {
            console.warn(`  ${colors.yellow}⚠${colors.reset} Style Dictionary transforms not found at ${transformsPath}`);
            
            // Create a minimal fallback
            const fallbackTransforms = `
// Fallback transforms when Style Dictionary is unavailable
window.styleTransforms = {
    colorTransforms: {
        hexToIosRgb: function(hexValue) {
            const hex = hexValue.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            return { red: r, green: g, blue: b, alpha: 1 };
        }
    },
    formatGenerators: {
        css: function(tokens) {
            let output = ':root {\\n';
            Object.entries(tokens).forEach(([name, value]) => {
                output += \`  --\${name}: \${value};\\n\`;
            });
            output += '}';
            return output;
        }
    }
};
`;
            
            fs.writeFileSync(path.join(projectRoot, CONFIG.styleTransformsBundle), fallbackTransforms);
            return fallbackTransforms;
        }
        
        console.log(`  ${colors.cyan}↓${colors.reset} Bundling Style Dictionary transforms...`);
        const transformsContent = readFileWithCache(transformsPath);
        
        // Ensure the transforms are available as window.styleTransforms
        let bundledContent = transformsContent;
        if (!bundledContent.includes('window.styleTransforms')) {
            bundledContent += '\n\n// Ensure transforms are available globally\nif (typeof window !== "undefined") {\n    window.styleTransforms = { colorTransforms, sizeTransforms, fontWeightTransforms, formatGenerators };\n}';
        }
        
        fs.writeFileSync(path.join(projectRoot, CONFIG.styleTransformsBundle), bundledContent);
        console.log(`  ${colors.green}✓${colors.reset} Style Dictionary transforms bundled`);
        
        return bundledContent;
        
    } catch (error) {
        console.error(`  ${colors.red}✗${colors.reset} Error bundling transforms: ${error.message}`);
        
        // Return minimal fallback on error
        const errorFallback = `
// Error fallback transforms
window.styleTransforms = {
    error: true,
    message: "Transform error occurred"
};
`;
        
        fs.writeFileSync(path.join(projectRoot, CONFIG.styleTransformsBundle), errorFallback);
        return errorFallback;
    }
}

/**
 * Test Style Dictionary integration with sample tokens
 * Validates that Style Dictionary transforms are working correctly
 * 
 * @returns {Promise<Object>} Test result object with success/failure status
 */
async function testStyleDictionaryIntegration() {
    console.log(`  ${colors.cyan}🧪${colors.reset} Testing Style Dictionary integration...`);
    
    /** @type {Record<string, string>} */
    const sampleTokens = {
        'primary-color': '#3b82f6',
        'secondary-color': '#64748b',
        'base-spacing': '16px',
        'font-size-lg': '1.125rem'
    };
    
    try {
        const result = await integrateStyleDictionary(sampleTokens);
        
        if (result.error) {
            console.warn(`  ${colors.yellow}⚠${colors.reset} Style Dictionary test failed, using fallback`);
        } else {
            console.log(`  ${colors.green}✓${colors.reset} Style Dictionary integration test passed`);
        }
        
        return result;
        
    } catch (error) {
        console.warn(`  ${colors.yellow}⚠${colors.reset} Style Dictionary test error: ${error.message}`);
        return { error: error.message, fallback: true };
    }
}

/**
 * Process HTML template with includes
 * Recursively processes @include directives in HTML templates
 * 
 * @param {string} templateFile - Path to the template file
 * @param {string} outputFile - Path where processed template should be written
 * @returns {boolean} Success status of template processing
 */
function processTemplate(templateFile, outputFile) {
    if (!fs.existsSync(templateFile)) {
        console.error(`  ${colors.red}✗${colors.reset} Template not found: ${templateFile}`);
        return false;
    }
    
    let content = readFileWithCache(templateFile);
    let hasIncludes = true;
    let depth = 0;
    const maxDepth = 10;
    
    // Process includes recursively
    while (hasIncludes && depth < maxDepth) {
        hasIncludes = false;
        depth++;
        
        content = content.replace(/<!-- @include ([^\s]+) -->/g, (match, includePath) => {
            hasIncludes = true;
            const fullPath = path.join(projectRoot, includePath);
            
            if (fs.existsSync(fullPath)) {
                return readFileWithCache(fullPath);
            } else {
                console.error(`  ${colors.red}✗${colors.reset} Include not found: ${includePath}`);
                return match;
            }
        });
    }
    
    fs.writeFileSync(outputFile, content);
    return true;
}

/**
 * @typedef {Object} ComponentConfig
 * @property {string} name - Component name for filename
 * @property {string} template - Template function name
 * @property {Object} data - Data to pass to template function
 */

/**
 * Process template functions to generate static components
 * Uses the template system to generate static HTML components
 * 
 * @returns {Promise<string|null>} Bundled template code for plugin use, or null if templates not found
 */
async function processTemplates() {
    const templatesPath = path.join(projectRoot, 'src/lib/templates.js');
    const dataPath = path.join(projectRoot, 'src/lib/data.js');
    
    // Check if template files exist
    if (!fs.existsSync(templatesPath) || !fs.existsSync(dataPath)) {
        console.log(`  ${colors.yellow}⚠${colors.reset} Template system not found, skipping...`);
        return null;
    }
    
    try {
        // Dynamic import for ES modules
        const { templates } = await import(templatesPath);
        const { sampleData } = await import(dataPath);
        
        // Generate static components
        /** @type {ComponentConfig[]} */
        const components = [
            {
                name: 'filters-card',
                template: 'filtersCard',
                data: {
                    collections: sampleData.collections,
                    showHeader: true
                }
            },
            {
                name: 'progress-flow-demo',
                template: 'progressFlowDemo',
                data: {
                    idPrefix: 'guide'
                }
            },
            {
                name: 'quick-export-card',
                template: 'quickExportCard',
                data: {
                    formats: sampleData.exportFormats,
                    showFiltersButton: true,
                    showDiagnostic: false  // Diagnostic removed after fixing button sizing
                }
            },
            {
                name: 'theme-toggle',
                template: 'themeToggle',
                data: {
                    ariaLabel: 'Toggle theme'
                }
            },
            {
                name: 'stats-container',
                template: 'statsContainer',
                data: {
                    stats: sampleData.stats
                }
            },
            {
                name: 'empty-state',
                template: 'emptyState',
                data: {
                    title: 'Let\'s build!',
                    subtitle: 'Create a variable collection in Figma to get started.'
                }
            }
        ];
        
        components.forEach(component => {
            const html = templates[component.template](component.data);
            const output = 
                `<!-- Auto-generated from src/lib/templates.js -->\n` +
                `<!-- Component: ${component.name} -->\n` +
                `<!-- DO NOT EDIT: This file is generated by build.js -->\n` +
                html;
            
            const filePath = path.join(projectRoot, 'src/components', `_${component.name}.html`);
            fs.writeFileSync(filePath, output);
            console.log(`  ${colors.green}✓${colors.reset} Generated ${component.name}.html`);
        });
        
        // Bundle templates for plugin use
        const templateCode = readFileWithCache(templatesPath);
        const dataCode = readFileWithCache(dataPath);
        
        // Transform to Figma-compatible JavaScript
        const transformedCode = (dataCode + '\n\n' + templateCode)
            .replace(/export \{[^}]+\};?/g, '')
            .replace(/import[^;]+;/g, '')
            .replace(/const templates = \{/, 'window.templates = {')
            .replace(/const sampleData = \{/, 'window.sampleData = {');
        
        return transformedCode;
    } catch (error) {
        console.error(`  ${colors.red}✗${colors.reset} Template processing failed: ${error.message}`);
        return null;
    }
}

/**
 * @typedef {Object} BuildStep
 * @property {string} name - Step name
 * @property {Function} fn - Step function
 * @property {Object} timing - Timing information
 * @property {number} timing.start - Start time
 * @property {number} timing.end - End time
 * @property {number} timing.duration - Duration in milliseconds
 */

/**
 * Log step timing information
 * @param {string} stepName - Name of the build step
 * @param {number} duration - Duration in milliseconds
 * @param {Object} metadata - Additional metadata to log
 */
function logStepTiming(stepName, duration, metadata = {}) {
    const metaStr = Object.keys(metadata).length > 0 
        ? ` (${Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(', ')})`
        : '';
    console.log(`  ${colors.green}✓${colors.reset} ${stepName} ${colors.gray}(${duration}ms)${colors.reset}${metaStr}`);
}

/**
 * Main build function with parallel execution and performance timing
 * Orchestrates the entire build process including CSS bundling, 
 * JavaScript processing, Style Dictionary integration, and template compilation
 * 
 * @returns {Promise<void>}
 */
async function build() {
    // Always read CLAUDE.md critical sections first!
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
    try {
        const content = readFileWithCache(claudeMdPath);
        const criticalSections = content.match(/## CRITICAL:.*?(?=##|$)/gs);
        
        if (criticalSections) {
            console.log(`${colors.yellow}📖 CLAUDE.md Critical Reminders:${colors.reset}\n`);
            criticalSections.forEach(section => {
                console.log(`${colors.red}${section.trim()}${colors.reset}`);
                console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
            });
            console.log();
        }
    } catch (error) {
        console.log(`${colors.yellow}⚠️  Could not read CLAUDE.md${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}🚀 Building Token Exporter...${colors.reset}`);
    console.log(`${colors.cyan}⚡ Using parallel execution for optimal performance${colors.reset}\n`);
    
    const buildStartTime = Date.now();
    const stepTimings = new Map();
    
    // Phase 1: Parallel processing of independent assets
    console.log(`${colors.blue}[Phase 1]${colors.reset} Processing independent assets in parallel...`);
    
    const phase1Tasks = [
        {
            name: 'Template Functions',
            fn: async () => {
                const start = Date.now();
                const result = await processTemplates();
                const duration = Date.now() - start;
                stepTimings.set('templates', { duration, result });
                return result;
            }
        },
        {
            name: 'CSS Bundling',
            fn: async () => {
                const start = Date.now();
                const cssBundle = await processCssImports(
                    path.join(projectRoot, CONFIG.cssSource),
                    path.join(projectRoot, CONFIG.tempCssBundle)
                );
                const duration = Date.now() - start;
                const size = Math.round(cssBundle.length / 1024);
                stepTimings.set('css', { duration, result: cssBundle, size });
                return cssBundle;
            }
        },
        {
            name: 'JavaScript Bundling',
            fn: async () => {
                const start = Date.now();
                const jsBundle = await processJavaScriptBundles(
                    path.join(projectRoot, CONFIG.templates.ui.source),
                    path.join(projectRoot, CONFIG.tempJsBundle)
                );
                const duration = Date.now() - start;
                const size = Math.round(jsBundle.length / 1024);
                stepTimings.set('js', { duration, result: jsBundle, size });
                return jsBundle;
            }
        },
        {
            name: 'Style Dictionary Transforms',
            fn: async () => {
                const start = Date.now();
                const styleTransforms = bundleStyleTransforms();
                const duration = Date.now() - start;
                const size = Math.round(styleTransforms.length / 1024);
                stepTimings.set('transforms', { duration, result: styleTransforms, size });
                return styleTransforms;
            }
        }
    ];

    // Execute Phase 1 tasks in parallel
    const [templateBundle, cssBundle, jsBundle, styleTransforms] = await Promise.all(
        phase1Tasks.map(task => task.fn())
    );

    // Log Phase 1 results
    const templatesData = stepTimings.get('templates');
    const cssData = stepTimings.get('css');
    const jsData = stepTimings.get('js');
    const transformsData = stepTimings.get('transforms');

    if (templatesData.result) {
        logStepTiming('Template functions processed', templatesData.duration);
    } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} No templates to process`);
    }
    
    logStepTiming('CSS bundled', cssData.duration, { size: `${cssData.size}KB` });
    logStepTiming('JavaScript bundled', jsData.duration, { size: `${jsData.size}KB` });
    logStepTiming('Style transforms bundled', transformsData.duration, { size: `${transformsData.size}KB` });

    // Test Style Dictionary integration (quick validation)
    const testStart = Date.now();
    await testStyleDictionaryIntegration();
    const testDuration = Date.now() - testStart;
    stepTimings.set('integration-test', { duration: testDuration });
    console.log(`  ${colors.green}✓${colors.reset} Style Dictionary integration tested ${colors.gray}(${testDuration}ms)${colors.reset}`);

    console.log();
    
    // Phase 2: Template processing (can be parallelized)
    console.log(`${colors.blue}[Phase 2]${colors.reset} Processing HTML templates in parallel...`);

    const phase2Tasks = [
        {
            name: 'UI Template',
            fn: async () => {
                const start = Date.now();
                const uiTemp = path.join(projectRoot, CONFIG.templates.ui.output + '.temp');
                const success = processTemplate(
                    path.join(projectRoot, CONFIG.templates.ui.source),
                    uiTemp
                );
                const duration = Date.now() - start;
                stepTimings.set('ui-template', { duration, tempPath: uiTemp, success });
                return { tempPath: uiTemp, success };
            }
        },
        {
            name: 'Guide Template',
            fn: async () => {
                const start = Date.now();
                const guideTemp = path.join(projectRoot, CONFIG.templates.guide.output + '.temp');
                const success = processTemplate(
                    path.join(projectRoot, CONFIG.templates.guide.source),
                    guideTemp
                );
                const duration = Date.now() - start;
                stepTimings.set('guide-template', { duration, tempPath: guideTemp, success });
                return { tempPath: guideTemp, success };
            }
        }
    ];

    // Execute Phase 2 tasks in parallel
    const [uiResult, guideResult] = await Promise.all(
        phase2Tasks.map(task => task.fn())
    );

    const uiTemplateData = stepTimings.get('ui-template');
    const guideTemplateData = stepTimings.get('guide-template');

    logStepTiming('UI template processed', uiTemplateData.duration);
    logStepTiming('Guide template processed', guideTemplateData.duration);

    console.log();
    
    // Phase 3: Final assembly (sequential due to dependencies)
    console.log(`${colors.blue}[Phase 3]${colors.reset} Final assembly...`);

    const assemblyStart = Date.now();

    // Assemble UI HTML (with inlined CSS for Figma plugin)
    const uiAssemblyStart = Date.now();
    const uiTempContent = readFileWithCache(uiResult.tempPath);
    const uiFinal = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Exporter</title>
    <style>
${cssBundle}
    </style>
    <script>
${jsBundle}
${templateBundle ? '\n// Template functions\n' + templateBundle : ''}

// Style Dictionary transforms
${styleTransforms}
    </script>
</head>
${uiTempContent.replace(/<script\s+src="[^"]+"><\/script>/g, '')}
</html>`;
    
    fs.writeFileSync(path.join(projectRoot, CONFIG.templates.ui.output), uiFinal);
    const uiAssemblyDuration = Date.now() - uiAssemblyStart;
    
    // Assemble Guide HTML (with linked CSS for better web performance)
    const guideAssemblyStart = Date.now();
    const guideContent = readFileWithCache(guideResult.tempPath);
    
    // Link to external CSS file to avoid minified Open Props parsing issues
    const styleLink = '<link rel="stylesheet" href="design-system.css">';
    
    const guideFinal = guideContent.replace('<!-- {{STYLES}} -->', styleLink);
    
    fs.writeFileSync(path.join(projectRoot, CONFIG.templates.guide.output), guideFinal);
    const guideAssemblyDuration = Date.now() - guideAssemblyStart;
    
    const assemblyDuration = Date.now() - assemblyStart;

    logStepTiming(CONFIG.templates.ui.output, uiAssemblyDuration);
    logStepTiming(CONFIG.templates.guide.output, guideAssemblyDuration);
    
    // DO NOT COPY BUNDLED CSS - it breaks with minified Open Props!
    // The docs/design-system.css from commit 744ea0b works perfectly
    // fs.copyFileSync(path.join(projectRoot, CONFIG.tempCssBundle), path.join(projectRoot, CONFIG.cssSource));
    console.log(`  ${colors.cyan}ℹ${colors.reset} Keeping existing docs/design-system.css (not bundling)`);
    
    // Cleanup temp files
    const cleanupStart = Date.now();
    try {
        if (fs.existsSync(uiResult.tempPath)) fs.unlinkSync(uiResult.tempPath);
        if (fs.existsSync(guideResult.tempPath)) fs.unlinkSync(guideResult.tempPath);
    } catch (error) {
        console.warn(`${colors.yellow}⚠ Temp file cleanup warning: ${error.message}${colors.reset}`);
    }
    cleanup();
    const cleanupDuration = Date.now() - cleanupStart;
    stepTimings.set('cleanup', { duration: cleanupDuration });
    
    const totalDuration = Date.now() - buildStartTime;
    
    // Performance summary
    console.log(`\n${colors.bright}${colors.green}✨ Build complete!${colors.reset}`);
    console.log(`${colors.cyan}⚡ Performance Summary:${colors.reset}`);
    console.log(`  • Phase 1 (parallel): ${Math.max(cssData.duration, jsData.duration, transformsData.duration, templatesData.duration)}ms`);
    console.log(`  • Phase 2 (parallel): ${Math.max(uiTemplateData.duration, guideTemplateData.duration)}ms`);
    console.log(`  • Phase 3 (assembly): ${assemblyDuration}ms`);
    console.log(`  • Cleanup: ${cleanupDuration}ms`);
    console.log(`  ${colors.bright}• Total: ${totalDuration}ms${colors.reset}\n`);
}

/**
 * Log message to console (notifications disabled for better flow)
 * @param {string} title - Message title
 * @param {string} message - Message content
 * @param {string} [subtitle] - Optional subtitle
 */
function sendNotification(title, message, subtitle = '') {
    // Desktop notifications disabled - too disruptive for design work
    // Silent operation - messages logged to console only when needed
    return;
}

/**
 * Run quality checks with notifications
 * @param {string} changedFile - The file that triggered the check
 * @returns {Promise<boolean>} Success status
 */
async function runQualityChecks(changedFile = '') {
    // Debounce checks to avoid spam
    const now = Date.now();
    if (now - lastCheckTime < CHECK_DEBOUNCE_MS) {
        return true;
    }
    
    if (isCheckRunning) {
        console.log(`${colors.yellow}⏳ Quality check already running, skipping...${colors.reset}`);
        return true;
    }
    
    isCheckRunning = true;
    lastCheckTime = now;
    
    // Run quality checks silently unless there are issues
    
    try {
        const checkResult = await new Promise((resolve, reject) => {
            // Add timeout for quality checks
            const CHECK_TIMEOUT = 30000; // 30 seconds max
            let timedOut = false;
            
            // Run only essential checks in watch mode (3 checks instead of 10)
            const checkProcess = spawn('node', ['--max-old-space-size=512', 'scripts/check.js', '--essential'], {
                cwd: projectRoot,
                stdio: 'pipe',
                env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' }
            });
            
            // Set timeout
            const timeoutId = setTimeout(() => {
                timedOut = true;
                checkProcess.kill('SIGTERM');
                reject(new Error('Quality check timed out after 30 seconds'));
            }, CHECK_TIMEOUT);
            
            let stdout = '';
            let stderr = '';
            
            checkProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                // Stream output to console in real-time
                process.stdout.write(output);
            });
            
            checkProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            checkProcess.on('close', (code) => {
                clearTimeout(timeoutId);
                if (!timedOut) {
                    resolve({ code, stdout, stderr });
                }
            });
            
            checkProcess.on('error', (error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
        });
        
        const success = checkResult.code === 0;
        const summary = extractCheckSummary(checkResult.stdout);
        
        if (success) {
            console.log(`${colors.green}✅ Quality checks passed (${summary.time}ms)${colors.reset}`);
        } else {
            console.log(`${colors.red}❌ ${summary.failed} checks failed - see output above${colors.reset}`);
        }
        
        return success;
        
    } catch (error) {
        console.error(`${colors.red}Error running quality checks: ${error.message}${colors.reset}`);
        return false;
    } finally {
        isCheckRunning = false;
    }
}

/**
 * Extract summary information from check script output
 * @param {string} output - Raw output from check.js
 * @returns {Object} Parsed summary
 */
function extractCheckSummary(output) {
    const summary = { passed: 0, failed: 0, time: 0 };
    
    // Extract results line: "Results: X passed, Y failed" (accounting for ANSI color codes)
    const resultsMatch = output.match(/Results: .*?(\d+) passed.*?, .*?(\d+) failed/);
    if (resultsMatch) {
        summary.passed = parseInt(resultsMatch[1]);
        summary.failed = parseInt(resultsMatch[2]);
    }
    
    // Extract time: "Time: XXXms"
    const timeMatch = output.match(/Time: (\d+)ms/);
    if (timeMatch) {
        summary.time = parseInt(timeMatch[1]);
    }
    
    return summary;
}

/**
 * Check if a file change should trigger quality checks
 * @param {string} filePath - Changed file path
 * @returns {boolean} Whether to run checks
 */
function shouldRunChecks(filePath) {
    const relevantExtensions = ['.css', '.js', '.html'];
    const relevantPaths = [
        'docs/design-system.css',
        'src/code.js',
        'src/ui.template.html',
        'docs/design-system-guide.template.html',
        'src/components/'
    ];
    
    // Check extension
    const hasRelevantExtension = relevantExtensions.some(ext => filePath.endsWith(ext));
    if (!hasRelevantExtension) return false;
    
    // Check path
    const isRelevantPath = relevantPaths.some(path => {
        return filePath.includes(path) || filePath.startsWith(path);
    });
    
    return isRelevantPath;
}

/**
 * Watch mode with integrated quality checks
 * Monitors file changes and triggers rebuilds + quality checks automatically
 * Uses fs.watch for efficient file watching with quality check integration
 * 
 * @returns {Promise<void>}
 */
async function watch() {
    console.log(`\n${colors.bright}👁️  Watch mode active with quality checks${colors.reset}`);
    console.log(`${colors.cyan}Watching for changes and running quality checks...${colors.reset}\n`);
    
    // Initial build and quality check
    await build();
    await runQualityChecks('initial build');
    
    const watchPaths = [
        'src/ui.template.html',
        'docs/design-system-guide.template.html', 
        'docs/design-system.css',
        'src/code.js',
        'src/components'
    ];
    
    // Debounce mechanism to prevent rapid rebuilds
    const pendingChanges = new Set();
    let debounceTimer = null;
    let isProcessing = false;
    const DEBOUNCE_DELAY = 300; // 300ms delay to batch changes
    const MIN_REBUILD_INTERVAL = 1000; // Minimum 1 second between rebuilds
    let lastBuildTime = 0;
    
    // Process pending changes with debouncing
    async function processPendingChanges() {
        if (isProcessing || pendingChanges.size === 0) return;
        
        // Enforce minimum rebuild interval
        const timeSinceLastBuild = Date.now() - lastBuildTime;
        if (timeSinceLastBuild < MIN_REBUILD_INTERVAL) {
            setTimeout(processPendingChanges, MIN_REBUILD_INTERVAL - timeSinceLastBuild);
            return;
        }
        
        isProcessing = true;
        const changedFiles = Array.from(pendingChanges);
        pendingChanges.clear();
        
        try {
            console.log(`\n${colors.cyan}📦 Processing ${changedFiles.length} file change(s)...${colors.reset}`);
            changedFiles.forEach(file => {
                console.log(`  - ${path.relative(projectRoot, file)}`);
            });
            
            // Rebuild once for all changes
            await build();
            lastBuildTime = Date.now();
            
            // Run quality checks if any relevant files changed
            const relevantChanges = changedFiles.filter(shouldRunChecks);
            if (relevantChanges.length > 0) {
                await runQualityChecks(`${relevantChanges.length} file(s)`);
            }
        } catch (error) {
            console.error(`${colors.red}Error processing changes:${colors.reset}`, error);
        } finally {
            isProcessing = false;
            
            // Process any new changes that accumulated during processing
            if (pendingChanges.size > 0) {
                setTimeout(processPendingChanges, DEBOUNCE_DELAY);
            }
        }
    }
    
    // Handle file change with debouncing
    function handleFileChange(filePath) {
        // Skip if this is a generated file
        const relativePath = path.relative(projectRoot, filePath);
        if (relativePath.includes('src/ui.html') || 
            relativePath.includes('docs/design-system-guide.html') ||
            relativePath.includes('src/components/') && !relativePath.includes('_')) {
            return; // Skip generated files to prevent loops
        }
        
        pendingChanges.add(filePath);
        
        // Clear existing timer
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // Set new timer
        debounceTimer = setTimeout(processPendingChanges, DEBOUNCE_DELAY);
    }
    
    // Set up file watchers
    const watchers = [];
    
    watchPaths.forEach(watchPath => {
        const fullPath = path.join(projectRoot, watchPath);
        
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                // Watch directory
                const watcher = fs.watch(fullPath, { recursive: true }, (eventType, filename) => {
                    if (filename && (filename.endsWith('.html') || filename.endsWith('.css') || filename.endsWith('.js'))) {
                        const changedFile = path.join(fullPath, filename);
                        console.log(`\n${colors.cyan}📝 File changed: ${path.relative(projectRoot, changedFile)}${colors.reset}`);
                        handleFileChange(changedFile);
                    }
                });
                watchers.push(watcher);
            } else {
                // Watch file
                const watcher = fs.watch(fullPath, (eventType, filename) => {
                    console.log(`\n${colors.cyan}📝 File changed: ${path.relative(projectRoot, fullPath)}${colors.reset}`);
                    handleFileChange(fullPath);
                });
                watchers.push(watcher);
            }
        } else {
            console.log(`${colors.yellow}⚠️  Watch path not found: ${watchPath}${colors.reset}`);
        }
    });
    
    console.log(`${colors.green}✅ Watching ${watchers.length} paths for changes...${colors.reset}`);
    console.log(`${colors.gray}Press Ctrl+C to stop watching${colors.reset}\n`);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log(`\n${colors.yellow}🛑 Stopping watch mode...${colors.reset}`);
        watchers.forEach(watcher => watcher.close());
        process.exit(0);
    });
    
    // Keep the process alive
    process.stdin.resume();
}

// Parse command line arguments
const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');

// Run
if (isWatch) {
    watch().catch(console.error);
} else {
    build().catch(console.error);
}