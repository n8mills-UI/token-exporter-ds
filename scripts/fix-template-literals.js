#!/usr/bin/env node
/**
 * Fix Template Literals - Converts template literals to string concatenation
 * This fixes the document.write syntax errors in Figma plugins
 */

const fs = require('fs');
const path = require('path');

function fixTemplateLiterals(content) {
    // Replace template literals with string concatenation
    // This regex finds template literals and converts them
    return content.replace(/`([^`]*)`/g, (match, templateContent) => {
        // Handle ${variable} interpolations
        let result = templateContent.replace(/\$\{([^}]+)\}/g, '" + ($1) + "');
        
        // Clean up empty concatenations
        result = result.replace(/^" \+ /, '');
        result = result.replace(/ \+ ""$/, '');
        result = result.replace(/"" \+ /g, '');
        result = result.replace(/ \+ ""$/g, '');
        
        // Handle newlines properly
        result = result.replace(/\n/g, '\\n');
        
        // Wrap in quotes if it doesn't start with a quote
        if (!result.startsWith('"')) {
            result = '"' + result;
        }
        
        // End with quote if it doesn't end with one
        if (!result.endsWith('"')) {
            result = result + '"';
        }
        
        return result;
    });
}

function processFile(filePath) {
    console.log(`Processing ${filePath}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixTemplateLiterals(content);
    
    if (content !== fixed) {
        fs.writeFileSync(filePath, fixed);
        console.log(`✅ Fixed template literals in ${filePath}`);
        return true;
    } else {
        console.log(`⚪ No template literals found in ${filePath}`);
        return false;
    }
}

function main() {
    const filesToFix = [
        'src/ui.html',
        'src/ui.template.html'
    ];
    
    let totalFixed = 0;
    
    filesToFix.forEach(file => {
        if (fs.existsSync(file)) {
            if (processFile(file)) {
                totalFixed++;
            }
        } else {
            console.log(`⚠️  File not found: ${file}`);
        }
    });
    
    console.log(`\n🎉 Fixed ${totalFixed} files`);
    
    if (totalFixed > 0) {
        console.log('\n⚠️  Remember to rebuild with: npm run sync');
    }
}

if (require.main === module) {
    main();
}

module.exports = { fixTemplateLiterals };