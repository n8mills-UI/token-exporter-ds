# Agent Workflow Standard

## Core Principle: Parallel Pipeline in Single File

This document defines the standard workflow for all multi-agent tasks in the Token Exporter project.

## 🎯 Key Benefits

- **2.5x faster** execution through parallel work
- **Better consistency** with single-file approach
- **Clear boundaries** prevent conflicts
- **Maximized quality** through specialized expertise

## 📋 Standard Workflow Pattern

### 1. Single File Strategy
All agents work in ONE comprehensive file with clearly defined zones:

```html
<!-- example-redesign.html -->
<!DOCTYPE html>
<html>
<head>
    <!-- AGENT A ZONE: Global foundation -->
    <style id="zone-a">/* Agent A exclusive area */</style>
    
    <!-- AGENT B ZONE: Layout system -->
    <style id="zone-b">/* Agent B exclusive area */</style>
    
    <!-- AGENT C ZONE: Technical base -->
    <style id="zone-c">/* Agent C exclusive area */</style>
</head>
<body>
    <!-- HTML zones with clear boundaries -->
</body>
</html>
```

### 2. Parallel Execution Stages

**Stage 1: Foundation (3-4 agents simultaneous)**
- Brand/Design tokens
- Layout/Responsive system
- Technical architecture
- Core components

**Stage 2: Implementation (4-6 agents simultaneous)**
- Different sections/features
- Each agent owns specific zone
- No overlap or conflicts

**Stage 3: Enhancement (2-3 agents simultaneous)**
- Polish and refinement
- Consistency checks
- Final optimizations

### 3. Zone Management

Each agent receives:
- **Exclusive line numbers** (e.g., lines 50-120)
- **Unique CSS/HTML IDs** (e.g., #zone-typography)
- **Clear commenting boundaries**
- **Non-overlapping responsibilities**

### 4. Handoff Protocol

```markdown
<!-- START: AGENT NAME - ZONE DESCRIPTION -->
<!-- Lines XXX-YYY | DO NOT MODIFY -->
[Agent work here]
<!-- END: AGENT NAME -->
```

## 🔄 Self-Correction Protocol

Before finalizing any modifications:

1. **Review against initial request** - Does this match what was asked?
2. **Check existing patterns** - Am I following project conventions?
3. **Validate assumptions** - Should I confirm before proceeding?
4. **State deviations** - "I notice X differs from Y, should I proceed?"

## 💬 Comment Standards

### DO Write Comments For:
- **Section headers** (e.g., `/* Typography Tokens */`)
- **Critical warnings** (e.g., `/* CRITICAL: Figma doesn't support X */`)
- **Complex algorithms** where the "why" isn't obvious
- **Zone boundaries** for agent coordination

### DON'T Write Comments For:
- **Obvious code** (e.g., `/* Set background to red */`)
- **What code does** (e.g., `/* Loop through array */`)
- **Inline explanations** of simple operations

## ✅ Test Adherence

After EVERY code change:

1. **Run relevant tests automatically**
   ```bash
   npm run check      # For CSS/UI changes
   npm run lint       # For JavaScript changes
   npm run audit      # For comprehensive validation
   ```

2. **If tests fail**:
   - Debug and fix before asking for help
   - Document what was tried
   - Only escalate if truly blocked

3. **Validation checklist**:
   - [ ] All tests passing?
   - [ ] Browser rendering correct?
   - [ ] Figma plugin functional?
   - [ ] No console errors?

## 📖 Learning from CLAUDE.md

**Priority Order**:
1. CLAUDE.md instructions override everything
2. If user request contradicts CLAUDE.md → point it out
3. Check CLAUDE.md for existing patterns before creating new ones
4. Update CLAUDE.md when establishing new standards

## 🚀 Implementation Examples

### Good: Parallel Typography + Spacing Redesign
```bash
Stage 1 (Day 1): 3 agents start simultaneously
- Agent A: Global token system
- Agent B: Layout framework  
- Agent C: Component architecture

Stage 2 (Day 2-3): 4 agents work on sections
- Agent A: Typography section
- Agent B: Spacing section
- Agent C: Effects section
- Agent D: Motion section

Stage 3 (Day 4): 2 agents polish
- Agent A: Consistency review
- Agent B: Interactive enhancements

Total: 4 days (vs 10 days sequential)
```

### Bad: Sequential Single-Agent Approach
```bash
Day 1-2: Agent A does typography
Day 3-4: Agent B does spacing
Day 5-6: Agent C does effects
[... continues sequentially ...]
Total: 10+ days
```

## 📁 File Organization

```
project-root/
├── .dev/
│   ├── agents/
│   │   ├── [task-name]/
│   │   │   ├── mockups/
│   │   │   ├── handoffs/
│   │   │   └── validation/
│   │   └── AGENT-WORKFLOW-STANDARD.md
│   └── archive/
└── [main project files]
```

## 🎯 Success Metrics

- **Time**: 2.5x faster than sequential
- **Quality**: Higher through specialized expertise
- **Consistency**: Single file ensures cohesion
- **Conflicts**: Zero through clear boundaries
- **Rework**: Minimal through upfront planning

## 🔧 Tools & Automation

### Boundary Validator
```javascript
// Automated check for zone conflicts
validateZoneBoundaries({
  'agent-a': { start: 1, end: 50 },
  'agent-b': { start: 51, end: 100 },
  'agent-c': { start: 101, end: 150 }
});
```

### Progress Tracker
```markdown
## Stage 1 Status
- [x] Agent A: Global tokens complete
- [x] Agent B: Layout system complete
- [ ] Agent C: Technical base (80%)
```

## 🚨 Common Pitfalls to Avoid

1. **Multiple concept files** → Use single file with sections
2. **Sequential work** → Maximize parallel execution
3. **Unclear boundaries** → Define exact line numbers
4. **No coordination** → Use clear handoff protocols
5. **Scattered files** → Organize in .dev/agents/[task]

## 📝 Quick Reference

### Starting a Multi-Agent Task:
1. Create single comprehensive file
2. Define agent zones with clear boundaries
3. Launch agents in parallel stages
4. Validate at each handoff point
5. Polish with final enhancement pass

### For Simple Tasks:
- Use single agent if truly simple
- Don't over-engineer small changes
- But default to parallel for any multi-section work

This workflow standard ensures maximum efficiency while maintaining quality and consistency across all Token Exporter development tasks.