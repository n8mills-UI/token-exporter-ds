# Component Architecture Plan

## Problem Statement
Currently, components only share HTML structure via `@include` directives. JavaScript behavior is duplicated between the plugin and design guide, leading to:
- Different animations/timing
- Inconsistent icons
- Duplicated event handlers
- No single source of truth for behavior

## Proposed Solution: Component JavaScript Modules

### Phase 1: Shared Configuration (Immediate)
✅ Created `src/shared/component-config.js` with shared constants
- Animation timings
- Icon mappings
- Component settings

### Phase 2: Component JavaScript Files (Next Sprint)
Each component with behavior gets a companion JS file:
```
src/components/
├── _progress-flow-demo.html
├── _progress-flow-demo.js      # Shared behavior
├── _theme-toggle.html
├── _theme-toggle.js           # Shared behavior
└── ...
```

### Phase 3: Build System Updates
Enhance `scripts/build.js` to:
1. Bundle component JS files
2. Create namespaced modules
3. Handle Figma compatibility

### Implementation Example

**Before (Current State):**
```javascript
// Plugin version
function updateProgress(progress) { /* different logic */ }

// Guide version  
function updateGuideProgress(percent) { /* different logic */ }
```

**After (Target State):**
```javascript
// _progress-flow-demo.js
export class ProgressFlow {
    constructor(container) {
        this.container = container;
        this.config = PROGRESS_ANIMATION;
    }
    
    animate(progress) {
        // Shared animation logic
    }
    
    showSuccess() {
        // Shared success state
    }
}

// Usage in both contexts
import { ProgressFlow } from './components/_progress-flow-demo.js';
const progress = new ProgressFlow(element);
progress.animate(50);
```

## Migration Strategy

### Step 1: Align Existing Code (Today)
- [x] Fix icon inconsistencies
- [x] Add smooth animation to plugin
- [ ] Create shared config file

### Step 2: Extract Shared Logic (This Week)
- [ ] Identify all components with JavaScript behavior
- [ ] Extract common patterns
- [ ] Create component JS modules

### Step 3: Update Build System (Next Week)
- [ ] Modify build.js to handle component JS
- [ ] Test Figma compatibility
- [ ] Update all components

## Components Requiring JavaScript

### High Priority (Complex Behavior):
1. **Progress Flow Demo** - Animation, state management
2. **Theme Toggle** - Theme switching, localStorage
3. **Filters Card** - Dynamic content, selection state
4. **Modal** - Show/hide, backdrop, keyboard events

### Medium Priority (Simple Behavior):
5. **Quick Export** - Format selection dropdown
6. **Profile Card** - Typing animation
7. **Button** - Loading states
8. **Forms** - Validation

### Low Priority (Mostly Static):
9. Token cards
10. Footer
11. Stats container
12. Empty state

## Success Criteria
- [ ] One source of truth for each component (HTML + JS)
- [ ] Consistent behavior between plugin and guide
- [ ] No duplicated JavaScript logic
- [ ] Build system handles component bundling
- [ ] Figma compatibility maintained

## Risks & Mitigation
1. **Figma CSP Restrictions**: Test inline scripts vs external modules
2. **Build Complexity**: Start simple, iterate
3. **Breaking Changes**: Version components during migration

## Timeline
- Week 1: Quick fixes + planning
- Week 2: Extract shared logic
- Week 3: Build system updates
- Week 4: Migration complete