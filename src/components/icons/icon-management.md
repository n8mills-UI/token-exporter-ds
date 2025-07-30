# Icon Management Guide

## How Icons Work After Build-Time Injection

### Current Architecture
1. **Icon Definitions**: Live in `scripts/icon-definitions.js`
2. **Build Process**: Replaces `<i data-icon="name"></i>` with actual SVG during build
3. **Runtime**: No JavaScript needed - icons are already in the HTML

### Adding or Changing Icons

#### To Add a New Icon:
1. Edit `scripts/icon-definitions.js`
2. Add your icon to the ICONS object:
   ```javascript
   'new-icon': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">...</svg>`,
   ```
3. Use it in your HTML templates:
   ```html
   <i data-icon="new-icon"></i>
   ```
4. Run `npm run build` - the icon will be injected

#### To Update an Existing Icon:
1. Edit `scripts/icon-definitions.js`
2. Find and update the icon SVG
3. Run `npm run build` - all instances will be updated

### Benefits of This Approach
- ✅ Icons always work (no JavaScript required)
- ✅ Faster page load (no runtime processing)
- ✅ Single source of truth
- ✅ Easy to update globally
- ✅ Works in Figma's restricted environment

### What Happens to _icon-system.html?
After implementing build-time injection, we can:
1. Delete it entirely (recommended)
2. OR keep it as a fallback (but it won't be used)

The old file with `window.PluginIcons` and `renderPluginIcons()` becomes unnecessary because icons are pre-rendered.

### Future Icon Sources
If you want to use external icon libraries:

1. **Download icons during build**:
   ```javascript
   // In build.js
   const icons = await fetch('https://unpkg.com/lucide-static/icons.json');
   ```

2. **Generate from Figma**:
   - Export icons from Figma as SVGs
   - Script to convert them to the format needed

3. **Icon sprite approach**:
   - Generate an SVG sprite sheet
   - Use `<use href="#icon-name">` references

### Migration Path
1. All current `data-icon` attributes will continue to work
2. No changes needed to existing HTML
3. Just update the build script and icon definitions
4. The _icon-system.html file can be removed after testing