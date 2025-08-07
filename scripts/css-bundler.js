#!/usr/bin/env node

/**
 * CSS Bundler for Token Exporter
 * Creates a fully self-contained CSS bundle by resolving all @import statements
 * 
 * @fileoverview Processes the main design-system.css file and creates a production-ready
 * bundled version that can be deployed to GitHub Pages without external dependencies
 * @author Nate Mills <nate@natemills.me>
 * @version 4.0.0
 * 
 * Usage:
 *   node scripts/css-bundler.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

/**
 * @typedef {Object} CSSBundleResult
 * @property {string} bundledCSS - The final bundled CSS content
 * @property {number} originalSize - Size of original CSS in bytes
 * @property {number} bundledSize - Size of bundled CSS in bytes
 * @property {string[]} processedImports - List of successfully processed imports
 * @property {string[]} failedImports - List of imports that failed to process
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
 * Process CSS imports and create a fully bundled CSS file
 * Resolves all @import statements by inlining the imported content
 * 
 * @param {string} inputFile - Path to the main CSS file
 * @param {string} outputFile - Path where bundled CSS should be written
 * @returns {Promise<CSSBundleResult>} Bundle result with statistics
 */
async function bundleCSS(inputFile, outputFile) {
    console.log(`\n${colors.bright}🎨 CSS Bundler - Creating self-contained CSS bundle${colors.reset}\n`);
    
    if (!fs.existsSync(inputFile)) {
        throw new Error(`Input CSS file not found: ${inputFile}`);
    }
    
    const originalContent = fs.readFileSync(inputFile, 'utf8');
    const originalSize = originalContent.length;
    
    console.log(`${colors.blue}📄 Processing:${colors.reset} ${path.basename(inputFile)} (${Math.round(originalSize / 1024)}KB)`);
    
    let bundledCSS = '';
    const processedImports = [];
    const failedImports = [];
    
    // Extract import statements and non-import content
    const importLines = originalContent
        .split('\n')
        .filter(line => line.trim().startsWith('@import'));
    
    const nonImportContent = originalContent
        .split('\n')
        .filter(line => !line.trim().startsWith('@import'))
        .join('\n');
    
    console.log(`\n${colors.cyan}🔗 Processing ${importLines.length} @import statements:${colors.reset}`);
    
    // Process each import
    for (const importLine of importLines) {
        const urlMatch = importLine.match(/url\\(["']?([^"')]+)["']?\\)/);
        if (!urlMatch) {
            console.log(`  ${colors.yellow}⚠${colors.reset} Skipping malformed import: ${importLine.trim()}`);
            continue;
        }
        
        const url = urlMatch[1];
        console.log(`  ${colors.cyan}↓${colors.reset} ${url}`);
        
        try {
            if (url.startsWith('../vendor/') || url.startsWith('vendor/')) {
                // Local vendor file
                const cleanUrl = url.replace(/^\.\.\//, '');
                const localPath = path.join(projectRoot, cleanUrl);
                
                if (fs.existsSync(localPath)) {
                    const importedContent = fs.readFileSync(localPath, 'utf8');
                    const importSize = Math.round(importedContent.length / 1024);
                    
                    bundledCSS += `\\n/* === BUNDLED: ${url} (${importSize}KB) === */\\n`;
                    bundledCSS += importedContent;
                    bundledCSS += `\\n/* === END BUNDLED: ${url} === */\\n\\n`;
                    
                    processedImports.push(url);
                    console.log(`    ${colors.green}✓${colors.reset} Bundled ${path.basename(url)} (${importSize}KB)`);
                } else {
                    failedImports.push(url);
                    console.log(`    ${colors.red}✗${colors.reset} File not found: ${localPath}`);
                }
            } else if (url.startsWith('https://')) {
                // Remote file - Fetch and include
                const response = await fetch(url);
                if (response.ok) {
                    const remoteContent = await response.text();
                    const importSize = Math.round(remoteContent.length / 1024);
                    
                    bundledCSS += `\\n/* === BUNDLED: ${url} (${importSize}KB) === */\\n`;
                    bundledCSS += remoteContent;
                    bundledCSS += `\\n/* === END BUNDLED: ${url} === */\\n\\n`;
                    
                    processedImports.push(url);
                    console.log(`    ${colors.green}✓${colors.reset} Fetched ${url.substring(0, 40)}... (${importSize}KB)`);
                } else {
                    failedImports.push(url);
                    console.log(`    ${colors.red}✗${colors.reset} Failed to fetch: ${response.status} ${response.statusText}`);
                }
            } else {
                failedImports.push(url);
                console.log(`    ${colors.yellow}⚠${colors.reset} Unsupported import type: ${url}`);
            }
        } catch (error) {
            failedImports.push(url);
            console.log(`    ${colors.red}✗${colors.reset} Error processing: ${error.message}`);
        }
    }
    
    // Add the main CSS content (everything that wasn't an import)
    bundledCSS += `\\n/* === MAIN CSS CONTENT === */\\n`;
    bundledCSS += nonImportContent;
    bundledCSS += `\\n/* === END MAIN CSS CONTENT === */\\n`;
    
    // Write the bundled CSS
    fs.writeFileSync(outputFile, bundledCSS);
    const bundledSize = bundledCSS.length;
    
    console.log(`\\n${colors.bright}📊 Bundle Statistics:${colors.reset}`);
    console.log(`  Original size: ${Math.round(originalSize / 1024)}KB`);
    console.log(`  Bundled size:  ${Math.round(bundledSize / 1024)}KB`);
    console.log(`  Imports processed: ${colors.green}${processedImports.length}${colors.reset}`);
    if (failedImports.length > 0) {
        console.log(`  Imports failed: ${colors.red}${failedImports.length}${colors.reset}`);
    }
    console.log(`  Output: ${colors.cyan}${path.basename(outputFile)}${colors.reset}`);
    
    return {
        bundledCSS,
        originalSize,
        bundledSize,
        processedImports,
        failedImports
    };
}

/**
 * Create production CSS bundle for GitHub Pages deployment
 * Creates a self-contained version that doesn't rely on external dependencies
 * 
 * @returns {Promise<void>}
 */
async function createProductionBundle() {
    try {
        const inputFile = path.join(projectRoot, 'docs/design-system.css');
        const outputFile = path.join(projectRoot, 'docs/design-system.bundled.css');
        
        const result = await bundleCSS(inputFile, outputFile);
        
        // Create a backup of the original
        const backupFile = path.join(projectRoot, 'docs/design-system.original.css');
        if (!fs.existsSync(backupFile)) {
            fs.copyFileSync(inputFile, backupFile);
            console.log(`\\n${colors.cyan}💾 Backup created: ${path.basename(backupFile)}${colors.reset}`);
        }
        
        // Success summary
        console.log(`\\n${colors.bright}${colors.green}✨ CSS Bundle Complete!${colors.reset}`);
        console.log(`   ${colors.green}✓${colors.reset} Self-contained CSS ready for GitHub Pages`);
        console.log(`   ${colors.green}✓${colors.reset} All vendor dependencies inlined`);
        console.log(`   ${colors.green}✓${colors.reset} No external @import statements`);
        
        if (result.failedImports.length > 0) {
            console.log(`\\n${colors.yellow}⚠ Warning: ${result.failedImports.length} imports failed:${colors.reset}`);
            result.failedImports.forEach(imp => console.log(`   - ${imp}`));
        }
        
        return result;
        
    } catch (error) {
        console.error(`\\n${colors.red}✗ CSS bundling failed:${colors.reset}`, error.message);
        throw error;
    }
}

/**
 * Replace the original CSS with the bundled version
 * This makes the bundled CSS the primary file for deployment
 * 
 * @returns {Promise<void>}
 */
async function promoteBundle() {
    try {
        const originalFile = path.join(projectRoot, 'docs/design-system.css');
        const bundledFile = path.join(projectRoot, 'docs/design-system.bundled.css');
        const backupFile = path.join(projectRoot, 'docs/design-system.original.css');
        
        if (!fs.existsSync(bundledFile)) {
            throw new Error('Bundled CSS file not found. Run bundling first.');
        }
        
        // Create backup if it doesn't exist
        if (!fs.existsSync(backupFile)) {
            fs.copyFileSync(originalFile, backupFile);
            console.log(`${colors.cyan}💾 Backup created: ${path.basename(backupFile)}${colors.reset}`);
        }
        
        // Replace original with bundled version
        fs.copyFileSync(bundledFile, originalFile);
        console.log(`${colors.green}✓${colors.reset} Bundled CSS promoted to ${path.basename(originalFile)}`);
        
        // Clean up the temporary bundle file
        fs.unlinkSync(bundledFile);
        console.log(`${colors.green}✓${colors.reset} Temporary bundle file cleaned up`);
        
        console.log(`\\n${colors.bright}${colors.green}🚀 CSS Bundle Promoted!${colors.reset}`);
        console.log(`   ${colors.green}✓${colors.reset} design-system.css is now self-contained`);
        console.log(`   ${colors.green}✓${colors.reset} Ready for GitHub Pages deployment`);
        console.log(`   ${colors.cyan}ℹ${colors.reset} Original backed up as design-system.original.css`);
        
    } catch (error) {
        console.error(`\\n${colors.red}✗ Failed to promote bundle:${colors.reset}`, error.message);
        throw error;
    }
}

/**
 * Restore the original CSS file from backup
 * Useful for development when you want to work with the original @import structure
 * 
 * @returns {Promise<void>}
 */
async function restoreOriginal() {
    try {
        const originalFile = path.join(projectRoot, 'docs/design-system.css');
        const backupFile = path.join(projectRoot, 'docs/design-system.original.css');
        
        if (!fs.existsSync(backupFile)) {
            throw new Error('No backup file found. Cannot restore original.');
        }
        
        fs.copyFileSync(backupFile, originalFile);
        console.log(`${colors.green}✓${colors.reset} Original CSS restored from backup`);
        console.log(`${colors.cyan}ℹ${colors.reset} You're now working with the @import version`);
        
    } catch (error) {
        console.error(`\\n${colors.red}✗ Failed to restore original:${colors.reset}`, error.message);
        throw error;
    }
}

// Command-line interface
const command = process.argv[2];

switch (command) {
    case 'bundle':
        createProductionBundle().catch(process.exit);
        break;
        
    case 'promote':
        promoteBundle().catch(process.exit);
        break;
        
    case 'restore':
        restoreOriginal().catch(process.exit);
        break;
        
    case 'full':
        // Complete process: bundle then promote
        createProductionBundle()
            .then(() => promoteBundle())
            .catch(process.exit);
        break;
        
    default:
        console.log(`\\n${colors.bright}CSS Bundler for Token Exporter${colors.reset}`);
        console.log(`\\nUsage: node scripts/css-bundler.js <command>`);
        console.log(`\\nCommands:`);
        console.log(`  ${colors.cyan}bundle${colors.reset}   - Create bundled CSS file`);
        console.log(`  ${colors.cyan}promote${colors.reset}  - Replace main CSS with bundled version`);
        console.log(`  ${colors.cyan}restore${colors.reset}  - Restore original CSS from backup`);
        console.log(`  ${colors.cyan}full${colors.reset}     - Bundle and promote in one step`);
        console.log(`\\nExamples:`);
        console.log(`  npm run css:bundle`);
        console.log(`  node scripts/css-bundler.js full`);
        break;
}