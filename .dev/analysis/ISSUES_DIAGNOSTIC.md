# 🔍 Token Exporter Issues - Visual Diagnostic Document

*This is a living document that will be updated as we progress through fixes*

---

## 🎯 Issue #1: Missing Plugin UI Classes (CRITICAL)

### Visual Mockup: Theme Toggle Appearance

#### ❌ CURRENT STATE (Broken):
```
┌──────────────────────────────────┐
│                                  │
│  [Button with no styling]        │
│  Sun Moon                        │
│                                  │
└──────────────────────────────────┘
```
- No visual feedback
- Icons overlap
- No track/thumb visible
- Looks like plain text

#### ✅ EXPECTED STATE (With CSS):
```
┌──────────────────────────────────┐
│                            ╭─────╮│
│                            │ ◐◐◐ ││
│                            ╰─────╯│
└──────────────────────────────────┘

Light Mode:                Dark Mode:
╭───────────╮              ╭───────────╮
│ ☀️  ◯────│              │────◯  🌙 │
╰───────────╯              ╰───────────╯
```

### HTML Structure That Needs Styling:
```html
<div class="plugin-header">                     <!-- ❌ Missing CSS -->
    <button class="theme-toggle" id="theme-toggle">
        <span class="theme-toggle-track">       <!-- ❌ Missing CSS -->
            <span class="theme-toggle-thumb">   <!-- ❌ Missing CSS -->
                <i data-icon="sun" class="theme-icon theme-icon-light"></i>   <!-- ❌ Missing CSS -->
                <i data-icon="moon" class="theme-icon theme-icon-dark"></i>   <!-- ❌ Missing CSS -->
            </span>
        </span>
    </button>
</div>

<div class="export-cards-section">              <!-- ❌ Missing CSS -->
    <!-- Export cards go here -->
</div>
```

### CSS Classes Needed:
```css
/* These classes are COMPLETELY MISSING from design-system.css */

.plugin-header {
    /* Needs: flex layout, padding, alignment */
}

.theme-toggle-track {
    /* Needs: pill shape, background gradient, size */
}

.theme-toggle-thumb {
    /* Needs: circular shape, white background, animation */
}

.theme-icon {
    /* Needs: absolute positioning, transitions */
}

.theme-icon-light {
    /* Needs: visible in light mode, hidden in dark */
}

.theme-icon-dark {
    /* Needs: hidden in light mode, visible in dark */
}

.export-cards-section {
    /* Needs: flex column, gap spacing */
}
```

### PROPOSED CSS IMPLEMENTATION

**⚠️ NOTE: This is a PROPOSED fix that has NOT been implemented yet. This shows the exact CSS code needed to fix the Plugin UI classes issue.**

```css
/* ===================================================================
   PLUGIN UI CLASSES - COMPLETE IMPLEMENTATION
   ================================================================= */

/* Plugin Header Layout */
.plugin-header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: var(--size-3) var(--size-4);
    background: var(--color-surface-primary);
    border-bottom: var(--border-size-1) solid var(--color-border-subtle);
    min-height: var(--size-12);
    position: relative;
    z-index: 10;
}

/* Theme Toggle Track Container */
.theme-toggle-track {
    width: 100%;
    height: 100%;
    border-radius: 19px;
    background: var(--theme-toggle-gradient);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animated Thumb */
.theme-toggle-thumb {
    position: absolute;
    width: 32px;
    height: 32px;
    background: var(--color-surface-primary);
    border-radius: 50%;
    box-shadow: 
        0 2px 4px rgba(0, 0, 0, 0.1),
        0 4px 8px rgba(0, 0, 0, 0.06),
        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

/* Dark mode thumb position */
[data-theme="dark"] .theme-toggle-thumb {
    transform: translateX(47px);
    background: var(--color-surface-secondary);
    box-shadow: 
        0 2px 6px rgba(0, 0, 0, 0.25),
        0 4px 12px rgba(0, 0, 0, 0.15),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Base Theme Icon Styles */
.theme-icon {
    position: absolute;
    width: var(--icon-sm);
    height: var(--icon-sm);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: scale(0.8);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Light Mode Icon (Sun) */
.theme-icon-light {
    color: var(--color-yellow-400);
    left: 8px;
    top: 50%;
    transform: translateY(-50%) scale(0.8);
}

/* Show sun icon in light mode */
[data-theme="light"] .theme-icon-light,
:root:not([data-theme="dark"]) .theme-icon-light {
    opacity: 1;
    transform: translateY(-50%) scale(1);
}

/* Dark Mode Icon (Moon) */
.theme-icon-dark {
    color: var(--color-text-inverse);
    right: 8px;
    top: 50%;
    transform: translateY(-50%) scale(0.8);
}

/* Show moon icon in dark mode */
[data-theme="dark"] .theme-icon-dark {
    opacity: 1;
    transform: translateY(-50%) scale(1);
    color: var(--color-cyan-400);
}

/* Active thumb icon */
.theme-toggle-thumb .theme-icon {
    position: relative;
    left: 0;
    top: 0;
    transform: none;
    opacity: 1;
}

/* Light mode: show sun in thumb */
[data-theme="light"] .theme-toggle-thumb .theme-icon-light,
:root:not([data-theme="dark"]) .theme-toggle-thumb .theme-icon-light {
    display: flex;
}

[data-theme="light"] .theme-toggle-thumb .theme-icon-dark,
:root:not([data-theme="dark"]) .theme-toggle-thumb .theme-icon-dark {
    display: none;
}

/* Dark mode: show moon in thumb */
[data-theme="dark"] .theme-toggle-thumb .theme-icon-light {
    display: none;
}

[data-theme="dark"] .theme-toggle-thumb .theme-icon-dark {
    display: flex;
}

/* Export Cards Section */
.export-cards-section {
    display: flex;
    flex-direction: column;
    gap: var(--size-4);
    padding: var(--size-4);
    background: var(--color-surface-primary);
    border-radius: var(--radius-lg);
    margin-top: var(--size-2);
}

/* Enhanced hover states for theme toggle */
.theme-toggle:hover .theme-toggle-thumb {
    transform: translateX(3px) scale(1.05);
    box-shadow: 
        0 4px 8px rgba(0, 0, 0, 0.15),
        0 8px 16px rgba(0, 0, 0, 0.1),
        inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

[data-theme="dark"] .theme-toggle:hover .theme-toggle-thumb {
    transform: translateX(47px) scale(1.05);
    box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.3),
        0 8px 20px rgba(0, 0, 0, 0.2),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

/* Focus states for accessibility */
.theme-toggle:focus-visible {
    outline: 2px solid var(--color-focus-ring);
    outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .theme-toggle-thumb,
    .theme-icon {
        transition: none;
    }
    
    .theme-toggle:hover {
        transform: none;
    }
}
```

### Impact:
- **User Experience**: 🔴 SEVERE - Cannot tell which theme is active
- **Accessibility**: 🔴 WCAG violation - No visual state indication
- **Professional**: 🔴 Plugin looks broken/unfinished

---

## 🎯 Issue #2: Check Script False Positive (HIGH)

### The Error Message:
```bash
$ npm run check

🔍 Plugin Compatibility Check
  ✗ Found 1 plugin compatibility issues:
    • Icon system missing accessibility attributes (aria-label, role)
```

### What The Check Script Looks For (WRONG):
```javascript
// scripts/check.js - Line 977-981
if (iconSystem.includes('aria-label') && iconSystem.includes('role="img"')) {
    // Looking for STATIC strings in HTML
}
```

### What Actually Exists (CORRECT):
```javascript
// src/components/icons/_icon-system.html - Lines 156-162
// ✅ ACCESSIBILITY IS PROPERLY IMPLEMENTED!
if (!element.hasAttribute('role')) {
    element.setAttribute('role', 'img');  // Dynamically adds role
}
if (!element.hasAttribute('aria-label')) {
    element.setAttribute('aria-label', iconName.replace(/-/g, ' '));  // Auto-generates labels
}
```

### Visual Proof - Rendered Icon in Browser:
```html
<!-- What check script expects (static): -->
<i data-icon="check" role="img" aria-label="check"></i>

<!-- What actually happens (dynamic): -->
<i data-icon="check">  <!-- Initial HTML -->
    <!-- JavaScript adds: role="img" aria-label="check" -->
    <svg>...</svg>
</i>
```

### Fix Needed:
```javascript
// Check should look for setAttribute patterns, not static attributes
const hasDynamicAccessibility = 
    iconSystem.includes('setAttribute(\'role\'') && 
    iconSystem.includes('setAttribute(\'aria-label\'');
```

### PROPOSED FIX CODE

**⚠️ NOTE: This is a PROPOSED fix that has NOT been implemented yet. This shows the exact code changes needed to fix the check script false positive.**

#### Exact Location: scripts/check.js Lines 977-981

**BEFORE (Current Broken Code):**
```javascript
// Validate icon system accessibility and consistency
if (iconSystem.includes('aria-label') && iconSystem.includes('role="img"')) {
    console.log(`  ${colors.green}✓${colors.reset} Icon system includes accessibility attributes`);
} else {
    issues.push('Icon system missing accessibility attributes (aria-label, role)');
}
```

**AFTER (Fixed Code):**
```javascript
// Validate icon system accessibility and consistency
// Check for dynamic setAttribute patterns instead of static HTML attributes
const hasDynamicRole = iconSystem.includes('setAttribute(\'role\',') || iconSystem.includes('setAttribute("role",');
const hasDynamicAriaLabel = iconSystem.includes('setAttribute(\'aria-label\',') || iconSystem.includes('setAttribute("aria-label",');

if (hasDynamicRole && hasDynamicAriaLabel) {
    console.log(`  ${colors.green}✓${colors.reset} Icon system includes accessibility attributes (dynamic)`);
} else {
    issues.push('Icon system missing accessibility attributes (aria-label, role)');
}
```

#### Why This Fix Works:

1. **Problem**: The original code searches for static strings `'aria-label'` and `'role="img"'` in the HTML file
2. **Reality**: The accessibility attributes are added dynamically via JavaScript using `setAttribute()`
3. **Solution**: Look for the `setAttribute('role',` and `setAttribute('aria-label',` patterns instead
4. **Coverage**: Handles both single and double quote variations in the JavaScript code
5. **Accuracy**: Matches the actual implementation in `/src/components/icons/_icon-system.html` lines 157-162:
   ```javascript
   element.setAttribute('role', 'img');
   element.setAttribute('aria-label', iconName.replace(/-/g, ' '));
   ```

### Impact:
- **CI/CD**: 🔴 Blocks deployments
- **Developer Time**: 🟡 30+ minutes wasted per developer
- **Trust**: 🟡 Erodes confidence in validation system

---

## 🎯 Issue #3: Context CSS Overrides (125 total)

### Visual Examples of Anti-Patterns:

#### Example 1: Button in Plugin Context
```css
/* ❌ CURRENT (Context Override) */
.figma-plugin .btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

/* HTML affected: */
<div class="figma-plugin">
    <button class="btn btn-sm">Export</button>
</div>
```

**Visual Impact:**
```
Regular Button:        Plugin Button (override):
┌──────────────┐      ┌─────────┐
│   Export     │  →   │ Export  │  (Smaller due to override)
└──────────────┘      └─────────┘
```

#### Example 2: Advanced Mode Overrides
```css
/* ❌ CURRENT (7 overrides) */
.advanced-mode .export-section {
    background: #f5f5f5;
    padding: 24px;
}

/* Creates specificity wars: */
.export-section { }           /* Specificity: 0,1,0 */
.advanced-mode .export-section { }  /* Specificity: 0,2,0 - WINS */
```

### Categorized Breakdown:
```
Total: 125 Context Overrides

🔴 Plugin-Specific (22) - AFFECTS PRODUCTION
   └─ .figma-plugin .* (15)
   └─ .advanced-mode .* (7)

🟡 Guide-Only (38) - AFFECTS DOCUMENTATION
   └─ .info-panel-a .* (22)
   └─ .about-modal-features .* (16)

🟢 Legacy Exemptions (58) - ACCEPTABLE (per CLAUDE.md)
   └─ .profile-card .* (47)
   └─ .about-modal .* (11)

⚪ Utility/Layout (7) - LOW PRIORITY
   └─ .example-container-modal .* (7)
```

### Proposed BEM Solution:
```css
/* ✅ SOLUTION (Component Variants) */
.btn--plugin {
    padding: 4px 8px;
    font-size: 12px;
}

.export-section--advanced {
    background: var(--color-surface-secondary);
    padding: var(--size-6);
}

/* HTML changes needed: */
<button class="btn btn--plugin">Export</button>
<div class="export-section export-section--advanced">
```

---

## 🎯 Issue #4: Hardcoded Values (284 px, 4 rem)

### Visual Consistency Problem:

#### Current Spacing Chaos:
```
Component A: padding: 8px;
Component B: padding: 10px;   (Why not 8?)
Component C: padding: 12px;   (Why not 10?)
Component D: padding: 15px;   (Random!)
Component E: padding: 16px;   (Back to power of 2?)
```

#### With Token System:
```
Component A: padding: var(--size-2);  /* 8px */
Component B: padding: var(--size-2);  /* Consistent! */
Component C: padding: var(--size-3);  /* 12px - Clear scale */
Component D: padding: var(--size-4);  /* 16px - Predictable */
Component E: padding: var(--size-4);  /* Same token = same space */
```

### Examples of Hardcoded Values:
```css
/* ❌ CURRENT - Scattered hardcoded values */
--plugin-width: 340px;              /* Should use: var(--size-container-sm) */
--plugin-height: 480px;             /* Should use: var(--size-container-md) */
--glass-blur-subtle: 2px;           /* Should use: var(--blur-xs) */
--card-min-height-sm: 80px;         /* Should use: var(--size-20) */
--icon-menu: 24px;                  /* Should use: var(--size-6) */
--font-size-0-5: 0.85rem;           /* Should use: var(--font-size-sm) */
```

### Visual Impact on Design:
```
Without Tokens:                    With Tokens:
┌─────────┐                        ┌─────────┐
│ 8px gap │                        │ size-2  │
├─────────┤ Inconsistent     →     ├─────────┤ Harmonious
│ 15px gap│ spacing                │ size-4  │ spacing
├─────────┤                        ├─────────┤
│ 12px gap│                        │ size-3  │
└─────────┘                        └─────────┘
```

---

## 📊 Priority & Impact Matrix

| Issue | Severity | User Impact | Dev Impact | Fix Effort | Priority |
|-------|----------|-------------|------------|------------|----------|
| Plugin UI Classes | 🔴 CRITICAL | Broken UX | None | 2-3 hrs | P0 - IMMEDIATE |
| Check Script | 🔴 HIGH | None | Blocks CI/CD | 30 min | P0 - IMMEDIATE |
| Context Overrides (Plugin) | 🟡 MEDIUM | Layout issues | Tech debt | 8-10 hrs | P1 - THIS WEEK |
| Hardcoded Values | 🟡 MEDIUM | Inconsistent | Maintenance | 20-30 hrs | P2 - THIS MONTH |
| Context Overrides (Guide) | 🟢 LOW | Docs only | Tech debt | 6-8 hrs | P2 - THIS MONTH |

---

## ✅ Fix Progress Tracker

### Wave 1: Critical Fixes
- [ ] Add missing Plugin UI classes (7 classes)
- [ ] Fix check script false positive
- [ ] Test plugin theme toggle works

### Wave 2: High Priority
- [ ] Convert .figma-plugin overrides (15)
- [ ] Convert .advanced-mode overrides (7)
- [ ] Create core token scales

### Wave 3: Medium Priority
- [ ] Convert guide-only overrides (38)
- [ ] Replace hardcoded values with tokens
- [ ] Add linting rules

---

## 📝 Notes Section
*This section will be updated as fixes are implemented*

**Current Status**: Diagnostic complete, awaiting review before fixes
**Last Updated**: Initial creation
**Next Steps**: Review mockups and approve fix strategy

---

*End of diagnostic document - will be updated as we progress*

---

## 🔒 Semgrep Security & Code Quality Analysis

### Summary
**24 findings identified** across security, performance, and code quality categories. Most findings are **false positives or low-risk** for a Figma plugin context, but several warrant attention for defense-in-depth security practices.

### Findings by Severity & Type

#### 🔴 Shell Injection Risks (6 findings)
**Location**: Scripts using `spawn()` with `shell: true`

**What the risk is**:
- Using `child_process.spawn()` with `shell: true` can allow command injection if user input reaches the command string
- Attackers could potentially execute arbitrary system commands

**Why it matters for this project**:
- **LOW RISK**: Figma plugins run in sandboxed environment with limited system access
- Scripts are development-only tools, not production runtime code
- No direct user input is processed in shell commands

**Quick fix recommendations**:
```javascript
// ❌ Current (flagged by Semgrep)
spawn(command, { shell: true })

// ✅ Safer approach
spawn(command, args, { shell: false })
// OR validate/sanitize any dynamic parts
```

#### 🟡 Path Traversal Risks (4 findings)
**Location**: Usage of `path.join()` and `path.resolve()`

**What the risk is**:
- Improper path handling could allow accessing files outside intended directories
- `../../../etc/passwd` type attacks

**Why it matters for this project**:
- **MEDIUM RISK**: File operations exist in build scripts
- Plugin has controlled file access patterns
- Risk mainly in development tooling, not runtime

**Quick fix recommendations**:
```javascript
// ❌ Potentially unsafe
path.join(userInput, fileName)

// ✅ Safer with validation
const safePath = path.resolve(baseDir, path.normalize(fileName))
if (!safePath.startsWith(path.resolve(baseDir))) {
  throw new Error('Path traversal attempt detected')
}
```

#### 🟡 RegExp DoS Risks (5 findings)
**Location**: Non-literal regular expressions

**What the risk is**:
- Complex regex patterns can cause catastrophic backtracking
- `(a+)+b` against `aaaaaaaaaaaaaaaaac` = exponential time

**Why it matters for this project**:
- **LOW-MEDIUM RISK**: Limited user input processing in Figma plugins
- Build-time regex usage is controlled
- No user-generated regex patterns

**Quick fix recommendations**:
```javascript
// ❌ Dynamic regex (flagged)
const regex = new RegExp(userPattern)

// ✅ Safer alternatives
const safePattern = escapeRegExp(userPattern)
const regex = new RegExp(safePattern)
// OR use literal regex where possible
```

#### 🟢 Unsafe Format Strings (3 findings)
**Location**: `console.log()` with string concatenation

**What the risk is**:
- String concatenation in logging can lead to format string vulnerabilities
- Potential information disclosure through log injection

**Why it matters for this project**:
- **VERY LOW RISK**: Console logs are development/debugging only
- No production logging with user data
- Figma plugin context limits exposure

**Quick fix recommendations**:
```javascript
// ❌ String concatenation (flagged)
console.log('User: ' + userInput)

// ✅ Template literals or array logging
console.log(`User: ${userInput}`)
console.log('User:', userInput)
```

#### 🟡 Prototype Pollution Risk (1 finding)
**Location**: Object manipulation without safety checks

**What the risk is**:
- Modifying object prototypes can affect all objects of that type
- Can lead to unexpected behavior or security vulnerabilities

**Why it matters for this project**:
- **LOW-MEDIUM RISK**: Limited object manipulation from external sources
- Plugin environment provides some isolation
- Worth fixing for code quality

**Quick fix recommendations**:
```javascript
// ❌ Potential prototype pollution
for (const key in userObject) {
  targetObject[key] = userObject[key]
}

// ✅ Safer object merging
for (const key in userObject) {
  if (userObject.hasOwnProperty(key) && key !== '__proto__') {
    targetObject[key] = userObject[key]
  }
}
// OR use Object.assign() / spread operator
```

#### 🟡 GitHub Actions Security (5 findings)
**Location**: Workflow files using potentially unsafe practices

**What the risk is**:
- Untrusted input in workflows can lead to code injection
- Broad permissions can expose secrets or allow unauthorized actions

**Why it matters for this project**:
- **MEDIUM RISK**: CI/CD security is important for supply chain
- Actions have access to repository secrets
- Can affect deployment pipeline integrity

**Quick fix recommendations**:
```yaml
# ❌ Potentially unsafe
- run: echo "${{ github.event.issue.title }}"

# ✅ Safer with input validation
- run: echo "Issue title processed"
  env:
    ISSUE_TITLE: ${{ github.event.issue.title }}
```

### Priority Assessment

#### 🔴 **Actual Security Risks (Should Fix)**
1. **GitHub Actions security** - Supply chain risk, affects CI/CD
2. **Path traversal in build scripts** - Could expose sensitive files during development
3. **Prototype pollution** - Code quality issue that could become security risk

#### 🟡 **Defense-in-Depth (Good Practice)**
1. **RegExp DoS patterns** - Add input validation/timeouts
2. **Shell injection patterns** - Use safer spawn alternatives

#### 🟢 **False Positives for Figma Plugin Context**
1. **Console.log format strings** - Development-only, low risk
2. **Shell commands in dev scripts** - Not user-facing, controlled environment
3. **File operations** - Limited scope, sandboxed environment

### Recommended Fix Order

**Phase 1: Critical (This Sprint)**
- [ ] Review and harden GitHub Actions workflows
- [ ] Add path traversal protection to build scripts
- [ ] Fix prototype pollution patterns

**Phase 2: Hardening (Next Sprint)**
- [ ] Replace dynamic RegExp with safer alternatives
- [ ] Convert `shell: true` spawn calls to safer variants
- [ ] Add input validation utilities

**Phase 3: Code Quality (Future)**
- [ ] Standardize logging patterns
- [ ] Add ESLint rules for security patterns
- [ ] Document security considerations

### Notes on Figma Plugin Security Context

**Why Many Findings Are Lower Risk Here**:
- Figma plugins run in sandboxed iframe environment
- Limited access to system resources and file system
- No server-side execution or network access to external services
- User input is primarily from Figma UI elements, not arbitrary text
- No database connections or external API calls with user data

**Still Important Because**:
- Build tools and development scripts run in full Node.js environment
- GitHub Actions have broader access and permissions
- Security practices matter for code maintainability and contributor safety
- Supply chain security affects plugin distribution

---