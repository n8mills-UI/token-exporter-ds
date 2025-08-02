# Current Plan: Template Functions Implementation

## Overview

This document outlines our immediate plan to solve the component synchronization issue using JavaScript template functions. This is Phase 1 of the larger React migration plan, but can stand alone as a complete solution.

## Problem We're Solving

### Current State
- **Design System Guide**: Shows static HTML examples (source of truth for design)
- **Plugin UI**: Generates HTML dynamically with JavaScript
- **Component Files**: Static HTML partials used via `@include` directives

### Issues
1. **Filters Card Mismatch**: Plugin shows different layout than guide
2. **Progress Animation**: Different implementations in plugin vs guide
3. **Icon Inconsistencies**: Different icons or orientations
4. **No JavaScript Reuse**: Logic duplicated between contexts

## Solution: Shared Template Functions

### Architecture

```
/src/shared/
  ├── templates.js          # All component templates
  ├── animations.js         # Shared animation logic
  └── constants.js          # Shared configuration

/scripts/
  ├── build-templates.js    # Converts templates to static HTML
  └── bundle-templates.js   # Bundles for plugin use
```

### Implementation Plan

#### Step 1: Create Shared Templates Module
```javascript
// src/shared/templates.js
export const templates = {
  // Filters Card Template
  filtersCard: (options = {}) => {
    const { collections = [], showHeader = true } = options;
    
    return `
      <div class="card filter-section is-compact">
        <div class="card-content">
          ${showHeader ? `
            <div style="display: flex; align-items: center; gap: var(--size-2); margin-bottom: var(--size-3);">
              <i data-icon="sliders-horizontal" style="width: 1em; height: 1em;"></i>
              <h4 class="text-label">Filters</h4>
            </div>
          ` : ''}
          <div class="collection-list">
            ${collections.map(collection => `
              <div class="collection-item ${collection.selected ? 'selected' : ''}">
                <div class="collection-checkbox"></div>
                <div class="collection-info">
                  <div class="text-body-lg collection-name">${collection.name}</div>
                  <div class="collection-pills">
                    ${collection.badges.map(badge => `
                      <span class="badge small ${badge.color}">
                        <span class="icon" data-icon="${badge.icon}"></span> ${badge.count}
                      </span>
                    `).join('')}
                  </div>
                </div>
                <div class="text-caption collection-count">${collection.total} tokens</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // Progress Animation Template
  progressBar: (progress, stage) => {
    return `
      <div class="progress-container">
        <div class="progress-bar" style="width: ${progress}%"></div>
        <div class="progress-stage">${stage}</div>
      </div>
    `;
  },

  // Quick Export Card
  quickExportCard: (options = {}) => {
    const { format = 'css', showAdvanced = false } = options;
    
    return `
      <div class="card quick-export-card">
        <!-- template content -->
      </div>
    `;
  }
};
```

#### Step 2: Create Shared Animation Logic
```javascript
// src/shared/animations.js
export const animations = {
  exportProgress: {
    stages: [
      { progress: 0, text: 'Analyzing variables...', duration: 0 },
      { progress: 25, text: 'Packaging tokens...', duration: 1500 },
      { progress: 50, text: 'Sanitizing output...', duration: 2700 },
      { progress: 75, text: 'Finalizing export...', duration: 4000 },
      { progress: 100, text: 'Export complete!', duration: 4500 }
    ],
    
    start: (updateCallback, completeCallback) => {
      const startTime = Date.now();
      
      animations.exportProgress.stages.forEach(stage => {
        setTimeout(() => {
          updateCallback(stage.progress, stage.text);
          
          if (stage.progress === 100) {
            setTimeout(completeCallback, 500);
          }
        }, stage.duration);
      });
    }
  }
};
```

#### Step 3: Build System Updates

**Template Processor** (`scripts/build-templates.js`):
```javascript
const { templates } = require('../src/shared/templates.js');
const fs = require('fs');

// Convert template functions to static HTML for components
function buildStaticComponents() {
  // For each component file that needs updating
  const components = [
    {
      name: 'filters-card',
      template: 'filtersCard',
      data: {
        collections: [
          {
            name: 'Brand',
            selected: true,
            badges: [
              { color: 'cyan', icon: 'palette', count: 12 },
              { color: 'pink', icon: 'toggle-right', count: 2 }
            ],
            total: 14
          },
          // ... more collections
        ]
      }
    }
  ];

  components.forEach(component => {
    const html = templates[component.template](component.data);
    fs.writeFileSync(
      `src/components/_${component.name}.html`,
      `<!-- Auto-generated from templates.js -->\n${html}`
    );
  });
}
```

**Plugin Bundler** (`scripts/bundle-templates.js`):
```javascript
// Bundle templates for plugin use
function bundleForPlugin() {
  const templateCode = fs.readFileSync('src/shared/templates.js', 'utf8');
  const animationCode = fs.readFileSync('src/shared/animations.js', 'utf8');
  
  // Transform to Figma-compatible JavaScript (no optional chaining, etc.)
  const transformed = transformForFigma(templateCode + animationCode);
  
  // Inject into plugin template
  const pluginTemplate = fs.readFileSync('src/ui.template.html', 'utf8');
  const updated = pluginTemplate.replace(
    '<!-- TEMPLATE_FUNCTIONS -->',
    `<script>${transformed}</script>`
  );
  
  fs.writeFileSync('src/ui.template.html.tmp', updated);
}
```

#### Step 4: Update Components to Use Templates

**Plugin UI** (`src/ui.template.html`):
```javascript
// Use shared templates
const filterData = {
  collections: figmaCollections.map(c => ({
    name: c.name,
    selected: selectedCollections.includes(c.id),
    badges: getCollectionBadges(c),
    total: c.tokenCount
  }))
};

document.getElementById('filters-container').innerHTML = 
  templates.filtersCard(filterData);

// Use shared animation
animations.exportProgress.start(
  (progress, stage) => {
    document.getElementById('progress-bar').style.width = progress + '%';
    document.getElementById('progress-stage').textContent = stage;
  },
  () => {
    document.getElementById('success-icon').innerHTML = 
      '<i data-icon="circle-check-big"></i>';
  }
);
```

**Design System Guide** (`docs/design-system-guide.template.html`):
```javascript
// Use same templates for examples
const exampleData = {
  collections: [
    // ... example data
  ]
};

document.getElementById('filters-demo').innerHTML = 
  templates.filtersCard(exampleData);
```

### Step 5: Update Build Process

Modify `scripts/build.js`:
```javascript
async function build() {
  console.log('Building Token Exporter...');
  
  // Step 1: Build template functions to static HTML
  await exec('node scripts/build-templates.js');
  
  // Step 2: Bundle templates for plugin
  await exec('node scripts/bundle-templates.js');
  
  // Step 3: Process templates (existing @include logic)
  await processTemplate('src/ui.template.html.tmp', 'src/ui.html');
  await processTemplate('docs/design-system-guide.template.html', 'docs/design-system-guide.html');
  
  // Cleanup
  fs.unlinkSync('src/ui.template.html.tmp');
}
```

### Step 6: Create Watch Mode

For development (`scripts/watch.js`):
```javascript
const chokidar = require('chokidar');

chokidar.watch(['src/shared/**/*.js', 'src/components/**/*.html'])
  .on('change', async (path) => {
    console.log(`File changed: ${path}`);
    
    if (path.includes('shared/')) {
      // Rebuild templates
      await exec('node scripts/build-templates.js');
      await exec('node scripts/bundle-templates.js');
    }
    
    // Rebuild everything
    await exec('npm run build');
  });
```

## Migration Steps

### Week 1: Core Infrastructure
1. ✅ Create `/src/shared/` directory structure
2. ✅ Implement `templates.js` with filtersCard
3. ✅ Implement `animations.js` with exportProgress
4. ✅ Create `build-templates.js` script
5. ✅ Create `bundle-templates.js` script
6. ✅ Update build.js to use new scripts

### Week 2: Component Migration
1. ✅ Migrate filters-card to template function
2. ✅ Migrate progress-animation to shared logic
3. ✅ Migrate quick-export-card
4. ✅ Migrate stats-container
5. ✅ Migrate theme-toggle

### Week 3: Testing & Optimization
1. ✅ Test all components in plugin context
2. ✅ Test all components in guide context
3. ✅ Verify visual consistency
4. ✅ Performance testing
5. ✅ Fix any edge cases

## Benefits of This Approach

### Immediate Benefits
1. **Single Source of Truth**: One template function per component
2. **Consistent Behavior**: Same logic in plugin and guide
3. **Easier Maintenance**: Change once, updates everywhere
4. **No New Dependencies**: Uses vanilla JavaScript

### Long-term Benefits
1. **React-Ready**: Template functions easily convert to JSX
2. **Testable**: Can unit test template functions
3. **Type-Safe**: Can add TypeScript later
4. **Composable**: Templates can use other templates

## Success Criteria

1. **Visual Parity**: Plugin and guide show identical components
2. **Behavioral Parity**: Animations and interactions match
3. **Build Time**: No significant increase (<2 seconds)
4. **Developer Experience**: Easier to add new components
5. **Zero Regressions**: All existing functionality maintained

## Rollback Plan

If template functions don't work:
1. Git revert to previous commit
2. Keep static HTML approach
3. Document manual sync process
4. Consider hiring developer for React migration

## Next Steps After Implementation

1. **Monitor**: Track how many sync issues occur
2. **Iterate**: Refine template function patterns
3. **Document**: Create component development guide
4. **Evaluate**: After 1 month, decide on React migration

## Component Priority Order

Based on complexity and reuse:

1. **High Priority** (Week 1):
   - filters-card (complex, differs between contexts)
   - progress-animation (shared logic needed)
   - quick-export-card (core functionality)

2. **Medium Priority** (Week 2):
   - theme-toggle (reused multiple times)
   - stats-container (simple but reused)
   - empty-state (static but reused)

3. **Low Priority** (Week 3):
   - challenge-solution-grid (mostly static)
   - profile-card (single use)
   - skeleton-loader (rarely shown)

## Technical Considerations

### Figma Compatibility
- No optional chaining (`?.`)
- No template literals in catch blocks
- Transform modern JS to ES5 equivalent

### Performance
- Templates generate strings (fast)
- No virtual DOM overhead
- Minimal bundle size increase (~5KB)

### Browser Support
- Works in all browsers Figma supports
- No polyfills needed
- Progressive enhancement friendly

## Conclusion

This template function approach provides an immediate solution to our component synchronization problems while laying groundwork for future React migration. It's pragmatic, low-risk, and can be implemented incrementally without disrupting the current system.