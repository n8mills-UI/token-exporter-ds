#!/usr/bin/env node

/**
 * Master Audit Script - One command to rule them all!
 * Run everything with: npm run audit
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

// All checks organized by category
const checks = {
    essential: [
        { name: 'Build System', cmd: 'npm', args: ['run', 'build'], critical: true },
        { name: 'Code Quality', cmd: 'npm', args: ['run', 'check'], critical: true }
    ],
    analysis: [
        { name: 'CSS Complexity', cmd: 'npx', args: ['wallace', 'docs/design-system.css'], critical: false },
        { name: 'CSS Statistics', cmd: 'npx', args: ['cssstats', 'docs/design-system.css'], critical: false, silent: true },
        { name: 'Specificity Graph', cmd: 'npx', args: ['specificity-graph', 'docs/design-system.css', '-o', 'reports/specificity.html'], critical: false }
    ],
    validation: [
        { name: 'Token Validation', cmd: 'npm', args: ['run', 'check:all'], critical: false }
    ],
    accessibility: [
        { name: 'A11y Check', cmd: 'npx', args: ['pa11y', 'docs/design-system-guide.html'], critical: false }
    ]
};

// Run a single check
function runCheck(check) {
    return new Promise((resolve) => {
        const child = spawn(check.cmd, check.args, {
            cwd: projectRoot,
            shell: true,
            stdio: check.silent ? 'pipe' : 'inherit'
        });
        
        let output = '';
        if (check.silent) {
            child.stdout.on('data', (data) => output += data);
            child.stderr.on('data', (data) => output += data);
        }
        
        child.on('close', (code) => {
            resolve({ 
                passed: code === 0, 
                name: check.name, 
                critical: check.critical,
                output: check.silent ? output : null
            });
        });
    });
}

// Progress bar
function showProgress(current, total, label) {
    const width = 30;
    const percent = current / total;
    const filled = Math.round(width * percent);
    const empty = width - filled;
    
    // Only show progress bar in TTY environments
    if (process.stdout.isTTY) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
            `${colors.cyan}[${colors.reset}` +
            `${'█'.repeat(filled)}${colors.gray}${'░'.repeat(empty)}${colors.reset}` +
            `${colors.cyan}]${colors.reset} ${Math.round(percent * 100)}% ${label}`
        );
    } else {
        console.log(`${colors.cyan}[${current}/${total}]${colors.reset} ${label}`);
    }
}

// Main audit function
async function audit() {
    console.log(`\n${colors.bright}🚀 Running Complete System Audit${colors.reset}`);
    console.log(`${colors.gray}This will run all quality checks and generate reports${colors.reset}\n`);
    
    // Create reports directory if needed
    const reportsDir = path.join(projectRoot, 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
    }
    
    const allChecks = Object.entries(checks).flatMap(([category, categoryChecks]) => 
        categoryChecks.map(check => ({ ...check, category }))
    );
    
    const totalChecks = allChecks.length;
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };
    
    // Run all checks
    for (let i = 0; i < allChecks.length; i++) {
        const check = allChecks[i];
        showProgress(i, totalChecks, `Running ${check.name}...`);
        
        const result = await runCheck(check);
        
        if (result.passed) {
            results.passed.push(result);
        } else if (result.critical) {
            results.failed.push(result);
        } else {
            results.warnings.push(result);
        }
        
        // Save CSS stats
        if (check.name === 'CSS Statistics' && result.output) {
            fs.writeFileSync(
                path.join(reportsDir, 'css-stats.json'),
                result.output
            );
        }
    }
    
    // Clear progress bar
    if (process.stdout.isTTY) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    }
    
    // Show results
    console.log(`\n${colors.gray}${'─'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}Audit Results:${colors.reset}\n`);
    
    // Group results by category
    const categories = {};
    allChecks.forEach((check, i) => {
        if (!categories[check.category]) {
            categories[check.category] = [];
        }
        const isPassed = results.passed.some(r => r.name === check.name);
        const isFailed = results.failed.some(r => r.name === check.name);
        const isWarning = results.warnings.some(r => r.name === check.name);
        
        categories[check.category].push({
            name: check.name,
            status: isPassed ? 'passed' : isFailed ? 'failed' : isWarning ? 'warning' : 'skipped'
        });
    });
    
    // Display by category
    Object.entries(categories).forEach(([category, categoryResults]) => {
        const title = category.charAt(0).toUpperCase() + category.slice(1);
        console.log(`${colors.blue}${title}:${colors.reset}`);
        
        categoryResults.forEach(result => {
            const icon = result.status === 'passed' ? `${colors.green}✓${colors.reset}` :
                        result.status === 'failed' ? `${colors.red}✗${colors.reset}` :
                        result.status === 'warning' ? `${colors.yellow}⚠${colors.reset}` :
                        `${colors.gray}○${colors.reset}`;
            console.log(`  ${icon} ${result.name}`);
        });
        console.log('');
    });
    
    // Summary
    console.log(`${colors.gray}${'─'.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}Summary:${colors.reset}`);
    console.log(`  ${colors.green}✓ Passed:${colors.reset} ${results.passed.length}`);
    console.log(`  ${colors.yellow}⚠ Warnings:${colors.reset} ${results.warnings.length}`);
    console.log(`  ${colors.red}✗ Failed:${colors.reset} ${results.failed.length}`);
    
    // Reports generated
    console.log(`\n${colors.cyan}📊 Reports generated in:${colors.reset} ${reportsDir}`);
    console.log(`  • css-stats.json - Detailed CSS metrics`);
    console.log(`  • specificity.html - Visual specificity graph`);
    
    // Quick actions
    console.log(`\n${colors.bright}Quick Actions:${colors.reset}`);
    if (results.failed.length > 0) {
        console.log(`  ${colors.red}Fix critical issues with:${colors.reset} npm run check`);
    }
    if (results.warnings.length > 0) {
        console.log(`  ${colors.yellow}View warnings in detail${colors.reset}`);
    }
    console.log(`  ${colors.blue}View reports:${colors.reset} open reports/specificity.html`);
    
    // Exit with error if critical checks failed
    if (results.failed.length > 0) {
        console.log(`\n${colors.red}❌ Audit failed - fix critical issues first${colors.reset}\n`);
        process.exit(1);
    } else {
        console.log(`\n${colors.green}✅ Audit complete!${colors.reset}\n`);
    }
}

// Handle arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}Token Exporter Audit Tool${colors.reset}

Usage:
  ${colors.cyan}npm run audit${colors.reset}      Run all checks
  ${colors.cyan}npm run audit -h${colors.reset}   Show this help

This runs:
  • Build & code quality checks
  • CSS complexity analysis  
  • Token validation
  • Accessibility testing
  • Report generation

Reports are saved to: reports/
`);
    process.exit(0);
}

// Run audit
audit().catch(console.error);