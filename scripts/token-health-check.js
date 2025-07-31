#!/usr/bin/env node

/**
 * Token Health Check
 * 
 * A SAFE, read-only tool that audits token consistency between
 * design-system.css and design-system-guide.template.html
 * 
 * Run: node scripts/token-health-check.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSS_FILE = path.join(__dirname, '../docs/design-system.css');
const TEMPLATE_FILE = path.join(__dirname, '../docs/design-system-guide.template.html');

class TokenHealthCheck {
    constructor() {
        this.cssTokens = new Set();
        this.guideTokens = new Set();
        this.report = {
            healthy: [],
            missing: [],
            outdated: [],
            stats: {}
        };
    }

    // Extract tokens from CSS - conservative approach
    extractCSSTokens() {
        const css = fs.readFileSync(CSS_FILE, 'utf8');
        
        // Only look in :root blocks to avoid false positives
        const rootBlocks = css.match(/:root\s*{[^}]+}/gs) || [];
        const themeBlocks = css.match(/\[data-theme="(?:light|dark)"\]\s*{[^}]+}/gs) || [];
        
        [...rootBlocks, ...themeBlocks].forEach(block => {
            // Match property declarations, not just token names
            const matches = block.match(/^\s*(--[a-zA-Z0-9-]+)\s*:/gm);
            if (matches) {
                matches.forEach(match => {
                    const token = match.trim().replace(':', '').trim();
                    this.cssTokens.add(token);
                });
            }
        });
        
        return this.cssTokens;
    }

    // Extract tokens from design guide template
    extractGuideTokens() {
        const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
        
        // Find colorSectionConfig
        const configMatch = template.match(/const colorSectionConfig = {[\s\S]+?};/);
        if (!configMatch) {
            throw new Error('Could not find colorSectionConfig in template');
        }
        
        // Extract token references - look for { token: '--xxx' } patterns
        const tokenMatches = configMatch[0].match(/token:\s*['"]([^'"]+)['"]/g);
        if (tokenMatches) {
            tokenMatches.forEach(match => {
                const token = match.match(/token:\s*['"]([^'"]+)['"]/)[1];
                this.guideTokens.add(token);
            });
        }
        
        return this.guideTokens;
    }

    // Categorize tokens for better reporting
    categorizeToken(token) {
        if (token.includes('-alpha-')) return 'alpha';
        if (token.includes('--brand-')) return 'brand';
        if (token.includes('--color-type-')) return 'colorType';
        if (token.includes('--color-text-')) return 'text';
        if (token.includes('--surface-')) return 'surface';
        if (token.includes('--color-border-')) return 'border';
        if (token.includes('--gray-')) return 'neutrals';
        return 'other';
    }

    // Run the health check
    analyze() {
        this.extractCSSTokens();
        this.extractGuideTokens();
        
        // Find tokens in CSS but not in guide (undocumented)
        this.cssTokens.forEach(token => {
            if (!this.guideTokens.has(token)) {
                this.report.missing.push({
                    token,
                    category: this.categorizeToken(token),
                    location: 'Missing from design guide'
                });
            } else {
                this.report.healthy.push(token);
            }
        });
        
        // Find tokens in guide but not in CSS (outdated)
        this.guideTokens.forEach(token => {
            if (!this.cssTokens.has(token)) {
                this.report.outdated.push({
                    token,
                    category: this.categorizeToken(token),
                    location: 'No longer exists in CSS'
                });
            }
        });
        
        // Calculate stats
        const categories = {};
        this.cssTokens.forEach(token => {
            const cat = this.categorizeToken(token);
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        this.report.stats = {
            totalCSSTokens: this.cssTokens.size,
            totalGuideTokens: this.guideTokens.size,
            documented: this.report.healthy.length,
            undocumented: this.report.missing.length,
            outdated: this.report.outdated.length,
            healthScore: Math.round((this.report.healthy.length / this.cssTokens.size) * 100),
            categories
        };
        
        return this.report;
    }

    // Generate human-readable report
    generateReport() {
        const report = this.analyze();
        
        console.log('\n' + '='.repeat(60));
        console.log('TOKEN HEALTH CHECK REPORT');
        console.log('='.repeat(60) + '\n');
        
        // Summary
        console.log('📊 SUMMARY');
        console.log(`   Total CSS Tokens: ${report.stats.totalCSSTokens}`);
        console.log(`   Documented: ${report.stats.documented} ✅`);
        console.log(`   Missing: ${report.stats.undocumented} ⚠️`);
        console.log(`   Outdated: ${report.stats.outdated} ❌`);
        console.log(`   Health Score: ${report.stats.healthScore}%\n`);
        
        // Category breakdown
        console.log('📦 TOKEN CATEGORIES');
        Object.entries(report.stats.categories).forEach(([cat, count]) => {
            console.log(`   ${cat}: ${count}`);
        });
        
        // Missing tokens (most important)
        if (report.missing.length > 0) {
            console.log('\n⚠️  MISSING FROM DOCUMENTATION');
            const byCategory = {};
            report.missing.forEach(item => {
                if (!byCategory[item.category]) byCategory[item.category] = [];
                byCategory[item.category].push(item.token);
            });
            
            Object.entries(byCategory).forEach(([cat, tokens]) => {
                console.log(`\n   ${cat.toUpperCase()}:`);
                tokens.forEach(token => console.log(`     - ${token}`));
            });
        }
        
        // Outdated tokens
        if (report.outdated.length > 0) {
            console.log('\n❌ OUTDATED IN DOCUMENTATION');
            report.outdated.forEach(item => {
                console.log(`   - ${item.token} (${item.category})`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS');
        if (report.stats.healthScore === 100) {
            console.log('   ✅ Perfect sync! All tokens are documented correctly.');
        } else if (report.stats.healthScore >= 90) {
            console.log('   ✅ Good health! Minor updates needed.');
        } else if (report.stats.healthScore >= 70) {
            console.log('   ⚠️  Fair health. Several tokens need documentation.');
        } else {
            console.log('   ❌ Poor health. Significant documentation updates required.');
        }
        
        if (report.missing.length > 0) {
            console.log(`\n   To fix: Add ${report.missing.length} missing tokens to colorSectionConfig`);
            console.log('   in docs/design-system-guide.template.html');
        }
        
        // Save detailed report
        const reportPath = path.join(__dirname, '../token-health-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: token-health-report.json`);
        
        return report;
    }
}

// Run if called directly
const checker = new TokenHealthCheck();
try {
    checker.generateReport();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

export default TokenHealthCheck;