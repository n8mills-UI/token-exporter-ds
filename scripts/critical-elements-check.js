#!/usr/bin/env node

/**
 * Critical Elements Check Script for Token Exporter
 * Validates essential UI components are working properly
 * 
 * Focuses on:
 * - Icon visibility and rendering
 * - Theme switching functionality  
 * - Dangerous CSS selectors that could affect plugin UI
 * - JavaScript initialization patterns
 */

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

// Configuration
const CONFIG = {
    projectRoot: projectRoot,
    cssFile: 'docs/design-system.css',
    iconSystemFile: 'src/components/icons/_icon-system.html',
    uiTemplateFile: 'src/ui.template.html',
    guideTemplateFile: 'docs/design-system-guide.template.html',
    builtGuideFile: 'docs/design-system-guide.html'
};

/**
 * Check icon system integrity
 */
async function checkIconSystem() {
    console.log(`\n${colors.blue}🎭 Icon System Check${colors.reset}`);
    
    const issues = [];
    
    try {
        // Check icon system file exists
        const iconSystemPath = path.join(projectRoot, CONFIG.iconSystemFile);
        if (!fs.existsSync(iconSystemPath)) {
            issues.push('Icon system file missing: ' + CONFIG.iconSystemFile);
            return false;
        }
        
        const iconSystemContent = fs.readFileSync(iconSystemPath, 'utf8');
        
        // Check for required icon system components (actual implementation)
        const requiredComponents = [
            'window.renderPluginIcons',
            'window.Icons',
            'data-icon',
            'window.renderIcons'
        ];
        
        requiredComponents.forEach(component => {
            if (!iconSystemContent.includes(component)) {
                issues.push(`Missing required icon system component: ${component}`);
            }
        });
        
        // Check for icon definitions (actual format: "name": "<svg...")
        const iconDefinitions = iconSystemContent.match(/"[a-zA-Z0-9-]+"\s*:\s*"<svg[^"]+"/g) || [];
        if (iconDefinitions.length === 0) {
            issues.push('No icon definitions found in icon system');
        } else {
            console.log(`  • Found ${iconDefinitions.length} icon definitions`);
        }
        
        // Check icon rendering functions exist (actual format)
        if (!iconSystemContent.includes('window.renderIcons = function')) {
            issues.push('Missing renderIcons function');
        }
        
        // Check for proper SVG structure in icons (within the icon definitions)
        const svgPatterns = iconSystemContent.match(/viewBox=\\"0 0 24 24\\"/g) || [];
        if (svgPatterns.length === 0) {
            issues.push('Icons missing proper SVG viewBox structure');
        } else {
            console.log(`  ${colors.green}✓${colors.reset} Found ${svgPatterns.length} properly structured SVG icons`);
        }
        
        if (issues.length === 0) {
            console.log(`  ${colors.green}✓${colors.reset} Icon system structure is valid`);
            console.log(`  ${colors.green}✓${colors.reset} Plugin and guide rendering functions present`);
            return true;
        } else {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} icon system issues:`);
            issues.forEach(issue => {
                console.log(`    • ${issue}`);
            });
            return false;
        }
        
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error checking icon system: ${error.message}`);
        return false;
    }
}

/**
 * Check theme switching functionality
 */
async function checkThemeSwitching() {
    console.log(`\n${colors.blue}🌗 Theme Switching Check${colors.reset}`);
    
    const issues = [];
    
    try {
        // Check CSS file for theme definitions
        const cssPath = path.join(projectRoot, CONFIG.cssFile);
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check for required theme attributes
        const lightTheme = cssContent.match(/\[data-theme="light"\]/g) || [];
        const darkTheme = cssContent.match(/\[data-theme="dark"\]/g) || [];
        
        if (lightTheme.length === 0) {
            issues.push('Missing light theme definition [data-theme="light"]');
        }
        
        if (darkTheme.length === 0) {
            issues.push('Missing dark theme definition [data-theme="dark"]');
        }
        
        // Check for theme variables
        const themeVariables = cssContent.match(/--[\w-]+:\s*[^;]+;/g) || [];
        if (themeVariables.length === 0) {
            issues.push('No CSS variables found for theming');
        }
        
        // Check for theme switching JavaScript in built guide
        const builtGuidePath = path.join(projectRoot, CONFIG.builtGuideFile);
        if (fs.existsSync(builtGuidePath)) {
            const builtGuideContent = fs.readFileSync(builtGuidePath, 'utf8');
            
            if (!builtGuideContent.includes('data-theme')) {
                issues.push('Theme switching JavaScript missing from built guide');
            }
            
            if (!builtGuideContent.includes('setAttribute')) {
                issues.push('Theme attribute setting functionality missing');
            }
        } else {
            console.log(`  ${colors.yellow}⚠${colors.reset} Built guide not found, run npm run build first`);
        }
        
        if (issues.length === 0) {
            console.log(`  ${colors.green}✓${colors.reset} Light and dark theme definitions found`);
            console.log(`  ${colors.green}✓${colors.reset} Theme variables properly configured`);
            return true;
        } else {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} theme switching issues:`);
            issues.forEach(issue => {
                console.log(`    • ${issue}`);
            });
            return false;
        }
        
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error checking theme switching: ${error.message}`);
        return false;
    }
}

/**
 * Check for dangerous CSS selectors that could affect plugin UI
 */
async function checkDangerousSelectors() {
    console.log(`\n${colors.blue}⚠️  Dangerous CSS Selectors Check${colors.reset}`);
    
    const issues = [];
    
    try {
        const cssPath = path.join(projectRoot, CONFIG.cssFile);
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Define dangerous patterns that could break plugin UI
        const dangerousPatterns = [
            {
                pattern: /^\s*\*\s*\{[^}]*\}/gm,
                name: 'Unscoped universal selector (*)',
                danger: 'Could override all plugin UI styles'
            },
            {
                pattern: /html\s*\{[^}]*overflow:\s*hidden[^}]*\}/g,
                name: 'html { overflow: hidden }',
                danger: 'Could break plugin scrolling'
            },
            {
                pattern: /body\s*\{[^}]*position:\s*fixed[^}]*\}/g,
                name: 'body { position: fixed }',
                danger: 'Could break plugin layout'
            },
            {
                pattern: /\*\s*\{[^}]*box-sizing[^}]*\}/g,
                name: 'Universal box-sizing reset',
                danger: 'Could break plugin component layouts'
            }
        ];
        
        dangerousPatterns.forEach(({ pattern, name, danger }) => {
            const matches = cssContent.match(pattern) || [];
            if (matches.length > 0) {
                issues.push({
                    name,
                    danger,
                    count: matches.length,
                    examples: matches.slice(0, 2)
                });
            }
        });
        
        // Check for dangerous element selectors that could break plugin UI
        const dangerousElementSelectors = [];
        
        // Look for specific dangerous patterns
        const dangerousElementPatterns = [
            { pattern: /^div\s*\{[^}]*position:\s*fixed[^}]*\}/gm, name: 'div { position: fixed }' },
            { pattern: /^span\s*\{[^}]*display:\s*block[^}]*\}/gm, name: 'span { display: block }' },
            { pattern: /^button\s*\{[^}]*border:\s*none[^}]*\}/gm, name: 'button { border: none }' },
            { pattern: /^input\s*\{[^}]*outline:\s*none[^}]*\}/gm, name: 'input { outline: none }' },
            { pattern: /^\*\s*\{[^}]*box-sizing[^}]*\}/gm, name: '* { box-sizing }' }
        ];
        
        dangerousElementPatterns.forEach(({ pattern, name }) => {
            const matches = cssContent.match(pattern) || [];
            if (matches.length > 0) {
                dangerousElementSelectors.push({
                    name,
                    count: matches.length,
                    examples: matches.slice(0, 2)
                });
            }
        });
        
        const problematicBroad = dangerousElementSelectors;
        
        if (problematicBroad.length > 0) {
            issues.push({
                name: 'Potentially broad element selectors',
                danger: 'Could affect plugin UI elements',
                count: problematicBroad.length,
                examples: problematicBroad.slice(0, 3).map(s => s.replace('{', '').trim())
            });
        }
        
        if (issues.length === 0) {
            console.log(`  ${colors.green}✓${colors.reset} No dangerous CSS selectors found`);
            console.log(`  ${colors.green}✓${colors.reset} Plugin UI safety maintained`);
            return true;
        } else {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} potentially dangerous selectors:`);
            issues.forEach(issue => {
                console.log(`    ${colors.yellow}•${colors.reset} ${issue.name} (${issue.count} instances)`);
                console.log(`      ${colors.gray}Risk: ${issue.danger}${colors.reset}`);
                if (issue.examples) {
                    console.log(`      ${colors.gray}Examples: ${issue.examples.join(', ')}${colors.reset}`);
                }
            });
            return false;
        }
        
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error checking dangerous selectors: ${error.message}`);
        return false;
    }
}

/**
 * Check JavaScript initialization patterns
 */
async function checkJavaScriptInit() {
    console.log(`\n${colors.blue}⚡ JavaScript Initialization Check${colors.reset}`);
    
    const issues = [];
    
    try {
        // Check built guide for initialization patterns
        const builtGuidePath = path.join(projectRoot, CONFIG.builtGuideFile);
        if (!fs.existsSync(builtGuidePath)) {
            console.log(`  ${colors.yellow}⚠${colors.reset} Built guide not found, run npm run build first`);
            return true;
        }
        
        const builtGuideContent = fs.readFileSync(builtGuidePath, 'utf8');
        
        // Check for required initialization patterns
        const requiredInits = [
            {
                pattern: /DOMContentLoaded|document\.addEventListener/,
                name: 'DOM ready event listener',
                purpose: 'Ensures scripts run after DOM is loaded'
            },
            {
                pattern: /renderGuideIcons|renderIcons/,
                name: 'Icon rendering initialization',
                purpose: 'Icons need to be rendered on page load'
            }
        ];
        
        requiredInits.forEach(({ pattern, name, purpose }) => {
            if (!pattern.test(builtGuideContent)) {
                issues.push({
                    name,
                    purpose,
                    missing: true
                });
            }
        });
        
        // Check for common initialization errors
        const initErrors = [
            {
                pattern: /querySelector.*null/,
                name: 'Null element selection',
                problem: 'Could cause runtime errors'
            },
            {
                pattern: /addEventListener.*undefined/,
                name: 'Undefined event handler',
                problem: 'Could cause runtime errors'
            }
        ];
        
        initErrors.forEach(({ pattern, name, problem }) => {
            if (pattern.test(builtGuideContent)) {
                issues.push({
                    name,
                    problem,
                    error: true
                });
            }
        });
        
        // Check for Figma-specific initialization
        if (builtGuideContent.includes('figma') || builtGuideContent.includes('plugin')) {
            console.log(`  ${colors.green}✓${colors.reset} Figma plugin detection present`);
        }
        
        if (issues.length === 0) {
            console.log(`  ${colors.green}✓${colors.reset} JavaScript initialization patterns look good`);
            console.log(`  ${colors.green}✓${colors.reset} Required event listeners present`);
            return true;
        } else {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} JavaScript initialization issues:`);
            issues.forEach(issue => {
                if (issue.missing) {
                    console.log(`    ${colors.red}•${colors.reset} Missing: ${issue.name}`);
                    console.log(`      ${colors.gray}Purpose: ${issue.purpose}${colors.reset}`);
                } else if (issue.error) {
                    console.log(`    ${colors.red}•${colors.reset} Error: ${issue.name}`);
                    console.log(`      ${colors.gray}Problem: ${issue.problem}${colors.reset}`);
                }
            });
            return false;
        }
        
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error checking JavaScript initialization: ${error.message}`);
        return false;
    }
}

/**
 * Check critical animations and keyframes
 */
async function checkCriticalAnimations() {
    console.log(`\n${colors.blue}🎬 Critical Animations Check${colors.reset}`);
    
    const issues = [];
    
    try {
        const cssPath = path.join(projectRoot, CONFIG.cssFile);
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check for required animations
        const requiredAnimations = [
            'te-vortex-swirl'
        ];
        
        requiredAnimations.forEach(animation => {
            if (!cssContent.includes(`@keyframes ${animation}`)) {
                issues.push(`Missing required animation: @keyframes ${animation}`);
            } else {
                console.log(`  ${colors.green}✓${colors.reset} Found @keyframes ${animation}`);
            }
        });
        
        // Check for animation usage
        const animationUsage = cssContent.match(/animation:\s*[^;]+;/g) || [];
        if (animationUsage.length === 0) {
            console.log(`  ${colors.yellow}⚠${colors.reset} No animation properties found`);
        } else {
            console.log(`  ${colors.green}✓${colors.reset} Found ${animationUsage.length} animation properties`);
        }
        
        if (issues.length === 0) {
            return true;
        } else {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} animation issues:`);
            issues.forEach(issue => {
                console.log(`    • ${issue}`);
            });
            return false;
        }
        
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error checking animations: ${error.message}`);
        return false;
    }
}

/**
 * Main critical elements check function
 */
async function checkCriticalElements() {
    console.log(`\n${colors.bright}🔍 Running Critical Elements Check${colors.reset}`);
    console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}`);
    
    const startTime = Date.now();
    const results = [];
    
    // Run all critical checks
    results.push({
        name: 'Icon System',
        passed: await checkIconSystem()
    });
    
    results.push({
        name: 'Theme Switching',
        passed: await checkThemeSwitching()
    });
    
    results.push({
        name: 'Dangerous CSS Selectors',
        passed: await checkDangerousSelectors()
    });
    
    results.push({
        name: 'JavaScript Initialization',
        passed: await checkJavaScriptInit()
    });
    
    results.push({
        name: 'Critical Animations',
        passed: await checkCriticalAnimations()
    });
    
    // Summary
    console.log(`\n${colors.gray}${'─'.repeat(50)}${colors.reset}`);
    console.log(`${colors.bright}Critical Elements Summary:${colors.reset}`);
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    results.forEach(result => {
        const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
        console.log(`  ${icon} ${result.name}`);
    });
    
    const elapsed = Date.now() - startTime;
    console.log(`\n${colors.bright}Results: ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.gray}${failed} failed${colors.reset}`);
    console.log(`${colors.gray}Time: ${elapsed}ms${colors.reset}`);
    
    if (failed > 0) {
        console.log(`\n${colors.red}✗ Critical elements check failed${colors.reset}`);
        console.log(`${colors.yellow}Fix the critical issues above before deploying${colors.reset}\n`);
        process.exit(1);
    } else {
        console.log(`\n${colors.green}✓ All critical elements are working properly!${colors.reset}\n`);
    }
}

// Run the critical elements check
checkCriticalElements().catch(console.error);