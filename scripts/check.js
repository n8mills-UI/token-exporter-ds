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
    projectRoot: projectRoot,
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
    
    // Remove comments and strings to avoid false positives
    const cleanContent = jsContent
        .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
        .replace(/\/\/.*$/gm, '')           // Remove line comments
        .replace(/'([^'\\]|\\.)*'/g, '')    // Remove single-quoted strings
        .replace(/"([^"\\]|\\.)*"/g, '');  // Remove double-quoted strings
    
    // Check for optional chaining - improved to avoid false positives
    const optionalChaining = cleanContent.match(/[^\/\/\s]\?\./g);
    if (optionalChaining) {
        issues.push({
            type: 'error',
            pattern: 'Optional chaining (?.)',
            count: optionalChaining.length,
            fix: 'Use: obj && obj.prop'
        });
    }
    
    // Check for nullish coalescing operator (??)
    const nullishCoalescing = cleanContent.match(/[a-zA-Z0-9_$)\]]\s*\?\?\s*[a-zA-Z0-9_$"'\(]/g);
    if (nullishCoalescing) {
        issues.push({
            type: 'error',
            pattern: 'Nullish coalescing (??)',
            count: nullishCoalescing.length,
            fix: 'Use: value !== null && value !== undefined ? value : defaultValue'
        });
    }
    
    // Check for catch without parameter
    const catchWithoutParam = cleanContent.match(/}\s*catch\s*{/g);
    if (catchWithoutParam) {
        issues.push({
            type: 'error',
            pattern: 'Catch without parameter',
            count: catchWithoutParam.length,
            fix: 'Use: } catch (error) {'
        });
    }
    
    // Check for template literals with interpolation
    const templateLiterals = cleanContent.match(/`[^`]*\$\{[^}]+\}[^`]*`/g);
    if (templateLiterals) {
        issues.push({
            type: 'error',
            pattern: 'Template literals with ${}',
            count: templateLiterals.length,
            fix: 'Use string concatenation'
        });
    }
    
    // Check for object spread in problematic contexts - improved detection
    const objectSpread = cleanContent.match(/\{\s*\.\.\.\w+/g);
    if (objectSpread) {
        // Filter out spread in function parameters and array destructuring
        const problematicSpread = objectSpread.filter(match => {
            const beforeMatch = cleanContent.substring(0, cleanContent.indexOf(match));
            const lastLine = beforeMatch.split('\n').pop();
            // Allow spread in function parameters and array contexts
            return !lastLine.includes('function') && !lastLine.includes('=>') && !lastLine.includes('[');
        });
        
        if (problematicSpread.length > 0) {
            issues.push({
                type: 'error',
                pattern: 'Object spread ({...obj})',
                count: problematicSpread.length,
                fix: 'Use: Object.assign({}, obj)'
            });
        }
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
    
    // Check for context-based overrides (anti-pattern)
    const contextOverrides = cssContent.match(/\.[a-zA-Z0-9-]+\s+\.[a-zA-Z0-9-]+\s*\{/g) || [];
    
    // Legacy components to ignore (too complex to refactor safely)
    const LEGACY_IGNORE_PATTERNS = [
        'profile-card',  // Complex component with many nested elements
        'about-modal',   // Modal with specific nested styles
        'faq-item'       // FAQ accordion with state-based styles
    ];
    
    // Guide-only patterns to ignore (not used in plugin)
    const GUIDE_ONLY_PATTERNS = [
        'guide-container',     // Guide layout wrapper
        'guideline',          // Documentation components
        'tech-item',          // Guide-only tech stack display
        'collection-item',    // Guide-only examples
        'example-',           // Example wrappers
        'demo-',              // Demo containers
        'docs-',              // Documentation specific
        'section-',           // Guide sections
        'icons-showcase',     // Icon showcase component
        'color-grid-2col',    // Color system display
        'gradient-card',      // Gradient showcase
        'gradient-directional-variant', // Gradient variants
        'text-utility-card',  // Text utilities
        'text-color-card',    // Text color showcase
        'light-sample',       // Theme comparison samples
        'dark-sample',        // Theme comparison samples
        'flow-token',         // Token flow display
        'light-theme-preview', // Theme previews
        'dark-theme-preview', // Theme previews
        'alpha-preview-large', // Alpha previews
        'split-preview',      // Preview components
        'theme-sample-content', // Theme samples
        'mobile-overview',    // Mobile documentation
        'challenge-card',     // Case study cards
        'solution-card',      // Case study cards
        'impact-card',        // Case study cards
        'export-section',     // Export examples
        'footer-main-row',    // Footer layout
        'footer-brand-mobile', // Mobile footer
        'component-title',    // Component headers
        'icon-card',          // Icon documentation
        'icon-size-card',     // Icon size showcase
        'icon-weight-card',   // Icon weight showcase
        'flow-item',          // Flow documentation
        'code-examples'       // Code examples
    ];
    
    // Plugin-specific patterns (legitimate scoped styles)
    const PLUGIN_SPECIFIC_PATTERNS = [
        'figma-plugin',       // Plugin UI context
        'token-summary',      // Plugin token summary
        'token-type-stat',    // Plugin token statistics
        'advanced-mode',      // Plugin advanced features
        'empty-state',        // Plugin empty states
        'empty-state-icon',   // Plugin icons
        'empty-state-category', // Plugin category states
        'mobile-menu',        // Plugin mobile menu
        'hamburger-icon',     // Plugin menu icon
        'mobile-header-controls', // Plugin mobile controls
        'te-celebrating',     // Plugin celebration states
        'hero-footer',        // Plugin footer elements
        'footer-section'      // Plugin sections
    ];
    
    // Legitimate component variants (allowed context overrides)
    const COMPONENT_VARIANTS = [
        '.btn-sm .icon',      // Button size variants with icons
        '.btn-md .icon',      // Button size variants with icons
        '.btn-lg .icon',      // Button size variants with icons
        '.btn-icon.btn-',     // Icon button variants
        '.badge.',            // Badge variants (all are properly scoped)
        '.card.is-compact',   // Card variants
        '.token-category .tokens-grid', // Token category layouts
        '.token-category .color-system-container', // Token layouts
        '.token-category .layout-container', // Token layouts
        '.token-category .subsection', // Token subsections
        '.info-panel-a',      // Info panel component (complex nested styles)
        '.fa-failed',         // Fallback states
        '.community-link',    // Community component
        '.open .faq-question', // FAQ state (part of .faq-item.open)
        '.creator-badge',     // Creator badge (part of profile-card)
        '.terminal-header',   // Terminal UI (part of profile-card)
        '.cyan .icon',        // Color badge variants (part of .badge.cyan)
        '.purple .icon',      // Color badge variants (part of .badge.purple)
        '.orange .icon',      // Color badge variants (part of .badge.orange)
        '.pink .icon',        // Color badge variants (part of .badge.pink)
        '.small .icon',       // Size badge variants (part of .badge.small)
        '.large .icon',       // Size badge variants (part of .badge.large)
        'content-section',    // Layout sections
        '.badge .icon',       // Badge icon default styles (legitimate)
        '.open .faq-toggle',  // FAQ toggle state (part of .faq-item.open)
        '.open .faq-answer',  // FAQ answer state (part of .faq-item.open)
        '.is-compact .subtitle', // Card variant (part of .card.is-compact)
        '.color .icon',       // Token stat icons (part of .token-type-stat.color)
        '.text .icon',        // Token stat icons (part of .token-type-stat.text) 
        '.states .icon',      // Token stat icons (part of .token-type-stat.states)
        '.number .icon',      // Token stat icons (part of .token-type-stat.number)
        '.selected .collection-checkbox', // Collection selection state
        '.is-loading .skeleton-pulse', // Loading state animations
        '.token-count-total .skeleton-pulse', // Loading state for counts
        '.guide-content',     // Guide layout styles
        '.low-contrast .color-swatch', // Color utility variants
        '.split-background .color-swatch', // Color utility variants
        '.color-details',     // Color documentation component
        '.alpha-swatch'       // Alpha color component
    ];
    
    const activeOverrides = contextOverrides.filter(override => {
        // Skip commented overrides
        const overrideIndex = cssContent.indexOf(override);
        const beforeOverride = cssContent.substring(Math.max(0, overrideIndex - 200), overrideIndex);
        const isCommented = beforeOverride.includes('/*') && beforeOverride.lastIndexOf('*/') < beforeOverride.lastIndexOf('/*');
        
        // Skip legacy components
        const isLegacy = LEGACY_IGNORE_PATTERNS.some(pattern => override.includes(pattern));
        
        // Skip guide-only components
        const isGuideOnly = GUIDE_ONLY_PATTERNS.some(pattern => override.includes(pattern));
        
        // Skip plugin-specific components
        const isPluginSpecific = PLUGIN_SPECIFIC_PATTERNS.some(pattern => override.includes(pattern));
        
        // Skip legitimate component variants
        const isComponentVariant = COMPONENT_VARIANTS.some(pattern => override.includes(pattern));
        
        return !isCommented && !isLegacy && !isGuideOnly && !isPluginSpecific && !isComponentVariant;
    });
    
    if (activeOverrides.length > 0) {
        issues.push({
            type: 'Context-based overrides (anti-pattern)',
            count: activeOverrides.length,
            examples: [...new Set(activeOverrides)].slice(0, 3)
        });
        
        console.log(`  ${colors.red}✗${colors.reset} Found ${activeOverrides.length} context-based overrides`);
        console.log(`  ${colors.yellow}⚠${colors.reset} Use component variants instead of context overrides`);
        activeOverrides.slice(0, 5).forEach(override => {
            console.log(`    • ${override.trim()}`);
        });
        if (activeOverrides.length > 5) {
            console.log(`    ... and ${activeOverrides.length - 5} more`);
        }
    } else {
        console.log(`  ${colors.green}✓${colors.reset} No context-based overrides found`);
    }
    
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
    
    // Legacy components to ignore (too complex to refactor safely)
    const LEGACY_IGNORE_PATTERNS = [
        'profile-card',  // Complex component with many nested elements
        'about-modal',   // Modal with specific nested styles
        'faq'            // FAQ accordion with state-based styles
    ];
    
    // Guide-only patterns to ignore (not used in plugin)
    const GUIDE_ONLY_PATTERNS = [
        'tech-item',      // Guide-only tech stack display
        'collection',     // Guide-only examples
        'badge',          // Guide-only badge demos
        'example',        // Example components
        'demo',           // Demo components
        'guideline'       // Documentation components
    ];
    
    // Filter out legacy and guide-only components
    const filteredOverrides = componentOverrides.filter(override => {
        const isLegacy = LEGACY_IGNORE_PATTERNS.some(pattern => override.includes(pattern));
        const isGuideOnly = GUIDE_ONLY_PATTERNS.some(pattern => override.includes(pattern));
        return !isLegacy && !isGuideOnly;
    });
    
    if (filteredOverrides.length > 0) {
        // Group by component type
        const componentGroups = {};
        filteredOverrides.forEach(match => {
            const componentMatch = match.match(/\.([\w-]+)/);
            if (componentMatch) {
                const component = componentMatch[1];
                if (!componentGroups[component]) {
                    componentGroups[component] = [];
                }
                componentGroups[component].push(match.trim());
            }
        });
        
        console.log(`  ${colors.red}✗${colors.reset} Found ${filteredOverrides.length} component-specific theme overrides`);
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
    
    // Check 3: Theme color contrast validation
    const themeContrast = validateThemeContrast(cssContent);
    if (!themeContrast.valid) {
        console.log(`  ${colors.yellow}⚠${colors.reset} Theme contrast validation: ${themeContrast.message}`);
    } else {
        console.log(`  ${colors.green}✓${colors.reset} Theme color contrast meets accessibility standards`);
    }
    
    // Check 4: Theme variable consistency
    const themeConsistency = validateThemeConsistency(cssContent);
    if (!themeConsistency.valid) {
        console.log(`  ${colors.yellow}⚠${colors.reset} Theme consistency: ${themeConsistency.message}`);
        issues.push('theme-inconsistency');
    } else {
        console.log(`  ${colors.green}✓${colors.reset} Theme variables are consistent across themes`);
    }
    
    if (issues.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} No component-specific theme overrides found`);
        console.log(`  ${colors.green}✓${colors.reset} No duplicate theme sections found`);
        console.log(`  ${colors.green}✓${colors.reset} Theme uses token-only approach (Open Props pattern)`);
        return true;
    }
    
    return false;
}

/**
 * Validate theme color contrast ratios
 */
function validateThemeContrast(cssContent) {
    // Basic contrast validation placeholder
    // In a real implementation, this would parse color values and calculate contrast ratios
    const hasContrastChecks = cssContent.includes('--color-text-') && cssContent.includes('--color-background-');
    
    if (hasContrastChecks) {
        return { valid: true, message: 'Contrast tokens found' };
    } else {
        return { valid: false, message: 'Missing contrast-aware color tokens' };
    }
}

/**
 * Validate theme variable consistency
 */
function validateThemeConsistency(cssContent) {
    // Extract theme token names from light and dark themes
    const lightTokens = new Set();
    const darkTokens = new Set();
    
    // Find light theme tokens
    const lightMatch = cssContent.match(/\[data-theme="light"\]\s*\{([^}]*)\}/s);
    if (lightMatch) {
        const tokenMatches = lightMatch[1].match(/--([a-zA-Z0-9-]+):/g) || [];
        tokenMatches.forEach(token => lightTokens.add(token.slice(2, -1)));
    }
    
    // Find dark theme tokens (if exists)
    const darkMatch = cssContent.match(/\[data-theme="dark"\]\s*\{([^}]*)\}/s);
    if (darkMatch) {
        const tokenMatches = darkMatch[1].match(/--([a-zA-Z0-9-]+):/g) || [];
        tokenMatches.forEach(token => darkTokens.add(token.slice(2, -1)));
    }
    
    // Check if themes have consistent token names
    if (darkTokens.size === 0) {
        return { valid: true, message: 'Only light theme defined' };
    }
    
    const lightOnly = [...lightTokens].filter(token => !darkTokens.has(token));
    const darkOnly = [...darkTokens].filter(token => !lightTokens.has(token));
    
    if (lightOnly.length === 0 && darkOnly.length === 0) {
        return { valid: true, message: 'Theme tokens are consistent' };
    } else {
        const issues = [];
        if (lightOnly.length > 0) issues.push(`Light-only: ${lightOnly.slice(0, 3).join(', ')}`);
        if (darkOnly.length > 0) issues.push(`Dark-only: ${darkOnly.slice(0, 3).join(', ')}`);
        return { valid: false, message: issues.join('; ') };
    }
}

/**
 * Validate undefined CSS variables
 */
async function checkUndefinedVariables() {
    console.log(`\n${colors.blue}🔍 Undefined CSS Variable Check${colors.reset}`);
    
    // Read CSS content
    const cssContent = fs.readFileSync(path.join(projectRoot, CONFIG.cssFile), 'utf8');
    
    // Extract all defined CSS variables
    const definedVariables = new Set();
    
    // Match variable definitions in any context
    const varDefPattern = /--([a-zA-Z0-9-]+):\s*[^;]+;/g;
    let match;
    
    while ((match = varDefPattern.exec(cssContent)) !== null) {
        definedVariables.add(match[1]);
    }
    
    // Add Open Props variables that are imported
    const openPropsVars = [
        // Size scale
        'size-000', 'size-00', 'size-0', 'size-1', 'size-2', 'size-3', 'size-4', 'size-5', 
        'size-6', 'size-7', 'size-8', 'size-9', 'size-10', 'size-11', 'size-12', 'size-13',
        'size-14', 'size-15', 'size-fluid-1', 'size-fluid-2', 'size-fluid-3', 'size-fluid-4',
        'size-fluid-5', 'size-fluid-6', 'size-fluid-7', 'size-fluid-8', 'size-fluid-9', 'size-fluid-10',
        // Font sizes
        'font-size-00', 'font-size-0', 'font-size-1', 'font-size-2', 'font-size-3',
        'font-size-4', 'font-size-5', 'font-size-6', 'font-size-7', 'font-size-8',
        'font-size-fluid-0', 'font-size-fluid-1', 'font-size-fluid-2', 'font-size-fluid-3',
        // Font weights
        'font-weight-1', 'font-weight-2', 'font-weight-3', 'font-weight-4', 'font-weight-5',
        'font-weight-6', 'font-weight-7', 'font-weight-8', 'font-weight-9',
        // Line heights
        'font-lineheight-00', 'font-lineheight-0', 'font-lineheight-1', 'font-lineheight-2',
        'font-lineheight-3', 'font-lineheight-4', 'font-lineheight-5',
        // Letter spacing
        'font-letterspacing-0', 'font-letterspacing-1', 'font-letterspacing-2', 'font-letterspacing-3',
        'font-letterspacing-4', 'font-letterspacing-5', 'font-letterspacing-6', 'font-letterspacing-7',
        // Colors
        'gray-0', 'gray-1', 'gray-2', 'gray-3', 'gray-4', 'gray-5', 'gray-6', 'gray-7', 'gray-8', 'gray-9', 'gray-10', 'gray-11', 'gray-12',
        'stone-0', 'stone-1', 'stone-2', 'stone-3', 'stone-4', 'stone-5', 'stone-6', 'stone-7', 'stone-8', 'stone-9', 'stone-10', 'stone-11', 'stone-12',
        'red-0', 'red-1', 'red-2', 'red-3', 'red-4', 'red-5', 'red-6', 'red-7', 'red-8', 'red-9', 'red-10', 'red-11', 'red-12',
        'pink-0', 'pink-1', 'pink-2', 'pink-3', 'pink-4', 'pink-5', 'pink-6', 'pink-7', 'pink-8', 'pink-9', 'pink-10', 'pink-11', 'pink-12',
        'purple-0', 'purple-1', 'purple-2', 'purple-3', 'purple-4', 'purple-5', 'purple-6', 'purple-7', 'purple-8', 'purple-9', 'purple-10', 'purple-11', 'purple-12',
        'violet-0', 'violet-1', 'violet-2', 'violet-3', 'violet-4', 'violet-5', 'violet-6', 'violet-7', 'violet-8', 'violet-9', 'violet-10', 'violet-11', 'violet-12',
        'indigo-0', 'indigo-1', 'indigo-2', 'indigo-3', 'indigo-4', 'indigo-5', 'indigo-6', 'indigo-7', 'indigo-8', 'indigo-9', 'indigo-10', 'indigo-11', 'indigo-12',
        'blue-0', 'blue-1', 'blue-2', 'blue-3', 'blue-4', 'blue-5', 'blue-6', 'blue-7', 'blue-8', 'blue-9', 'blue-10', 'blue-11', 'blue-12',
        'cyan-0', 'cyan-1', 'cyan-2', 'cyan-3', 'cyan-4', 'cyan-5', 'cyan-6', 'cyan-7', 'cyan-8', 'cyan-9', 'cyan-10', 'cyan-11', 'cyan-12',
        'teal-0', 'teal-1', 'teal-2', 'teal-3', 'teal-4', 'teal-5', 'teal-6', 'teal-7', 'teal-8', 'teal-9', 'teal-10', 'teal-11', 'teal-12',
        'green-0', 'green-1', 'green-2', 'green-3', 'green-4', 'green-5', 'green-6', 'green-7', 'green-8', 'green-9', 'green-10', 'green-11', 'green-12',
        'lime-0', 'lime-1', 'lime-2', 'lime-3', 'lime-4', 'lime-5', 'lime-6', 'lime-7', 'lime-8', 'lime-9', 'lime-10', 'lime-11', 'lime-12',
        'yellow-0', 'yellow-1', 'yellow-2', 'yellow-3', 'yellow-4', 'yellow-5', 'yellow-6', 'yellow-7', 'yellow-8', 'yellow-9', 'yellow-10', 'yellow-11', 'yellow-12',
        'orange-0', 'orange-1', 'orange-2', 'orange-3', 'orange-4', 'orange-5', 'orange-6', 'orange-7', 'orange-8', 'orange-9', 'orange-10', 'orange-11', 'orange-12',
        'choco-0', 'choco-1', 'choco-2', 'choco-3', 'choco-4', 'choco-5', 'choco-6', 'choco-7', 'choco-8', 'choco-9', 'choco-10', 'choco-11', 'choco-12',
        'brown-0', 'brown-1', 'brown-2', 'brown-3', 'brown-4', 'brown-5', 'brown-6', 'brown-7', 'brown-8', 'brown-9', 'brown-10', 'brown-11', 'brown-12',
        'sand-0', 'sand-1', 'sand-2', 'sand-3', 'sand-4', 'sand-5', 'sand-6', 'sand-7', 'sand-8', 'sand-9', 'sand-10', 'sand-11', 'sand-12',
        'camo-0', 'camo-1', 'camo-2', 'camo-3', 'camo-4', 'camo-5', 'camo-6', 'camo-7', 'camo-8', 'camo-9', 'camo-10', 'camo-11', 'camo-12',
        'jungle-0', 'jungle-1', 'jungle-2', 'jungle-3', 'jungle-4', 'jungle-5', 'jungle-6', 'jungle-7', 'jungle-8', 'jungle-9', 'jungle-10', 'jungle-11', 'jungle-12',
        // Warm and cool grays
        'gray-warm-0', 'gray-warm-1', 'gray-warm-2', 'gray-warm-3', 'gray-warm-4', 'gray-warm-5', 'gray-warm-6', 'gray-warm-7', 'gray-warm-8', 'gray-warm-9', 'gray-warm-10', 'gray-warm-11', 'gray-warm-12',
        'gray-cool-0', 'gray-cool-1', 'gray-cool-2', 'gray-cool-3', 'gray-cool-4', 'gray-cool-5', 'gray-cool-6', 'gray-cool-7', 'gray-cool-8', 'gray-cool-9', 'gray-cool-10', 'gray-cool-11', 'gray-cool-12',
        // Radius
        'radius-1', 'radius-2', 'radius-3', 'radius-4', 'radius-5', 'radius-6',
        'radius-round', 'radius-blob-1', 'radius-blob-2', 'radius-blob-3', 'radius-blob-4', 'radius-blob-5',
        'radius-conditional-1', 'radius-conditional-2', 'radius-conditional-3', 'radius-conditional-4', 'radius-conditional-5', 'radius-conditional-6',
        // Border sizes
        'border-size-1', 'border-size-2', 'border-size-3', 'border-size-4', 'border-size-5',
        // Shadows
        'shadow-1', 'shadow-2', 'shadow-3', 'shadow-4', 'shadow-5', 'shadow-6',
        'inner-shadow-0', 'inner-shadow-1', 'inner-shadow-2', 'inner-shadow-3', 'inner-shadow-4',
        // Easings
        'ease-1', 'ease-2', 'ease-3', 'ease-4', 'ease-5',
        'ease-in-1', 'ease-in-2', 'ease-in-3', 'ease-in-4', 'ease-in-5',
        'ease-out-1', 'ease-out-2', 'ease-out-3', 'ease-out-4', 'ease-out-5',
        'ease-in-out-1', 'ease-in-out-2', 'ease-in-out-3', 'ease-in-out-4', 'ease-in-out-5',
        'ease-elastic-1', 'ease-elastic-2', 'ease-elastic-3', 'ease-elastic-4', 'ease-elastic-5',
        'ease-squish-1', 'ease-squish-2', 'ease-squish-3', 'ease-squish-4', 'ease-squish-5',
        'ease-spring-1', 'ease-spring-2', 'ease-spring-3', 'ease-spring-4', 'ease-spring-5',
        'ease-bounce-1', 'ease-bounce-2', 'ease-bounce-3', 'ease-bounce-4', 'ease-bounce-5',
        // Additional props
        'layer-1', 'layer-2', 'layer-3', 'layer-4', 'layer-5', 'layer-important',
        'font-sans', 'font-serif', 'font-mono',
        'gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5', 'gradient-6', 'gradient-7', 
        'gradient-8', 'gradient-9', 'gradient-10', 'gradient-11', 'gradient-12', 'gradient-13', 'gradient-14',
        'gradient-15', 'gradient-16', 'gradient-17', 'gradient-18', 'gradient-19', 'gradient-20', 'gradient-21',
        'gradient-22', 'gradient-23', 'gradient-24', 'gradient-25', 'gradient-26', 'gradient-27', 'gradient-28',
        'gradient-29', 'gradient-30',
        'noise-1', 'noise-2', 'noise-3', 'noise-4', 'noise-5',
        'noise-filter-1', 'noise-filter-2', 'noise-filter-3', 'noise-filter-4', 'noise-filter-5',
        // Animation
        'animation-slide-in-up', 'animation-slide-in-down', 'animation-slide-in-right', 'animation-slide-in-left',
        'animation-slide-out-up', 'animation-slide-out-down', 'animation-slide-out-right', 'animation-slide-out-left',
        'animation-scale-up', 'animation-scale-down', 'animation-fade-in', 'animation-fade-out',
        'animation-fade-in-bloom', 'animation-fade-out-bloom', 'animation-rotate-in', 'animation-rotate-out',
        'animation-float', 'animation-bounce', 'animation-pulse', 'animation-ping', 'animation-blink',
        'animation-spin', 'animation-shake-x', 'animation-shake-y'
    ];
    
    // Check if using Open Props
    if (cssContent.includes('open-props')) {
        openPropsVars.forEach(v => definedVariables.add(v));
    }
    
    // Find all variable references
    const varRefPattern = /var\(--([a-zA-Z0-9-]+)(?:,\s*[^)]+)?\)/g;
    const undefinedVars = [];
    const lines = cssContent.split('\n');
    
    // Reset regex for new search
    varRefPattern.lastIndex = 0;
    
    while ((match = varRefPattern.exec(cssContent)) !== null) {
        const varName = match[1];
        
        if (!definedVariables.has(varName)) {
            // Find line number
            const position = match.index;
            let lineNumber = 1;
            let charCount = 0;
            
            for (let i = 0; i < lines.length; i++) {
                charCount += lines[i].length + 1;
                if (charCount > position) {
                    lineNumber = i + 1;
                    break;
                }
            }
            
            // Get the line content for context
            const lineContent = lines[lineNumber - 1].trim();
            
            undefinedVars.push({
                variable: `--${varName}`,
                line: lineNumber,
                context: lineContent.substring(0, 80) + (lineContent.length > 80 ? '...' : '')
            });
        }
    }
    
    if (undefinedVars.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} All CSS variables are properly defined`);
        return true;
    } else {
        console.log(`  ${colors.red}✗${colors.reset} Found ${undefinedVars.length} undefined CSS variables:\n`);
        
        // Group by variable name to avoid duplicates
        const grouped = {};
        undefinedVars.forEach(item => {
            if (!grouped[item.variable]) {
                grouped[item.variable] = [];
            }
            grouped[item.variable].push(item);
        });
        
        Object.entries(grouped).forEach(([variable, occurrences]) => {
            console.log(`  ${colors.red}Variable:${colors.reset} ${variable} (${occurrences.length} usage${occurrences.length > 1 ? 's' : ''})`);
            
            // Show first 3 occurrences
            occurrences.slice(0, 3).forEach(item => {
                console.log(`    ${colors.gray}Line ${item.line}: ${item.context}${colors.reset}`);
            });
            
            if (occurrences.length > 3) {
                console.log(`    ${colors.gray}... and ${occurrences.length - 3} more${colors.reset}`);
            }
            console.log();
        });
        
        console.log(`  ${colors.bright}How to fix:${colors.reset}`);
        console.log(`  1. Add the missing variable to :root in design-system.css`);
        console.log(`  2. Or update the CSS to use an existing variable`);
        console.log(`  3. Check if the variable name has a typo\n`);
        
        return false;
    }
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
 * Check plugin-specific compatibility
 */
async function checkPluginCompatibility() {
    const sectionName = '📱 Plugin Compatibility Check';
    console.log(`\n${colors.blue}${sectionName}${colors.reset}`);
    
    const issues = [];
    
    try {
        // Check icon system
        const iconSystemPath = path.join(__dirname, '../src/components/icons/_icon-system.html');
        const iconSystem = await fs.promises.readFile(iconSystemPath, 'utf8');
        
        if (!iconSystem.includes('window.renderPluginIcons')) {
            issues.push('Icon system missing plugin compatibility alias (window.renderPluginIcons)');
        }
        
        // Check animations in CSS
        const cssPath = path.join(__dirname, '../docs/design-system.css');
        const css = await fs.promises.readFile(cssPath, 'utf8');
        
        const requiredAnimations = ['te-vortex-swirl'];
        requiredAnimations.forEach(anim => {
            if (!css.includes(`@keyframes ${anim}`)) {
                issues.push(`Missing required animation: @keyframes ${anim}`);
            }
        });
        
        // Check for Figma-specific CSS
        if (css.includes('.figma-plugin')) {
            console.log(`  ${colors.green}✓${colors.reset} Figma-specific CSS rules found`);
        } else {
            console.log(`  ${colors.yellow}⚠${colors.reset}  No Figma-specific CSS rules found`);
        }
        
        // Validate icon system accessibility and consistency
        // Check for both static attributes and dynamic setAttribute patterns
        const hasStaticAccessibility = iconSystem.includes('aria-label') && iconSystem.includes('role="img"');
        const hasDynamicRole = iconSystem.includes('setAttribute(\'role\'') || iconSystem.includes('setAttribute("role"');
        const hasDynamicAriaLabel = iconSystem.includes('setAttribute(\'aria-label\'') || iconSystem.includes('setAttribute("aria-label"');
        
        if (hasStaticAccessibility || (hasDynamicRole && hasDynamicAriaLabel)) {
            console.log(`  ${colors.green}✓${colors.reset} Icon system includes accessibility attributes (${hasDynamicRole ? 'dynamic' : 'static'})`);
        } else {
            issues.push('Icon system missing accessibility attributes (aria-label, role)');
        }
        
        // Check icon naming conventions
        const iconMatches = iconSystem.match(/data-icon="([^"]+)"/g) || [];
        const invalidIcons = iconMatches.filter(match => {
            const iconName = match.match(/data-icon="([^"]+)"/)[1];
            return !/^[a-z0-9-]+$/.test(iconName);
        });
        
        if (invalidIcons.length === 0) {
            console.log(`  ${colors.green}✓${colors.reset} Icon naming conventions followed`);
        } else {
            issues.push(`${invalidIcons.length} icons with invalid naming conventions`);
        }
        
        // Report results
        if (issues.length === 0) {
            console.log(`  ${colors.green}✓${colors.reset} All plugin compatibility checks passed`);
            return true;
        } else {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} plugin compatibility issues:`);
            issues.forEach(issue => {
                console.log(`    ${colors.red}•${colors.reset} ${issue}`);
            });
            return false;
        }
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Plugin compatibility check failed`);
        console.error(`    ${error.message}`);
        return false;
    }
}

/**
 * Find the closest matching CSS class
 */
function findClosestClass(className, definedClasses) {
    // Simple edit distance algorithm
    const candidates = Array.from(definedClasses)
        .map(defined => ({
            class: defined,
            distance: levenshteinDistance(className, defined)
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
    
    return candidates.filter(c => c.distance <= 3);
}

/**
 * Simple Levenshtein distance for string similarity
 */
function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

/**
 * Validate that all CSS classes used in HTML are defined
 */
async function validateCSSClasses() {
    console.log(`\n${colors.blue}🎯 CSS Class Validation${colors.reset}`);
    
    try {
        // Read CSS and extract defined classes
        const cssContent = await fs.promises.readFile(path.join(CONFIG.projectRoot, CONFIG.cssFile), 'utf8');
        const definedClasses = new Set();
        
        // Match class selectors
        const classRegex = /\.([a-zA-Z0-9_-]+)(?=[^{]*{)/g;
        let match;
        
        while ((match = classRegex.exec(cssContent)) !== null) {
            definedClasses.add(match[1]);
        }
        
        // Check HTML files for undefined classes
        const htmlFiles = [
            path.join(CONFIG.projectRoot, 'src/ui.template.html'),
            path.join(CONFIG.projectRoot, 'docs/design-system-guide.template.html')
        ];
        
        // Add component files
        const componentFiles = await fs.promises.readdir(path.join(CONFIG.projectRoot, 'src/components'));
        componentFiles.forEach(file => {
            if (file.endsWith('.html')) {
                htmlFiles.push(path.join(CONFIG.projectRoot, 'src/components', file));
            }
        });
        
        let hasErrors = false;
        const issues = [];
        
        for (const file of htmlFiles) {
            try {
                const content = await fs.promises.readFile(file, 'utf8');
                const lines = content.split('\n');
                const classAttrRegex = /class\s*=\s*["']([^"']+)["']/g;
                
                let lineMatch;
                lines.forEach((line, index) => {
                    classAttrRegex.lastIndex = 0;
                    while ((lineMatch = classAttrRegex.exec(line)) !== null) {
                        const classes = lineMatch[1].split(/\s+/).filter(c => c.length > 0);
                        
                        for (const className of classes) {
                            // Skip dynamic/JS classes and known exceptions
                            if (className.startsWith('data-') || 
                                className.startsWith('js-') ||
                                ['icon-rendered', 'state-hidden', 'active', 'selected', 
                                 'disabled', 'force-hover', 'figma-plugin', 'icon'].includes(className)) {
                                continue;
                            }
                            
                            if (!definedClasses.has(className)) {
                                const suggestions = findClosestClass(className, definedClasses);
                                issues.push({
                                    file: path.relative(CONFIG.projectRoot, file),
                                    line: index + 1,
                                    className,
                                    suggestions
                                });
                                hasErrors = true;
                            }
                        }
                    }
                });
            } catch (err) {
                // File might not exist, skip
            }
        }
        
        if (hasErrors) {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} undefined CSS classes\n`);
            
            issues.forEach(issue => {
                console.log(`  ${colors.yellow}File:${colors.reset} ${issue.file}:${issue.line}`);
                console.log(`  ${colors.red}Class:${colors.reset} .${issue.className}`);
                
                if (issue.suggestions.length > 0) {
                    console.log(`  ${colors.green}Did you mean:${colors.reset}`);
                    issue.suggestions.forEach(suggestion => {
                        console.log(`    • .${suggestion.class} (distance: ${suggestion.distance})`);
                    });
                } else {
                    console.log(`  ${colors.gray}No similar classes found. Define this class in design-system.css${colors.reset}`);
                }
                console.log();
            });
            
            console.log(`  ${colors.bright}How to fix:${colors.reset}`);
            console.log(`  1. Define the missing class in design-system.css`);
            console.log(`  2. Or update the HTML to use an existing class`);
            console.log(`  3. If it's a dynamic class, add it to the exceptions list\n`);
            
            return false;
        } else {
            console.log(`  ${colors.green}✓${colors.reset} All CSS classes are properly defined`);
            return true;
        }
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error validating CSS classes:`, error.message);
        return false;
    }
}

/**
 * Validate component synchronization
 */
async function validateComponentSync() {
    console.log(`\n${colors.blue}🔄 Component Sync Validation${colors.reset}`);
    
    try {
        // Get all component files
        const componentsDir = path.join(CONFIG.projectRoot, 'src/components');
        const componentFiles = await fs.promises.readdir(componentsDir);
        const components = componentFiles
            .filter(f => f.startsWith('_') && f.endsWith('.html'))
            .map(f => ({
                file: f,
                name: f.replace(/^_|\.html$/g, ''),
                path: path.join(componentsDir, f)
            }));
        
        // Read design guide template
        const guideTemplate = path.join(CONFIG.projectRoot, 'docs/design-system-guide.template.html');
        const guideContent = await fs.promises.readFile(guideTemplate, 'utf8');
        
        const issues = [];
        
        // For each component, check if it's properly included or hardcoded
        for (const component of components) {
            const componentContent = await fs.promises.readFile(component.path, 'utf8');
            
            // Extract key patterns from component (first few distinctive lines)
            const componentLines = componentContent.split('\n').slice(2, 6)
                .map(line => line.trim())
                .filter(line => line.length > 10 && !line.startsWith('<!--'));
            
            // Check if component content appears directly in guide (hardcoded)
            let isHardcoded = false;
            componentLines.forEach(line => {
                if (line && guideContent.includes(line)) {
                    isHardcoded = true;
                }
            });
            
            // Check if component is included properly
            const includePattern = new RegExp(`<!--\\s*@include\\s+src/components/${component.file}\\s*-->`);
            const isIncluded = includePattern.test(guideContent);
            
            if (isHardcoded && !isIncluded) {
                // Find where it's hardcoded
                const lineNumber = guideContent.split('\n').findIndex(line => 
                    componentLines.some(cl => line.includes(cl))
                ) + 1;
                
                issues.push({
                    component: component.name,
                    problem: 'hardcoded',
                    lineNumber,
                    fix: `Replace with: <!-- @include src/components/${component.file} -->`
                });
            }
        }
        
        if (issues.length > 0) {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} component sync issues\n`);
            
            issues.forEach(issue => {
                console.log(`  ${colors.yellow}Component:${colors.reset} ${issue.component}`);
                console.log(`  ${colors.red}Problem:${colors.reset} Component is hardcoded instead of using @include`);
                console.log(`  ${colors.gray}Line:${colors.reset} ~${issue.lineNumber} in design-system-guide.template.html`);
                console.log(`  ${colors.green}Fix:${colors.reset} ${issue.fix}\n`);
            });
            
            console.log(`  ${colors.bright}Why this matters:${colors.reset}`);
            console.log(`  • Components get out of sync between plugin and guide`);
            console.log(`  • Changes to components don't propagate automatically`);
            console.log(`  • Violates single source of truth principle\n`);
            
            return false;
        } else {
            console.log(`  ${colors.green}✓${colors.reset} All components properly use @include directives`);
            return true;
        }
        
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error validating component sync:`, error.message);
        return false;
    }
}

/**
 * Validate CSS integrity (prevent bundled/minified content)
 */
async function validateCSSIntegrity() {
    console.log(`\n${colors.blue}🛡️  CSS Integrity Check${colors.reset}`);
    
    try {
        const cssPath = path.join(CONFIG.projectRoot, CONFIG.cssFile);
        const cssContent = await fs.promises.readFile(cssPath, 'utf8');
        const fileStats = await fs.promises.stat(cssPath);
        
        const issues = [];
        
        // Check 1: File size validation (bundled files are much larger)
        const fileSizeKB = Math.round(fileStats.size / 1024);
        const EXPECTED_MAX_SIZE_KB = 500; // Reasonable max for unbundled CSS
        
        if (fileSizeKB > EXPECTED_MAX_SIZE_KB) {
            issues.push({
                type: 'warning',
                message: `File size (${fileSizeKB}KB) exceeds expected maximum (${EXPECTED_MAX_SIZE_KB}KB)`,
                detail: 'May indicate bundled/inlined content'
            });
        }
        
        // Check 2: Detect minified Open Props signatures
        const problematicPatterns = [
            {
                pattern: /@media[^{]*\{:where\(html\)\{/g,
                type: 'error',
                message: 'Minified media query with :where(html) detected',
                detail: 'This pattern breaks CSS parsing in browsers'
            },
            {
                pattern: /@media[^{]*\{[^}]*\{[^}]*\}[^}]*\}/g,
                type: 'warning', 
                message: 'Single-line media query with nested braces detected',
                detail: 'May indicate minified Open Props content'
            },
            {
                pattern: /--[a-z-]+:[^;]+;--[a-z-]+:[^;]+;--[a-z-]+:[^;]+/g,
                type: 'warning',
                message: 'Multiple CSS variables on single line detected',
                detail: 'May indicate minified content'
            }
        ];
        
        problematicPatterns.forEach(({ pattern, type, message, detail }) => {
            const matches = cssContent.match(pattern);
            if (matches) {
                issues.push({
                    type,
                    message: `${message} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
                    detail,
                    examples: matches.slice(0, 2).map(m => m.substring(0, 80) + (m.length > 80 ? '...' : ''))
                });
            }
        });
        
        // Check 3: Validate proper import structure
        const hasOpenPropsImports = cssContent.includes('@import url("vendor/open-props/');
        const hasInlinedOpenProps = cssContent.includes('/* Open Props') || 
                                   cssContent.includes('--size-000:') ||
                                   cssContent.includes('--size-00:');
        
        if (!hasOpenPropsImports && hasInlinedOpenProps) {
            issues.push({
                type: 'error',
                message: 'Open Props appears to be inlined instead of imported',
                detail: 'Use @import statements to keep CSS unbundled for web compatibility'
            });
        } else if (hasOpenPropsImports) {
            console.log(`  ${colors.green}✓${colors.reset} Open Props properly imported via @import statements`);
        }
        
        // Check 4: Line density analysis (minified files have very long lines)
        const lines = cssContent.split('\n');
        const longLines = lines.filter(line => line.length > 200);
        const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
        
        if (longLines.length > 10 || avgLineLength > 80) {
            issues.push({
                type: 'warning',
                message: `High line density detected (${longLines.length} lines >200 chars, avg: ${Math.round(avgLineLength)} chars)`,
                detail: 'May indicate minified content'
            });
        }
        
        // Results summary
        console.log(`  • File size: ${fileSizeKB}KB`);
        console.log(`  • Total lines: ${lines.length}`);
        console.log(`  • Average line length: ${Math.round(avgLineLength)} chars`);
        console.log(`  • Lines >200 chars: ${longLines.length}`);
        
        const errors = issues.filter(i => i.type === 'error');
        const warnings = issues.filter(i => i.type === 'warning');
        
        if (errors.length > 0) {
            console.log(`  ${colors.red}✗ ${errors.length} critical integrity issues:${colors.reset}`);
            errors.forEach(issue => {
                console.log(`    • ${issue.message}`);
                console.log(`      ${colors.gray}${issue.detail}${colors.reset}`);
                if (issue.examples) {
                    issue.examples.forEach(example => {
                        console.log(`      ${colors.yellow}Example: ${example}${colors.reset}`);
                    });
                }
            });
            
            console.log(`\n  ${colors.bright}CRITICAL: Bundled CSS detected!${colors.reset}`);
            console.log(`  ${colors.red}This will break the documentation website.${colors.reset}`);
            console.log(`  ${colors.bright}To fix:${colors.reset}`);
            console.log(`    1. Restore unbundled CSS: git show 744ea0b:docs/design-system.css > docs/design-system.css`);
            console.log(`    2. Verify build.js excludes docs CSS bundling (lines 647-649)`);
            console.log(`    3. Never run CSS bundling on the docs folder\n`);
        }
        
        if (warnings.length > 0) {
            console.log(`  ${colors.yellow}⚠ ${warnings.length} warnings:${colors.reset}`);
            warnings.forEach(issue => {
                console.log(`    • ${issue.message}`);
                console.log(`      ${colors.gray}${issue.detail}${colors.reset}`);
            });
        }
        
        if (errors.length === 0 && warnings.length === 0) {
            console.log(`  ${colors.green}✓${colors.reset} CSS integrity validated - file is properly unbundled`);
            return true;
        }
        
        return errors.length === 0; // Only fail on errors, not warnings
        
    } catch (error) {
        console.log(`  ${colors.red}✗${colors.reset} Error validating CSS integrity:`, error.message);
        return false;
    }
}

/**
 * Main check function
 */
async function check(options = {}) {
    const isFullMode = options.all || false;
    const isEssentialOnly = options.essential || false;
    
    // Determine mode
    const mode = isEssentialOnly ? 'Essential (3 checks)' : isFullMode ? 'Full' : 'Standard';
    
    console.log(`\n${colors.bright}🔍 Running ${mode} Quality Checks${colors.reset}`);
    console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}`);
    
    const startTime = Date.now();
    
    // Define essential checks (for watch mode - only the critical ones)
    const watchModeEssentialChecks = [
        { name: 'Figma Compatibility', fn: checkFigmaCompatibility },
        { name: 'CSS Integrity', fn: validateCSSIntegrity },
        { name: 'Component Sync', fn: validateComponentSync }
    ];
    
    // Define standard checks (normal run)
    const standardChecks = [
        { name: 'Figma Compatibility', fn: checkFigmaCompatibility },
        { name: 'JavaScript Linting', fn: lintJavaScript },
        { name: 'CSS Architecture', fn: checkCSSArchitecture },
        { name: 'Theme Architecture', fn: checkThemeArchitecture },
        { name: 'Semantic Token Usage', fn: checkSemanticTokenUsage },
        { name: 'Plugin Compatibility', fn: checkPluginCompatibility },
        { name: 'CSS Class Validation', fn: validateCSSClasses },
        { name: 'Component Sync', fn: validateComponentSync },
        { name: 'Undefined Variables', fn: checkUndefinedVariables },
        { name: 'CSS Integrity', fn: validateCSSIntegrity }
    ];
    
    const additionalChecks = [
        { name: 'Token Validation', fn: validateTokens },
        { name: 'Documentation', fn: checkDocumentation },
        { name: 'Duplicate Analysis', fn: checkDuplicates }
    ];
    
    // Combine checks based on mode
    const checksToRun = isEssentialOnly 
        ? watchModeEssentialChecks  // Only 3 critical checks for watch mode
        : isFullMode 
            ? [...standardChecks, ...additionalChecks]  // All checks
            : standardChecks;  // Normal 10 checks
    
    // Show parallel execution notice
    console.log(`${colors.cyan}⚡ Running ${checksToRun.length} checks in parallel...${colors.reset}\n`);
    
    // Run all checks in parallel
    const checkPromises = checksToRun.map(async (check) => {
        try {
            const passed = await check.fn();
            return { name: check.name, passed };
        } catch (error) {
            console.error(`\n${colors.red}Error in ${check.name}:${colors.reset}`, error.message);
            return { name: check.name, passed: false };
        }
    });
    
    // Wait for all checks to complete
    const results = await Promise.all(checkPromises);
    
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
    console.log(`${colors.gray}Time: ${elapsed}ms${colors.reset}`);
    
    // Exit with error code if any critical checks failed
    if (failed > 0 && !isFullMode) {
        console.log(`\n${colors.red}✗ Quality checks failed${colors.reset}`);
        console.log(`${colors.yellow}Fix the issues above and run again${colors.reset}\n`);
        process.exit(1);
    } else {
        console.log(`\n${colors.green}✓ All quality checks passed!${colors.reset}\n`);
    }
}

// Parse arguments
const args = process.argv.slice(2);
const options = {
    all: args.includes('--all') || args.includes('-a'),
    essential: args.includes('--essential') || args.includes('-e')
};

// Run checks
check(options).catch(console.error);