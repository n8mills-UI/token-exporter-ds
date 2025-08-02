# Design Principles & Foundation Establishment Prompt

## Enhanced Prompt for Foundation Audit & Principles

```
@studio-coach: Assemble an elite panel of experts to establish foundational design principles and perform a comprehensive audit of the `token-exporter-ds` design system. 

### PHASE 1: Foundation Audit Panel
**Agents**: @brand-guardian, @ui-designer, @ux-researcher, @workflow-optimizer, @test-writer-fixer

**Audit Scope**:
1. **Token Architecture Analysis**
   - How Open Props tokens are being used vs custom tokens
   - Token naming consistency and semantic clarity
   - Any hardcoded colors, sizes, spacing, or other values
   - Token coverage gaps (what should be tokenized but isn't)

2. **CSS Architecture Review**
   - Current architecture strengths and weaknesses
   - Maintainability and scalability assessment
   - Performance implications of current structure
   - Suggestions for architectural improvements

3. **Component Quality Audit**
   - HTML semantic structure and accessibility
   - CSS specificity and cascade issues
   - Fragile selectors that could break easily
   - Component API consistency

4. **Recent Enhancement Assessment**
   - Review all Phase 3 additions (animations, whimsy, etc.)
   - Identify what aligns with core product vision
   - Flag what might be excessive or off-brand
   - Recommend what to keep, modify, or remove

### PHASE 2: Design Principles Definition
**Agents**: @brand-guardian, @visual-storyteller, @ux-researcher, @content-creator

**Deliverables**:
1. **Core Design Principles** (5-7 principles)
   - Each principle with rationale and examples
   - How it applies to Token Exporter specifically
   - Success/failure criteria

2. **Brand Personality Framework**
   - Voice and tone guidelines
   - When to be playful vs professional
   - Personality traits and how they manifest

3. **Visual Design Language**
   - Animation principles (timing, easing, purpose)
   - Color usage philosophy
   - Typography hierarchy rules
   - Spacing and layout principles

4. **Component Design Guidelines**
   - When to create new components vs modify existing
   - Component complexity boundaries
   - Reusability requirements
   - Documentation standards

### PHASE 3: Implementation Roadmap
**Agents**: @sprint-prioritizer, @workflow-optimizer, @project-shipper

**Create**:
1. **Remediation Plan**
   - Priority order for fixing identified issues
   - Effort estimates for each fix
   - Dependencies and risks

2. **Governance Model**
   - How to maintain principles going forward
   - Review process for new additions
   - Decision framework for edge cases

3. **Success Metrics**
   - How to measure adherence to principles
   - Quality gates for new work
   - Regular audit schedule

### Key Context:
- This is a Figma plugin for exporting design tokens
- Target users are designers and developers
- Must work within Figma's technical constraints
- 6-day sprint development philosophy
- Currently uses Open Props as foundation
- Recent additions may have introduced inconsistency

### Questions to Answer:
1. What is the core identity of Token Exporter?
2. What design decisions best serve our users?
3. How do we balance delight with professionalism?
4. What is our philosophy on complexity vs simplicity?
5. How do we ensure long-term maintainability?

Please provide a consolidated report with:
- Executive summary of findings
- Detailed audit results with evidence
- Proposed design principles with rationale
- Specific recommendations with priority
- Implementation roadmap
```

## Recommended Agent Assembly

### Primary Panel (Foundation Audit)
1. **@studio-coach** - Orchestrate and synthesize findings
2. **@brand-guardian** - Ensure brand consistency and establish identity
3. **@ui-designer** - Visual design assessment and principles
4. **@ux-researcher** - User-centered design validation
5. **@workflow-optimizer** - Development workflow implications
6. **@test-writer-fixer** - Technical robustness and maintainability

### Secondary Panel (Principles & Guidelines)
7. **@visual-storyteller** - Craft compelling design narratives
8. **@content-creator** - Voice and tone guidelines
9. **@analytics-reporter** - Metrics for principle adherence
10. **@legal-compliance-checker** - Accessibility compliance

### Implementation Panel
11. **@sprint-prioritizer** - Create actionable roadmap
12. **@project-shipper** - Ensure principles ship successfully
13. **@experiment-tracker** - Measure impact of changes

## Why This Approach is Better

1. **Structured Phases**: Clear progression from audit → principles → implementation
2. **Comprehensive Coverage**: Technical, visual, and user experience perspectives
3. **Actionable Outcomes**: Not just theory but specific implementation plans
4. **Measurable Success**: Built-in metrics and governance
5. **Future-Proof**: Creates framework for ongoing decisions

## Expected Outcomes

1. **Clear Design Principles Document**
2. **Prioritized Fix List** for current issues
3. **Decision Framework** for future additions
4. **Quality Gates** to maintain standards
5. **Team Alignment** on design philosophy

This approach ensures we're not just fixing problems but establishing a sustainable foundation for the Token Exporter's future evolution.