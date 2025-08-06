# 🔍 Semgrep & CSS Analysis Tools - Comprehensive Research

## 📚 Semgrep Community Registry Overview

### What is Semgrep Registry?
- **2,000+ community rules** covering 30+ languages
- **Free access** at https://semgrep.dev/r
- **GitHub repository**: https://github.com/semgrep/semgrep-rules
- **Categories**: Security, Correctness, Best Practices, Framework-specific

### Current Language Support
```
✅ Excellent: JavaScript, TypeScript, Python, Go, Java
⚠️  Limited: HTML (basic rules only)
❌ Missing: CSS, SCSS, Design Tokens
```

## 🎯 Relevant Rules for Token Exporter

### JavaScript/TypeScript Security Rules
```bash
# Run comprehensive JavaScript/TypeScript analysis
semgrep --config=p/javascript --config=p/typescript .

# Specific high-value rules for your project:
semgrep --config=r/javascript.lang.security.audit.path-traversal
semgrep --config=r/javascript.lang.security.audit.prototype-pollution
semgrep --config=r/typescript.react.security.audit.react-dangerouslysetinnerhtml
```

### Current Findings from Auto Config
- **24 findings** identified with `--config=auto`
- **6 shell injection warnings** (mostly false positives for dev scripts)
- **4 path traversal risks** (actual concerns)
- **1 prototype pollution** in src/code.js
- **5 GitHub Actions security issues**

## 🎨 CSS & Design System Analysis Tools

### 1. **Enhanced Stylelint Configuration**
Since Semgrep doesn't support CSS, use Stylelint with custom rules:

```json
{
  "extends": ["stylelint-config-standard"],
  "plugins": [
    "stylelint-no-unsupported-browser-features",
    "stylelint-high-performance-animation",
    "stylelint-design-tokens"
  ],
  "rules": {
    "selector-max-compound-selectors": 2,
    "selector-no-qualifying-type": true,
    "no-descending-specificity": true,
    "custom-property-pattern": "^--[a-z]+(-[a-z]+)*$",
    "declaration-property-value-disallowed-list": {
      "/.*/": ["/^#/", "/^rgb/", "/\\dpx/"]
    }
  }
}
```

### 2. **PostCSS Validation Pipeline**
```javascript
// postcss.config.js for design token validation
module.exports = {
  plugins: [
    require('postcss-design-tokens')({
      tokens: './style-dictionary/tokens.json',
      enforceUsage: true,
      warnOnHardcoded: true
    }),
    require('postcss-bem-linter')({
      preset: 'bem'
    })
  ]
}
```

### 3. **Custom CSS Linting for Your Issues**
```javascript
// custom-css-linter.js
const contextOverrides = [
  /\.figma-plugin\s+\./,
  /\.advanced-mode\s+\./,
  /\.info-panel-a\s+\./
];

const hardcodedValues = [
  /:\s*\d+px/,
  /:\s*\d+(\.\d+)?rem/,
  /:\s*#[0-9a-f]{3,6}/i
];
```

## 🔒 Figma Plugin Security Patterns

### Critical Security Considerations
1. **Message Validation** - Validate all postMessage communications
2. **Token Sanitization** - Sanitize design token names for each platform
3. **Export Size Limits** - Prevent memory exhaustion (already implemented)
4. **Network Whitelist** - Restrict external domains (already in manifest.json)

### Custom Semgrep Rules for Figma Plugins
```yaml
# figma-security.yaml
rules:
  - id: figma-unsafe-postmessage
    pattern: figma.ui.postMessage($DATA)
    message: "Validate message data before sending"
    languages: [javascript, typescript]
    severity: WARNING

  - id: figma-missing-message-validation
    pattern: |
      figma.ui.onmessage = (msg) => {
        $BODY
      }
    pattern-not-inside: |
      if (!validateMessage(msg)) { ... }
    message: "Add message validation"
    severity: ERROR

  - id: design-token-exposure
    pattern: console.log($TOKEN)
    message: "Avoid logging sensitive design data"
    languages: [javascript]
    severity: INFO
```

## 🚀 Recommended Tool Stack

### Immediate Implementation (High ROI)
1. **Stylelint** - Already in package.json, needs enhanced config
2. **Semgrep JavaScript rules** - Use p/javascript and p/typescript
3. **Custom validation script** - For your 125 context overrides

### Phase 2 Additions
1. **PostCSS plugins** - For build-time token validation
2. **Custom Semgrep rules** - For Figma-specific patterns
3. **CSS Stats integration** - Already have, enhance usage

### Phase 3 Advanced
1. **Design token linter** - Custom tool for token consistency
2. **Accessibility validator** - Enhance pa11y integration
3. **Component isolation checker** - Prevent context overrides

## 📊 Comparison: Semgrep vs CSS Tools

| Tool | Strengths | Weaknesses | Use For |
|------|-----------|------------|---------|
| **Semgrep** | JavaScript/TS security, Fast, Free | No CSS support | Security, JS patterns |
| **Stylelint** | CSS-specific, Extensible, Active community | Not security-focused | CSS quality, conventions |
| **PostCSS** | Build integration, Token validation | Requires setup | Design system compliance |
| **Custom Linters** | Project-specific, Exact issue targeting | Maintenance burden | Your specific issues |

## 🎯 Action Items for Token Exporter

### Quick Wins (Today)
```bash
# 1. Run focused Semgrep analysis
semgrep --config=p/javascript --config=p/typescript src/

# 2. Create custom Stylelint config
echo '{
  "rules": {
    "selector-max-compound-selectors": 2,
    "no-descending-specificity": true
  }
}' > .stylelintrc.custom.json

# 3. Validate existing issues
grep -r "\.figma-plugin\s\+\." docs/design-system.css
```

### This Week
1. Implement message validation layer in src/code.js
2. Add CSS linting to pre-commit hooks
3. Create custom rules for context overrides

### This Month
1. Build comprehensive design token validator
2. Integrate all tools into CI/CD pipeline
3. Document security best practices

## 🔗 Essential Resources

### Official Documentation
- **Semgrep Registry**: https://semgrep.dev/r
- **Rule Writing**: https://semgrep.dev/learn
- **Playground**: https://semgrep.dev/playground

### Community Rules
- **Semgrep Rules**: https://github.com/semgrep/semgrep-rules
- **Trail of Bits**: https://github.com/trailofbits/semgrep-rules
- **r2c Community**: https://github.com/returntocorp/semgrep-rules

### CSS/Design System Tools
- **Stylelint**: https://stylelint.io/
- **PostCSS**: https://postcss.org/
- **Design Tokens Community**: https://github.com/design-tokens/community-group

## 💡 Key Insight

While Semgrep excels at JavaScript/TypeScript security analysis, it currently lacks CSS support. For comprehensive Token Exporter analysis, combine:

1. **Semgrep** for JavaScript security patterns
2. **Stylelint** for CSS quality and conventions
3. **Custom scripts** for your specific architectural issues (context overrides, hardcoded values)

This multi-tool approach addresses both security and design system quality, perfectly suited for a Figma plugin that bridges design and development.

---

*Generated from parallel agent research on Semgrep community rules, CSS analysis tools, and Figma plugin security patterns.*