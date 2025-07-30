#!/usr/bin/env node

/**
 * Master Check Script for Token Exporter
 * Consolidates all quality checks into a single tool
 * 
 * Usage:
 *   node scripts/check.js        # Run essential checks (quick)
 *   node scripts/check.js --all  # Run all quality checks
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

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

// Configuration
const CONFIG = {
    jsFile: 'src/code.js',
    cssFile: 'docs/design-system.css',
    guideFile: 'docs/design-system-guide.html'
};

/**
 * Run a command and capture output
 */
function runCommand(cmd, args = []) {
    return new Promise((resolve) => {
        const child = spawn(cmd, args, {
            cwd: projectRoot,
            shell: true
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });
    });
}

/**
 * Check Figma compatibility issues
 */
async function checkFigmaCompatibility() {
    console.log(`\n${colors.blue}📋 Figma Compatibility Check${colors.reset}`);
    
    if (!fs.existsSync(path.join(projectRoot, CONFIG.jsFile))) {
        console.log(`  ${colors.red}✗${colors.reset} File not found: ${CONFIG.jsFile}`);
        return false;
    }
    
    const jsContent = fs.readFileSync(path.join(projectRoot, CONFIG.jsFile), 'utf8');
    const issues = [];
    
    // Check for optional chaining
    const optionalChaining = jsContent.match(/[^\/\/\s]\?\./g);
    if (optionalChaining) {
        issues.push({
            type: 'error',
            pattern: 'Optional chaining (?.)',
            count: optionalChaining.length,
            fix: 'Use: obj && obj.prop'
        });
    }
    
    // Check for catch without parameter
    const catchWithoutParam = jsContent.match(/}\s*catch\s*{/g);
    if (catchWithoutParam) {
        issues.push({
            type: 'error',
            pattern: 'Catch without parameter',
            count: catchWithoutParam.length,
            fix: 'Use: } catch (error) {'
        });
    }
    
    // Check for template literals with interpolation
    const templateLiterals = jsContent.match(/`[^`]*\$\{[^}]+\}[^`]*`/g);
    if (templateLiterals) {
        issues.push({
            type: 'error',
            pattern: 'Template literals with ${}',
            count: templateLiterals.length,
            fix: 'Use string concatenation'
        });
    }
    
    if (issues.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} No compatibility issues found`);
        return true;
    } else {
        issues.forEach(issue => {
            console.log(`  ${colors.red}✗${colors.reset} ${issue.pattern} (${issue.count} occurrence${issue.count > 1 ? 's' : ''})`);
            console.log(`    ${colors.gray}Fix: ${issue.fix}${colors.reset}`);
        });
        return false;
    }
}

/**
 * Lint JavaScript with ESLint
 */
async function lintJavaScript() {
    console.log(`\n${colors.blue}🔍 JavaScript Linting${colors.reset}`);
    
    const result = await runCommand('npx', ['eslint', CONFIG.jsFile]);
    
    if (result.code === 0) {
        console.log(`  ${colors.green}✓${colors.reset} No ESLint errors`);
        return true;
    } else {
        console.log(`  ${colors.red}✗${colors.reset} ESLint found issues:`);
        console.log(result.stdout || result.stderr);
        return false;
    }
}

/**
 * Check CSS architecture (no hardcoded values outside :root)
 */
async function checkCSSArchitecture() {
    console.log(`\n${colors.blue}🏗️  CSS Architecture Check${colors.reset}`);
    
    // Read CSS content
    const cssContent = fs.readFileSync(path.join(projectRoot, CONFIG.cssFile), 'utf8');
    
    // Remove :root blocks and theme blocks to check only semantic CSS
    let nonRootContent = cssContent.replace(/:root\s*\{[^}]*\}/gs, '');
    // Also remove theme blocks where raw values are expected
    nonRootContent = nonRootContent.replace(/\[data-theme="[^"]+"\]\s*\{[^}]*\}/gs, '');
    
    const issues = [];
    
    // Check for hardcoded colors
    const hexColors = nonRootContent.match(/#(?:[0-9a-fA-F]{3}){1,2}(?![0-9a-fA-F])/g);
    if (hexColors) {
        issues.push({
            type: 'Hardcoded hex colors',
            count: hexColors.length,
            examples: [...new Set(hexColors)].slice(0, 3)
        });
    }
    
    // Check for hardcoded px values
    const pxValues = nonRootContent.match(/(?:[1-9]\d*|\d*\.[1-9]\d*)px\b/g);
    if (pxValues) {
        const uniquePx = [...new Set(pxValues)];
        // Filter out common exceptions (0px, media queries)
        const filtered = uniquePx.filter(px => {
            if (px === '0px') return false;
            // Check if this px value appears in a media query
            const mediaQueryPattern = new RegExp(`@media[^{]*${px.replace('.', '\\.')}`, 'g');
            return !nonRootContent.match(mediaQueryPattern);
        });
        if (filtered.length > 0) {
            issues.push({
                type: 'Hardcoded px values',
                count: filtered.length,
                examples: filtered.slice(0, 3)
            });
        }
    }
    
    // Check for hardcoded rem values
    const remValues = nonRootContent.match(/(?:[1-9]\d*|\d*\.[1-9]\d*)rem\b/g);
    if (remValues) {
        issues.push({
            type: 'Hardcoded rem values',
            count: remValues.length,
            examples: [...new Set(remValues)].slice(0, 3)
        });
    }
    
    if (issues.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} CSS follows token architecture`);
        return true;
    } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} Found hardcoded values outside :root:`);
        issues.forEach(issue => {
            console.log(`    • ${issue.type}: ${issue.count} instances`);
            console.log(`      Examples: ${issue.examples.join(', ')}`);
        });
        return false;
    }
}

/**
 * Check theme architecture (no component overrides in themes, no duplicates)
 */
async function checkThemeArchitecture() {
    console.log(`\n${colors.blue}🏛️  Theme Architecture Check${colors.reset}`);
    
    // Read CSS content
    const cssContent = fs.readFileSync(path.join(projectRoot, CONFIG.cssFile), 'utf8');
    
    const issues = [];
    
    // Check 1: Component overrides in themes (bad practice)
    const themeComponentPattern = /\[data-theme="[^"]+"\]\s+\.(?:btn|card|badge|modal|table|nav|header|footer|component|section|empty-state|faq|tech|stat|compact|collection|token|profile|hero|impact|community|example|guideline|progress|search|advanced|about|empty)[^{]*\{/g;
    
    const componentOverrides = cssContent.match(themeComponentPattern) || [];
    
    if (componentOverrides.length > 0) {
        // Group by component type
        const componentGroups = {};
        componentOverrides.forEach(match => {
            const componentMatch = match.match(/\.([\w-]+)/);
            if (componentMatch) {
                const component = componentMatch[1];
                if (!componentGroups[component]) {
                    componentGroups[component] = [];
                }
                componentGroups[component].push(match.trim());
            }
        });
        
        console.log(`  ${colors.red}✗${colors.reset} Found ${componentOverrides.length} component-specific theme overrides`);
        console.log(`  ${colors.yellow}⚠${colors.reset} Components should use semantic tokens that adapt to themes`);
        console.log(`\n  ${colors.bright}Anti-pattern found:${colors.reset}`);
        
        // Show examples
        Object.entries(componentGroups).slice(0, 3).forEach(([component, instances]) => {
            console.log(`    • .${component} (${instances.length} overrides)`);
        });
        
        console.log(`\n  ${colors.bright}Recommended pattern:${colors.reset}`);
        console.log(`    1. Define semantic tokens in theme blocks:`);
        console.log(`       ${colors.gray}[data-theme="light"] { --btn-primary-bg: #value; }${colors.reset}`);
        console.log(`    2. Use tokens in component styles:`);
        console.log(`       ${colors.gray}.btn-primary { background: var(--btn-primary-bg); }${colors.reset}`);
        
        issues.push('component-overrides');
    }
    
    // Check 2: Multiple theme sections (critical issue)
    const themes = ['light', 'dark'];
    themes.forEach(theme => {
        const themePattern = new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{`, 'g');
        const matches = cssContent.match(themePattern) || [];
        
        if (matches.length > 1) {
            console.log(`  ${colors.red}✗${colors.reset} CRITICAL: Found ${matches.length} separate [data-theme="${theme}"] sections`);
            console.log(`  ${colors.red}⚠${colors.reset} Multiple theme sections cause CSS specificity conflicts`);
            console.log(`  ${colors.bright}Fix: Consolidate all ${theme} theme tokens into ONE section${colors.reset}`);
            
            // Find line numbers for debugging
            const lines = cssContent.split('\n');
            const themeLines = [];
            lines.forEach((line, index) => {
                if (line.includes(`[data-theme="${theme}"]`) && line.includes('{')) {
                    themeLines.push(index + 1);
                }
            });
            
            if (themeLines.length > 0) {
                console.log(`  ${colors.gray}Found at lines: ${themeLines.join(', ')}${colors.reset}`);
            }
            
            issues.push(`duplicate-${theme}-theme`);
        }
    });
    
    if (issues.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} No component-specific theme overrides found`);
        console.log(`  ${colors.green}✓${colors.reset} No duplicate theme sections found`);
        console.log(`  ${colors.green}✓${colors.reset} Theme uses token-only approach (Open Props pattern)`);
        return true;
    }
    
    return false;
}

/**
 * Validate design tokens (comprehensive)
 */
async function validateTokens() {
    console.log(`\n${colors.blue}🎨 Token Validation${colors.reset}`);
    
    // Read CSS content
    const cssContent = fs.readFileSync(path.join(projectRoot, CONFIG.cssFile), 'utf8');
    
    const issues = [];
    
    // Parse tokens with context awareness
    const tokenDefinitions = new Map();
    const tokenReferences = new Map();
    
    // Extract tokens from different contexts
    const contexts = [
        { pattern: /:root\s*\{([^}]*)\}/gs, name: 'root' },
        { pattern: /\[data-theme="light"\]\s*\{([^}]*)\}/gs, name: 'light' }
    ];
    
    contexts.forEach(({ pattern, name }) => {
        const blocks = cssContent.match(pattern) || [];
        blocks.forEach(block => {
            const tokenMatches = [...block.matchAll(/--([a-zA-Z0-9-]+):\s*([^;]+);/g)];
            tokenMatches.forEach(match => {
                const tokenName = match[1];
                const tokenValue = match[2].trim();
                
                if (!tokenDefinitions.has(tokenName)) {
                    tokenDefinitions.set(tokenName, []);
                }
                tokenDefinitions.get(tokenName).push({
                    value: tokenValue,
                    context: name,
                    line: cssContent.substring(0, cssContent.indexOf(match[0])).split('\n').length
                });
            });
        });
    });
    
    // Find all token references
    const refMatches = [...cssContent.matchAll(/var\(--([a-zA-Z0-9-]+)(?:,\s*([^)]+))?\)/g)];
    refMatches.forEach(match => {
        const tokenName = match[1];
        const fallback = match[2];
        const line = cssContent.substring(0, match.index).split('\n').length;
        
        if (!tokenReferences.has(tokenName)) {
            tokenReferences.set(tokenName, []);
        }
        tokenReferences.get(tokenName).push({ line, fallback });
    });
    
    // Check 1: Undefined tokens
    const undefinedCount = 0;
    tokenReferences.forEach((refs, tokenName) => {
        if (!tokenDefinitions.has(tokenName)) {
            issues.push({
                type: 'error',
                message: `Undefined token: --${tokenName}`,
                count: refs.length,
                lines: refs.slice(0, 3).map(r => r.line)
            });
        }
    });
    
    // Check 2: Unused tokens (excluding meta tokens)
    const unusedCount = 0;
    tokenDefinitions.forEach((defs, tokenName) => {
        if (!tokenReferences.has(tokenName) && 
            !tokenName.includes('version') && 
            !tokenName.includes('updated') && 
            !tokenName.includes('stage') &&
            !tokenName.includes('svg')) {
            issues.push({
                type: 'warning',
                message: `Unused token: --${tokenName}`,
                count: defs.length,
                contexts: [...new Set(defs.map(d => d.context))]
            });
        }
    });
    
    // Check 3: Duplicate definitions in same context
    tokenDefinitions.forEach((defs, tokenName) => {
        const contextGroups = {};
        defs.forEach(def => {
            if (!contextGroups[def.context]) {
                contextGroups[def.context] = [];
            }
            contextGroups[def.context].push(def);
        });
        
        Object.entries(contextGroups).forEach(([context, contextDefs]) => {
            if (contextDefs.length > 1) {
                issues.push({
                    type: 'warning',
                    message: `Duplicate definition: --${tokenName} in ${context}`,
                    count: contextDefs.length,
                    lines: contextDefs.map(d => d.line)
                });
            }
        });
    });
    
    // Check 4: Light theme completeness
    const semanticPrefixes = ['surface-', 'color-background-', 'color-text-', 'color-border-', 'shadow-', 'focus-ring'];
    const rootTokens = new Set();
    const lightTokens = new Set();
    
    tokenDefinitions.forEach((defs, tokenName) => {
        defs.forEach(def => {
            if (def.context === 'root') rootTokens.add(tokenName);
            if (def.context === 'light') lightTokens.add(tokenName);
        });
    });
    
    let missingLightOverrides = 0;
    rootTokens.forEach(tokenName => {
        if (semanticPrefixes.some(prefix => tokenName.startsWith(prefix)) && !lightTokens.has(tokenName)) {
            missingLightOverrides++;
        }
    });
    
    // Summary
    console.log(`  • Defined tokens: ${tokenDefinitions.size}`);
    console.log(`  • Token references: ${tokenReferences.size}`);
    console.log(`  • Light theme overrides: ${lightTokens.size}`);
    
    const errors = issues.filter(i => i.type === 'error');
    const warnings = issues.filter(i => i.type === 'warning');
    
    if (errors.length > 0) {
        console.log(`  ${colors.red}✗ ${errors.length} errors:${colors.reset}`);
        errors.slice(0, 3).forEach(issue => {
            console.log(`    • ${issue.message} (${issue.count} occurrences)`);
        });
        if (errors.length > 3) {
            console.log(`    ... and ${errors.length - 3} more errors`);
        }
    }
    
    if (warnings.length > 0) {
        console.log(`  ${colors.yellow}⚠ ${warnings.length} warnings:${colors.reset}`);
        warnings.slice(0, 3).forEach(issue => {
            console.log(`    • ${issue.message}`);
        });
        if (warnings.length > 3) {
            console.log(`    ... and ${warnings.length - 3} more warnings`);
        }
    }
    
    if (missingLightOverrides > 0) {
        console.log(`  ${colors.blue}ℹ ${missingLightOverrides} semantic tokens without light theme overrides${colors.reset}`);
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} All tokens validated successfully`);
        return true;
    }
    
    return errors.length === 0; // Only fail on errors, not warnings
}

/**
 * Check documentation completeness (quick version)
 */
async function checkDocumentation() {
    console.log(`\n${colors.blue}📚 Documentation Check${colors.reset}`);
    
    const cssContent = fs.readFileSync(path.join(projectRoot, CONFIG.cssFile), 'utf8');
    const guideContent = fs.readFileSync(path.join(projectRoot, CONFIG.guideFile), 'utf8');
    
    // Find major component classes
    const componentClasses = cssContent.match(/\.(?:btn|card|badge|input|modal|table|nav|header|footer)\b/g) || [];
    const uniqueComponents = [...new Set(componentClasses.map(c => c.slice(1)))];
    
    // Check if documented
    const undocumented = uniqueComponents.filter(component => {
        const sectionId = component + 's'; // e.g., btn -> btns, card -> cards
        return !guideContent.includes(`id="${sectionId}"`) && !guideContent.includes(`id="${component}"`);
    });
    
    if (undocumented.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} All major components documented`);
        return true;
    } else {
        console.log(`  ${colors.yellow}⚠${colors.reset} Undocumented components: ${undocumented.join(', ')}`);
        return false;
    }
}

/**
 * Check for duplicate values (full mode only)
 */
async function checkDuplicates() {
    console.log(`\n${colors.blue}🔄 Duplicate Analysis${colors.reset}`);
    
    const cssContent = fs.readFileSync(path.join(projectRoot, CONFIG.cssFile), 'utf8');
    const nonRootContent = cssContent.replace(/:root\s*\{[^}]*\}/gs, '');
    
    // Find all property values
    const valueMap = new Map();
    const propertyValues = nonRootContent.match(/:\s*([^;]+);/g) || [];
    
    propertyValues.forEach(match => {
        const value = match.slice(1, -1).trim();
        if (value && !value.includes('var(')) {
            valueMap.set(value, (valueMap.get(value) || 0) + 1);
        }
    });
    
    // Find high-frequency duplicates
    const duplicates = [...valueMap.entries()]
        .filter(([_, count]) => count > 3)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    if (duplicates.length > 0) {
        console.log(`  ${colors.yellow}⚠${colors.reset} High-frequency values that could be tokenized:`);
        duplicates.forEach(([value, count]) => {
            console.log(`    • "${value}" appears ${count} times`);
        });
    } else {
        console.log(`  ${colors.green}✓${colors.reset} No significant duplicates found`);
    }
    
    return true;
}

/**
 * Check for component tokens using direct color references
 */
async function checkSemanticTokenUsage() {
    console.log(`\n${colors.blue}🎯 Semantic Token Usage${colors.reset}`);
    
    // Read CSS content
    const cssContent = fs.readFileSync(path.join(projectRoot, CONFIG.cssFile), 'utf8');
    
    // Remove all token definitions (they're allowed to reference primitives)
    let componentCSS = cssContent.replace(/--[\w-]+:\s*[^;]+;/g, '');
    
    const ANTI_PATTERNS = [
        {
            // Check for gray references in actual CSS properties
            pattern: /(?:color|background|background-color|border-color|fill|stroke):\s*var\(--gray-(?:warm|cool)-\d+\)/g,
            type: 'Direct grey reference in CSS property',
            fix: 'Use semantic tokens like var(--color-text-secondary)'
        },
        {
            // Check for hex colors in CSS properties
            pattern: /(?:color|background|background-color|border-color|fill|stroke):\s*#[0-9a-fA-F]{3,6}\b/g,
            type: 'Hardcoded hex color in CSS property',
            fix: 'Use color tokens'
        }
    ];
    
    const issues = [];
    const lines = cssContent.split('\n');
    
    ANTI_PATTERNS.forEach(({ pattern, type, fix }) => {
        let match;
        const regex = new RegExp(pattern);
        
        while ((match = regex.exec(componentCSS)) !== null) {
            // Find line number in original content
            const position = cssContent.indexOf(match[0]);
            if (position === -1) continue;
            
            let lineNumber = 0;
            let charCount = 0;
            
            for (let i = 0; i < lines.length; i++) {
                charCount += lines[i].length + 1;
                if (charCount > position) {
                    lineNumber = i + 1;
                    break;
                }
            }
            
            issues.push({
                type,
                line: lineNumber,
                value: match[0],
                fix
            });
        }
    });
    
    if (issues.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} All component tokens use semantic tokens`);
        return true;
    } else {
        console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} direct color references:`);
        
        // Show first 5 examples
        issues.slice(0, 5).forEach(issue => {
            console.log(`    Line ${issue.line}: ${issue.value}`);
            console.log(`      ${colors.gray}Fix: ${issue.fix}${colors.reset}`);
        });
        
        if (issues.length > 5) {
            console.log(`    ... and ${issues.length - 5} more`);
        }
        
        return false;
    }
}

/**
 * Main check function
 */
async function check(options = {}) {
    const isFullMode = options.all || false;
    
    console.log(`\n${colors.bright}🔍 Running ${isFullMode ? 'Full' : 'Essential'} Quality Checks${colors.reset}`);
    console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}`);
    
    const startTime = Date.now();
    const results = [];
    
    // Essential checks (always run)
    results.push({
        name: 'Figma Compatibility',
        passed: await checkFigmaCompatibility()
    });
    
    results.push({
        name: 'JavaScript Linting',
        passed: await lintJavaScript()
    });
    
    results.push({
        name: 'CSS Architecture',
        passed: await checkCSSArchitecture()
    });
    
    results.push({
        name: 'Theme Architecture',
        passed: await checkThemeArchitecture()
    });
    
    results.push({
        name: 'Semantic Token Usage',
        passed: await checkSemanticTokenUsage()
    });
    
    // Additional checks in full mode
    if (isFullMode) {
        results.push({
            name: 'Token Validation',
            passed: await validateTokens()
        });
        
        results.push({
            name: 'Documentation',
            passed: await checkDocumentation()
        });
        
        results.push({
            name: 'Duplicate Analysis',
            passed: await checkDuplicates()
        });
    }
    
    // Summary
    console.log(`\n${colors.gray}${'─'.repeat(50)}${colors.reset}`);
    console.log(`${colors.bright}Summary:${colors.reset}`);
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    results.forEach(result => {
        const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        console.log(`  ${icon} ${result.name}`);
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`\n${colors.bright}Results: ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.gray}${failed} failed${colors.reset}`);
    console.log(`${colors.gray}Time: ${elapsed}ms${colors.reset}\n`);
    
    // Exit with error code if any critical checks failed
    if (failed > 0 && !isFullMode) {
        process.exit(1);
    }
}

// Parse arguments
const args = process.argv.slice(2);
const options = {
    all: args.includes('--all') || args.includes('-a')
};

// Run checks
check(options).catch(console.error);