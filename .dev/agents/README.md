# Agent Collaboration Workspace

This directory is the designated workspace for all AI agents working on the Token Exporter project.

## Directory Structure

```
.dev/agents/
├── prototypes/     # Quick experiments and proof-of-concepts
├── analysis/       # Research outputs and audits
├── plans/          # Strategy documents and migration plans
└── scripts/        # Experimental scripts (not production-ready)
```

## Agent Protocols

### 1. File Creation
- **Always create new files in the appropriate subdirectory**
- **Never create files in the root directory**
- **Use descriptive names with dates when relevant**

### 2. Experimentation
- **prototypes/**: For rapid experiments and demos
- **analysis/**: For research findings and audits
- **plans/**: For strategic documents and roadmaps

### 3. Promotion to Production
Files move from `.dev/` to production only after:
- Review and approval
- Integration into main build system
- Proper testing

### 4. Naming Conventions
- Plans: `YYYY-MM-DD-topic-plan.md`
- Prototypes: `feature-name-prototype.{ext}`
- Analysis: `topic-analysis-YYYY-MM-DD.md`

## Current Active Work
- Template functions implementation
- Component synchronization
- Build system optimization

## Best Practices
1. Keep experiments isolated in this workspace
2. Document your work with clear README files
3. Clean up failed experiments
4. Collaborate by building on each other's work
5. Always check existing work before creating duplicates