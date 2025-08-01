# Token Exporter Plugin Architecture

## Overview
Token Exporter is a Figma plugin that transforms design variables (colors, typography, spacing, etc.) into production-ready code across multiple platforms. This document outlines the plugin's architecture, user flow, and technical implementation details.

## State Machine

```
┌─────────────┐
│   LOADING   │ ← Initial state when plugin opens
└─────┬───────┘
      │
      ├─→ ┌──────────┐
      │    │  EMPTY   │ ← No collections found
      │    └──────────┘
      │
      └─→ ┌──────────┐
           │  READY   │ ← Collections loaded
           └─────┬────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────────────┐    ┌──────────────────┐
│  SIMPLE_EXPORT  │←──→│ ADVANCED_EXPORT  │
└────────┬────────┘    └────────┬─────────┘
         │                      │
         └──────────┬───────────┘
                    ▼
            ┌──────────────┐
            │  EXPORTING   │
            └───────┬──────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
    ┌─────────┐          ┌─────────┐
    │ SUCCESS │          │  ERROR  │
    └─────────┘          └─────────┘
```

## Screen Definitions

### 1. Loading Screen
- **Component**: `_skeleton-loader.html`
- **Purpose**: Visual feedback while fetching variable collections
- **Duration**: 1-3 seconds typically
- **Transitions to**: Empty State OR Ready State

### 2. Empty State
- **Component**: `_empty-state.html`
- **Purpose**: Inform user no collections are available
- **Actions**: 
  - Reload collections button
  - Link to documentation
- **Transitions to**: Loading (on reload)

### 3. Simple Export View (Default)
- **Component**: `_quick-export-card.html`
- **Purpose**: Quick export with minimal configuration
- **Features**:
  - Format selection (CSS, iOS, Android, etc.)
  - Export all collections at once
  - One-click export
- **Transitions to**: Advanced Export, Exporting

### 4. Advanced Export View
- **Components**: 
  - `_filters-card.html` - Collection filtering
  - `_quick-export-card.html` - Export options
- **Purpose**: Granular control over export
- **Features**:
  - Filter by collection
  - Filter by mode
  - Search functionality
  - Preview token count
- **Transitions to**: Simple Export, Exporting

### 5. Export Progress
- **Component**: Progress overlay (inline)
- **Purpose**: Show export progress
- **Features**:
  - Progress bar
  - Status messages
  - Cancel option (if applicable)
- **Transitions to**: Success, Error

### 6. Success State
- **Component**: Toast notification
- **Purpose**: Confirm successful export
- **Features**:
  - Success message
  - Export summary
  - Copy to clipboard option
- **Transitions to**: Previous view

### 7. Error State
- **Component**: Error message (inline)
- **Purpose**: Inform user of export failure
- **Features**:
  - Error description
  - Retry option
  - Help link
- **Transitions to**: Previous view

## Component Hierarchy

```
PluginContainer (#plugin-container)
├── Header (optional - not currently used)
├── ContentArea (#content-area)
│   ├── LoadingState (#loading-container)
│   │   └── SkeletonLoader
│   ├── EmptyState (#empty-state-container)
│   │   └── EmptyStateCard
│   └── ExportView (#export-view)
│       ├── SimpleExport (#quick-export-view)
│       │   └── QuickExportCard
│       └── AdvancedExport (#advanced-filter-view)
│           ├── FiltersCard
│           └── QuickExportCard
└── Footer (#plugin-footer)
    └── PluginFooter
```

## Event Flow

### 1. Plugin Initialization
```javascript
1. Plugin opens → Show loading state
2. Request collections from Figma
3. Receive collections data
4. Determine state:
   - No collections → Show empty state
   - Has collections → Show simple export view
```

### 2. Mode Switching
```javascript
1. User clicks "Advanced Filtering" toggle
2. Hide simple export view
3. Show advanced filter view
4. Initialize filter state
```

### 3. Export Process
```javascript
1. User clicks export button
2. Collect form data:
   - Selected format
   - Selected collections (if advanced)
   - Export options
3. Show progress indicator
4. Send export request to code.js
5. Process tokens in backend
6. Return formatted output
7. Show success/error state
```

## Data Flow

```
UI (ui.html) ←→ Plugin Code (code.js) ←→ Figma API
     │                    │                    │
     ├─ User Actions      ├─ Process Tokens   ├─ Get Variables
     ├─ Form Data         ├─ Format Output    ├─ Get Collections
     └─ UI Updates        └─ Error Handling   └─ Get Modes
```

## Message Protocol

### UI → Plugin Messages
```javascript
// Get collections
{ type: 'get-collections' }

// Export tokens
{
  type: 'export-tokens',
  format: 'css|ios|android|flutter|json|tailwind',
  options: {
    collections: ['collection-id-1', 'collection-id-2'],
    modes: ['mode-1', 'mode-2'],
    includeComments: boolean
  }
}
```

### Plugin → UI Messages
```javascript
// Collections data
{
  type: 'collections-loaded',
  data: {
    collections: [...],
    hasCollections: boolean
  }
}

// Export progress
{
  type: 'export-progress',
  progress: 0-100,
  message: 'Processing collection...'
}

// Export complete
{
  type: 'export-complete',
  data: {
    output: 'formatted code string',
    format: 'css',
    tokenCount: 150
  }
}

// Error
{
  type: 'error',
  message: 'Error description'
}
```

## Container Requirements

Each view requires specific containers in the HTML structure:

### Required Container IDs
- `#loading-container` - For skeleton loader
- `#empty-state-container` - For empty state
- `#export-card-container` - Main container for export views
- `#quick-export-view` - Simple export mode
- `#advanced-filter-view` - Advanced export mode
- `#plugin-footer` - Footer container

### Dynamic Content Areas
- `#collections-grid` - Renders collection checkboxes
- `#export-output` - Shows formatted export (if preview enabled)
- `#error-message` - Displays error states

## Memory & Performance Considerations

### Token Limits
- Batch processing for >1000 tokens
- Memory warning at 100MB usage
- Maximum export size: 50MB

### UI Optimizations
- Lazy load advanced features
- Debounce search input
- Virtual scrolling for large collections (future)

## Security & Validation

### Input Validation
- Sanitize collection names
- Validate export format selection
- Check token counts before processing

### Error Boundaries
- Graceful degradation for missing features
- Fallback UI for critical errors
- User-friendly error messages

## Testing Checklist

### Unit Tests (Component Level)
- [ ] Each component renders correctly
- [ ] Interactive elements are accessible
- [ ] Event handlers are attached

### Integration Tests
- [ ] State transitions work correctly
- [ ] Data flows between UI and plugin
- [ ] Export formats generate correctly

### E2E Tests
- [ ] Complete export flow for each format
- [ ] Mode switching preserves state
- [ ] Error recovery works

### Edge Cases
- [ ] No collections available
- [ ] Very large collections (>5000 tokens)
- [ ] Network failures (if applicable)
- [ ] Figma API limits

## Future Enhancements

### Planned Features
1. **Batch Operations**: Export multiple formats at once
2. **Export History**: Recent exports with re-export option
3. **Custom Templates**: User-defined export formats
4. **Preview Mode**: See output before exporting

### Architecture Improvements
1. **State Management**: Consider Redux/Zustand for complex state
2. **Component Library**: Build reusable component system
3. **Testing Framework**: Automated testing suite
4. **Performance Monitoring**: Track export times and optimize

## Maintenance Notes

### Adding New Export Formats
1. Add format option to UI select element
2. Add format handler in `code.js`
3. Create formatting function
4. Add format to message protocol
5. Update documentation

### Debugging Common Issues
1. **Buttons not working**: Check event listener selectors
2. **Missing content**: Verify container IDs exist
3. **Export fails**: Check console for backend errors
4. **Styling issues**: Ensure CSS is properly inlined

### Build Process Reminders
- Always edit `.template.html` files, never `.html` directly
- Run `npm run build` after changes
- Test in Figma after building
- Check for CSP compliance (no external resources)