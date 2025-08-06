# CSS-Specific Static Analysis Tools for Token Exporter

This document outlines CSS-specific static analysis tools and configurations to complement Semgrep for the Token Exporter project, addressing the specific issues identified in the diagnostic.

## Overview

The Token Exporter project has several CSS-specific issues that require specialized tooling beyond general-purpose static analysis:

1. **125 Context-based overrides** (`.figma-plugin`, `.advanced-mode`)
2. **284 Hardcoded values** instead of design tokens
3. **Missing plugin UI classes** causing broken user experience
4. **Non-semantic naming patterns** breaking component isolation

## Tool Categories & Implementations

### 1. Enhanced Stylelint Configuration

**Current Issue**: The existing `.stylelintrc.json` is too permissive and doesn't catch design token anti-patterns.

**Solution**: Enhanced Stylelint configuration with design token enforcement.

#### Key Rules for Token Exporter Issues:

```json
{
  "plugins": [
    "stylelint-plugin-design-tokens",
    "stylelint-plugin-defensive-css", 
    "stylelint-a11y"
  ],
  "rules": {
    // Context Override Detection
    "selector-disallowed-list": [
      ["/^\\.(figma-plugin|advanced-mode|info-panel-a)\\s+/"],
      {
        "message": "Avoid context-based overrides. Use component variants instead.",
        "severity": "error"
      }
    ],
    
    // Hardcoded Value Prevention
    "declaration-property-value-disallowed-list": {
      "padding": ["/^[0-9]+px$/", "/^[0-9]+rem$/"],
      "margin": ["/^[0-9]+px$/", "/^[0-9]+rem$/"],
      "color": ["/^#[0-9a-fA-F]{3,8}$/"],
      "message": "Use design tokens instead of hardcoded values"
    },
    
    // BEM Convention Enforcement
    "selector-class-pattern": [
      "^([a-z][a-z0-9]*)(__[a-z0-9]+)?(--[a-z0-9]+)?$",
      {
        "message": "Use BEM naming: .block__element--modifier"
      }
    ]
  }
}
```

#### Installation & Usage:

```bash
npm install --save-dev \
  stylelint-plugin-design-tokens \
  stylelint-plugin-defensive-css \
  stylelint-a11y \
  @primer/stylelint-config

# Enhanced linting
npm run lint:css:enhanced
```

### 2. PostCSS Design Token Validator

**Purpose**: Catches hardcoded values and context overrides during build process.

**Key Features**:
- Detects `.figma-plugin .btn` override patterns
- Validates color token usage (`var(--color-*)`)
- Enforces spacing token patterns (`var(--size-*)`)
- Calculates selector specificity

#### Example Validation:

```css
/* ❌ Detected Anti-pattern */
.figma-plugin .btn-sm {
  padding: 4px 8px; /* Hardcoded values */
}

/* ✅ Recommended Pattern */
.btn--plugin {
  padding: var(--size-1) var(--size-2);
}
```

#### Integration:

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('./postcss.design-tokens.js')({
      contextOverrides: ['.figma-plugin', '.advanced-mode'],
      tokenPrefix: '--',
      enforceTokenUsage: ['color', 'padding', 'margin', 'font-size']
    })
  ]
}
```

### 3. Custom Design System Linter

**Purpose**: Project-specific validation for Token Exporter architecture.

**Key Checks**:
1. **Context Override Detection**: Finds all 125 problematic overrides
2. **Missing Component Classes**: Detects missing `.plugin-header`, `.theme-toggle-*` classes
3. **Token Usage Validation**: Ensures consistent token patterns
4. **BEM Convention Compliance**: Validates naming conventions

#### Sample Report:

```
🔍 Design System Linting Results
============================================================
🔴 Errors: 22        (Missing plugin UI classes)
🟡 Warnings: 125     (Context overrides)
🔵 Info: 284         (Hardcoded values)
📦 Total Issues: 431

Issues by Type:
  context-override: 125    (🎯 Priority #1)
  missing-token: 284       (🎯 Priority #2)
  missing-classes: 7       (🎯 Priority #0 - CRITICAL)
  bem-convention: 15
```

#### Usage:

```bash
node design-system-linter.js
# Generates reports/design-system-lint.json with actionable recommendations
```

### 4. Accessibility-Focused CSS Analysis

**Purpose**: Validates WCAG compliance and accessibility patterns.

#### Key Validations:

1. **Color Contrast**: Ensures 4.5:1 ratio minimum
2. **Focus States**: Validates `:focus-visible` implementations  
3. **Font Sizes**: Prevents sub-14px text
4. **Motion Sensitivity**: Enforces `prefers-reduced-motion`

#### Specific Rules for Token Exporter:

```css
/* Theme Toggle Accessibility Requirements */
.theme-toggle {
  /* ✅ Required: Minimum 44x44px touch target */
  min-width: var(--size-11);  /* 44px */
  min-height: var(--size-11);
  
  /* ✅ Required: Visible focus indicator */
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* ✅ Required: High contrast support */
@media (prefers-contrast: high) {
  .theme-toggle-track {
    border: 2px solid currentColor;
  }
}
```

### 5. Integration with Existing Tools

#### Enhanced Package.json Scripts:

```json
{
  "scripts": {
    // Enhanced CSS linting
    "lint:css:enhanced": "stylelint docs/design-system.css --config .stylelintrc.enhanced.json",
    "lint:css:tokens": "node design-system-linter.js",
    "lint:css:a11y": "stylelint docs/design-system.css --config css-a11y-config.js",
    
    // Integration with existing audit
    "audit:enhanced": "npm run audit && npm run lint:css:enhanced && npm run lint:css:tokens",
    
    // Pre-commit hooks
    "pre-commit:css": "npm run lint:css:enhanced && npm run lint:css:tokens"
  }
}
```

#### Git Hooks Integration:

```json
{
  "lint-staged": {
    "docs/design-system.css": [
      "stylelint --config .stylelintrc.enhanced.json --fix",
      "node design-system-linter.js",
      "npm run check"
    ]
  }
}
```

## Addressing Specific Token Exporter Issues

### Issue #1: Missing Plugin UI Classes (CRITICAL)

**Current Problem**:
```html
<!-- ❌ No CSS for these classes -->
<div class="plugin-header">
  <button class="theme-toggle">
    <span class="theme-toggle-track">
      <span class="theme-toggle-thumb">
```

**Detection Method**:
```javascript
// Custom rule in design-system-linter.js
checkMissingClasses(html, css) {
  const requiredClasses = [
    'plugin-header', 'theme-toggle-track', 'theme-toggle-thumb',
    'theme-icon', 'export-cards-section'
  ];
  
  requiredClasses.forEach(className => {
    if (html.includes(className) && !css.includes('.' + className)) {
      this.addError(`Missing CSS for class: .${className}`);
    }
  });
}
```

### Issue #2: Context Override Anti-patterns (125 instances)

**Current Problem**:
```css
/* ❌ 15 instances of figma-plugin overrides */
.figma-plugin .btn-sm { padding: 4px 8px !important; }
.figma-plugin .content-wrapper { padding: var(--size-3); }

/* ❌ 7 instances of advanced-mode overrides */  
.advanced-mode .token-type-stat { cursor: pointer; }
.advanced-mode .collection-item { cursor: pointer; }
```

**Detection & Fix**:
```javascript
// Detects in design-system-linter.js
checkContextOverrides(rule) {
  const antiPatterns = ['.figma-plugin ', '.advanced-mode '];
  antiPatterns.forEach(pattern => {
    if (rule.selector.includes(pattern)) {
      this.addError({
        message: `Context override: ${rule.selector}`,
        suggestion: `Use .${getBaseClass(rule)}--${getModifier(pattern)} instead`
      });
    }
  });
}
```

**Automated Fix Suggestions**:
```css
/* ✅ BEM Alternative */
.btn--plugin { padding: var(--size-1) var(--size-2); }
.content-wrapper--plugin { padding: var(--size-3); }
.token-type-stat--advanced { cursor: pointer; }
```

### Issue #3: Hardcoded Values (284 instances)

**Detection Pattern**:
```javascript
// PostCSS plugin detects patterns like:
const hardcodedPatterns = {
  pixels: /^\d+px$/,           // "12px", "24px"
  rems: /^\d*\.?\d+rem$/,      // "1.5rem", "0.85rem"
  hexColors: /^#[0-9a-fA-F]+$/, // "#007acc", "#f5f5f5"
  namedColors: /^(red|blue|green)$/i
};
```

**Token Replacement Suggestions**:
```css
/* ❌ Current */
padding: 8px 12px;
color: #007acc;
font-size: 14px;

/* ✅ With Tokens */
padding: var(--size-2) var(--size-3);
color: var(--color-primary);
font-size: var(--font-size-sm);
```

## Implementation Timeline

### Phase 1: Critical Issues (Week 1)
1. ✅ Install enhanced Stylelint configuration
2. ✅ Create design-system-linter.js
3. ✅ Set up PostCSS token validator
4. 🔄 Run initial audit to baseline issues

### Phase 2: Integration (Week 2) 
1. Integrate with existing `npm run audit` script
2. Add pre-commit hooks for CSS validation
3. Configure CI/CD pipeline integration
4. Create actionable fix recommendations

### Phase 3: Systematic Fixes (Week 3-4)
1. Address missing plugin UI classes (7 classes)
2. Convert context overrides to BEM modifiers (125 instances)
3. Replace hardcoded values with tokens (284 instances)
4. Validate accessibility improvements

## Expected Outcomes

### Immediate Benefits:
- **Automated Detection**: Catch new context overrides before they merge
- **Consistent Patterns**: Enforce BEM and token usage
- **Accessibility Validation**: Prevent WCAG violations
- **Performance Insights**: Flag expensive CSS patterns

### Long-term Benefits:
- **Component Isolation**: No more specificity wars
- **Design Consistency**: Systematic token usage
- **Maintainability**: Clear architectural patterns
- **Team Productivity**: Automated guidance for developers

## Tool Comparison Matrix

| Tool | Context Overrides | Token Usage | Missing Classes | A11y | Performance |
|------|:----------------:|:-----------:|:---------------:|:----:|:-----------:|
| **Enhanced Stylelint** | ✅ | ✅ | ❌ | ✅ | ✅ |
| **PostCSS Validator** | ✅ | ✅ | ❌ | ✅ | ✅ |  
| **Design System Linter** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **CSS A11y Config** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Existing Stylelint** | ❌ | ❌ | ❌ | ❌ | ❌ |

## Files Created

1. **`.stylelintrc.enhanced.json`** - Advanced Stylelint configuration
2. **`postcss.design-tokens.js`** - PostCSS plugin for token validation
3. **`design-system-linter.js`** - Custom linter for project-specific issues
4. **`css-a11y-config.js`** - Accessibility validation configuration
5. **`.eslintrc.css-in-js.json`** - CSS-in-JS specific rules (future-proofing)

## Next Steps

1. **Review configurations** with the development team
2. **Run initial audit** to establish baseline metrics
3. **Integrate with CI/CD** pipeline for automated validation  
4. **Begin systematic fixes** starting with critical missing classes
5. **Monitor improvements** through automated reporting

---

*This analysis specifically addresses the Token Exporter project's CSS architecture issues identified in the diagnostic document, providing targeted tools and configurations for systematic resolution.*