#!/usr/bin/env node

/**
 * Master Build Script for Token Exporter
 * Consolidates all build operations into a single tool
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

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Configuration
const CONFIG = {
    cssSource: 'docs/design-system.css',
    tempCssBundle: 'temp_css_bundle.css',
    tempJsBundle: 'temp_js_bundle.js',
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
 */
function cleanup() {
    try {
        if (fs.existsSync(CONFIG.tempCssBundle)) fs.unlinkSync(CONFIG.tempCssBundle);
        if (fs.existsSync(CONFIG.tempJsBundle)) fs.unlinkSync(CONFIG.tempJsBundle);
        
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
 * Process HTML template with includes
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
 * Main build function
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
    
    // Step 1: Bundle CSS
    console.log(`${colors.blue}[1/4]${colors.reset} Bundling CSS...`);
    let cssBundle;
    
    // Process CSS with imports
    cssBundle = await processCssImports(
        path.join(projectRoot, CONFIG.cssSource),
        path.join(projectRoot, CONFIG.tempCssBundle)
    );
    
    const cssSize = Math.round(cssBundle.length / 1024);
    console.log(`  ${colors.green}✓${colors.reset} CSS bundled (${cssSize}KB)\n`);
    
    // Step 2: Bundle JavaScript
    console.log(`${colors.blue}[2/4]${colors.reset} Bundling JavaScript...`);
    const jsBundle = await processJavaScriptBundles(
        path.join(projectRoot, CONFIG.templates.ui.source),
        path.join(projectRoot, CONFIG.tempJsBundle)
    );
    const jsSize = Math.round(jsBundle.length / 1024);
    console.log(`  ${colors.green}✓${colors.reset} JavaScript bundled (${jsSize}KB)\n`);
    
    // Step 3: Process templates
    console.log(`${colors.blue}[3/4]${colors.reset} Processing templates...`);
    
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
    
    // Step 4: Final assembly
    console.log(`${colors.blue}[4/4]${colors.reset} Assembling final files...`);
    
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
    </script>
</head>
${uiTempContent.replace(/<script\s+src="[^"]+"><\/script>/g, '')}
</html>`;
    
    fs.writeFileSync(path.join(projectRoot, CONFIG.templates.ui.output), uiFinal);
    console.log(`  ${colors.green}✓${colors.reset} ${CONFIG.templates.ui.output}`);
    
    // Assemble Guide HTML (with linked CSS for better web performance)
    const guideContent = fs.readFileSync(guideTemp, 'utf8');
    let styleLinks;
    
    // Link to single CSS file
    styleLinks = '<link rel="stylesheet" href="design-system.css">';
    
    const guideFinal = guideContent.replace('<!-- {{STYLES}} -->', styleLinks);
    
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
    
    const elapsed = Date.now() - startTime;
    console.log(`\n${colors.bright}${colors.green}✨ Build complete in ${elapsed}ms${colors.reset}\n`);
}

/**
 * Watch mode
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