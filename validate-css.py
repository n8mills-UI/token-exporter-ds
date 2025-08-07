#!/usr/bin/env python3
import re
import sys

def validate_css(filepath):
    """Validate CSS file for common issues"""
    
    print(f"🔍 Validating CSS file: {filepath}\n")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        css_content = f.read()
    
    issues = []
    
    # Check file size
    size_kb = len(css_content) / 1024
    print(f"📊 File size: {size_kb:.1f} KB")
    
    # Check for unclosed comments
    open_comments = css_content.count('/*')
    close_comments = css_content.count('*/')
    if open_comments != close_comments:
        issues.append(f"❌ Unclosed comments: {open_comments} open, {close_comments} closed")
    else:
        print(f"✅ Comments balanced: {open_comments} pairs")
    
    # Check for unclosed braces
    open_braces = css_content.count('{')
    close_braces = css_content.count('}')
    if open_braces != close_braces:
        issues.append(f"❌ Unclosed braces: {open_braces} open, {close_braces} closed")
    else:
        print(f"✅ Braces balanced: {open_braces} pairs")
    
    # Check for multiple :root blocks
    root_blocks = len(re.findall(r'^:root\s*{', css_content, re.MULTILINE))
    print(f"📍 :root blocks found: {root_blocks}")
    if root_blocks > 1:
        issues.append(f"⚠️  Multiple :root blocks: {root_blocks}")
    
    # Check for malformed selectors
    lines = css_content.split('\n')
    for i, line in enumerate(lines, 1):
        # Check for selectors with missing closing
        if '{' in line and not line.strip().startswith('/*'):
            # Simple check for common issues
            if line.count('{') > 1:
                issues.append(f"⚠️  Line {i}: Multiple opening braces on one line")
            if '{{' in line:
                issues.append(f"❌ Line {i}: Double opening braces")
    
    # Check for invalid CSS variable syntax
    invalid_vars = re.findall(r'--[^:;\s]+\s*:[^;]*;', css_content)
    var_count = len(invalid_vars)
    print(f"📝 CSS variables defined: ~{var_count}")
    
    # Look for common CSS errors
    if ';;' in css_content:
        issues.append("❌ Double semicolons found")
    
    if '{}' in css_content and not '{{}}' in css_content:
        # Empty rule blocks (might be intentional)
        empty_blocks = css_content.count('{}')
        if empty_blocks > 0:
            print(f"⚠️  Empty rule blocks: {empty_blocks}")
    
    # Check for parsing blockers
    if '\x00' in css_content:
        issues.append("❌ Null bytes in file")
    
    # Check for BOM
    if css_content.startswith('\ufeff'):
        issues.append("⚠️  File starts with BOM (Byte Order Mark)")
    
    # Summary
    print("\n" + "="*50)
    if issues:
        print("❌ ISSUES FOUND:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("✅ No major issues detected!")
    
    return len(issues) == 0

if __name__ == "__main__":
    filepath = sys.argv[1] if len(sys.argv) > 1 else "docs/design-system.css"
    validate_css(filepath)