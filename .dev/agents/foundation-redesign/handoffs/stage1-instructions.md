# Stage 1 Agent Instructions - Foundation Development

## Mission: Establish Foundation for 6 Foundation Sections Redesign

**Duration**: 1-2 days parallel execution  
**File**: `/Users/nathan/Documents/GitHub/token-exporter-ds/.dev/agents/foundation-redesign/foundation-sections-mockup.html`

---

## Agent A: Brand Guardian

### Zone Assignment
- **Lines**: 15-80
- **CSS ID**: `#zone-brand-guardian`
- **Style Block**: `<style id="zone-brand-guardian">`

### Primary Responsibility
Create cohesive visual concepts with controlled playfulness across all 6 Foundation sections.

### Specific Deliverables

#### 1. Global Visual Concept (Critical)
- Define overarching design theme for all 6 sections
- Balance "strong concepts" with "controlled playfulness"
- Ensure professional yet engaging presentation
- Create visual harmony between Typography, Spacing, Effects, Borders, Radius, Motion

#### 2. Brand Color Relationships
```css
/* Define consistent color usage patterns */
--section-accent-color: /* How brand colors are used in sections */
--section-text-hierarchy: /* Text color relationships */
--section-background-strategy: /* Background treatment approach */
```

#### 3. Token Usage Guidelines
- Standardize how existing design tokens are used
- Define new tokens if needed for section consistency
- Ensure theme-aware color relationships (light/dark)

#### 4. Visual Personality
- Establish tone: Professional but approachable
- Define playfulness boundaries (what's too much?)
- Create brand expression patterns for Foundation sections

### Success Criteria
- [ ] Clear visual concept applicable to all 6 sections
- [ ] Brand color usage patterns established
- [ ] Theme-aware token relationships defined
- [ ] Playfulness guidelines documented

---

## Agent B: UI Designer

### Zone Assignment  
- **Lines**: 85-150
- **CSS ID**: `#zone-ui-designer`
- **Style Block**: `<style id="zone-ui-designer">`

### Primary Responsibility
Create responsive layout system with smart grid rules and visual hierarchy.

### Specific Deliverables

#### 1. Smart Responsive Grid System (Critical)
```css
/* Even items → 2 columns */
.section-content:has(.token-item:nth-child(even):last-child) {
    grid-template-columns: 1fr 1fr;
}

/* Odd items → 1 column */  
.section-content:has(.token-item:nth-child(odd):last-child) {
    grid-template-columns: 1fr;
}
```

#### 2. Visual Hierarchy Framework
- Section header treatments (consistent across all 6)
- Content area layouts
- Token item presentation patterns
- Spacing relationships between elements

#### 3. Responsive Breakpoints
- Desktop layout optimizations
- Tablet behavior (maintain smart grid rules)
- Mobile adaptations (likely 1-column stacking)

#### 4. Layout Patterns
- How icons are positioned relative to titles
- Description text formatting and positioning
- Content flow patterns that work for all 6 sections

### Success Criteria
- [ ] Smart grid system implemented (even→2col, odd→1col)
- [ ] Consistent section header styling
- [ ] Responsive behavior across breakpoints
- [ ] Visual hierarchy patterns established

---

## Agent C: Frontend Developer

### Zone Assignment
- **Lines**: 155-220  
- **CSS ID**: `#zone-frontend-developer`
- **Style Block**: `<style id="zone-frontend-developer">`

### Primary Responsibility
Technical architecture, icon system integration, and interactive patterns.

### Specific Deliverables

#### 1. Icon System Validation (Critical)
- Test all embedded icons render correctly
- Ensure icon sizing consistency across sections
- Validate theme-aware icon colors

#### 2. Interactive State Patterns
```css
/* Hover states for all interactive elements */
.token-item:hover { /* Define consistent hover behavior */ }
.section-header:hover { /* Header interaction patterns */ }
```

#### 3. Animation Foundations
- Subtle micro-interactions for token items
- Section loading/reveal animations
- Smooth transitions between theme switches

#### 4. Technical Implementation Patterns
- CSS architecture that supports all 6 sections
- Performance optimization for large token displays
- Cross-browser compatibility ensuring

### Success Criteria
- [ ] All icons render correctly in both themes
- [ ] Interactive state patterns established
- [ ] Animation foundations implemented
- [ ] Technical architecture supports all 6 sections

---

## Coordination Protocol

### Daily Standup (15 minutes)
**Time**: Every 24 hours  
**Participants**: All 3 Stage 1 agents

**Format**:
1. Progress since last standup (2 min each)
2. Blockers or dependencies (5 min total)
3. Next 24-hour commitments (3 min total)

### Shared Communication
- Update masterplan.md with progress
- Comment in shared mockup file for coordination
- Flag conflicts immediately for resolution

### Handoff Preparation
- Document design decisions in your zone
- Prepare briefing materials for Stage 2 agents
- Ensure work is polished for handoff meeting

---

## Success Handoff Criteria

### Foundation Ready for Stage 2 When:
1. **Brand Guardian**: Visual concept is clear and documented
2. **UI Designer**: Layout system works for all section types  
3. **Frontend Developer**: Technical patterns support content variations
4. **All Agents**: No conflicts between zones
5. **Integration Test**: Mockup displays correctly in both themes

### Handoff Meeting Agenda
1. Brand Guardian presents visual concept (10 min)
2. UI Designer demonstrates layout system (10 min)
3. Frontend Developer shows technical capabilities (10 min)
4. Q&A with Stage 2 agents (15 min)
5. Stage 2 launch coordination (5 min)

---

## Emergency Protocols

### If Blocked
- Escalate to Studio Orchestrator within 2 hours
- Document what was tried before escalation
- Continue on non-blocked items while waiting

### If Conflicts Arise
- Immediate communication between conflicting agents
- Studio Orchestrator facilitates resolution same day
- Document resolution in masterplan.md

### If Behind Schedule
- Assess scope reduction options
- Consider resource reallocation
- Maintain quality over speed

---

**Start Time**: Upon receipt of these instructions  
**Target Completion**: 48 hours maximum  
**Coordinator**: Studio Orchestrator  
**Emergency Contact**: Via todo list updates