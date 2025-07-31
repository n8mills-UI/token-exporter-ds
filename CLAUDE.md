# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Token Exporter** is a Figma plugin that transforms design variables into production-ready code across multiple platforms. Built with vanilla JavaScript, it features a sophisticated build system that handles Figma's strict CSP requirements by inlining all external assets.

## Essential Commands

```bash
# Development
npm start          # Start development with watch mode
npm run dev        # Same as npm start - rebuilds on changes
npm run build      # Build once for production

# Quality Checks
npm run check      # Essential checks: Figma compatibility, JS lint, CSS architecture (~10s)
npm run audit      # Comprehensive audit: all checks + reports (~60s)
npm run format     # Auto-fix CSS formatting issues

# Specific Checks (rarely needed individually)
npm run check:critical    # Check for breaking changes
npm run check:all         # All checks including token validation
npm run lint:a11y  # Run pa11y accessibility tests
```

## Critical Figma JavaScript Constraints

**NEVER use these features - they cause runtime errors:**
```javascript
// ❌ Optional chaining
obj?.prop                    // → Use: obj && obj.prop

// ❌ Template literal interpolation  
`Hello ${name}`             // → Use: 'Hello ' + name

// ❌ Catch without parameter
} catch {                   // → Use: } catch (error) {
```

## Architecture Overview

### Build System (`scripts/build.js`)
The build process handles Figma's Content Security Policy restrictions:
1. **CSS Bundling**: Fetches and inlines all `@import` statements (both CDN and local)
2. **JavaScript Bundling**: Extracts and inlines external `<script src>` dependencies
3. **Template Processing**: Resolves `<!-- @include path/to/partial.html -->` directives
4. **Output Generation**:
   - `src/ui.html` - Plugin UI with everything inlined (Figma requirement)
   - `docs/design-system-guide.html` - Documentation site with external CSS link

### Quality Assurance (`scripts/check.js`)
Automated checks enforce design system integrity:
- **Figma Compatibility**: Detects unsupported JavaScript features
- **CSS Architecture**: Validates two-layer token system
- **Theme Architecture**: Ensures token-only theming (no component overrides)
- **Semantic Token Usage**: Flags direct primitive token usage in components

### Comprehensive Audit (`scripts/audit.js`)
The audit command runs extensive analysis:
- **Build Verification**: Ensures templates build correctly
- **Code Quality**: Figma compatibility, ESLint, CSS architecture
- **CSS Analysis**: Wallace complexity, cssstats metrics, specificity graphs
- **Accessibility**: pa11y testing on design guide
- **Token Validation**: Style Dictionary compatibility checks
- **Reports**: Generated in `reports/` directory (gitignored)

## CSS Architecture Rules

### 1. Two-Layer Token System
```css
/* Layer 1: Primitives in :root (raw values allowed) */
:root {
    --brand-primary: #D2FF37;      /* ✅ Raw value here */
    --size-4: 1.25rem;             /* ✅ Raw value here */
}

/* Layer 2: Components (MUST use tokens) */
.btn {
    background: var(--brand-primary);  /* ✅ Token reference */
    padding: var(--size-4);           /* ✅ Token reference */
    /* padding: 1.25rem; */           /* ❌ NEVER raw values */
}
```

### 2. Theme Architecture

**CRITICAL: Only ONE theme section per theme**
- Each theme (light/dark) must have exactly ONE `[data-theme="X"]` section
- Multiple theme sections cause CSS specificity conflicts and break theme switching
- The build system will FAIL if duplicate theme sections are detected

```css
/* ✅ CORRECT: Single theme section with all tokens */
[data-theme="light"] {
    --btn-primary-bg: var(--brand-primary);
    --btn-primary-text: var(--gray-warm-9);
    --card-bg: var(--gray-warm-0);
    --surface-bg: var(--gray-cool-1);
    /* ALL light theme tokens in ONE place */
}

/* ✅ CORRECT: Token-only theming */
.btn-primary {
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
}

/* ❌ WRONG: Multiple theme sections */
[data-theme="light"] { --btn-primary-bg: #value; }
/* ... other CSS ... */
[data-theme="light"] { --card-bg: #value; }  /* NEVER - causes conflicts */

/* ❌ WRONG: Component-specific overrides */
[data-theme="light"] .btn-primary {
    background: #D2FF37;  /* Never do this */
}
```

**Prevention:**
- Run `npm run check` - fails build if duplicate sections found
- Check shows line numbers of duplicate sections for easy fixing
- Consolidate all theme tokens into single section per theme

### 3. Brand Colors
- `--brand-primary`: Always lime (#D2FF37) - used for primary actions, focus states
- `--brand-secondary`: Theme-aware - lime (#EF0) in dark mode, pink (#FF1493) in light mode

## File Structure

**Edit These Source Files:**
- `docs/design-system.css` - All styles (single source of truth)
- `src/ui.template.html` - Plugin UI template
- `docs/design-system-guide.template.html` - Documentation template
- `src/components/_*.html` - Reusable HTML partials
- `src/code.js` - Plugin logic (6 export formats)

**Never Edit (Auto-Generated):**
- `src/ui.html` - Built plugin UI
- `docs/design-system-guide.html` - Built documentation

## Development Workflow

1. **Make changes** to source files (.template.html, .css, components)
2. **Build**: `npm run build` (or use `npm run dev` for auto-rebuild)
3. **Validate**: `npm run check` for quick verification
4. **Test**:
   - Browser: Open `docs/design-system-guide.html`
   - Figma: Reload plugin (no reinstall needed)

## Plugin Export Formats

The plugin (`src/code.js`) exports to 6 formats:
- **CSS**: W3C custom properties
- **Swift**: iOS native format
- **Android XML**: Android resources
- **Flutter**: Dart constants
- **JSON**: W3C Design Token Standard
- **Tailwind**: Theme configuration

## Performance Optimizations

For large token collections (>1000 variables):
```javascript
const BATCH_SIZE = 100;              // Process in chunks
const MEMORY_WARNING_THRESHOLD = 100; // MB before warning
const MAX_EXPORT_SIZE = 50;          // MB export limit
```

## Common Issues & Solutions

### JavaScript Errors in Figma
- **"Unexpected token ."** → Replace `obj?.prop` with `obj && obj.prop`
- **"Unexpected token {"** → Use `catch (error)` not `catch {`
- Check with: `npm run check`

### CSS Architecture Violations
- **Direct color references** → Use semantic tokens
- **Raw values in components** → Move to tokens
- **Theme overrides on components** → Use token-only approach

### Build Issues
- **Empty HTML output** → Check external resource URLs
- **Missing styles** → Verify CSS imports are accessible
- **Plugin not updating** → Hard refresh Figma (Cmd+R/Ctrl+R)

## Vendor Dependencies

Open Props CSS framework is vendored locally in `vendor/open-props/`:
- `open-props.style.css` - Core styles
- `open-props.normalize.css` - CSS reset
- `open-props.buttons.css` - Button utilities

**Important**: The `.min.css` files (e.g., `open-props.min.css`) must be kept even though they're identical to source files. The build system expects these minified versions, and `docs/design-system.css` imports them specifically. Do not delete or gitignore these files.

## Code Style Rules

**CRITICAL: Write clean code without comments unless absolutely critical**
- DO NOT add explanatory comments to CSS, JavaScript, or HTML
- DO NOT add "helpful" inline comments explaining what code does
- DO NOT add TODO comments unless explicitly requested
- ONLY add comments if they are critical for Figma compatibility warnings or security notes
- EXCEPTIONS - Keep these comment types:
  - **Section header comments** in CSS (e.g., `/* Button tokens */`, `/* FAQ tokens */`)
  - **ASCII art headers** - They add personality and visual organization
  - **Build markers** (e.g., `/* @docs-only-start */`, `/* @plugin-only-end */`)

## Dual-Persona Development Mode (Optional)

**Toggle Instructions:**
- **Enable**: Uncomment the section below for complex architectural decisions, new features, or systemic changes
- **Disable**: Keep commented for routine fixes, simple edits, or when preferring direct responses

### DUAL-PERSONA MODE ACTIVE

When this mode is enabled, responses will include a structured dialogue between two personas:

**Claude**: Implementation-focused persona with deep design system expertise. Proposes solutions efficiently while considering:
- CSS token architecture and theme consistency
- Build system implications (Figma CSP constraints, template processing)
- Design system scalability and maintainability
- Existing project patterns and established workflows

**Bob**: Quality guardian and UX advocate. Challenges approaches by questioning:
- Accessibility implications and user experience impact
- Edge cases and potential failure modes
- Testing strategy and validation approach
- Systemic risks and unintended consequences
- Cross-browser compatibility and Figma plugin constraints

### Output Format (when active):
1. **Dialogue**: Brief exchange between Claude and Bob reaching alignment
2. **Unified Approach**: Joint recommendation 
3. **Implementation**: Design system specific technical details
4. **Quality Checklist**: Validation steps, potential issues, testing approach

### When to Use:
- ✅ New component architecture decisions
- ✅ Theme system changes or token restructuring  
- ✅ Build system modifications
- ✅ Complex CSS architecture decisions
- ✅ Feature additions that affect multiple components
- ❌ Simple bug fixes or typos
- ❌ Following established patterns
- ❌ Routine maintenance tasks

### Example Triggers:
- "Should we refactor the color token system?"
- "How do we add a new theme variant?"
- "What's the best way to implement this new component?"
- "We need to change the build process to support X"

Both personas understand this project's constraints:
- Figma JavaScript limitations (no optional chaining, template literals, etc.)
- CSS two-layer token system and single theme section rule
- Build system requirements and component architecture
- Existing quality tools (`npm run check`, `npm run audit`)

## Critical Elements Protection

The `scripts/critical-elements-check.js` validates that changes don't break:
- Icon visibility and rendering
- Theme switching functionality
- Dangerous CSS selectors that could affect plugin UI
- JavaScript initialization patterns

## Design Token Documentation System

**CRITICAL: The documentation is partially dynamic!**

### How Token Documentation Works:
1. **Token VALUES are live** - Uses `getComputedStyle()` to pull current CSS values
2. **Token LISTS are static** - Manually maintained in `colorSectionConfig` in design-system-guide.template.html
3. **Some sections are dynamic** - e.g., Neutrals populate based on current theme
4. **Some sections are hard-coded** - e.g., Shadows only shows 3 of 5 tokens

### Important Implications:
- **Changing a token's color/value** → Automatically reflected in docs ✅
- **Adding a new token** → Must manually add to colorSectionConfig ❌
- **Renaming a token** → Must update colorSectionConfig ❌
- **Health checks** → May show false positives for dynamic sections

### Token Documentation Sections:
```javascript
// Static sections (manually maintained):
'alpha': { tokens: [...] }      // Manually list each token
'shadows': { tokens: [...] }    // Currently incomplete (3 of 5)

// Dynamic sections (auto-generated):
'neutrals': { tokens: [] }      // Populated by JavaScript based on theme

// Hybrid sections:
'utilities': {
    subgroups: {
        'text': { tokens: [...] }    // Static list
        'surface': { tokens: [...] } // Static list
    }
}
```

### When Adding New Tokens:
1. Add to CSS (design-system.css)
2. Add to documentation (design-system-guide.template.html)
3. Run `node scripts/token-health-check.js` to verify
4. Note: Health check may report false positives for dynamic sections

### Common Pitfalls:
- **Don't assume all tokens are auto-documented** - Most need manual addition
- **Shadow tokens**: Currently only shadow-2,3,4 are shown (missing 1,5)
- **Gray scales**: Documented dynamically, so won't appear in static token lists
- **Internal tokens**: Many tokens (like `--plugin-width`) are internal and shouldn't be documented
- **Health check limitations**: Shows ~15% health but many "missing" tokens are actually internal or dynamically rendered

## Testing Strategy

No formal test framework - rely on:
1. **Automated checks**: `npm run check` / `npm run audit`
2. **Manual testing**: Browser for UI, Figma for functionality
3. **Visual regression**: Compare before/after in design guide

## Pre-commit Validation

Husky runs automated checks before commits:
- CSS files → Architecture linting
- JavaScript → Figma compatibility + ESLint
- Templates → Documentation audit

Configure in `package.json` under `lint-staged`.

## CRITICAL: Color System Debugging Guide

If the Color System breaks (empty container, JavaScript as text, stuck scrolling), check these:

### 1. JavaScript Rendering as Text
**Symptom**: JavaScript code appears as plain text below the footer
**Cause**: Build system is injecting HTML content into JavaScript strings
**Fix**: Never use `@include` directives inside JavaScript strings. The build system will replace them with raw HTML, breaking the string syntax.

### 2. "Cannot read properties of undefined" Errors
**Symptom**: Color System shows error about reading 'forEach' of undefined
**Cause**: Some sections (like theme overview) don't have a `tokens` array
**Fix**: Always check if `section.tokens` exists before iterating:
```javascript
if (section.tokens && section.tokens.length > 0) {
    section.tokens.forEach(item => { ... });
}
```

### 3. Tab Panels Not Showing
**Symptom**: Tabs appear but panels are always hidden
**Cause**: CSS expects `aria-hidden="false"` but JavaScript only sets `.active` class
**Fix**: Remove any CSS rules checking for `aria-hidden`. Use only `.tab-panel.active { display: block; }`

### 4. Scrolling Lock / Content Gets Stuck
**Symptom**: Clicking navigation hides content above, can't scroll properly
**Cause**: Sidebar with `position: sticky` and `height: 100vh` conflicts with content
**Fix**: Use `position: fixed` for sidebar and adjust content margin accordingly

### 5. Horizontal Scrolling Issues
**Symptom**: Page has unwanted horizontal scroll
**Cause**: Fixed sidebar + 100% width content = overflow
**Fix**: Use `width: calc(100% - var(--size-sidebar-width))` for content

### Prevention Tips:
- Always run `npm run check` before committing
- Test Color System after any template changes
- Check browser console for JavaScript errors
- Never mix @include directives with JavaScript code
- Keep duplicate CSS rules consolidated