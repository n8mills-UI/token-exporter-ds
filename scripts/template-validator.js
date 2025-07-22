#!/usr/bin/env node

/**
 * Template Validator
 * Ensures all design system documentation follows the Guide Layout Framework
 * 
 * Usage: node scripts/template-validator.js [file-path]
 * 
 * Validates that documentation files contain required template structure:
 * - .section-wrapper (required)
 * - .section-label (required) 
 * - .component-section OR .component-body (required)
 * - .example-wrapper (required for examples)
 * - Proper heading hierarchy
 */

const fs = require('fs');
const path = require('path');

// Required template classes
const REQUIRED_CLASSES = {
    'section-wrapper': 'Every documentation section must be wrapped in .section-wrapper',
    'section-label': 'Every section must have a .section-label identifying the content type',
};

const CONTENT_CLASSES = {
    'component-section': 'Use for major components with headers',
    'component-body': 'Use for simple content sections',
};

const EXAMPLE_CLASSES = {
    'example-wrapper': 'Required for all examples and code samples',
    'example-label': 'Required label for each example',
};

// Template validation rules
const VALIDATION_RULES = [
    {
        name: 'Section Structure',
        check: (content) => {
            const hasSectionWrapper = content.includes('section-wrapper');
            const hasSectionLabel = content.includes('section-label');
            return {
                passed: hasSectionWrapper && hasSectionLabel,
                message: hasSectionWrapper 
                    ? (hasSectionLabel ? 'All sections properly wrapped' : 'Missing .section-label')
                    : 'Missing .section-wrapper'
            };
        }
    },
    {
        name: 'Content Structure',
        check: (content) => {
            const hasComponentSection = content.includes('component-section');
            const hasComponentBody = content.includes('component-body');
            return {
                passed: hasComponentSection || hasComponentBody,
                message: hasComponentSection || hasComponentBody 
                    ? 'Content structure present'
                    : 'Missing .component-section or .component-body'
            };
        }
    },
    {
        name: 'Example Structure',
        check: (content) => {
            const hasExamples = content.includes('example-wrapper');
            const hasLabels = content.includes('example-label');
            
            // If no examples, validation passes
            if (!hasExamples) {
                return { passed: true, message: 'No examples found (OK)' };
            }
            
            return {
                passed: hasExamples && hasLabels,
                message: hasLabels 
                    ? 'Examples properly labeled'
                    : 'Examples missing .example-label'
            };
        }
    },
    {
        name: 'Typography Hierarchy',
        check: (content) => {
            const hasComponentTitle = content.includes('component-title');
            const hasSubheaders = content.includes('example-subheader');
            
            // Check for proper heading structure
            const h1Count = (content.match(/<h1/g) || []).length;
            const h2Count = (content.match(/<h2/g) || []).length;
            
            // H1 should only be used for page title (1 max)
            if (h1Count > 1) {
                return { passed: false, message: 'Multiple H1 tags found - use only one page title' };
            }
            
            // If has component sections, should have component titles (H2)
            if (content.includes('component-section') && !hasComponentTitle) {
                return { passed: false, message: 'Component sections missing .component-title (H2)' };
            }
            
            return { passed: true, message: 'Typography hierarchy correct' };
        }
    }
];

function validateFile(filePath) {
    console.log(`\n🔍 Validating template structure: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    let allPassed = true;
    
    // Run validation rules
    VALIDATION_RULES.forEach(rule => {
        const result = rule.check(content);
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${rule.name}: ${result.message}`);
        
        if (!result.passed) {
            allPassed = false;
        }
    });
    
    // Template class usage summary
    console.log(`\n📊 Template Class Usage:`);
    
    Object.entries(REQUIRED_CLASSES).forEach(([className, description]) => {
        const found = content.includes(className);
        const status = found ? '✅' : '❌';
        console.log(`   ${status} .${className}: ${description}`);
    });
    
    Object.entries(CONTENT_CLASSES).forEach(([className, description]) => {
        const found = content.includes(className);
        const status = found ? '✅' : '⚪';
        console.log(`   ${status} .${className}: ${description}`);
    });
    
    Object.entries(EXAMPLE_CLASSES).forEach(([className, description]) => {
        const found = content.includes(className);
        const status = found ? '✅' : '⚪';
        console.log(`   ${status} .${className}: ${description}`);
    });
    
    return allPassed;
}

function validateDirectory(dirPath) {
    console.log(`\n🔍 Validating all HTML files in: ${dirPath}`);
    
    const files = fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.html'))
        .filter(file => !file.includes('.template.')) // Skip template files
        .map(file => path.join(dirPath, file));
    
    let allFilesValid = true;
    
    files.forEach(file => {
        const isValid = validateFile(file);
        if (!isValid) {
            allFilesValid = false;
        }
    });
    
    return allFilesValid;
}

// Main execution
function main() {
    console.log('🎯 Guide Layout Framework - Template Validator');
    console.log('===============================================');
    
    const targetPath = process.argv[2];
    
    if (!targetPath) {
        // Default: validate docs directory
        const docsDir = path.join(__dirname, '../docs');
        const isValid = validateDirectory(docsDir);
        
        if (isValid) {
            console.log('\n✅ All documentation follows template guidelines!');
            process.exit(0);
        } else {
            console.log('\n❌ Template validation failed. Please fix the issues above.');
            process.exit(1);
        }
    } else {
        // Validate specific file
        const isValid = validateFile(targetPath);
        
        if (isValid) {
            console.log('\n✅ File follows template guidelines!');
            process.exit(0);
        } else {
            console.log('\n❌ Template validation failed. Please fix the issues above.');
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { validateFile, validateDirectory, VALIDATION_RULES };