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
import { integrateStyleDictionary, validateStyleDictionaryAvailability } from './style-dictionary-integration.js';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

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
    const cssContent = fs.readFileSync(cssFile, 'utf8');
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
                bundledCss += fs.readFileSync(localPath, 'utf8') + '\n';
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
    const templateContent = fs.readFileSync(templateFile, 'utf8');
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
                    bundledJs += fs.readFileSync(scriptPath, 'utf8') + '\n';
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
        const transformsContent = fs.readFileSync(transformsPath, 'utf8');
        
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
    
    let content = fs.readFileSync(templateFile, 'utf8');
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
                return fs.readFileSync(fullPath, 'utf8');
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
        const templateCode = fs.readFileSync(templatesPath, 'utf8');
        const dataCode = fs.readFileSync(dataPath, 'utf8');
        
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
 * Main build function
 * Orchestrates the entire build process including CSS bundling, 
 * JavaScript processing, Style Dictionary integration, and template compilation
 * 
 * @returns {Promise<void>}
 */
async function build() {
    // Always read CLAUDE.md critical sections first!
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
    try {
        const content = fs.readFileSync(claudeMdPath, 'utf8');
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
    
    console.log(`\n${colors.bright}🚀 Building Token Exporter...${colors.reset}\n`);
    
    const startTime = Date.now();
    
    // Step 1: Process template functions (if available)
    console.log(`${colors.blue}[1/5]${colors.reset} Processing template functions...`);
    const templateBundle = await processTemplates();
    if (templateBundle) {
        console.log(`  ${colors.green}✓${colors.reset} Templates processed\n`);
    } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} No templates to process\n`);
    }
    
    // Step 2: Bundle CSS
    console.log(`${colors.blue}[2/5]${colors.reset} Bundling CSS...`);
    let cssBundle;
    
    // Process CSS with imports
    cssBundle = await processCssImports(
        path.join(projectRoot, CONFIG.cssSource),
        path.join(projectRoot, CONFIG.tempCssBundle)
    );
    
    const cssSize = Math.round(cssBundle.length / 1024);
    console.log(`  ${colors.green}✓${colors.reset} CSS bundled (${cssSize}KB)\n`);
    
    // Step 3: Bundle JavaScript
    console.log(`${colors.blue}[3/6]${colors.reset} Bundling JavaScript...`);
    const jsBundle = await processJavaScriptBundles(
        path.join(projectRoot, CONFIG.templates.ui.source),
        path.join(projectRoot, CONFIG.tempJsBundle)
    );
    const jsSize = Math.round(jsBundle.length / 1024);
    console.log(`  ${colors.green}✓${colors.reset} JavaScript bundled (${jsSize}KB)\n`);
    
    // Step 4: Bundle Style Dictionary transforms
    console.log(`${colors.blue}[4/6]${colors.reset} Bundling Style Dictionary transforms...`);
    const styleTransforms = bundleStyleTransforms();
    const transformsSize = Math.round(styleTransforms.length / 1024);
    console.log(`  ${colors.green}✓${colors.reset} Style transforms bundled (${transformsSize}KB)`);
    
    // Test Style Dictionary integration
    await testStyleDictionaryIntegration();
    console.log();
    
    // Step 5: Process templates
    console.log(`${colors.blue}[5/6]${colors.reset} Processing templates...`);
    
    // Process UI template
    const uiTemp = path.join(projectRoot, CONFIG.templates.ui.output + '.temp');
    processTemplate(
        path.join(projectRoot, CONFIG.templates.ui.source),
        uiTemp
    );
    console.log(`  ${colors.green}✓${colors.reset} UI template processed`);
    
    // Process Guide template
    const guideTemp = path.join(projectRoot, CONFIG.templates.guide.output + '.temp');
    processTemplate(
        path.join(projectRoot, CONFIG.templates.guide.source),
        guideTemp
    );
    console.log(`  ${colors.green}✓${colors.reset} Guide template processed\n`);
    
    // Step 6: Final assembly
    console.log(`${colors.blue}[6/6]${colors.reset} Assembling final files...`);
    
    // Assemble UI HTML (with inlined CSS for Figma plugin)
    const uiTempContent = fs.readFileSync(uiTemp, 'utf8');
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
    console.log(`  ${colors.green}✓${colors.reset} ${CONFIG.templates.ui.output}`);
    
    // Assemble Guide HTML (with inlined CSS for standalone functionality)
    const guideContent = fs.readFileSync(guideTemp, 'utf8');
    
    // Inline the CSS for a fully self-contained file
    const inlineStyles = `<style>
${cssBundle}
    </style>`;
    
    const guideFinal = guideContent.replace('<!-- {{STYLES}} -->', inlineStyles);
    
    fs.writeFileSync(path.join(projectRoot, CONFIG.templates.guide.output), guideFinal);
    console.log(`  ${colors.green}✓${colors.reset} ${CONFIG.templates.guide.output}`);
    
    // Copy CSS file to docs directory (it should already be there, but ensure it's up to date)
    const cssSourcePath = path.join(projectRoot, CONFIG.cssSource);
    const cssDestPath = path.join(projectRoot, 'docs', 'design-system.css');
    if (cssSourcePath !== cssDestPath) {
        fs.copyFileSync(cssSourcePath, cssDestPath);
        console.log(`  ${colors.green}✓${colors.reset} Copied design-system.css`);
    }
    
    // Cleanup temp files
    fs.unlinkSync(uiTemp);
    fs.unlinkSync(guideTemp);
    
    // Additional cleanup for new temp files
    cleanup();
    
    const elapsed = Date.now() - startTime;
    console.log(`\n${colors.bright}${colors.green}✨ Build complete in ${elapsed}ms${colors.reset}\n`);
}

/**
 * Watch mode
 * Monitors file changes and triggers rebuilds automatically
 * Uses nodemon for efficient file watching
 * 
 * @returns {Promise<void>}
 */
async function watch() {
    console.log(`\n${colors.bright}👁️  Watch mode active${colors.reset}`);
    console.log(`${colors.cyan}Watching for changes...${colors.reset}\n`);
    
    // Initial build
    await build();
    
    const watchPaths = [
        'src/ui.template.html',
        'docs/design-system-guide.template.html',
        'src/components'
    ];
    
    // Watch CSS file
    watchPaths.push('docs/design-system.css');
    
    // Use nodemon for watching
    const nodemon = spawn('npx', [
        'nodemon',
        '--watch', watchPaths.join(' --watch '),
        '--ext', 'html,css',
        '--ignore', 'src/ui.html',
        '--ignore', 'docs/design-system-guide.html',
        '--exec', 'node scripts/build.js'
    ], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true
    });
    
    nodemon.on('error', (error) => {
        console.error(`${colors.red}Watch error: ${error.message}${colors.reset}`);
    });
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