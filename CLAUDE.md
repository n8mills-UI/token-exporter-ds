# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚡ PRIORITY ONE: DELEGATE TO SPECIALIZED AGENTS

**CRITICAL RULE: Claude is the ORCHESTRATOR, not the DOER. Your PRIMARY job is to delegate tasks to specialized agents using the Task tool.**

**The agents have their own examples and triggers built-in. They run in separate contexts without consuming main chat tokens.**

**BEFORE doing ANY work yourself, ask:**
1. Is there an agent that specializes in this?
2. Would an agent do this better than me?
3. Should multiple agents collaborate on this?

**If YES to any → USE THE AGENT(S)**

**See section "🤖 MANDATORY Agent Usage Protocol" below for enforcement rules.**

## 🚀 Quick Start for Claude

### MANDATORY SESSION START PROTOCOL
**⚠️ STOP: Do NOT proceed without completing ALL steps:**

1. ✅ Read this CLAUDE.md file completely
2. ✅ Run `pwd` to verify working directory
3. ✅ Run `npm run check` - STOP if any failures
4. ✅ Run `git status` to check work in progress
5. ✅ Check if session is continuation (look for context)
6. ✅ State your understanding of current task

**🛑 BLOCKING RULES:**
- **NEVER** add comments to CSS (auto-reject if found)
- **NEVER** add CSS variables without checking existing patterns
- **ALWAYS** run `npm run check` before AND after changes
- **ALWAYS** use TodoWrite for multi-step tasks

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

## 🤖 MANDATORY Agent Delegation Protocol

**YOUR ROLE: You are an ORCHESTRATOR. Delegate work to specialized agents who have deep expertise.**

### 🚨 DELEGATION TRIGGERS (Non-Negotiable)

**ALWAYS delegate when you hear:**
- "Build/create/implement" → Agent does the building
- "Test/fix/debug" → Agent handles testing
- "Design/UI/UX" → Agent creates interfaces
- "Optimize/performance" → Agent analyzes speed
- "Research/analyze" → Agent investigates
- "Complex/multi-step" → `studio-coach` coordinates multiple agents

### 🛑 BLOCKING RULES:

**You are FORBIDDEN from:**
1. Writing frontend code → `frontend-developer` agent does this
2. Creating tests → `test-writer-fixer` agent does this
3. Designing UI → `ui-designer` agent does this
4. Analyzing performance → `performance-benchmarker` agent does this
5. Doing ANY specialized work that matches an agent's expertise

### 📋 DELEGATION DECISION TREE:

```
User request received
    ↓
Does an agent specialize in this?
    ├─ YES → DELEGATE to that agent
    └─ NO → Is it complex/multi-step?
              ├─ YES → `studio-coach` coordinates
              └─ NO → Only then do it yourself
```

### 🔄 AUTOMATIC CHAIN REACTIONS:

These MUST happen automatically:
- Code written → `test-writer-fixer` validates
- UI changed → `whimsy-injector` adds delight
- Feature complete → `test-writer-fixer` ensures quality
- Complex task started → `studio-coach` orchestrates

### 💡 REMEMBER:

- **Agents have their own built-in examples and triggers**
- **Agents run in separate contexts (no token consumption)**
- **Multiple agents can work in parallel**
- **Trust the agents - they're specialists**
- **Your value is in orchestration, not doing**

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

#### 🎯 STRATEGIC CSS VARIABLE PROTOCOL
Before adding ANY CSS variable:

1. **CHECK**: Does a similar variable already exist?
   ```bash
   grep -n "variable-name" docs/design-system.css
   ```

2. **DECIDE**: Is this a primitive or alias?
   - **Primitive** (raw value): Only in `:root`, only if truly new
   - **Alias** (reference): Points to existing primitive

3. **FOLLOW** the pattern:
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

4. **VERIFY**: Run `npm run check` after adding

### 2. Single Theme Section Rule
Each theme must have exactly ONE `[data-theme="X"]` section. Never split theme tokens across multiple selectors.

## File Structure

**Edit These Source Files:**
- `docs/design-system.css` - All styles (single source of truth)
- `src/ui.template.html` - Plugin UI template
- `docs/design-system-guide.template.html` - Documentation template
- `src/components/_*.html` - Reusable HTML partials
- `src/lib/data.js` - Shared data for templates
- `src/lib/templates.js` - Template functions

**Never Edit (Auto-Generated):**
- `src/ui.html` - Built plugin UI
- `docs/design-system-guide.html` - Built documentation
- `src/components/*` (without underscore) - Generated from templates

## CRITICAL: Single Source of Truth Principle

**One Component = One File = One Source of Truth**

- Each component must exist as exactly ONE file in `src/components/_component-name.html`
- NEVER create wrapper files that bundle multiple components (violates single source of truth)
- Both plugin and documentation guide must use the same component file via `@include` directives
- If you need different layouts, create separate individual components

**Example of CORRECT architecture:**
```
src/components/_quick-export-card.html  # One component
src/components/_filters-card.html       # Another component
```

**Example of INCORRECT architecture:**
```
src/components/_forms-example.html  # Contains both quick-export AND filters
```

### ⚠️ ZERO TOLERANCE: Component Override Policy

**NEVER override component styles with context-specific selectors!**

Components must render identically regardless of their container. Any CSS that targets `.componentName` with additional specificity is a violation.

**FORBIDDEN patterns:**
```css
/* ❌ NEVER DO THIS */
.export-section .btn { padding: different-value; }
.plugin-container .card-actions { gap: different-value; }
.some-context .component { any-override: value; }
```

**Detection:**
```bash
npm run check:overrides  # Detects all component overrides
```

**If variations are needed:**
1. Create explicit component variants (e.g., `.btn--large`, `.card--compact`)
2. Use CSS custom properties that components can inherit
3. Create separate components for different contexts

### CSS Component Contract

**Every component must:**
1. **Be self-contained** - Render identically regardless of parent context
2. **Use semantic tokens only** - Never use primitive values directly
3. **Define explicit variants** - Use BEM-style modifiers (`.component--variant`)
4. **Follow single responsibility** - One component, one purpose

**Component Structure:**
```css
/* Base component (required) */
.btn {
  display: inline-flex;
  padding: var(--size-2) var(--size-3);
  color: var(--color-text-primary);
  background: var(--color-surface-secondary);
  border: var(--border-size-1) solid var(--color-border-default);
}

/* Size variants (optional) */
.btn--xs { padding: var(--size-1) var(--size-2); }
.btn--sm { padding: var(--size-2) var(--size-3); }
.btn--lg { padding: var(--size-4) var(--size-5); }

/* Style variants (optional) */
.btn--primary { background: var(--color-interactive-primary); }
.btn--secondary { background: var(--color-interactive-secondary); }

/* Layout variants (optional) */
.btn--full-width { width: 100%; }
.btn--auto-width { width: auto; }

/* Context variants (when absolutely needed) */
.btn--demo { width: 100%; margin-top: var(--size-4); }
```

**Semantic Token Categories:**
- **Text**: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- **Surface**: `--color-surface-primary`, `--color-surface-secondary`, `--color-surface-elevated`
- **Interactive**: `--color-interactive-primary`, `--color-interactive-hover`, `--color-interactive-active`
- **Border**: `--color-border-default`, `--color-border-subtle`, `--color-border-strong`
- **Status**: `--color-status-success`, `--color-status-warning`, `--color-status-error`

This principle prevents drift between plugin and documentation guide.

### Legacy Components Exception

The following components are exempt from the override rules due to their complexity:
- **profile-card** - Complex component with ~40+ nested element overrides
- **about-modal** - Modal with specific nested styles  
- **faq-item** - Accordion with state-based styles (.open state)

These components predate the component isolation architecture and would require significant refactoring to comply. New components must follow the isolation principles.

## Development Workflow

1. **Check current state**: `git status` and `npm run check`
2. **Make changes** to source files
3. **Build**: `npm run build` 
4. **Validate**: `npm run check`
5. **Test**: Browser and Figma

## Code Style Rules

### 🚨 ZERO TOLERANCE: Comment Policy
**Write clean code without explanatory comments**
- ❌ **FORBIDDEN**: Comments explaining what code does
- ❌ **FORBIDDEN**: TODO comments (unless user requests)
- ✅ **ALLOWED**: Section headers, ASCII art, build markers
- ✅ **ALLOWED**: Critical warnings (Figma limitations, security)

**Examples of FORBIDDEN comments:**
```css
--color-text-primary: var(--gray-warm-0);  /* ❌ Alias for consistency */
--black-rgb: 0, 0, 0;                       /* ❌ RGB values for rgba() usage */
```

**If you add forbidden comments:**
1. User will reject the change
2. You must remove ALL comments
3. Time will be wasted

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

## 🔄 Working Principles

### Self-Correction Protocol
Before finalizing any code modification:
1. **Review changes against initial request** - Does this match what was asked?
2. **Check project's existing patterns** - Am I following conventions?
3. **State deviations** - If something differs from expectations, ask for confirmation
4. **Learning from CLAUDE.md** - If request contradicts these instructions, point it out

### Comment Standards
**Focus on WHY, not WHAT:**
- ✅ `/* CRITICAL: Figma doesn't support optional chaining */`
- ✅ `/* Using 3-column grid for odd number of items */`
- ❌ `/* Set background to red */`
- ❌ `/* Loop through array */`

### Test Adherence
After EVERY significant code change:
1. **Run tests automatically** - `npm run check`
2. **Debug failures before asking** - Attempt fixes first
3. **Document what was tried** - If escalating issues

### Multi-Agent Workflow Standard
For complex tasks, use **parallel pipeline** approach:
- **Single file** with clear agent zones
- **3-4 agents working simultaneously**
- **2.5x faster** than sequential approach
- See `.dev/agents/AGENT-WORKFLOW-STANDARD.md` for details

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
See `.dev/docs-internal/reports/MASTER_PLAN.md` for the comprehensive project roadmap and completed phases.

## Project Structure & Maintenance

### Directory Organization (Updated 2025-08-04)
**Essential Directories**:
- `src/` - Core plugin source code
- `docs/` - Design system documentation  
- `scripts/` - Build system (referenced in package.json)
- `vendor/` - Required dependencies (jszip, open-props)
- `tokens/` - Style Dictionary configuration
- `build/` - Generated platform outputs

**Archive Strategy**:
- `.archive/` - Consolidated archive for historical docs
- Generated files (.lighthouseci/, .snapshots/, reports/) are .gitignored

### Known Issues & Learnings

#### Mobile Responsiveness
- Mobile header "Token Exporter" should stay on one line using `clamp()` for font sizing
- Chevron positioning: Desktop 6vh, Mobile 0.25vh from bottom
- Logo size should use tokens (var(--icon-md)) not hardcoded values

#### CSS Cleanup Patterns
- Duplicate class definitions should be consolidated
- Comments about "REMOVED" code should be deleted, not kept
- Empty deprecated sections should be removed entirely

#### Documentation Best Practices
- Single source of truth: One MASTER_PLAN.md in .dev/docs-internal/reports/
- Archive historical session reports with correct dates
- Consolidate related documentation (e.g., multiple Style Dictionary docs)

#### Performance Optimizations (2025-08-04)
- Implemented parallel execution in check.js: 30% performance improvement (835ms → 585ms)
- All 8 quality checks now run concurrently using Promise.all()
- Audit.js already uses parallel execution for comprehensive testing
- Build.js and other scripts could benefit from similar optimization

---

**Remember**: This is a living document. Update it when making architectural decisions or discovering new constraints.