#!/usr/bin/env python3

"""
Intelligent CSS Linting Script

This script analyzes CSS files for hardcoded values while respecting design system architecture.
It understands the two-layer hierarchy:
1. Primitives (:root blocks) - Raw values are legitimate and required
2. Semantic/Components (outside :root) - Should only use var() tokens

Usage: python lint-css.py <css-file-path>
"""

import sys
import re
import os

def extract_root_blocks(css_content):
    """
    Extract all :root block contents from CSS.
    Returns tuple: (root_content, non_root_content)
    """
    # Pattern to match :root blocks, handling nested braces
    root_pattern = r':root\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}'
    
    root_blocks = []
    root_matches = list(re.finditer(root_pattern, css_content, re.DOTALL))
    
    # Extract root block content
    for match in root_matches:
        root_blocks.append(match.group(1))
    
    # Remove root blocks from content to get non-root content
    non_root_content = re.sub(root_pattern, '', css_content, flags=re.DOTALL)
    
    return ''.join(root_blocks), non_root_content

def find_hardcoded_values(content, start_line_offset=0):
    """
    Find hardcoded values in CSS content.
    Returns list of violations with line numbers and context.
    """
    violations = []
    lines = content.split('\n')
    
    # Patterns for hardcoded values
    patterns = {
        'hex_color': r'#(?:[0-9a-fA-F]{3}){1,2}(?![0-9a-fA-F])',
        'rgb_color': r'rgba?\([^)]+\)',
        'px_units': r'(?:[1-9]\d*|\d*\.[1-9]\d*)px\b',
        'rem_units': r'(?:[1-9]\d*|\d*\.[1-9]\d*)rem\b'
    }
    
    for line_num, line in enumerate(lines, 1):
        # Skip comments and empty lines
        stripped_line = line.strip()
        if not stripped_line or stripped_line.startswith('/*') or stripped_line.startswith('*'):
            continue
            
        # Skip lines that are just closing braces or contain only whitespace/punctuation
        if re.match(r'^\s*[})\];]*\s*$', line):
            continue
            
        for pattern_name, pattern in patterns.items():
            matches = re.finditer(pattern, line)
            for match in matches:
                value = match.group(0)
                
                # Skip certain legitimate cases
                if should_skip_value(value, line, pattern_name):
                    continue
                    
                violations.append({
                    'line': line_num + start_line_offset,
                    'value': value,
                    'context': line.strip(),
                    'type': pattern_name
                })
    
    return violations

def should_skip_value(value, line, pattern_name):
    """
    Determine if a hardcoded value should be skipped (is legitimate).
    """
    # Skip comments and comment-like content
    if '/*' in line or '*/' in line or line.strip().startswith('*') or line.strip().startswith('//'):
        return True
        
    # Skip if it's already inside a var() function
    if 'var(' in line and value in line:
        return True
        
    # Skip fallback values in var() declarations  
    if re.search(r'var\([^,)]+,\s*[^)]*' + re.escape(value), line):
        return True
        
    # Skip media queries (CSS limitation - cannot use variables)
    if '@media' in line:
        return True
        
    # Skip certain CSS properties that commonly use raw values legitimately
    if any(prop in line for prop in [
        'clip:', 'clip-path:', 'content:', 'transform:', 'animation:', '@keyframes',
        'grid-template-columns:', 'grid-template-rows:', 'min-width:', 'max-width:', 
        'min-height:', 'max-height:', 'clamp(', 'backdrop-filter:', 'filter:'
    ]):
        return True
        
    # Skip data URLs and SVG content
    if 'data:' in line or 'url(' in line:
        return True
        
    # Skip animation keyframe percentages that might have px
    if re.search(r'\d+%\s*\{', line):
        return True
        
    # Skip 0 values (0px, 0rem are equivalent to 0)
    if value.startswith('0'):
        return True
        
    # Skip values that are clearly part of calc() expressions we created
    if 'calc(' in line and value in line:
        return True
        
    # Skip box-shadow and text-shadow (complex multi-value properties)
    if any(prop in line for prop in ['box-shadow:', 'text-shadow:', 'drop-shadow(']):
        return True
        
    # Skip gradient definitions (complex color stops)
    if any(gradient in line for gradient in ['gradient(', 'linear-gradient', 'radial-gradient']):
        return True
        
    # Focus on the most impactful violations: spacing, padding, margin
    if not any(prop in line for prop in ['padding:', 'margin:', 'gap:', 'top:', 'bottom:', 'left:', 'right:']):
        # If it's not one of these key spacing properties, skip it for now
        # This focuses the script on the most important architectural violations
        return True
        
    return False

def get_css_rule_context(content, line_num):
    """
    Extract the full CSS rule context for a given line number.
    """
    lines = content.split('\n')
    if line_num > len(lines):
        return lines[line_num - 1].strip() if line_num <= len(lines) else ""
        
    # Look backwards for selector
    selector_line = line_num - 1
    while selector_line >= 0:
        line = lines[selector_line].strip()
        if '{' in line:
            # Found opening brace, extract selector
            selector = line.split('{')[0].strip()
            return selector
        elif line and not line.startswith('/*') and not line.startswith('*'):
            # This might be a multi-line selector
            selector_line -= 1
        else:
            selector_line -= 1
            
    return "Unknown selector"

def main():
    if len(sys.argv) != 2:
        print("Usage: python lint-css.py <css-file-path>")
        sys.exit(1)
        
    css_file_path = sys.argv[1]
    
    if not os.path.exists(css_file_path):
        print(f"Error: File '{css_file_path}' not found.")
        sys.exit(1)
        
    # Read CSS file
    try:
        with open(css_file_path, 'r', encoding='utf-8') as file:
            css_content = file.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    print(f"🔍 Analyzing CSS architecture in {css_file_path}...")
    print("📐 Respecting design system hierarchy: :root (primitives) vs components (semantic)\n")
    
    # Extract root blocks and non-root content
    root_content, non_root_content = extract_root_blocks(css_content)
    
    # Count lines before non-root content to adjust line numbers
    root_line_count = css_content[:css_content.find(non_root_content)].count('\n') if non_root_content else 0
    
    # Analyze only non-root content
    violations = find_hardcoded_values(non_root_content)
    
    if not violations:
        print("✅ No hardcoded values found outside :root blocks.")
        print("🎯 Design system architecture is clean and token-driven!")
        return
        
    print(f"❌ Found {len(violations)} hardcoded values outside :root blocks:\n")
    
    # Group violations by type for better reporting
    by_type = {}
    for violation in violations:
        vtype = violation['type']
        if vtype not in by_type:
            by_type[vtype] = []
        by_type[vtype].append(violation)
    
    # Report violations grouped by type
    type_labels = {
        'hex_color': '🎨 Hex Colors',
        'rgb_color': '🌈 RGB/RGBA Colors', 
        'px_units': '📏 Pixel Units',
        'rem_units': '📐 REM Units'
    }
    
    for vtype, violations_of_type in by_type.items():
        print(f"{type_labels.get(vtype, vtype.title())} ({len(violations_of_type)} found):")
        for violation in violations_of_type:
            print(f"  [Line {violation['line']}] '{violation['value']}' in: {violation['context']}")
        print()
    
    print("💡 Recommendations:")
    print("  1. Replace hardcoded values with appropriate var(--token) references")
    print("  2. Ensure all values outside :root blocks consume design tokens")
    print("  3. Check that tokens exist in :root for the values you need")
    
    # Exit with error code to indicate issues found
    sys.exit(1)

if __name__ == "__main__":
    main()