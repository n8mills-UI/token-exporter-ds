# Learning Capture: CSS Variables in Media Queries

**Date:** 2025-07-24  
**Severity:** Critical  
**Recurrence:** Second occurrence (recurring pattern)  

## Problem Description
Attempted to "fix" hardcoded pixel values in media queries by replacing them with CSS variables:
```css
/* WRONG - doesn't work */
@media (width <= var(--content-lg)) { }

/* CORRECT - hardcoded pixels required */
@media (width <= 1024px) { }
```

## Root Cause Analysis
- **Knowledge gap:** CSS variables cannot be used in media query declarations (CSS spec limitation)
- **Pattern recognition failure:** This is the second time this mistake was made
- **Missing documentation:** Critical limitation wasn't documented in CLAUDE.md
- **Missing automation:** No script validation to catch this mistake
- **False optimization:** Assumed all hardcoded values should be replaced with tokens

## Impact
- **Broken CSS:** Media queries with variables don't work at all
- **Layout failures:** Responsive design breaks completely
- **Development time lost:** Time spent "fixing" something that was already correct
- **Systemic issue:** Pattern suggests this will keep happening without intervention

## Solution Applied
1. **Reverted changes:** Restored hardcoded pixels in all media queries
2. **Enhanced documentation:** Added "Critical CSS Limitations" section to CLAUDE.md
3. **Added automation:** Enhanced `analyze-duplicates.js` script to:
   - Skip media queries when suggesting token replacements
   - Detect and warn about CSS variables in media queries
   - Provide clear error messages with solution guidance

## Prevention Strategy
1. **Documentation:** Added prominent warning section in CLAUDE.md with examples
2. **Automation:** Script now validates and prevents this mistake
3. **Process:** Created learning capture template and process for future issues

## Validation
- [x] Added to CLAUDE.md (Critical CSS Limitations section)
- [x] Added automated check/validation (analyze-duplicates script enhancement)
- [x] Added to pre-commit hooks (script runs in test suite)
- [x] Tested prevention measures (script correctly detects the issue)
- [x] Verified fix works as expected (media queries work with hardcoded pixels)

## Related Issues
- This is the second occurrence of the same mistake
- Suggests need for systematic learning capture for all recurring issues

## Key Takeaway
**Some hardcoded values are required by CSS specification limitations.** Token replacement isn't always the right solution - understanding the underlying constraints is critical.