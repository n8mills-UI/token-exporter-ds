#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

console.log(`\n${COLORS.bold}🔍 CSS Class Validator${COLORS.reset}`);
console.log(`${COLORS.blue}Checking for undefined CSS classes...${COLORS.reset}\n`);

// Read CSS file and extract all defined classes
function extractCSSClasses(cssContent) {
    const classes = new Set();
    
    // Match class selectors (handles .class, .class:hover, .class.other, etc.)
    const classRegex = /\.([a-zA-Z0-9_-]+)(?=[^{]*{)/g;
    let match;
    
    while ((match = classRegex.exec(cssContent)) !== null) {
        classes.add(match[1]);
    }
    
    return classes;
}

// Extract classes used in HTML files
function extractHTMLClasses(htmlContent) {
    const usedClasses = new Map(); // class -> locations
    
    // Match class attributes in HTML
    const classAttrRegex = /class\s*=\s*["']([^"']+)["']/g;
    let match;
    
    while ((match = classAttrRegex.exec(htmlContent)) !== null) {
        const classString = match[1];
        const classes = classString.split(/\s+/).filter(c => c.length > 0);
        
        classes.forEach(className => {
            if (!usedClasses.has(className)) {
                usedClasses.set(className, []);
            }
            // Store line number for reporting
            const lineNum = htmlContent.substring(0, match.index).split('\n').length;
            usedClasses.get(className).push(lineNum);
        });
    }
    
    return usedClasses;
}

// Main validation
async function validateClasses() {
    let hasErrors = false;
    const issues = [];
    
    try {
        // Read main CSS file
        const cssPath = path.join(__dirname, '../docs/design-system.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        const definedClasses = extractCSSClasses(cssContent);
        
        console.log(`Found ${COLORS.green}${definedClasses.size}${COLORS.reset} CSS classes defined\n`);
        
        // Check all HTML templates and components
        const htmlPatterns = [
            'src/**/*.html',
            'docs/**/*.template.html'
        ];
        
        for (const pattern of htmlPatterns) {
            const files = glob.sync(pattern, { cwd: path.dirname(__dirname) });
            
            for (const file of files) {
                const filePath = path.join(path.dirname(__dirname), file);
                const content = fs.readFileSync(filePath, 'utf8');
                const usedClasses = extractHTMLClasses(content);
                
                const fileIssues = [];
                
                // Check each used class
                for (const [className, locations] of usedClasses) {
                    // Skip data attributes, IDs, and JS hooks
                    if (className.startsWith('data-') || 
                        className.startsWith('js-') ||
                        className === 'icon-rendered' || // Dynamic class
                        className === 'state-hidden' || // JS state classes
                        className === 'active' ||
                        className === 'selected' ||
                        className === 'disabled' ||
                        className === 'force-hover') {
                        continue;
                    }
                    
                    // Check if class is defined
                    if (!definedClasses.has(className)) {
                        fileIssues.push({
                            className,
                            lines: locations
                        });
                        hasErrors = true;
                    }
                }
                
                if (fileIssues.length > 0) {
                    issues.push({
                        file,
                        issues: fileIssues
                    });
                }
            }
        }
        
        // Report results
        if (hasErrors) {
            console.log(`${COLORS.red}✗ Found undefined CSS classes:${COLORS.reset}\n`);
            
            issues.forEach(({ file, issues }) => {
                console.log(`  ${COLORS.yellow}${file}${COLORS.reset}`);
                issues.forEach(({ className, lines }) => {
                    console.log(`    ${COLORS.red}✗${COLORS.reset} .${className} (lines: ${lines.join(', ')})`);
                });
                console.log();
            });
            
            console.log(`${COLORS.bold}Recommendation:${COLORS.reset}`);
            console.log(`  1. Define missing classes in design-system.css`);
            console.log(`  2. Or update HTML to use existing classes`);
            console.log(`  3. Add this check to your build process\n`);
            
            process.exit(1);
        } else {
            console.log(`${COLORS.green}✓ All CSS classes are properly defined!${COLORS.reset}\n`);
        }
        
    } catch (error) {
        console.error(`${COLORS.red}Error:${COLORS.reset}`, error.message);
        process.exit(1);
    }
}

// Run validation
validateClasses();