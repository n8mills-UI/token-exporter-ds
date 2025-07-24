#!/usr/bin/env node
/**
 * Figma Plugin Compatibility Checker
 * Validates JavaScript code for known Figma plugin environment issues
 */

const fs = require('fs');
const path = require('path');

// Known Figma compatibility issues
const COMPATIBILITY_CHECKS = [
    {
        name: 'Optional Chaining',
        pattern: /[^\/\/\s]\?\./g,
        severity: 'error',
        message: 'Optional chaining (?.) is not supported in Figma plugins',
        fix: 'Use conditional checks: obj && obj.prop or obj ? obj.prop : defaultValue'
    },
    {
        name: 'Catch Without Parameter',
        pattern: /}\s*catch\s*{/g,
        severity: 'error', 
        message: 'Catch blocks must have a parameter in Figma plugins',
        fix: 'Use: } catch (error) { instead of } catch {'
    },
    {
        name: 'Nullish Coalescing Assignment',
        pattern: /\?\?=/g,
        severity: 'warning',
        message: 'Nullish coalescing assignment (??=) may not be supported',
        fix: 'Use: obj = obj ?? value instead of obj ??= value'
    },
    {
        name: 'Logical Assignment',
        pattern: /(\|\|=|&&=)/g,
        severity: 'warning',
        message: 'Logical assignment operators may not be supported',
        fix: 'Use explicit assignment: obj = obj || value'
    }
];

// ANSI color codes
const colors = {
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function colorize(text, color) {
    return `${colors[color]}${text}${colors.reset}`;
}

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    COMPATIBILITY_CHECKS.forEach(check => {
        const matches = [...content.matchAll(check.pattern)];
        matches.forEach(match => {
            const lines = content.substring(0, match.index).split('\n');
            const lineNumber = lines.length;
            const column = lines[lines.length - 1].length + 1;
            const currentLine = lines[lines.length - 1];
            
            // Skip if it's in a comment
            const beforeMatch = currentLine.substring(0, column - 1);
            if (beforeMatch.includes('//') || beforeMatch.trim().startsWith('*') || beforeMatch.trim().startsWith('/*')) {
                return;
            }
            
            issues.push({
                ...check,
                line: lineNumber,
                column,
                match: match[0],
                context: getContextLines(content, lineNumber, 1)
            });
        });
    });
    
    return issues;
}

function getContextLines(content, targetLine, contextSize = 1) {
    const lines = content.split('\n');
    const start = Math.max(0, targetLine - contextSize - 1);
    const end = Math.min(lines.length, targetLine + contextSize);
    
    return lines.slice(start, end).map((line, index) => ({
        number: start + index + 1,
        text: line,
        isTarget: start + index + 1 === targetLine
    }));
}

function formatIssues(issues, filePath) {
    if (issues.length === 0) {
        return colorize(`✅ ${filePath} - No compatibility issues found`, 'green');
    }
    
    let output = colorize(`\n📁 ${filePath}`, 'bold');
    output += colorize(` (${issues.length} issue${issues.length > 1 ? 's' : ''})`, 'blue');
    
    issues.forEach(issue => {
        const severityColor = issue.severity === 'error' ? 'red' : 'yellow';
        const severityIcon = issue.severity === 'error' ? '❌' : '⚠️';
        
        output += `\n\n${severityIcon} ${colorize(issue.name, 'bold')} ${colorize(`[${issue.severity.toUpperCase()}]`, severityColor)}`;
        output += `\n   ${colorize(`Line ${issue.line}:${issue.column}`, 'blue')} - ${issue.message}`;
        output += `\n   ${colorize('Fix:', 'bold')} ${issue.fix}`;
        
        // Show context
        output += `\n   ${colorize('Context:', 'bold')}`;
        issue.context.forEach(contextLine => {
            const prefix = contextLine.isTarget ? '  →' : '   ';
            const lineColor = contextLine.isTarget ? 'red' : 'reset';
            output += `\n${prefix} ${colorize(contextLine.number.toString().padStart(4), 'blue')}: ${colorize(contextLine.text, lineColor)}`;
        });
    });
    
    return output;
}

function generateSummary(allIssues) {
    const totalIssues = allIssues.reduce((sum, fileIssues) => sum + fileIssues.issues.length, 0);
    const errorCount = allIssues.reduce((sum, fileIssues) => 
        sum + fileIssues.issues.filter(i => i.severity === 'error').length, 0);
    const warningCount = totalIssues - errorCount;
    
    let summary = colorize('\n' + '='.repeat(60), 'blue');
    summary += colorize('\n📊 FIGMA COMPATIBILITY SUMMARY', 'bold');
    summary += colorize('\n' + '='.repeat(60), 'blue');
    
    if (totalIssues === 0) {
        summary += colorize('\n✅ All files pass Figma compatibility checks!', 'green');
    } else {
        summary += `\n${colorize('Total Issues:', 'bold')} ${totalIssues}`;
        if (errorCount > 0) {
            summary += `\n${colorize('Errors:', 'bold')} ${colorize(errorCount.toString(), 'red')} (will cause Figma plugin to fail)`;
        }
        if (warningCount > 0) {
            summary += `\n${colorize('Warnings:', 'bold')} ${colorize(warningCount.toString(), 'yellow')} (may cause issues)`;
        }
        
        if (errorCount > 0) {
            summary += colorize('\n\n❌ Plugin will likely fail to load in Figma', 'red');
        } else {
            summary += colorize('\n\n✅ Plugin should load in Figma (warnings may cause runtime issues)', 'green');
        }
    }
    
    return summary + '\n';
}

function checkHTMLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for problematic patterns in HTML that could break in Figma
    const htmlChecks = [
        {
            name: 'Unescaped Template Literals in Script',
            pattern: /`[^`]*\${[^}]*}[^`]*`/g,
            severity: 'warning',
            message: 'Template literals may cause document.write syntax errors in Figma',
            fix: 'Consider using string concatenation instead of template literals'
        },
        {
            name: 'Document.write Usage',
            pattern: /document\.write/g,
            severity: 'error', 
            message: 'Direct document.write usage is not recommended in Figma plugins',
            fix: 'Use DOM manipulation methods instead'
        },
        {
            name: 'Unescaped Quotes in HTML',
            pattern: /[^\\]"[^"]*[<>][^"]*"/g,
            severity: 'warning',
            message: 'Unescaped quotes containing HTML may cause parsing issues',
            fix: 'Escape quotes or use single quotes where appropriate'
        },
        {
            name: 'External Script Loading',
            pattern: /<script[^>]+src\s*=\s*["'][^"']*["'][^>]*>/g,
            severity: 'warning',
            message: 'External script loading may fail due to CSP restrictions',
            fix: 'Bundle scripts inline or ensure domains are allowlisted in manifest.json'
        }
    ];
    
    htmlChecks.forEach(check => {
        const matches = [...content.matchAll(check.pattern)];
        matches.forEach(match => {
            const lines = content.substring(0, match.index).split('\n');
            const lineNumber = lines.length;
            const column = lines[lines.length - 1].length + 1;
            
            issues.push({
                ...check,
                line: lineNumber,
                column,
                match: match[0],
                context: getContextLines(content, lineNumber, 1)
            });
        });
    });
    
    return issues;
}

function main() {
    const filesToCheck = process.argv.slice(2).length > 0 
        ? process.argv.slice(2)
        : ['src/code.js', 'src/ui.html'];
    
    console.log(colorize('🔍 Figma Plugin Compatibility Checker', 'bold'));
    console.log(colorize('Scanning for known compatibility issues...', 'blue'));
    
    const results = [];
    
    filesToCheck.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            let issues;
            if (path.extname(filePath) === '.html') {
                issues = checkHTMLFile(filePath);
            } else {
                issues = checkFile(filePath);
            }
            results.push({ file: filePath, issues });
            console.log(formatIssues(issues, filePath));
        } else {
            console.log(colorize(`⚠️  File not found: ${filePath}`, 'yellow'));
        }
    });
    
    console.log(generateSummary(results));
    
    // Exit with error code if there are errors
    const hasErrors = results.some(r => r.issues.some(i => i.severity === 'error'));
    process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
    main();
}

module.exports = { checkFile, COMPATIBILITY_CHECKS };