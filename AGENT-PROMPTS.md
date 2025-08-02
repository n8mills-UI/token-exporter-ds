# Agent Prompts for Token Exporter Project

## 🚀 Initial Recovery & Assessment Panel

When restarting Claude, use this master prompt with multiple agents:

### Master Prompt for Project Recovery
```
I need help with the Token Exporter project - a Figma plugin that exports design tokens. We're at a critical juncture migrating from HTML templates to a component-based architecture.

Please assemble the following expert panel to:
1. Review our current state and migration plans
2. Validate the technical approach
3. Execute their specialized parts of the implementation

Required reading for all agents:
- /CLAUDE.md - Project overview and constraints
- /CURRENT-PLAN-TEMPLATES.md - Immediate template functions plan
- /MIGRATION-PLAN-REACT.md - Long-term React migration strategy
- /docs/design-system.css - Current CSS architecture
- /src/ui.template.html - Plugin UI code
- /scripts/check.js - Our validation systems

Key constraints:
- Figma JavaScript restrictions (no optional chaining, template literals in catch)
- Must maintain single source of truth for components
- Design System Guide is the visual reference standard
- Need to support 6 export formats (CSS, Swift, Android, Flutter, JSON, Tailwind)
```

### Agent Panel Assembly

**PHASE 1: Architecture Review Panel**
```
Agents: backend-architect, frontend-developer, devops-automator, rapid-prototyper

Task: Review the template functions approach and React migration plan. Specifically:
- Validate the shared templates.js architecture
- Assess the phased migration strategy
- Identify technical risks and dependencies
- Propose optimizations for the build pipeline
- Ensure Figma plugin constraints are properly handled
```

**PHASE 2: Implementation Team**
```
Agents: frontend-developer, ai-engineer, test-writer-fixer, mobile-app-builder

Task: Implement the template functions system:
- frontend-developer: Create the shared template modules
- ai-engineer: Optimize template generation and transformations
- test-writer-fixer: Build comprehensive test suite
- mobile-app-builder: Ensure export formats work for mobile (Swift/Android)
```

**PHASE 3: Design & UX Enhancement**
```
Agents: ui-designer, ux-researcher, visual-storyteller, whimsy-injector, brand-guardian

Task: Enhance the plugin and documentation:
- Review current UI/UX pain points
- Design improved component layouts
- Add delightful micro-interactions
- Ensure consistent visual language
- Create better onboarding experience
```

**PHASE 4: Quality & Performance**
```
Agents: performance-benchmarker, api-tester, workflow-optimizer, test-results-analyzer

Task: Optimize everything:
- Benchmark current vs new template system
- Load test with 1000+ design tokens
- Optimize build times
- Identify workflow bottlenecks
- Create performance monitoring
```

## 📋 Specific Task Prompts

### Component Migration Sprint
```
Agents: sprint-prioritizer, project-shipper, frontend-developer, test-writer-fixer

I need to migrate our component system in a 6-day sprint:
- Day 1-2: Create template infrastructure
- Day 3-4: Migrate high-priority components
- Day 5: Testing and optimization
- Day 6: Ship and monitor

Start by reading /component-diff-report.md to understand which components need work.
Focus on filters-card, progress-animation, and quick-export-card first.
```

### Design System Audit
```
Agents: brand-guardian, ui-designer, analytics-reporter, feedback-synthesizer

Audit our design system for consistency and usability:
- Review /docs/design-system-guide.html
- Check token naming conventions
- Validate accessibility standards
- Analyze component usage patterns
- Synthesize user feedback about confusing parts
```

### Plugin Performance Optimization
```
Agents: performance-benchmarker, infrastructure-maintainer, devops-automator

Our Figma plugin needs optimization:
- Current issue: Slow with 1000+ tokens
- Memory usage spikes during export
- Build size is growing (currently ~50KB)
- Need to maintain Figma CSP compliance
Read /src/code.js for current implementation.
```

### Documentation & Marketing
```
Agents: content-creator, visual-storyteller, growth-hacker, twitter-engager

Create compelling documentation and marketing:
- Write clear component usage guides
- Create GIF demos of the plugin in action
- Design a landing page for the tool
- Plan a ProductHunt launch
- Create Twitter thread about our approach
```

## 🎯 Future Feature Development

### Advanced Token Management
```
Agents: ai-engineer, frontend-developer, ux-researcher

Design an AI-powered token suggestion system:
- Analyze existing design patterns
- Suggest semantic token names
- Auto-categorize tokens
- Detect and merge duplicate tokens
- Create smart token relationships
```

### Multi-Brand Support
```
Agents: backend-architect, ui-designer, rapid-prototyper

Implement multi-brand theming:
- Allow multiple theme configurations
- Brand switcher in UI
- Export brand-specific tokens
- Preview themes side-by-side
- Import/export theme configurations
```

### Collaboration Features
```
Agents: backend-architect, frontend-developer, support-responder

Add team collaboration:
- Share token sets with team
- Version control for tokens
- Commenting on tokens
- Approval workflows
- Change notifications
```

## 🔧 Maintenance & Operations

### Weekly Health Check
```
Agents: analytics-reporter, test-results-analyzer, support-responder

Weekly automated health check:
- Run all validation scripts
- Check for new CSS violations
- Monitor plugin crash reports
- Analyze user feedback
- Report on token usage patterns
```

### Security & Compliance
```
Agents: legal-compliance-checker, backend-architect, infrastructure-maintainer

Ensure ongoing compliance:
- Audit third-party dependencies
- Check for security vulnerabilities
- Validate data handling practices
- Review Figma API usage
- Ensure GDPR compliance
```

## 💡 Innovation Prompts

### Next-Gen Features
```
Agents: trend-researcher, ai-engineer, rapid-prototyper, experiment-tracker

Research and prototype future features:
- AI-powered design-to-code
- Real-time collaboration
- Git integration
- Design system analytics
- Token inheritance visualization
- Cross-tool synchronization (Sketch, Adobe XD)
```

### Community Building
```
Agents: reddit-community-builder, twitter-engager, content-creator, support-responder

Build a community around Token Exporter:
- Create Discord/Slack community
- Weekly design token tips
- User showcase features
- Open source contributions
- Plugin template marketplace
```

## 🚨 Crisis Management

### Bug Triage
```
Agents: test-writer-fixer, support-responder, project-shipper

Critical bug in production:
- Reproduce the issue
- Identify root cause
- Create hotfix
- Test thoroughly
- Deploy with minimal disruption
- Communicate with affected users
```

### Performance Emergency
```
Agents: performance-benchmarker, infrastructure-maintainer, devops-automator

Plugin is crashing with large files:
- Profile memory usage
- Identify bottlenecks
- Implement batching/pagination
- Add progress indicators
- Create fallback mechanisms
```

## 📊 Success Metrics Tracking

### Monthly Review
```
Agents: analytics-reporter, feedback-synthesizer, growth-hacker

Track our success metrics:
- Plugin installations
- Daily active users
- Export success rate
- User satisfaction scores
- Performance benchmarks
- Community growth
```

## 🎨 Special Creative Tasks

### Delight Injection
```
Agents: whimsy-injector, visual-storyteller, ui-designer

Add moments of delight:
- Easter eggs for power users
- Smooth, satisfying animations
- Clever loading messages
- Beautiful empty states
- Celebration animations
- Helpful tooltips with personality
```

### Studio Culture
```
Agents: studio-coach, joker

Keep the team motivated:
- Celebrate wins
- Share funny bugs
- Create team traditions
- Build inside jokes
- Maintain high energy
```

## Usage Instructions

1. **Start with the Master Prompt** - Gets all agents up to speed
2. **Run Phase 1** - Architecture review before any implementation
3. **Execute phases sequentially** - Each builds on the previous
4. **Use specific prompts** - For focused tasks
5. **Combine agents creatively** - They work well together
6. **Document outcomes** - Each agent should update relevant docs

Remember: The more specific your prompt, the better the results. Always provide context about what's already been tried and what the constraints are.