#!/usr/bin/env python3

"""
Documentation Audit Script

This script audits the design system for documentation completeness by comparing
semantic CSS components against their corresponding HTML documentation sections.

It uses intelligent component detection to focus on semantic components while
ignoring atomic utility classes, preventing noise in the audit reports.

Usage: python audit-documentation.py <css-file-path> <html-file-path>
"""

import sys
import re
import os

def extract_semantic_components(css_content):
    """
    Extract semantic component class names from CSS content.
    Uses intelligent pattern matching to focus on documented components
    while ignoring atomic utility classes and component sub-elements.
    
    Returns list of component class names (without the dot prefix).
    """
    # Refined regex pattern targeting known semantic component prefixes
    # This prevents flagging utility classes like .p-4, .flex, .bg-*, etc.
    component_pattern = r'\.((btn|card|modal|token|badge|form|collection|empty-state|progress|profile|guideline|table|nav|hero|footer)[\w-]*)\s*\{'
    
    components = []
    matches = re.finditer(component_pattern, css_content, re.MULTILINE)
    
    for match in matches:
        component_name = match.group(1)
        if component_name not in components:
            components.append(component_name)
    
    # Filter to focus on main components, not sub-elements
    # Keep only base components and important variants that should be documented
    filtered_components = []
    
    for component in components:
        # Keep base components (no hyphens or single modifier)
        parts = component.split('-')
        base = parts[0]
        
        # Always keep base components
        if len(parts) == 1:
            filtered_components.append(component)
            continue
            
        # Keep important variants that warrant documentation
        important_variants = [
            # Button variants
            'btn-primary', 'btn-secondary', 'btn-tertiary', 'btn-icon',
            'btn-sm', 'btn-md', 'btn-lg', 'btn-inline',
            # Card variants  
            'card-showcase',
            # Badge variants
            'badge-showcase', 'badge-group',
            # Table variants
            'table-responsive',
            # Modal variants (if any exist)
            'modal-dialog', 'modal-content',
            # Form variants
            'form-group', 'form-control',
            # Progress variants
            'progress-bar', 'progress-container'
        ]
        
        if component in important_variants:
            filtered_components.append(component)
        # Keep base component names even if they have modifiers like 'empty-state'
        elif base in ['empty-state', 'profile-card'] and len(parts) == 2:
            filtered_components.append(component)
    
    return sorted(list(set(filtered_components)))

def extract_documentation_sections(html_content):
    """
    Extract documentation section IDs from HTML content.
    Looks for div or section tags with id attributes that represent
    documented components.
    
    Returns list of section IDs.
    """
    # Pattern to match div or section tags with id attributes
    section_pattern = r'<(?:div|section)[^>]+id=["\']([^"\']+)["\'][^>]*>'
    
    sections = []
    matches = re.finditer(section_pattern, html_content, re.IGNORECASE)
    
    for match in matches:
        section_id = match.group(1)
        # Filter out non-component sections (navigation, structural elements)
        if not any(skip in section_id for skip in ['sidebar', 'overview', 'paint0', 'clip0', 'hero_logo']):
            sections.append(section_id)
    
    return sorted(sections)

def create_semantic_mapping(components, sections):
    """
    Create semantic mappings between CSS components and HTML documentation sections.
    
    This handles common naming patterns like:
    - .btn -> id="buttons"
    - .card -> id="cards" 
    - .modal -> id="modals"
    - etc.
    
    Returns tuple: (component_to_section_map, section_to_component_map)
    """
    component_to_section = {}
    section_to_component = {}
    
    # Common semantic mappings
    pluralization_map = {
        'btn': 'buttons',
        'card': 'cards', 
        'modal': 'modals',
        'form': 'forms',
        'table': 'tables',
        'badge': 'badges',
        'nav': 'navigation',
        'footer': 'footers',
        'hero': 'heroes'
    }
    
    # Map components to potential section names
    for component in components:
        base_component = component.split('-')[0]  # Get base name (e.g., 'btn' from 'btn-primary')
        
        potential_sections = []
        
        # Try pluralized version
        if base_component in pluralization_map:
            potential_sections.append(pluralization_map[base_component])
        
        # Try exact match
        potential_sections.append(base_component)
        
        # Try component name as-is
        potential_sections.append(component)
        
        # Find first matching section
        for potential in potential_sections:
            if potential in sections:
                component_to_section[component] = potential
                section_to_component[potential] = component
                break
    
    return component_to_section, section_to_component

def audit_documentation(css_file_path, html_file_path):
    """
    Perform documentation audit comparing CSS components to HTML sections.
    
    Returns tuple: (undocumented_components, stale_sections, component_count, section_count)
    """
    # Read CSS file
    try:
        with open(css_file_path, 'r', encoding='utf-8') as file:
            css_content = file.read()
    except Exception as e:
        print(f"❌ Error reading CSS file: {e}")
        sys.exit(1)
    
    # Read HTML file  
    try:
        with open(html_file_path, 'r', encoding='utf-8') as file:
            html_content = file.read()
    except Exception as e:
        print(f"❌ Error reading HTML file: {e}")
        sys.exit(1)
    
    # Extract components and sections
    components = extract_semantic_components(css_content)
    sections = extract_documentation_sections(html_content)
    
    # Create semantic mappings
    component_to_section, section_to_component = create_semantic_mapping(components, sections)
    
    # Find undocumented components
    undocumented = []
    for component in components:
        if component not in component_to_section:
            undocumented.append(component)
    
    # Find stale documentation sections
    # Only flag sections that look like they should map to components
    documented_sections = set(component_to_section.values())
    component_like_sections = []
    
    for section in sections:
        # Check if section name suggests it should have corresponding components
        if any(section.startswith(prefix) or prefix in section for prefix in 
               ['btn', 'card', 'modal', 'token', 'badge', 'form', 'table', 'nav', 'footer']):
            component_like_sections.append(section)
    
    stale_sections = []
    for section in component_like_sections:
        if section not in documented_sections:
            stale_sections.append(section)
    
    return undocumented, stale_sections, len(components), len(sections)

def main():
    if len(sys.argv) != 3:
        print("Usage: python audit-documentation.py <css-file-path> <html-file-path>")
        sys.exit(1)
    
    css_file_path = sys.argv[1]
    html_file_path = sys.argv[2]
    
    # Validate file paths
    if not os.path.exists(css_file_path):
        print(f"❌ Error: CSS file '{css_file_path}' not found.")
        sys.exit(1)
        
    if not os.path.exists(html_file_path):
        print(f"❌ Error: HTML file '{html_file_path}' not found.")
        sys.exit(1)
    
    print(f"🔍 Auditing documentation completeness...")
    print(f"📄 CSS: {css_file_path}")
    print(f"📄 HTML: {html_file_path}")
    print()
    
    # Perform audit
    undocumented, stale_sections, component_count, section_count = audit_documentation(css_file_path, html_file_path)
    
    # Report results
    print(f"📊 Analysis Summary:")
    print(f"   • Found {component_count} semantic CSS components")
    print(f"   • Found {section_count} documentation sections")
    print()
    
    if not undocumented and not stale_sections:
        print("✅ Documentation audit passed!")
        print("🎯 All semantic components are properly documented.")
        return
    
    issues_found = False
    
    # Report undocumented components
    if undocumented:
        issues_found = True
        print(f"❌ Undocumented Components ({len(undocumented)} found):")
        print("   CSS components that lack corresponding HTML documentation sections:")
        print()
        for component in undocumented:
            print(f"   • .{component}")
        print()
        print("   💡 Suggestion: Add documentation sections for these components")
        print("      or verify they are correctly categorized as semantic components.")
        print()
    
    # Report stale documentation
    if stale_sections:
        issues_found = True
        print(f"⚠️  Potentially Stale Documentation ({len(stale_sections)} found):")
        print("   HTML sections that may no longer have corresponding CSS components:")
        print()
        for section in stale_sections:
            print(f"   • id=\"{section}\"")
        print()
        print("   💡 Suggestion: Verify these sections are still needed")
        print("      or check if corresponding CSS components exist under different names.")
        print()
    
    if issues_found:
        print("🔧 Recommendations:")
        print("   1. Review flagged components and ensure proper documentation")
        print("   2. Remove or update stale documentation sections")
        print("   3. Verify component naming conventions are consistent")
        
        # Exit with error code to indicate issues found
        sys.exit(1)

if __name__ == "__main__":
    main()