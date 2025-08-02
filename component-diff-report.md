# Component Diff Report

## Overview
This report compares hardcoded components in the Design System Guide with their source files in `src/components/`.

### Summary of Findings:
- **15 components** are hardcoded instead of using `@include`
- **Key pattern differences** found in icon usage and SVG attributes
- **Most components** have only minor differences that can be reconciled

### Analyzed Components (9 of 15):
✅ **Identical (5)**: Can be replaced with `@include` immediately
- Progress Flow Demo
- About Modal
- Footer Minimal
- Token Card Default
- Token Card Advanced

⚠️ **Minor Differences (4)**: Need small updates before replacing
- Theme Toggle: Remove `stroke-width="2"` from SVGs
- Button Component: Standardize icon approach (`<i>` vs `<span class="icon">`)
- Filters Card: Update badge colors and card modifier
- Profile Card: Update button text to `[RE-RUN DEMO]`

🔍 **Not Yet Analyzed (6)**:
- Skeleton Loader
- Empty State
- Forms Example
- Built With Info Panel
- Plugin Footer
- Others from initial validation

---

## 1. Progress Flow Demo (`_progress-flow-demo.html`)

### Status: ✅ IDENTICAL HTML STRUCTURE

**Key Finding**: The HTML is identical between source and guide. If the animation works in the guide but not the plugin, the issue is JavaScript/CSS context, not the component structure.

### Recommendation:
- ✅ Can safely replace with `@include` - no HTML changes needed
- ⚠️ Need to ensure animation JS/CSS are loaded in plugin context

---

## 2. Theme Toggle (`_theme-toggle.html`)

### Status: ⚠️ MINOR DIFFERENCES

**Differences Found**:
1. **SVG stroke-width attribute**:
   - Source: `stroke-width="2"`
   - Guide: Missing stroke-width attribute

**Example**:
```html
<!-- Source -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">

<!-- Guide -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" >
```

### Recommendation:
- 🔧 Update component file to remove stroke-width="2" to match guide
- OR add stroke-width="2" to guide versions
- Then replace with `@include`

---

## 3. Button Component (`_button.html`)

### Status: ⚠️ STRUCTURAL DIFFERENCES

**Major Differences**:
1. **Icon Implementation**:
   - Source: `<span class="icon" data-icon="figma"></span>`
   - Guide: `<i data-icon="package"></i>`

2. **Component Structure**:
   - Source: Full component showcase with sections, states, guidelines
   - Guide: Individual button examples integrated into design system sections

**Example**:
```html
<!-- Source -->
<button class="btn btn-primary btn-sm">
  <span class="icon" data-icon="figma"></span> Small
</button>

<!-- Guide -->
<button class="btn btn-primary btn-sm">
  <i data-icon="package"></i> Small Button
</button>
```

### Recommendation:
- 🚨 Need to standardize icon approach across the system
- Decide: `<span class="icon">` vs `<i>` for icons
- Button component may need to stay partially hardcoded in guide for contextual examples

---

## 4. Filters Card (`_filters-card.html`)

### Status: ⚠️ STYLING DIFFERENCES

**Differences Found**:
1. **Card class modifier**:
   - Source: `class="card filter-section has-inner-structure"`
   - Guide: `class="card filter-section is-compact"`

2. **Badge color classes**:
   - Source: Semantic classes (`badge small color`, `badge small state`, `badge small text`, `badge small number`)
   - Guide: Theme-specific colors (`badge small cyan`, `badge small pink`, `badge small purple`, `badge small orange`)

**Example**:
```html
<!-- Source -->
<span class="badge small color"><span class="icon" data-icon="palette"></span> 12</span>

<!-- Guide -->
<span class="badge small cyan"><span class="icon" data-icon="palette"></span> 12</span>
```

### Recommendation:
- 🔧 Update component file to use theme-specific badge colors (cyan, pink, etc.)
- 🔧 Change `has-inner-structure` to `is-compact` modifier
- Then replace with `@include`

---

## 5. About Modal (`_about-modal.html`)

### Status: ✅ IDENTICAL

**Key Finding**: The HTML is identical between source and guide. Both versions use `<i data-icon="x">` for icons.

### Recommendation:
- ✅ Can safely replace with `@include` - no changes needed

---

## 6. Profile Card (`_profile-card.html`)

### Status: ⚠️ MINOR DIFFERENCE

**Differences Found**:
1. **Button data-text attribute**:
   - Source: `data-text="[RE-RUN]"`
   - Guide: `data-text="[RE-RUN DEMO]"`

### Recommendation:
- 🔧 Update component file to use `[RE-RUN DEMO]` to match guide
- Then replace with `@include`

---

## 7. Footer Minimal (`_footer-minimal.html`)

### Status: ✅ IDENTICAL

**Key Finding**: The HTML is identical between source and guide. Both versions use `<i data-icon="x">` for icons.

### Recommendation:
- ✅ Can safely replace with `@include` - no changes needed

---

## 8. Token Card Default (`_token-card-default.html`)

### Status: ✅ IDENTICAL

**Key Finding**: The HTML is identical between source and guide.

### Recommendation:
- ✅ Can safely replace with `@include` - no changes needed

---

## 9. Token Card Advanced (`_token-card-advanced.html`)

### Status: ✅ IDENTICAL

**Key Finding**: The HTML is identical between source and guide.

### Recommendation:
- ✅ Can safely replace with `@include` - no changes needed

---

## Next Steps & Recommendations

### 1. Immediate Actions (No Changes Required):
Replace these 5 identical components with `@include` directives:
- Progress Flow Demo
- About Modal  
- Footer Minimal
- Token Card Default
- Token Card Advanced

### 2. Quick Fixes (Minor Updates):
Update these 4 components in their source files, then replace with `@include`:
- **Theme Toggle**: Remove `stroke-width="2"` attribute from SVGs
- **Profile Card**: Change button text from `[RE-RUN]` to `[RE-RUN DEMO]`
- **Filters Card**: 
  - Change class from `has-inner-structure` to `is-compact`
  - Update badge colors: `color` → `cyan`, `state` → `pink`, `text` → `purple`, `number` → `orange`

### 3. Strategic Decision Required:
- **Button Component**: Need to standardize icon implementation across the system
  - Current: Mix of `<i data-icon="x">` and `<span class="icon" data-icon="x">`
  - Recommendation: Use `<i data-icon="x">` consistently (simpler, less markup)

### 4. Further Analysis:
Analyze the remaining 6 components to complete the reconciliation process