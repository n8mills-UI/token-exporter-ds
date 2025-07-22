/**
 * Lightweight Accessibility Checker
 * Focuses on color contrast validation for WCAG AA compliance
 * Version: 1.0.0
 */

class AccessibilityChecker {
    constructor() {
        this.violations = [];
        this.wcagAANormal = 4.5;  // WCAG AA for normal text
        this.wcagAALarge = 3.0;   // WCAG AA for large text (18pt+ or 14pt+ bold)
    }

    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Calculate relative luminance
     * https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
     */
    getLuminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    /**
     * Calculate contrast ratio between two colors
     */
    getContrastRatio(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return null;

        const lum1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
        
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }

    /**
     * Get computed styles for an element
     */
    getComputedColors(element) {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;

        return {
            color: this.rgbToHex(color),
            backgroundColor: this.rgbToHex(backgroundColor),
            fontSize,
            fontWeight: this.isNumeric(fontWeight) ? parseInt(fontWeight) : (fontWeight === 'bold' ? 700 : 400),
            isLarge: fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700))
        };
    }

    /**
     * Convert RGB string to hex
     */
    rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const rgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (!rgbMatch) return null;
        
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Check if a value is numeric
     */
    isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    /**
     * Check contrast for a specific element
     */
    checkElementContrast(element) {
        const colors = this.getComputedColors(element);
        
        if (!colors.color || !colors.backgroundColor || colors.backgroundColor === '#000000') {
            return null; // Skip if no background or transparent
        }

        const contrastRatio = this.getContrastRatio(colors.color, colors.backgroundColor);
        if (!contrastRatio) return null;

        const requiredRatio = colors.isLarge ? this.wcagAALarge : this.wcagAANormal;
        const passes = contrastRatio >= requiredRatio;

        return {
            element,
            contrastRatio: Math.round(contrastRatio * 100) / 100,
            requiredRatio,
            passes,
            colors,
            isLarge: colors.isLarge
        };
    }

    /**
     * Scan entire document for contrast violations
     */
    scanDocument() {
        this.violations = [];
        const textElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, button, a, label, li, td, th');
        
        textElements.forEach(element => {
            // Skip if element has no text content
            if (!element.textContent.trim()) return;
            
            const result = this.checkElementContrast(element);
            if (result && !result.passes) {
                this.violations.push(result);
            }
        });

        return this.violations;
    }

    /**
     * Check specific color combinations (for design tokens)
     */
    checkColorCombination(foreground, background, isLarge = false) {
        const contrastRatio = this.getContrastRatio(foreground, background);
        const requiredRatio = isLarge ? this.wcagAALarge : this.wcagAANormal;
        
        return {
            foreground,
            background,
            contrastRatio: Math.round(contrastRatio * 100) / 100,
            requiredRatio,
            passes: contrastRatio >= requiredRatio,
            isLarge
        };
    }

    /**
     * Generate accessibility report
     */
    generateReport() {
        const violations = this.scanDocument();
        
        return {
            summary: {
                totalViolations: violations.length,
                timestamp: new Date().toISOString(),
                wcagLevel: 'AA'
            },
            violations: violations.map(v => ({
                element: v.element.tagName.toLowerCase(),
                text: v.element.textContent.trim().substring(0, 50) + '...',
                contrastRatio: v.contrastRatio,
                requiredRatio: v.requiredRatio,
                foregroundColor: v.colors.color,
                backgroundColor: v.colors.backgroundColor,
                isLarge: v.isLarge,
                severity: v.contrastRatio < 3 ? 'critical' : 'warning'
            }))
        };
    }

    /**
     * Create visual indicators for violations
     */
    highlightViolations() {
        const violations = this.scanDocument();
        
        violations.forEach(violation => {
            violation.element.style.outline = '2px solid red';
            violation.element.style.outlineOffset = '2px';
            violation.element.setAttribute('data-a11y-violation', 
                `Contrast: ${violation.contrastRatio} (needs ${violation.requiredRatio})`);
        });

        return violations.length;
    }

    /**
     * Remove violation highlights
     */
    clearHighlights() {
        const highlightedElements = document.querySelectorAll('[data-a11y-violation]');
        highlightedElements.forEach(element => {
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.removeAttribute('data-a11y-violation');
        });
    }

    /**
     * Test common design system color combinations
     */
    testDesignTokens() {
        const commonCombinations = [
            // Brand colors on white
            { fg: '#D2FF37', bg: '#FFFFFF', name: 'Brand Lime on White' },
            { fg: '#FFFFFF', bg: '#D2FF37', name: 'White on Brand Lime' },
            
            // Text colors
            { fg: '#1E1E1E', bg: '#FFFFFF', name: 'Primary Text on White' },
            { fg: '#666666', bg: '#FFFFFF', name: 'Secondary Text on White' },
            { fg: '#999999', bg: '#FFFFFF', name: 'Tertiary Text on White' },
            
            // Dark backgrounds
            { fg: '#FFFFFF', bg: '#1E1E1E', name: 'White on Dark' },
            { fg: '#D2FF37', bg: '#1E1E1E', name: 'Brand Lime on Dark' },
            
            // Category colors
            { fg: '#FFFFFF', bg: '#00D4FF', name: 'White on Cyan' },
            { fg: '#FFFFFF', bg: '#8B5CF6', name: 'White on Purple' },
            { fg: '#FFFFFF', bg: '#F97316', name: 'White on Orange' },
            { fg: '#FFFFFF', bg: '#EC4899', name: 'White on Pink' },
        ];

        return commonCombinations.map(combo => ({
            ...combo,
            ...this.checkColorCombination(combo.fg, combo.bg)
        }));
    }
}

// Create and expose global instance
window.AccessibilityChecker = AccessibilityChecker;
window.a11yChecker = new AccessibilityChecker();

// Console helpers
window.checkA11y = () => {
    console.log('🔍 Running accessibility scan...');
    const report = window.a11yChecker.generateReport();
    console.log(`Found ${report.summary.totalViolations} contrast violations`);
    if (report.violations.length > 0) {
        console.table(report.violations);
    }
    return report;
};

window.highlightA11y = () => {
    const count = window.a11yChecker.highlightViolations();
    console.log(`🚨 Highlighted ${count} accessibility violations`);
    return count;
};

window.clearA11y = () => {
    window.a11yChecker.clearHighlights();
    console.log('✅ Cleared accessibility highlights');
};

window.testTokens = () => {
    console.log('🎨 Testing design token color combinations...');
    const results = window.a11yChecker.testDesignTokens();
    const failing = results.filter(r => !r.passes);
    console.log(`${failing.length} of ${results.length} token combinations fail WCAG AA`);
    console.table(results);
    return results;
};

console.log('♿ Accessibility Checker loaded. Use checkA11y(), highlightA11y(), clearA11y(), or testTokens() in console.');