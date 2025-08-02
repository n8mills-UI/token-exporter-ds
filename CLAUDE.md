# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Start for Claude

When starting a new session, Claude should:
1. Read this CLAUDE.md file first
2. Run `npm run check` to understand current state
3. Check git status to see work in progress
4. Review recent commits for context
5. Use appropriate agents for complex tasks

## Project Overview

**Token Exporter** is a Figma plugin that transforms design variables into production-ready code across multiple platforms. Built with vanilla JavaScript, it features a sophisticated build system that handles Figma's strict CSP requirements by inlining all external assets.

**Portfolio Context**: This is a portfolio piece for natemills.me - professional tool with purposeful delight (Apple/Wealthsimple aesthetic, not gaming themed).

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
```

## 🤖 Agent Workflow Triggers

Claude should proactively use specialized agents when appropriate:

### Phase-Based Work
- **Starting new feature**: Use `rapid-prototyper` agent
- **After code changes**: Use `test-writer-fixer` agent
- **Design updates**: Use `whimsy-injector` agent after UI changes
- **Complex tasks**: Use `studio-coach` agent for coordination

### Automatic Triggers
- **CSS/UI changes** → Run `npm run check`
- **JavaScript changes** → Check Figma compatibility
- **Component updates** → Verify template synchronization
- **Before commits** → Run quality checks

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

## Current Design System State

### Core Design Tokens (Simplified)
- **4 Core Gradients**: Primary, Secondary, Accent, Highlight (all 90deg)
- **Brand Colors**: 
  - Primary: Always lime (#D2FF37)
  - Secondary: Theme-aware (lime in dark, pink in light)
- **No hover states on non-interactive cards**
- **No animation dots/icons in vortex or progress flows**

### Recent Architectural Decisions
1. Consolidated 32 gradients → 4 core gradients
2. Removed hover states from static cards
3. Hidden icon grid animations (dots) 
4. Updated stats to reflect plugin capabilities, not design system size
5. Copy focuses on truthful claims (portfolio piece, not launched product)

## CSS Architecture Rules

### 1. Two-Layer Token System
```css
/* Layer 1: Primitives in :root (raw values allowed) */
:root {
    --brand-primary: #D2FF37;      /* ✅ Raw value here */
    --gradient-primary: linear-gradient(90deg, var(--brand-primary) 0%, var(--color-cyan-500) 100%);
}

/* Layer 2: Components (MUST use tokens) */
.btn {
    background: var(--gradient-primary);  /* ✅ Token reference */
    /* background: linear-gradient(...); */ /* ❌ NEVER raw gradients */
}
```

### 2. Single Theme Section Rule
Each theme must have exactly ONE `[data-theme="X"]` section. Never split theme tokens across multiple selectors.

## File Structure

**Edit These Source Files:**
- `docs/design-system.css` - All styles (single source of truth)
- `src/ui.template.html` - Plugin UI template
- `docs/design-system-guide.template.html` - Documentation template
- `src/components/_*.html` - Reusable HTML partials
- `src/shared/data.js` - Shared data for templates
- `src/shared/templates.js` - Template functions

**Never Edit (Auto-Generated):**
- `src/ui.html` - Built plugin UI
- `docs/design-system-guide.html` - Built documentation
- `src/components/*` (without underscore) - Generated from templates

## Development Workflow

1. **Check current state**: `git status` and `npm run check`
2. **Make changes** to source files
3. **Build**: `npm run build` 
4. **Validate**: `npm run check`
5. **Test**: Browser and Figma

## Code Style Rules

**Write clean code without explanatory comments**
- NO comments explaining what code does
- NO TODO comments unless requested
- KEEP section headers, ASCII art, build markers
- KEEP critical warnings (Figma limitations, security)

## Icon System Rules

**NEVER add external icon libraries - the build will fail!**

- All icons defined in `src/components/icons/_icon-system.html`
- Use `<i data-icon="icon-name"></i>` pattern
- Add new icons to the system before use
- Build system blocks external icon CDNs

## Common Issues & Quick Fixes

### Build Failures
- **External resources blocked** → Check CDN URLs in imports
- **Icon validation fails** → Add missing icon to system
- **Template not found** → Use underscore prefix for partials

### CSS Issues  
- **Gradient not showing** → Use the 4 core gradient tokens
- **Hover on static card** → Remove, only interactive elements hover
- **Theme switching broken** → Consolidate theme sections

### JavaScript Errors
- **Optional chaining** → Use `obj && obj.prop`
- **Template literals** → Use string concatenation
- **Catch blocks** → Always include error parameter

## CRITICAL: Color System Debugging Guide

Past issues we've learned from:

### 1. JavaScript Rendering as Text
**Symptom**: JavaScript code appears as plain text below the footer
**Fix**: Never use `@include` directives inside JavaScript strings

### 2. "Cannot read properties of undefined" Errors
**Symptom**: Color System shows error about reading 'forEach' of undefined
**Fix**: Always check if `section.tokens` exists before iterating

### 3. Tab Panels Not Showing
**Symptom**: Tabs appear but panels are always hidden
**Fix**: Use only `.tab-panel.active { display: block; }`

### 4. Horizontal Scrolling Issues
**Symptom**: Page has unwanted horizontal scroll
**Fix**: Use `width: calc(100% - var(--size-sidebar-width))` for content

## Design Token Documentation System

**CRITICAL: The documentation is partially dynamic!**

- **Token VALUES are live** - Uses `getComputedStyle()` 
- **Token LISTS are static** - Manually maintained in `colorSectionConfig`
- **Adding new token** → Must manually add to colorSectionConfig
- **Shadow tokens**: Currently only shadow-2,3,4 are shown (missing 1,5)

## Quality Checklist

Before major changes:
- [ ] Run `npm run check` - all passing?
- [ ] Test in browser - UI renders correctly?
- [ ] Test in Figma - plugin works?
- [ ] Review git diff - changes intentional?
- [ ] Update CLAUDE.md - document decisions?

## Agent Directory

For complex tasks, use these specialized agents:
- `rapid-prototyper` - New features/MVPs
- `test-writer-fixer` - After code changes
- `frontend-developer` - UI/UX implementation
- `backend-architect` - API/data structure design
- `whimsy-injector` - Add delightful touches
- `studio-coach` - Coordinate complex work

## Working with Nate

- **Design is sacred** - Don't change UI without mockup approval
- **Truth in marketing** - No false claims about users/features
- **Professional aesthetic** - Apple/Wealthsimple vibe, not gaming
- **Purposeful delight** - Fun moments that enhance, not distract
- **Portfolio quality** - This showcases design system expertise

## Project Organization

### Agent Workspace
- `.dev/agents/` - AI agent collaboration workspace (gitignored)
  - `prototypes/` - Quick experiments and proof-of-concepts
  - `analysis/` - Research outputs and audits
  - `plans/` - Strategy documents and roadmaps
  - `scripts/` - Experimental scripts (not production-ready)
- Production scripts stay in `/scripts/`
- See `.dev/agents/README.md` for agent protocols

### Critical Elements Protection
Run `npm run check:critical` to validate:
- Icon visibility and rendering
- Theme switching functionality
- Dangerous CSS selectors that could affect plugin UI
- JavaScript initialization patterns
- Required animations (e.g., `te-vortex-swirl`)

### Project Roadmap
See `docs-internal/MASTER_PLAN.md` for the comprehensive project roadmap and completed phases.

## Recent Updates Log

- **2024-01**: Consolidated gradients, removed animation dots
- **2024-01**: Updated copy for accuracy (portfolio piece)
- **2024-01**: Simplified hover states to interactive elements only
- **2024-01**: Added shield-check icon for Style Dictionary validation

---

**Remember**: This is a living document. Update it when making architectural decisions or discovering new constraints.