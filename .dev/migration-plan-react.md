# React Migration Plan for Token Exporter

## Executive Summary

This document outlines the migration strategy from the current HTML template-based architecture to a React-based component system. The goal is to establish a true single source of truth for components while maintaining Figma plugin compatibility.

## Current Architecture Issues

### 1. Duplicated Component Logic
- **Problem**: HTML structure shared via `@include` directives, but JavaScript logic duplicated between plugin and documentation
- **Impact**: Changes must be made in multiple places, leading to inconsistencies
- **Example**: Progress animation has different implementations in plugin vs guide

### 2. No True Single Source of Truth
- **Problem**: Components exist in three forms:
  - Static HTML in `/src/components/`
  - JavaScript-generated HTML in plugin
  - Static examples in documentation
- **Impact**: Visual and behavioral inconsistencies (e.g., filters card appearance)

### 3. Manual Synchronization Required
- **Problem**: No automated way to ensure components stay in sync
- **Impact**: Prone to human error, maintenance burden increases with scale

## Migration Strategy

### Phase 1: Template Functions (Immediate - 1 week)
Create JavaScript template functions as an intermediate step to reduce duplication.

#### Implementation:
1. **Create shared template module** (`/src/shared/templates.js`):
   ```javascript
   export const templates = {
     filtersCard: (data) => `
       <div class="card filter-section is-compact">
         ${data.collections.map(collection => `
           <div class="collection-item ${collection.selected ? 'selected' : ''}">
             <!-- template content -->
           </div>
         `).join('')}
       </div>
     `,
     progressAnimation: (stage) => {
       // Shared animation logic
     }
   };
   ```

2. **Update build system** to process template functions:
   - Convert template functions to static HTML for documentation
   - Bundle for plugin use

3. **Benefits**:
   - Single source for component logic
   - No new tooling required
   - Incremental migration path

### Phase 2: React Components (Month 2-3)

#### 2.1 Setup React Build Pipeline
1. **Install dependencies**:
   ```bash
   npm install --save-dev @vitejs/plugin-react vite
   npm install react react-dom
   ```

2. **Configure Vite** for dual output:
   - Bundle for Figma plugin (inline everything)
   - Bundle for documentation site (with code splitting)

3. **Create component structure**:
   ```
   /src/components/
     ├── atoms/
     │   ├── Button.tsx
     │   ├── Badge.tsx
     │   └── Icon.tsx
     ├── molecules/
     │   ├── CollectionItem.tsx
     │   └── ProgressBar.tsx
     └── organisms/
         ├── FiltersCard.tsx
         └── ExportProgress.tsx
   ```

#### 2.2 Component Migration Order
1. **Atoms first** (Week 1):
   - Buttons, badges, icons
   - These have no dependencies

2. **Molecules** (Week 2):
   - Collection items, progress bars
   - Compose from atoms

3. **Organisms** (Week 3-4):
   - Filter cards, export sections
   - Compose from molecules

#### 2.3 Figma Plugin Integration
1. **Message passing architecture**:
   ```javascript
   // Plugin code (sandbox)
   parent.postMessage({
     pluginMessage: {
       type: 'render-component',
       component: 'FiltersCard',
       props: { collections: [...] }
     }
   }, '*');
   
   // UI code (React)
   window.addEventListener('message', (event) => {
     const { component, props } = event.data.pluginMessage;
     ReactDOM.render(
       React.createElement(components[component], props),
       document.getElementById('root')
     );
   });
   ```

2. **Maintain CSP compliance**:
   - All assets inlined during build
   - No external dependencies

### Phase 3: Full Migration (Month 4)

#### 3.1 Documentation Site
1. **Convert to React app** with:
   - React Router for navigation
   - MDX for documentation content
   - Live component playground

2. **Benefits**:
   - Interactive examples
   - Real-time theme switching
   - Component API documentation

#### 3.2 Testing Strategy
1. **Unit tests** for components
2. **Visual regression tests** with Chromatic
3. **Integration tests** for Figma plugin

## Technical Considerations

### 1. Bundle Size
- Current HTML: ~50KB
- Estimated React: ~150KB (before optimization)
- Mitigation: Tree shaking, code splitting for docs

### 2. Performance
- React adds ~16KB runtime overhead
- Virtual DOM updates more efficient for dynamic content
- Figma plugin performance unchanged (message passing)

### 3. Development Experience
- Hot module replacement
- TypeScript for type safety
- Component documentation with Storybook

## Risk Mitigation

### 1. Gradual Migration
- Keep existing system working during migration
- Component by component replacement
- Feature flags for A/B testing

### 2. Rollback Strategy
- Git branches for each phase
- Build flags to switch between old/new
- Parallel builds during transition

### 3. Team Training
- React fundamentals workshop
- Code review process
- Pair programming for complex components

## Success Metrics

1. **Code Reduction**: 50% less duplicated code
2. **Bug Reduction**: 75% fewer sync-related issues
3. **Development Speed**: 2x faster component creation
4. **Consistency**: 100% visual/behavioral parity

## Timeline

### Month 1: Foundation
- Week 1: Template functions implementation
- Week 2: Build system updates
- Week 3: Migrate 5 core components
- Week 4: Testing and optimization

### Month 2-3: React Migration
- Week 1-2: React setup and atoms
- Week 3-4: Molecules and organisms
- Week 5-6: Plugin integration
- Week 7-8: Documentation site

### Month 4: Polish & Launch
- Week 1-2: Performance optimization
- Week 3: Final testing
- Week 4: Launch and monitoring

## Decision Points

1. **After Phase 1**: Evaluate template function approach
   - If sufficient, delay React migration
   - If not, proceed to Phase 2

2. **After Phase 2**: Assess React implementation
   - Performance metrics
   - Developer satisfaction
   - User feedback

3. **Before Phase 3**: Full commitment check
   - Resource availability
   - Business priorities
   - Technical debt assessment

## Alternatives Considered

### 1. Web Components
- **Pros**: Framework agnostic, native browser support
- **Cons**: Limited tooling, larger polyfills for older browsers
- **Decision**: React has better ecosystem and Figma plugin examples

### 2. Svelte
- **Pros**: Smaller bundle size, compile-time optimization
- **Cons**: Smaller community, fewer Figma plugin examples
- **Decision**: React skills more transferable

### 3. Vue.js
- **Pros**: Gentle learning curve, good documentation
- **Cons**: Less popular for design systems
- **Decision**: React has more design system patterns

## Next Steps

1. **Immediate** (This week):
   - [ ] Implement template functions for filters-card
   - [ ] Create build script for template processing
   - [ ] Test in both plugin and documentation

2. **Short term** (Next 2 weeks):
   - [ ] Migrate 5 most-used components
   - [ ] Set up automated testing
   - [ ] Document template function patterns

3. **Long term** (Next month):
   - [ ] Evaluate Phase 1 success
   - [ ] Plan Phase 2 React setup
   - [ ] Research React + Figma patterns

## Conclusion

This migration plan provides a pragmatic path from the current template-based system to a modern React architecture. The phased approach minimizes risk while delivering incremental value. Template functions provide immediate relief from duplication issues, while React offers a long-term solution for scalable component development.

The key to success is maintaining backward compatibility during migration and ensuring each phase delivers measurable improvements before proceeding to the next.