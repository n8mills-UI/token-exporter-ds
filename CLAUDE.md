# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Token Exporter** is a Figma plugin that transforms design variables into production-ready code across multiple platforms. It's built using vanilla JavaScript and features a component-based build system with automated CSS/JS bundling.

## Development Commands

### Core Development
- `npm run sync` - Main build command that compiles templates, bundles assets, and generates final HTML files
- `npm run dev` - Watch mode that auto-rebuilds when source files change
- `npm run build` - Alias for `npm run sync`

### Code Quality
- `npm run lint:js` - Lint JavaScript files using ESLint (note: uses legacy flat config)
- `npm run figma-check` - Check for Figma plugin compatibility issues **[CRITICAL - Run before testing in Figma]**
- `npm test` - Run both linting and Figma compatibility checks
- ESLint config includes Figma-specific globals (`figma`, `__html__`)
- Stylelint is configured for CSS linting (extends `stylelint-config-standard`)

### Cleanup
- `npm run clean` - Remove backup files

## Architecture

### Build System
The project uses a sophisticated bash-based build system (`scripts/sync.sh`) that:
1. Bundles external CSS from `@import` statements by fetching and inlining them
2. Bundles external JavaScript from `<script src>` tags
3. Processes HTML templates by injecting component partials using `<!-- @include path/to/partial.html -->` syntax
4. Assembles final HTML files with all assets embedded inline (required for Figma's CSP restrictions)

### File Structure & Conventions

**Source Files (EDIT THESE):**
- `docs/design-system.css` - Single source of truth for all styles
- `src/ui.template.html` - Template for plugin UI
- `docs/design-system-guide.template.html` - Template for documentation site
- `src/components/_*.html` - Reusable HTML component partials
- `src/code.js` - Main plugin logic

**Generated Files (DO NOT EDIT):**
- `src/ui.html` - Final plugin UI (auto-generated)
- `docs/design-system-guide.html` - Final documentation site (auto-generated)

### Template System
- Templates use `<!-- @include path/to/component.html -->` syntax to inject partials
- All external resources (CSS/JS) are bundled inline due to Figma CSP restrictions
- Build script automatically processes templates and resolves all includes

### Plugin Architecture
- Main plugin code in `src/code.js` handles token extraction and export
- Supports 6 export formats: CSS, Swift, Android XML, Flutter, W3C JSON, Tailwind
- Features intelligent alias resolution, platform-specific name sanitization, and context-aware unit handling
- Includes performance monitoring with batch processing and memory management

## Key Technical Constraints

### Figma CSP Restrictions
- All external CSS/JS must be bundled inline
- No external `@import` or `<script src>` allowed in final plugin files
- Build system automatically handles this bundling

### Template Processing
- Never edit `.html` files directly - they are build artifacts
- Always edit `.template.html` files and component partials
- Use the include syntax for component composition

### Development Workflow
1. Edit source files (CSS, templates, components)
2. Run `npm run sync` to build
3. Test in browser (design system guide) and Figma (plugin)

## Code Style & Standards

### JavaScript
- ES2021+ features supported, but **IMPORTANT**: Figma's JavaScript environment has limitations
- **Compatibility Requirements:**
  - **CRITICAL:** Never use optional chaining (`?.`) - causes "Unexpected token ." errors
  - **CRITICAL:** Always use `catch (error)` with a parameter - `catch { }` syntax is not supported
  - Use conditional checks instead: `obj && obj.prop` or `obj ? obj.prop : defaultValue`
  - Modern features like `const`, `let`, `Map`, `Set`, `async/await` work fine
- ESLint extends `eslint:recommended`
- Figma and plugin-specific globals are defined: `figma`, `__html__`
- No unused vars warnings for function arguments

### Modern JavaScript Patterns (Implemented)
The codebase follows modern JavaScript best practices:

**Error Handling:**
- Custom error classes: `ValidationError`, `NetworkError`, `ProcessingError`, `MemoryError`
- Always include context in errors for better debugging
- Use specific error types rather than generic Error objects
- Example: `throw new ValidationError('Message', { context: data })`

**Async/Await Patterns:**
- Use `Promise.allSettled()` instead of `Promise.all()` for better error handling
- Wrap async operations in try/catch blocks with specific error types
- Prefer concurrent processing where possible for performance

**Functional Programming:**
- Use `Object.entries()` instead of `for...in` loops for better performance
- Prefer `map()`, `filter()`, `reduce()` over manual loops
- Use array destructuring and spread operator where appropriate

**Data Structures:**
- Use `Map` for O(1) lookups instead of `Array.find()` for large datasets
- Create lookup maps for frequently accessed data (variables, collections)
- Example: `const variablesById = new Map(variables.map(v => [v.id, v]))`

**Input Validation:**
- Always validate inputs with specific error messages
- Sanitize user inputs (URLs, names) before processing
- Use type checking and bounds validation
- Throw `ValidationError` for invalid inputs with detailed context

### CSS
- Uses CSS custom properties extensively
- Built on Shoelace component library and Open Props
- Follows atomic design principles
- Alpha values use number notation, color functions use legacy notation

### Component Architecture
- Single source of truth principle
- Template-based generation ensures consistency
- Component partials enable reusability across plugin and documentation

## Testing

No formal testing framework is configured. Testing is done manually:
- Test plugin functionality in Figma
- Test UI/design system in browser via generated documentation site
- Verify build process produces valid output

## Performance Considerations

### Implemented Optimizations
The plugin includes several performance optimizations:
- **Batch processing** with configurable batch sizes (`BATCH_SIZE = 100`)
- **Memory monitoring** with warnings and error thresholds
- **Chunked operations** for large datasets to prevent UI blocking
- **Export size limits** (50MB max) to prevent memory issues
- **Circular reference detection** in alias resolution with depth limits

### Performance Patterns (Implemented)
**Memory Management:**
- Use `checkMemoryUsage()` before processing large datasets
- Configurable memory thresholds: `MEMORY_WARNING_THRESHOLD = 100MB`
- Throw `MemoryError` for critical memory conditions
- Yield control with `setTimeout(0)` to prevent UI blocking

**Data Processing:**
- **Map-based lookups:** Replace `Array.find()` with `Map.get()` for O(1) performance
- **Sequential processing** for datasets >1000 variables to manage memory
- **Promise.allSettled()** for concurrent processing with graceful failure handling
- **Lazy loading** with dataset size thresholds

**Optimization Constants:**
```javascript
const BATCH_SIZE = 100;           // Variables per batch
const CHUNK_SIZE = 10;            // Collections per chunk  
const MAX_ALIAS_DEPTH = 100;      // Prevent infinite recursion
const MEMORY_WARNING_THRESHOLD = 100; // MB threshold
```

**Best Practices:**
- Always use `variablesById.get(id)` instead of `allVariables.find(v => v.id === id)`
- Process large datasets sequentially to prevent memory spikes
- Monitor memory usage during processing with `checkMemoryUsage()`
- Use functional patterns for better performance and readability

## External Dependencies

**Runtime:**
- Shoelace (web components)
- Open Props (CSS framework)
- Lucide (icons)

**Development:**
- ESLint for JavaScript linting
- Stylelint for CSS linting
- Nodemon for watch mode

All external assets are bundled inline during build process.

## Debugging & Troubleshooting

### Common Issues & Solutions

**1. JavaScript Compatibility Errors:**
- **Error:** `Syntax error: Unexpected token .` (optional chaining)
- **Solution:** Replace `obj?.prop` with `obj && obj.prop` or `obj ? obj.prop : defaultValue`
- **Fix:** Never use `?.` syntax anywhere in the code

- **Error:** `Syntax error: Unexpected token {` (catch blocks)  
- **Solution:** Always use `catch (error)` with parameter, never `catch {}`
- **Fix:** Replace `} catch {` with `} catch (error) {`

**2. Performance Issues:**
- **Problem:** Plugin crashes with large token collections
- **Solution:** Check memory usage and use sequential processing
- **Debug:** Look for `MemoryError` in console, use `checkMemoryUsage()`

**3. Build Failures:**
- **Problem:** Generated HTML files are empty or broken
- **Solution:** Check that external resources are fetchable
- **Debug:** Run `npm run sync` and check for failed fetches in output

**4. Validation Errors:**
- **Error:** `ValidationError` with specific context
- **Solution:** Check the error context for detailed information
- **Debug:** All validation errors include context object with debugging info

### Debugging Best Practices

**Error Context:**
All custom errors include context for debugging:
```javascript
catch (error) {
    if (error instanceof ValidationError) {
        console.error('Validation failed:', error.context);
        // Context contains: received, expected, validValues, etc.
    }
}
```

**Memory Debugging:**
```javascript
const memInfo = checkMemoryUsage();
if (memInfo) {
    console.log(`Memory: ${memInfo.used}MB / ${memInfo.limit}MB`);
}
```

**Performance Profiling:**
- Use browser dev tools Performance tab when testing in documentation site
- Monitor console for memory warnings during large exports
- Check network requests during build process for failed external resource fetches

### Development Tips

**Quick Testing Workflow (RECOMMENDED):**
1. Make changes to `src/code.js`
2. **Run `npm run figma-check`** - This catches compatibility issues instantly
3. If compatibility check passes, run `npm run sync`
4. Reload plugin in Figma (no need to reinstall)  
5. Test with small token collection first

**Script Testing Before Commits:**
When adding or modifying npm scripts in `package.json`:
1. **Test critical scripts manually** before committing:
   - `npm start` - Verify universal entry point works
   - `npm run sync` - Ensure build process completes
   - `npm run format` - Check CSS auto-fix functionality
2. **Update README.md** to reflect any script changes
3. **Document new scripts** with clear descriptions of their purpose
4. **Avoid "unsafe" naming** - use descriptive names like `sync:skip-checks`

**Figma Compatibility Checker:**
- **Purpose:** Validates code for Figma plugin environment issues before testing
- **Usage:** `npm run figma-check` or `npm run figma-check path/to/file.js`
- **Detects:** Optional chaining (`?.`), catch blocks without parameters, modern syntax issues
- **Benefits:** Saves time by catching errors before Figma reload cycle

**Error Investigation:**
- All errors include timestamps and operation context
- Check both browser console and Figma console for different error types
- Use `console.error()` with structured error objects for better debugging