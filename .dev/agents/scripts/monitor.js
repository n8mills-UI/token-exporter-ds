#!/usr/bin/env node

/**
 * Performance Monitoring & Alerting System
 * Tracks build performance, bundle sizes, and deployment health
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Performance thresholds
const THRESHOLDS = {
    buildTime: 10000, // 10 seconds
    pluginSize: 2 * 1024 * 1024, // 2MB
    cssSize: 500 * 1024, // 500KB
    accessibilityErrors: 5,
    cssComplexity: 100
};

class PerformanceMonitor {
    constructor() {
        this.metricsPath = path.join(projectRoot, '.build-cache/metrics.json');
        this.alertsPath = path.join(projectRoot, '.build-cache/alerts.json');
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        const cacheDir = path.dirname(this.metricsPath);
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
    }
    
    async collectMetrics() {
        console.log(`\n${colors.bright}📊 Collecting Performance Metrics${colors.reset}\n`);
        
        const metrics = {
            timestamp: new Date().toISOString(),
            build: await this.measureBuildPerformance(),
            bundle: await this.analyzeBundleSizes(),
            css: await this.analyzeCSSComplexity(),
            accessibility: await this.checkAccessibility(),
            git: await this.getGitInfo()
        };
        
        // Store metrics
        this.storeMetrics(metrics);
        
        // Check for alerts
        const alerts = this.checkThresholds(metrics);
        if (alerts.length > 0) {
            this.storeAlerts(alerts);
            this.displayAlerts(alerts);
        }
        
        this.displayMetrics(metrics);
        
        return metrics;
    }
    
    async measureBuildPerformance() {
        console.log(`${colors.blue}⏱️  Measuring build performance${colors.reset}`);
        
        const startTime = Date.now();
        
        try {
            await execAsync('npm run build:optimized');
            const buildTime = Date.now() - startTime;
            
            console.log(`  ${colors.green}✓${colors.reset} Build completed in ${buildTime}ms`);
            
            return {
                duration: buildTime,
                success: true,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            const buildTime = Date.now() - startTime;
            
            console.log(`  ${colors.red}✗${colors.reset} Build failed after ${buildTime}ms`);
            
            return {
                duration: buildTime,
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    async analyzeBundleSizes() {
        console.log(`${colors.blue}📦 Analyzing bundle sizes${colors.reset}`);
        
        const files = [
            { path: 'src/ui.html', name: 'Plugin UI', type: 'plugin' },
            { path: 'docs/design-system-guide.html', name: 'Design Guide', type: 'documentation' },
            { path: 'docs/design-system.css', name: 'CSS Bundle', type: 'stylesheet' }
        ];
        
        const analysis = {};
        
        for (const file of files) {
            const filePath = path.join(projectRoot, file.path);
            
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const size = stats.size;
                
                analysis[file.type] = {
                    name: file.name,
                    size: size,
                    sizeKB: Math.round(size / 1024),
                    sizeMB: Math.round(size / (1024 * 1024) * 100) / 100,
                    path: file.path
                };
                
                console.log(`  ${colors.cyan}→${colors.reset} ${file.name}: ${Math.round(size / 1024)}KB`);
            }
        }
        
        return analysis;
    }
    
    async analyzeCSSComplexity() {
        console.log(`${colors.blue}🎨 Analyzing CSS complexity${colors.reset}`);
        
        try {
            const { stdout } = await execAsync('npx wallace docs/design-system.css --format json');
            const wallaceData = JSON.parse(stdout);
            
            const complexity = {
                rules: wallaceData.base.rules,
                selectors: wallaceData.base.selectors,
                declarations: wallaceData.base.declarations,
                specificity: {
                    average: wallaceData.base.averageSpecificity,
                    max: wallaceData.base.maxSpecificity
                },
                mediaQueries: wallaceData.base.mediaQueries,
                uniqueColors: wallaceData.base.uniqueColors
            };
            
            console.log(`  ${colors.cyan}→${colors.reset} Rules: ${complexity.rules}`);
            console.log(`  ${colors.cyan}→${colors.reset} Selectors: ${complexity.selectors}`);
            console.log(`  ${colors.cyan}→${colors.reset} Declarations: ${complexity.declarations}`);
            console.log(`  ${colors.cyan}→${colors.reset} Average specificity: ${complexity.specificity.average}`);
            
            return complexity;
            
        } catch (error) {
            console.log(`  ${colors.yellow}⚠${colors.reset} CSS analysis failed: ${error.message}`);
            return { error: error.message };
        }
    }
    
    async checkAccessibility() {
        console.log(`${colors.blue}♿ Checking accessibility${colors.reset}`);
        
        try {
            const { stdout, stderr } = await execAsync('npx pa11y docs/design-system-guide.html --reporter json');
            const pa11yResults = JSON.parse(stdout);
            
            const issues = {
                errors: pa11yResults.filter(issue => issue.type === 'error').length,
                warnings: pa11yResults.filter(issue => issue.type === 'warning').length,
                notices: pa11yResults.filter(issue => issue.type === 'notice').length,
                total: pa11yResults.length
            };
            
            console.log(`  ${colors.cyan}→${colors.reset} Errors: ${issues.errors}`);
            console.log(`  ${colors.cyan}→${colors.reset} Warnings: ${issues.warnings}`);
            console.log(`  ${colors.cyan}→${colors.reset} Notices: ${issues.notices}`);
            
            return { issues, details: pa11yResults };
            
        } catch (error) {
            console.log(`  ${colors.yellow}⚠${colors.reset} Accessibility check failed: ${error.message}`);
            return { error: error.message };
        }
    }
    
    async getGitInfo() {
        try {
            const { stdout: commit } = await execAsync('git rev-parse HEAD');
            const { stdout: branch } = await execAsync('git rev-parse --abbrev-ref HEAD');
            const { stdout: author } = await execAsync('git log -1 --pretty=format:"%an"');
            const { stdout: message } = await execAsync('git log -1 --pretty=format:"%s"');
            
            return {
                commit: commit.trim().substring(0, 8),
                branch: branch.trim(),
                author: author.trim(),
                message: message.trim()
            };
        } catch (error) {
            return { error: error.message };
        }
    }
    
    checkThresholds(metrics) {
        const alerts = [];
        
        // Build time threshold
        if (metrics.build.duration > THRESHOLDS.buildTime) {
            alerts.push({
                type: 'performance',
                severity: 'warning',
                message: `Build time exceeded threshold: ${metrics.build.duration}ms > ${THRESHOLDS.buildTime}ms`,
                metric: 'build.duration',
                value: metrics.build.duration,
                threshold: THRESHOLDS.buildTime
            });
        }
        
        // Plugin size threshold
        if (metrics.bundle.plugin && metrics.bundle.plugin.size > THRESHOLDS.pluginSize) {
            alerts.push({
                type: 'bundle-size',
                severity: 'error',
                message: `Plugin size exceeded limit: ${metrics.bundle.plugin.sizeMB}MB > ${Math.round(THRESHOLDS.pluginSize / (1024 * 1024))}MB`,
                metric: 'bundle.plugin.size',
                value: metrics.bundle.plugin.size,
                threshold: THRESHOLDS.pluginSize
            });
        }
        
        // CSS size threshold
        if (metrics.bundle.stylesheet && metrics.bundle.stylesheet.size > THRESHOLDS.cssSize) {
            alerts.push({
                type: 'bundle-size',
                severity: 'warning',
                message: `CSS size exceeded threshold: ${metrics.bundle.stylesheet.sizeKB}KB > ${Math.round(THRESHOLDS.cssSize / 1024)}KB`,
                metric: 'bundle.stylesheet.size',
                value: metrics.bundle.stylesheet.size,
                threshold: THRESHOLDS.cssSize
            });
        }
        
        // Accessibility threshold
        if (metrics.accessibility.issues && metrics.accessibility.issues.errors > THRESHOLDS.accessibilityErrors) {
            alerts.push({
                type: 'accessibility',
                severity: 'error',
                message: `Accessibility errors exceeded threshold: ${metrics.accessibility.issues.errors} > ${THRESHOLDS.accessibilityErrors}`,
                metric: 'accessibility.issues.errors',
                value: metrics.accessibility.issues.errors,
                threshold: THRESHOLDS.accessibilityErrors
            });
        }
        
        return alerts;
    }
    
    storeMetrics(metrics) {
        let history = [];
        
        if (fs.existsSync(this.metricsPath)) {
            try {
                history = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
            } catch (error) {
                console.log(`${colors.yellow}⚠${colors.reset} Could not load metrics history`);
            }
        }
        
        history.push(metrics);
        
        // Keep only last 100 entries
        if (history.length > 100) {
            history = history.slice(-100);
        }
        
        fs.writeFileSync(this.metricsPath, JSON.stringify(history, null, 2));
    }
    
    storeAlerts(alerts) {
        const alertData = {
            timestamp: new Date().toISOString(),
            alerts: alerts
        };
        
        fs.writeFileSync(this.alertsPath, JSON.stringify(alertData, null, 2));
    }
    
    displayMetrics(metrics) {
        console.log(`\n${colors.bright}📈 Performance Summary${colors.reset}`);
        console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}`);
        
        // Build performance
        const buildStatus = metrics.build.success ? 
            `${colors.green}✓ ${metrics.build.duration}ms${colors.reset}` : 
            `${colors.red}✗ Failed${colors.reset}`;
        console.log(`Build Performance: ${buildStatus}`);
        
        // Bundle sizes
        if (metrics.bundle.plugin) {
            const pluginStatus = metrics.bundle.plugin.size < THRESHOLDS.pluginSize ?
                `${colors.green}${metrics.bundle.plugin.sizeKB}KB${colors.reset}` :
                `${colors.red}${metrics.bundle.plugin.sizeKB}KB${colors.reset}`;
            console.log(`Plugin Size: ${pluginStatus}`);
        }
        
        if (metrics.bundle.stylesheet) {
            const cssStatus = metrics.bundle.stylesheet.size < THRESHOLDS.cssSize ?
                `${colors.green}${metrics.bundle.stylesheet.sizeKB}KB${colors.reset}` :
                `${colors.yellow}${metrics.bundle.stylesheet.sizeKB}KB${colors.reset}`;
            console.log(`CSS Size: ${cssStatus}`);
        }
        
        // Accessibility
        if (metrics.accessibility.issues) {
            const a11yStatus = metrics.accessibility.issues.errors === 0 ?
                `${colors.green}✓ ${metrics.accessibility.issues.total} issues${colors.reset}` :
                `${colors.red}${metrics.accessibility.issues.errors} errors${colors.reset}`;
            console.log(`Accessibility: ${a11yStatus}`);
        }
        
        // Git info
        if (metrics.git.commit) {
            console.log(`Git: ${metrics.git.branch}@${metrics.git.commit}`);
        }
        
        console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}\n`);
    }
    
    displayAlerts(alerts) {
        console.log(`\n${colors.bright}🚨 Performance Alerts${colors.reset}`);
        console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}`);
        
        alerts.forEach(alert => {
            const severityColor = alert.severity === 'error' ? colors.red : colors.yellow;
            const icon = alert.severity === 'error' ? '🚨' : '⚠️';
            
            console.log(`${icon} ${severityColor}${alert.severity.toUpperCase()}${colors.reset}: ${alert.message}`);
        });
        
        console.log(`${colors.gray}${'─'.repeat(50)}${colors.reset}\n`);
    }
    
    async generateReport() {
        console.log(`\n${colors.bright}📊 Generating Performance Report${colors.reset}\n`);
        
        if (!fs.existsSync(this.metricsPath)) {
            console.log(`${colors.yellow}No metrics data found. Run monitoring first.${colors.reset}`);
            return;
        }
        
        const history = JSON.parse(fs.readFileSync(this.metricsPath, 'utf8'));
        const latest = history[history.length - 1];
        
        // Calculate trends (last 10 builds)
        const recent = history.slice(-10);
        const buildTimes = recent.filter(m => m.build.success).map(m => m.build.duration);
        const avgBuildTime = buildTimes.length > 0 ? 
            Math.round(buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length) : 0;
        
        // Generate HTML report
        const reportHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Exporter Performance Report</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 40px; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .good { color: #10b981; }
        .warning { color: #f59e0b; }
        .error { color: #ef4444; }
        .chart { height: 200px; background: #f8f9fa; margin: 20px 0; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Token Exporter Performance Report</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>
        
        <h2>Current Metrics</h2>
        <div class="metric">
            <span>Build Time</span>
            <span class="${latest.build.duration < THRESHOLDS.buildTime ? 'good' : 'warning'}">${latest.build.duration}ms</span>
        </div>
        <div class="metric">
            <span>Average Build Time (10 builds)</span>
            <span>${avgBuildTime}ms</span>
        </div>
        ${latest.bundle.plugin ? `
        <div class="metric">
            <span>Plugin Size</span>
            <span class="${latest.bundle.plugin.size < THRESHOLDS.pluginSize ? 'good' : 'error'}">${latest.bundle.plugin.sizeMB}MB</span>
        </div>
        ` : ''}
        ${latest.bundle.stylesheet ? `
        <div class="metric">
            <span>CSS Size</span>
            <span class="${latest.bundle.stylesheet.size < THRESHOLDS.cssSize ? 'good' : 'warning'}">${latest.bundle.stylesheet.sizeKB}KB</span>
        </div>
        ` : ''}
        ${latest.accessibility.issues ? `
        <div class="metric">
            <span>Accessibility Errors</span>
            <span class="${latest.accessibility.issues.errors === 0 ? 'good' : 'error'}">${latest.accessibility.issues.errors}</span>
        </div>
        ` : ''}
        
        <h2>Build Trend</h2>
        <div class="chart">Build time chart would go here (${buildTimes.length} data points)</div>
        
        <h2>Thresholds</h2>
        <div class="metric">
            <span>Max Build Time</span>
            <span>${THRESHOLDS.buildTime}ms</span>
        </div>
        <div class="metric">
            <span>Max Plugin Size</span>
            <span>${Math.round(THRESHOLDS.pluginSize / (1024 * 1024))}MB</span>
        </div>
        <div class="metric">
            <span>Max CSS Size</span>
            <span>${Math.round(THRESHOLDS.cssSize / 1024)}KB</span>
        </div>
        <div class="metric">
            <span>Max Accessibility Errors</span>
            <span>${THRESHOLDS.accessibilityErrors}</span>
        </div>
    </div>
</body>
</html>
        `;
        
        const reportsDir = path.join(projectRoot, 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const reportPath = path.join(reportsDir, 'performance-report.html');
        fs.writeFileSync(reportPath, reportHtml);
        
        console.log(`${colors.green}✓${colors.reset} Report generated: ${reportPath}`);
        console.log(`${colors.cyan}🌐 Open: file://${reportPath}${colors.reset}\n`);
    }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

const monitor = new PerformanceMonitor();

switch (command) {
    case 'collect':
        monitor.collectMetrics().catch(console.error);
        break;
        
    case 'report':
        monitor.generateReport().catch(console.error);
        break;
        
    default:
        console.log(`
${colors.bright}Token Exporter Performance Monitor${colors.reset}

Usage:
  ${colors.cyan}node scripts/monitor.js <command>${colors.reset}

Commands:
  ${colors.cyan}collect${colors.reset}  Collect current performance metrics
  ${colors.cyan}report${colors.reset}   Generate performance report

Examples:
  ${colors.gray}npm run monitor${colors.reset}
  ${colors.gray}npm run monitor:report${colors.reset}
`);
        break;
}