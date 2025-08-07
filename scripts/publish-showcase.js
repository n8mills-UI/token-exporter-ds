#!/usr/bin/env node

/**
 * Showcase Publisher for Token Exporter
 * Automates the complete process of preparing and copying files to the showcase repository
 * 
 * @fileoverview Handles the complete workflow for publishing to token-exporter-showcase:
 * 1. Creates self-contained CSS bundle
 * 2. Builds the plugin with bundled assets
 * 3. Copies documentation to showcase repository
 * 4. Removes obsolete vendor folder
 * 5. Validates the showcase setup
 * 
 * @author Nate Mills <nate@natemills.me>
 * @version 4.1.0 - FIXED: No longer overwrites showcase README.md
 * 
 * Usage:
 *   node scripts/publish-showcase.js [--dry-run] [--showcase-path=/path/to/repo]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

/**
 * @typedef {Object} ShowcaseConfig
 * @property {string} sourcePath - Path to this repository
 * @property {string} showcasePath - Path to showcase repository
 * @property {boolean} dryRun - Whether to perform a dry run
 * @property {string[]} filesToCopy - Files to copy to showcase
 * @property {string[]} dirsToRemove - Directories to remove from showcase
 */

// ANSI colors for output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

/**
 * Parse command line arguments
 * @returns {ShowcaseConfig} Configuration object
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        sourcePath: projectRoot,
        showcasePath: null,
        dryRun: args.includes('--dry-run'),
        filesToCopy: [
            'docs/design-system.css',
            'docs/design-system-guide.html',
            'docs/index.html',
            'src/ui.html',
            'src/code.js',
            'manifest.json',
            'package.json'
            // README.md REMOVED - showcase has its own README
        ],
        dirsToRemove: [
            'vendor',
            'node_modules'
        ]
    };
    
    // Check for custom showcase path
    const showcasePathArg = args.find(arg => arg.startsWith('--showcase-path='));
    if (showcasePathArg) {
        config.showcasePath = showcasePathArg.split('=')[1];
    } else {
        // Try to detect showcase repository
        const possiblePaths = [
            path.join(projectRoot, '..', 'token-exporter-showcase'),
            path.join(projectRoot, '..', 'token-exporter-showcase.git'),
            path.join(process.env.HOME || '', 'token-exporter-showcase'),
            path.join(process.cwd(), '..', 'token-exporter-showcase')
        ];
        
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath) && fs.existsSync(path.join(possiblePath, '.git'))) {
                config.showcasePath = possiblePath;
                break;
            }
        }
    }
    
    return config;
}

/**
 * Validate the configuration and paths
 * @param {ShowcaseConfig} config - Configuration to validate
 * @returns {boolean} True if configuration is valid
 */
function validateConfig(config) {
    console.log(`\n${colors.bright}🔍 Validating configuration...${colors.reset}`);
    
    if (!fs.existsSync(config.sourcePath)) {
        console.error(`${colors.red}✗${colors.reset} Source path not found: ${config.sourcePath}`);
        return false;
    }
    
    if (!config.showcasePath) {
        console.error(`${colors.red}✗${colors.reset} Showcase repository not found.`);
        console.error(`   Specify with: --showcase-path=/path/to/token-exporter-showcase`);
        console.error(`   Or ensure it exists at: ../token-exporter-showcase`);
        return false;
    }
    
    if (!fs.existsSync(config.showcasePath)) {
        console.error(`${colors.red}✗${colors.reset} Showcase path not found: ${config.showcasePath}`);
        return false;
    }
    
    if (!fs.existsSync(path.join(config.showcasePath, '.git'))) {
        console.error(`${colors.red}✗${colors.reset} Showcase path is not a git repository: ${config.showcasePath}`);
        return false;
    }
    
    console.log(`${colors.green}✓${colors.reset} Source: ${config.sourcePath}`);
    console.log(`${colors.green}✓${colors.reset} Showcase: ${config.showcasePath}`);
    if (config.dryRun) {
        console.log(`${colors.yellow}ℹ${colors.reset} Dry run mode enabled`);
    }
    
    return true;
}

/**
 * Prepare the build by creating bundled CSS and building the plugin
 * @param {ShowcaseConfig} config - Configuration object
 * @returns {Promise<void>}
 */
async function prepareBuild(config) {
    console.log(`\n${colors.bright}🔧 Preparing build...${colors.reset}`);
    
    try {
        if (config.dryRun) {
            console.log(`${colors.yellow}[DRY RUN]${colors.reset} Would create CSS bundle and build plugin`);
            return;
        }
        
        // Step 1: Create CSS bundle
        console.log(`${colors.blue}[1/2]${colors.reset} Creating CSS bundle...`);
        const { stdout: cssOutput } = await execAsync('node scripts/css-bundler.js full', { 
            cwd: config.sourcePath 
        });
        console.log(`${colors.green}✓${colors.reset} CSS bundle created`);
        
        // Step 2: Build the plugin
        console.log(`${colors.blue}[2/2]${colors.reset} Building plugin...`);
        const { stdout: buildOutput } = await execAsync('node scripts/build.js', { 
            cwd: config.sourcePath 
        });
        console.log(`${colors.green}✓${colors.reset} Plugin built successfully`);
        
    } catch (error) {
        console.error(`${colors.red}✗${colors.reset} Build preparation failed:`, error.message);
        throw error;
    }
}

/**
 * Copy files to the showcase repository
 * @param {ShowcaseConfig} config - Configuration object
 * @returns {Promise<void>}
 */
async function copyFiles(config) {
    console.log(`\n${colors.bright}📁 Copying files to showcase repository...${colors.reset}`);
    
    let copiedCount = 0;
    let skippedCount = 0;
    
    for (const filePath of config.filesToCopy) {
        const sourcePath = path.join(config.sourcePath, filePath);
        const targetPath = path.join(config.showcasePath, filePath);
        
        try {
            if (!fs.existsSync(sourcePath)) {
                console.log(`${colors.yellow}⚠${colors.reset} Skipping missing file: ${filePath}`);
                skippedCount++;
                continue;
            }
            
            if (config.dryRun) {
                console.log(`${colors.yellow}[DRY RUN]${colors.reset} Would copy: ${filePath}`);
                continue;
            }
            
            // Ensure target directory exists
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }
            
            // Copy file
            fs.copyFileSync(sourcePath, targetPath);
            
            const stats = fs.statSync(sourcePath);
            const sizeKB = Math.round(stats.size / 1024);
            console.log(`${colors.green}✓${colors.reset} ${filePath} (${sizeKB}KB)`);
            copiedCount++;
            
        } catch (error) {
            console.error(`${colors.red}✗${colors.reset} Failed to copy ${filePath}:`, error.message);
            throw error;
        }
    }
    
    console.log(`\n${colors.cyan}📊 Copy Summary:${colors.reset}`);
    console.log(`  Files copied: ${colors.green}${copiedCount}${colors.reset}`);
    if (skippedCount > 0) {
        console.log(`  Files skipped: ${colors.yellow}${skippedCount}${colors.reset}`);
    }
    console.log(`  ${colors.cyan}ℹ${colors.reset} README.md preserved in showcase (not overwritten)`);
}

/**
 * Remove obsolete directories from showcase repository
 * @param {ShowcaseConfig} config - Configuration object
 * @returns {Promise<void>}
 */
async function cleanupObsolete(config) {
    console.log(`\n${colors.bright}🧹 Cleaning up obsolete directories...${colors.reset}`);
    
    let removedCount = 0;
    
    for (const dirName of config.dirsToRemove) {
        const dirPath = path.join(config.showcasePath, dirName);
        
        try {
            if (!fs.existsSync(dirPath)) {
                console.log(`${colors.cyan}ℹ${colors.reset} Already clean: ${dirName}`);
                continue;
            }
            
            if (config.dryRun) {
                console.log(`${colors.yellow}[DRY RUN]${colors.reset} Would remove: ${dirName}`);
                continue;
            }
            
            // Remove directory recursively
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`${colors.green}✓${colors.reset} Removed: ${dirName}`);
            removedCount++;
            
        } catch (error) {
            console.error(`${colors.red}✗${colors.reset} Failed to remove ${dirName}:`, error.message);
            // Don't throw - this is cleanup, not critical
        }
    }
    
    if (removedCount > 0) {
        console.log(`\n${colors.green}✓${colors.reset} Cleaned up ${removedCount} obsolete directories`);
    } else {
        console.log(`\n${colors.cyan}ℹ${colors.reset} No cleanup needed - showcase repository is clean`);
    }
}

/**
 * Validate the showcase repository after publishing
 * @param {ShowcaseConfig} config - Configuration object
 * @returns {Promise<boolean>} True if validation passes
 */
async function validateShowcase(config) {
    console.log(`\n${colors.bright}✅ Validating showcase repository...${colors.reset}`);
    
    const requiredFiles = [
        'docs/design-system.css',
        'docs/design-system-guide.html',
        'src/ui.html',
        'src/code.js',
        'manifest.json'
    ];
    
    let allValid = true;
    
    for (const filePath of requiredFiles) {
        const fullPath = path.join(config.showcasePath, filePath);
        
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            const sizeKB = Math.round(stats.size / 1024);
            console.log(`${colors.green}✓${colors.reset} ${filePath} (${sizeKB}KB)`);
            
            // Special validation for bundled CSS
            if (filePath === 'docs/design-system.css') {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes('@import')) {
                    console.log(`${colors.red}✗${colors.reset} CSS still contains @import statements!`);
                    console.log(`${colors.yellow}  Run: npm run css:deploy${colors.reset}`);
                    allValid = false;
                } else if (content.includes('/* === BUNDLED:')) {
                    const bundleCount = (content.match(/\/\* === BUNDLED:/g) || []).length;
                    console.log(`${colors.cyan}  ℹ CSS is properly bundled (${bundleCount} imports resolved)`);
                } else {
                    console.log(`${colors.yellow}  ⚠ CSS may not be bundled (no bundle markers found)${colors.reset}`);
                }
            }
        } else {
            console.log(`${colors.red}✗${colors.reset} Missing: ${filePath}`);
            allValid = false;
        }
    }
    
    // Check that obsolete directories are removed
    for (const dirName of config.dirsToRemove) {
        const dirPath = path.join(config.showcasePath, dirName);
        if (fs.existsSync(dirPath)) {
            console.log(`${colors.yellow}⚠${colors.reset} Obsolete directory still exists: ${dirName}`);
            // Not critical, don't fail validation
        }
    }
    
    return allValid;
}

/**
 * Get git status of the showcase repository
 * @param {ShowcaseConfig} config - Configuration object
 * @returns {Promise<void>}
 */
async function checkGitStatus(config) {
    try {
        const { stdout } = await execAsync('git status --porcelain', { 
            cwd: config.showcasePath 
        });
        
        if (stdout.trim()) {
            console.log(`\n${colors.cyan}📋 Git Status (showcase repository):${colors.reset}`);
            const lines = stdout.trim().split('\n');
            lines.forEach(line => {
                const status = line.substring(0, 2);
                const file = line.substring(3);
                let statusColor = colors.cyan;
                if (status.includes('M')) statusColor = colors.yellow;
                if (status.includes('A')) statusColor = colors.green;
                if (status.includes('D')) statusColor = colors.red;
                console.log(`  ${statusColor}${status}${colors.reset} ${file}`);
            });
            
            console.log(`\n${colors.magenta}💡 Next steps:${colors.reset}`);
            console.log(`   cd ${config.showcasePath}`);
            console.log(`   git add .`);
            console.log(`   git commit -m "Update from token-exporter-ds"`);
            console.log(`   git push origin main`);
        } else {
            console.log(`\n${colors.green}✓${colors.reset} Showcase repository is up to date`);
        }
    } catch (error) {
        console.log(`\n${colors.yellow}⚠${colors.reset} Could not check git status: ${error.message}`);
    }
}

/**
 * Main publication function
 * @returns {Promise<void>}
 */
async function publishShowcase() {
    console.log(`\n${colors.bright}${colors.magenta}🚀 Token Exporter Showcase Publisher${colors.reset}`);
    console.log(`${colors.cyan}${'═'.repeat(50)}${colors.reset}`);
    
    const config = parseArgs();
    
    // Validate configuration
    if (!validateConfig(config)) {
        process.exit(1);
    }
    
    const startTime = Date.now();
    
    try {
        // Step 1: Prepare build
        await prepareBuild(config);
        
        // Step 2: Copy files
        await copyFiles(config);
        
        // Step 3: Clean up obsolete directories
        await cleanupObsolete(config);
        
        // Step 4: Validate showcase
        const isValid = await validateShowcase(config);
        
        // Step 5: Check git status
        await checkGitStatus(config);
        
        const elapsed = Date.now() - startTime;
        
        console.log(`\n${colors.bright}${colors.green}✨ Showcase Publication Complete!${colors.reset}`);
        console.log(`${colors.cyan}${'═'.repeat(50)}${colors.reset}`);
        console.log(`   Duration: ${elapsed}ms`);
        console.log(`   Target: ${config.showcasePath}`);
        
        if (config.dryRun) {
            console.log(`\n${colors.yellow}🔍 Dry run completed - no files were actually modified${colors.reset}`);
        } else if (isValid) {
            console.log(`\n${colors.green}🎯 Showcase repository is ready for deployment!${colors.reset}`);
        } else {
            console.log(`\n${colors.yellow}⚠ Showcase repository has validation issues${colors.reset}`);
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`\n${colors.red}💥 Publication failed:${colors.reset}`, error.message);
        console.error(`\nStack trace:`, error.stack);
        process.exit(1);
    }
}

// Help text
function showHelp() {
    console.log(`\n${colors.bright}Token Exporter Showcase Publisher${colors.reset}`);
    console.log(`\nUsage: node scripts/publish-showcase.js [options]`);
    console.log(`\nOptions:`);
    console.log(`  ${colors.cyan}--dry-run${colors.reset}                    Preview what would be done`);
    console.log(`  ${colors.cyan}--showcase-path=PATH${colors.reset}         Specify showcase repository path`);
    console.log(`\nExamples:`);
    console.log(`  npm run showcase:publish`);
    console.log(`  node scripts/publish-showcase.js --dry-run`);
    console.log(`  node scripts/publish-showcase.js --showcase-path=../token-exporter-showcase`);
    console.log(`\nWhat this script does:`);
    console.log(`  1. Creates self-contained CSS bundle (resolves @import statements)`);
    console.log(`  2. Builds the Figma plugin with bundled assets`);
    console.log(`  3. Copies all necessary files to showcase repository`);
    console.log(`  4. Preserves showcase README.md (does NOT overwrite)`);
    console.log(`  5. Removes obsolete directories (vendor, node_modules)`);
    console.log(`  6. Validates the showcase setup`);
    console.log(`  7. Shows git status and next steps`);
}

// Command line interface
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
}

// Run the publisher
publishShowcase().catch(console.error);