#!/usr/bin/env node

/**
 * Publish to Token Exporter Showcase
 * Copies only the docs folder to the public showcase repository
 * Preserves the showcase's own README
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const showcaseRoot = path.join(projectRoot, '..', 'token-exporter-showcase');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

console.log(`\n${colors.bright}📤 Publishing to Token Exporter Showcase...${colors.reset}\n`);

// Check if showcase repo exists
if (!fs.existsSync(showcaseRoot)) {
    console.error(`${colors.red}✗ Showcase repository not found at: ${showcaseRoot}${colors.reset}`);
    console.error(`${colors.yellow}  Please clone the showcase repo next to this one${colors.reset}`);
    process.exit(1);
}

// Files to copy (ONLY docs folder!)
const filesToCopy = [
    { src: 'docs', dest: 'docs' }
];

// Copy files
filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(projectRoot, src);
    const destPath = path.join(showcaseRoot, dest);
    
    if (!fs.existsSync(srcPath)) {
        console.warn(`${colors.yellow}⚠ Source not found: ${src}${colors.reset}`);
        return;
    }
    
    // Remove existing destination if it exists
    if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true, force: true });
    }
    
    // Copy recursively
    fs.cpSync(srcPath, destPath, { recursive: true });
    console.log(`${colors.green}✓${colors.reset} Copied ${src}`);
});

// Git operations in showcase repo
console.log(`\n${colors.blue}📝 Committing changes...${colors.reset}`);
try {
    process.chdir(showcaseRoot);
    
    // Check if there are changes
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (!status) {
        console.log(`${colors.yellow}No changes to publish${colors.reset}`);
        process.exit(0);
    }
    
    // Add and commit
    execSync('git add -A');
    const date = new Date().toISOString().split('T')[0];
    execSync(`git commit -m "Update showcase - ${date}"`);
    
    console.log(`${colors.green}✓ Changes committed${colors.reset}`);
    console.log(`\n${colors.bright}${colors.green}✨ Showcase updated successfully!${colors.reset}`);
    console.log(`${colors.cyan}Run 'cd ../token-exporter-showcase && git push' to deploy${colors.reset}\n`);
    
} catch (error) {
    console.error(`${colors.red}✗ Git operation failed: ${error.message}${colors.reset}`);
    process.exit(1);
}