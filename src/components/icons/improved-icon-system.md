# Improved Icon System Architecture

## Current Issues
1. **Mixed Systems**: Trying to use both custom icons AND external Lucide
2. **External Dependencies**: Loading from CDN (fails in Figma)
3. **Attribute Confusion**: Supporting both data-icon and data-lucide
4. **Complex Rendering**: Overly complicated with debouncing and initialization checks

## Proposed Clean Architecture

### Option 1: Pure CSS Icons (No JavaScript)
```html
<!-- In the HTML -->
<i class="icon icon-package"></i>

<!-- In the CSS -->
.icon-package::before {
    content: url('data:image/svg+xml;utf8,<svg>...</svg>');
}
```

**Pros:**
- Zero JavaScript needed
- Always works
- Fast rendering
- No timing issues

**Cons:**
- Can't dynamically change colors
- Larger CSS file
- Less flexible

### Option 2: Web Components (Modern)
```javascript
class IconElement extends HTMLElement {
    connectedCallback() {
        const name = this.getAttribute('name');
        this.innerHTML = ICONS[name] || '';
    }
}
customElements.define('app-icon', IconElement);
```

```html
<app-icon name="package"></app-icon>
```

**Pros:**
- Clean, semantic HTML
- Self-rendering
- No external dependencies
- Works with dynamic content

**Cons:**
- Requires modern browser
- Might not work in Figma

### Option 3: Simplified Current System
```javascript
// Just one simple function
function renderIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => {
        const icon = ICONS[el.dataset.icon];
        if (icon && !el.innerHTML) {
            el.innerHTML = icon;
        }
    });
}

// Run it once
renderIcons();

// Run on any dynamic content
const observer = new MutationObserver(renderIcons);
observer.observe(document.body, { childList: true, subtree: true });
```

**Pros:**
- Simple and reliable
- Works everywhere
- No external dependencies
- Handles dynamic content

**Cons:**
- Still needs JavaScript

## Recommendation

For a Figma plugin, I recommend **Option 3** with these improvements:

1. **Single Attribute**: Use only `data-icon`, remove `data-lucide` support
2. **No External Scripts**: Everything embedded
3. **Simple Rendering**: No complex initialization
4. **Inline the Icons**: Consider inlining the most common icons directly in HTML during build

## Build-Time Optimization

Instead of runtime rendering, process icons during build:

```javascript
// In build.js
content = content.replace(/<i data-icon="(\w+)"><\/i>/g, (match, iconName) => {
    return `<i class="icon">${ICONS[iconName] || match}</i>`;
});
```

This way:
- Icons are pre-rendered in HTML
- No JavaScript needed at runtime
- Fastest possible performance
- Never fails