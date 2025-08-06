# Component System Architecture

## Overview
This directory powers the **shared component system** between the Figma plugin and design system documentation. It ensures **perfect consistency** by using the same HTML generation functions, sample data, and configuration across both environments.

## Why This System Exists
- **Single Source of Truth**: Each component defined once, used everywhere
- **Zero Drift**: Plugin and documentation stay perfectly synchronized  
- **Figma Compatibility**: All code works in Figma's restricted JavaScript environment
- **Maintainable**: Centralized updates propagate automatically

## Quick Start
Looking to add a new component? Jump to [Adding New Components](#adding-new-components-step-by-step)

## How It Works
This directory contains reusable code shared between the Figma plugin (`src/ui.template.html`) and documentation guide (`docs/design-system-guide.template.html`).

## Files Overview

### `data.js` - Sample Data
Contains mock data used by template functions for consistent component rendering.

**Contents:**
- `collections` - Sample variable collections with badges, selection states, and counts
- `stats` - Performance metrics for stats container (platforms, automation %, export time)
- `exportFormats` - List of supported export formats (CSS, Swift, Android, etc.)

**Usage:**
```javascript
// Available in both browser and Node.js environments
import { sampleData } from './data.js';
// or
window.sampleData.collections
```

### `templates.js` - HTML Generation Functions
JavaScript functions that generate consistent HTML for UI components. Uses vanilla JS syntax for Figma compatibility.

**Key Templates:**
- `filtersCard()` - Variable collection filter UI with checkboxes and badges
- `quickExportCard()` - Export format selector with dropdown
- `progressFlowDemo()` - Animated progress loader with glass morphism
- `statsContainer()` - Performance metrics display
- `themeToggle()` - Light/dark theme switcher with animated icons
- `emptyState()` - Welcome screen when no variables exist

**Figma Constraints:**
- No optional chaining (`obj?.prop`)
- No template literals with interpolation (`${var}`)
- No spread operators (`...obj`)
- Uses string concatenation for HTML building

**Example:**
```javascript
// Generate a filters card
const html = templates.filtersCard({
  collections: sampleData.collections,
  showHeader: true
});
```

### `component-config.js` - Configuration Constants
Centralized settings for component behavior and styling.

**Configurations:**
- `PROGRESS_ANIMATION` - Animation stages, timing, and success states
- `ICON_CONFIG` - Icon sizes, aliases for backward compatibility
- `BUTTON_CONFIG` - Button sizing and icon positioning
- `THEME_TOGGLE_CONFIG` - Theme persistence and default values

**Example:**
```javascript
import { PROGRESS_ANIMATION } from './component-config.js';

// Access animation stages
PROGRESS_ANIMATION.stages.forEach(stage => {
  console.log(`${stage.percent}% - ${stage.label}`);
});
```

## Architecture Benefits

### Single Source of Truth
Components defined once, used everywhere. Changes automatically propagate to both plugin and documentation.

### Figma Compatibility
All code uses ES5-compatible syntax that works in Figma's restricted JavaScript environment.

### Consistency
Identical HTML structure and behavior between plugin and guide ensures design system integrity.

### Maintainability
Centralized configuration makes updates easier and reduces bugs from inconsistent implementations.

## Usage in Build System

The build system (`scripts/build.js`) processes templates and inlines these shared components:

1. **Template Processing** - Replaces `@include` directives with component HTML
2. **Data Injection** - Makes `sampleData` available in both contexts
3. **Configuration Merging** - Ensures consistent settings across environments

## Development Guidelines

### Adding New Components - Step by Step

#### 1. Create the Component File
```bash
# Create underscore-prefixed file in components/
touch src/components/_my-new-component.html
```

#### 2. Add Template Function (if needed)
**In `src/lib/templates.js`:**
```javascript
// Add new template function
myNewComponent: function(options) {
  const defaults = {
    title: 'Default Title',
    showIcon: true
  };
  
  const config = {};
  for (const key in defaults) {
    config[key] = options && options[key] !== undefined ? options[key] : defaults[key];
  }
  
  return '<div class="my-component">' +
    '<h3>' + config.title + '</h3>' +
    // Build HTML string...
  '</div>';
}
```

#### 3. Add Sample Data (if needed)
**In `src/lib/data.js`:**
```javascript
const sampleData = {
  // Add new data structure
  myComponentData: {
    items: ['Item 1', 'Item 2'],
    config: { enabled: true }
  }
  // ... existing data
};
```

#### 4. Create Component HTML
**In `src/components/_my-new-component.html`:**
```html
<script>
// Use the shared template and data
const html = templates.myNewComponent({
  title: sampleData.myComponentData.title,
  items: sampleData.myComponentData.items
});
document.write(html);
</script>
```

#### 5. Include in Templates
**In `src/ui.template.html` or `docs/design-system-guide.template.html`:**
```html
<!-- @include src/components/_my-new-component.html -->
```

#### 6. Build and Test
```bash
npm run build  # Processes templates
npm run check  # Validates everything
```

### Component Naming Conventions
- **Component files**: `_component-name.html` (underscore prefix required)
- **Template functions**: `camelCase` matching component name
- **Data objects**: `componentNameData` in sampleData
- **CSS classes**: Follow existing patterns in `docs/design-system.css`

### Figma Compatibility Rules
- Always use `function() {}` syntax, never arrow functions in loops
- Use `for...in` loops instead of `Object.keys()`
- Check for `undefined` explicitly: `obj && obj.prop`
- Build strings with concatenation: `'Hello ' + name`
- Always include error parameters: `catch (error) {}`

### Testing Changes
```bash
npm run build  # Build templates
npm run check  # Validate compatibility
```

Both the plugin and documentation guide should render identically after changes.

## Troubleshooting

### Common Issues

#### Component Not Showing
- Check underscore prefix: `_component-name.html`
- Verify `@include` path matches file location
- Run `npm run build` to regenerate templates

#### JavaScript Errors in Figma
- Use `obj && obj.prop` instead of `obj?.prop`
- Replace template literals: `'Hello ' + name` not `` `Hello ${name}` ``
- Add catch parameters: `catch (error) {}` not `catch {}`

#### Data Not Available
- Check `sampleData` export in `data.js`
- Verify `window.sampleData` is set for browser usage
- Ensure build system processes both files

#### CSS Classes Missing
- Add styles to `docs/design-system.css`
- Follow existing naming patterns
- Run `npm run check` to validate class usage

### Build System Flow
```
Source Files → Build Script → Generated Files
├── *.template.html → (processes @include) → *.html
├── _components.html → (inlines JavaScript) → embedded HTML
└── shared/*.js → (makes available) → window.sampleData, window.templates
```

### File Structure
```
src/lib/
├── data.js              # Sample data for all components
├── templates.js         # HTML generation functions
├── component-config.js  # Configuration constants
└── README.md           # This documentation

src/components/
├── _component.html     # Component definitions (underscore prefix)
└── icons/
    └── _icon-system.html

Generated by build:
├── src/ui.html                    # Plugin interface
└── docs/design-system-guide.html  # Documentation site
```