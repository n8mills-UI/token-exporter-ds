#!/usr/bin/env node

/**
 * Quality Assurance Orchestrator
 * Manages organized workflows for running multiple QA scripts efficiently
 */

const { spawn } = require('child_process');

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Define workflow configurations
const workflows = {
    quick: {
        name: 'Quick Development Checks',
        description: 'Essential checks for fast feedback (~10 seconds)',
        scripts: [
            { cmd: 'npm', args: ['run', 'figma-check'], name: 'Figma Compatibility' },
            { cmd: 'npm', args: ['run', 'lint:js'], name: 'JavaScript Linting' },
            { cmd: 'npm', args: ['run', 'lint:css'], name: 'CSS Architecture' }
        ],
        parallel: false,
        stopOnError: true
    },
    full: {
        name: 'Complete Quality Audit',
        description: 'Comprehensive analysis of all aspects (~60 seconds)',
        scripts: [
            { cmd: 'npm', args: ['run', 'figma-check'], name: 'Figma Compatibility' },
            { cmd: 'npm', args: ['run', 'lint:js'], name: 'JavaScript Linting' },
            { cmd: 'npm', args: ['run', 'lint:css'], name: 'CSS Architecture' },
            { cmd: 'npm', args: ['run', 'validate:tokens'], name: 'Token Validation' },
            { cmd: 'npm', args: ['run', 'audit:docs'], name: 'Documentation Audit' },
            { cmd: 'npm', args: ['run', 'audit:arch'], name: 'Architecture Analysis' },
            { cmd: 'npm', args: ['run', 'analyze:duplicates'], name: 'Duplicate Analysis' }
        ],
        parallel: false,
        stopOnError: false
    },
    ci: {
        name: 'CI/CD Pipeline Checks',
        description: 'Production-ready validation with detailed reporting',
        scripts: [
            { cmd: 'npm', args: ['run', 'figma-check'], name: 'Figma Compatibility', critical: true },
            { cmd: 'npm', args: ['run', 'lint:js'], name: 'JavaScript Linting', critical: true },
            { cmd: 'npm', args: ['run', 'lint:css'], name: 'CSS Architecture', critical: true },
            { cmd: 'npm', args: ['run', 'validate:tokens'], name: 'Token Validation', critical: true },
            { cmd: 'npm', args: ['run', 'audit:docs'], name: 'Documentation Audit', critical: false },
            { cmd: 'npm', args: ['run', 'audit:arch'], name: 'Architecture Analysis', critical: false },
            { cmd: 'npm', args: ['run', 'analyze:duplicates'], name: 'Duplicate Analysis', critical: false }
        ],
        parallel: false,
        stopOnError: false,
        generateReport: true
    },
};

class QAOrchestrator {
    constructor(workflowName) {
        this.workflow = workflows[workflowName];
        this.workflowName = workflowName;
        this.results = [];
        this.startTime = Date.now();
        
        if (!this.workflow) {
            console.error(`${colors.red}❌ Unknown workflow: ${workflowName}${colors.reset}`);
            console.log(`${colors.cyan}Available workflows: ${Object.keys(workflows).join(', ')}${colors.reset}`);
            process.exit(1);
        }
    }

    async run() {
        this.printHeader();
        

        for (let i = 0; i < this.workflow.scripts.length; i++) {
            const script = this.workflow.scripts[i];
            const result = await this.runScript(script, i + 1);
            this.results.push(result);
            
            if (result.error && this.workflow.stopOnError) {
                console.log(`\n${colors.red}🛑 Stopping workflow due to error${colors.reset}`);
                break;
            }
        }
        
        this.printSummary();
        
        if (this.workflow.generateReport) {
            this.generateCIReport();
        }
        
        // Exit with error code if any critical scripts failed
        const criticalFailures = this.results.filter(r => r.error && r.critical);
        if (criticalFailures.length > 0) {
            process.exit(1);
        }
    }

    printHeader() {
        const border = '='.repeat(60);
        console.log(`\n${colors.cyan}${border}${colors.reset}`);
        console.log(`${colors.bright}🎯 ${this.workflow.name}${colors.reset}`);
        console.log(`${colors.yellow}${this.workflow.description}${colors.reset}`);
        console.log(`${colors.cyan}${border}${colors.reset}\n`);
    }

    async runScript(script, index) {
        const total = this.workflow.scripts.length;
        const prefix = `[${index}/${total}]`;
        
        console.log(`${colors.blue}${prefix} 🚀 ${script.name}${colors.reset}`);
        
        const startTime = Date.now();
        
        try {
            await this.executeCommand(script.cmd, script.args);
            const duration = Date.now() - startTime;
            console.log(`${colors.green}${prefix} ✅ ${script.name} (${duration}ms)${colors.reset}\n`);
            
            return {
                name: script.name,
                success: true,
                duration,
                critical: script.critical !== false
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            const isCritical = script.critical !== false;
            const icon = isCritical ? '❌' : '⚠️';
            const color = isCritical ? colors.red : colors.yellow;
            
            console.log(`${color}${prefix} ${icon} ${script.name} failed (${duration}ms)${colors.reset}`);
            if (error.message) {
                console.log(`${colors.red}   Error: ${error.message}${colors.reset}\n`);
            }
            
            return {
                name: script.name,
                success: false,
                error: error.message || 'Unknown error',
                duration,
                critical: isCritical
            };
        }
    }

    executeCommand(cmd, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(cmd, args, {
                stdio: 'inherit',
                shell: true,
                cwd: process.cwd()
            });
            
            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });
            
            child.on('error', (error) => {
                reject(error);
            });
        });
    }


    printSummary() {
        const totalTime = Date.now() - this.startTime;
        const successful = this.results.filter(r => r.success).length;
        const failed = this.results.filter(r => !r.success).length;
        const criticalFailed = this.results.filter(r => !r.success && r.critical).length;
        
        console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.bright}📊 Workflow Summary${colors.reset}`);
        console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
        
        console.log(`${colors.green}✅ Successful: ${successful}${colors.reset}`);
        if (failed > 0) {
            console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
            if (criticalFailed > 0) {
                console.log(`${colors.red}🚨 Critical failures: ${criticalFailed}${colors.reset}`);
            }
        }
        console.log(`${colors.blue}⏱️  Total time: ${totalTime}ms${colors.reset}`);
        
        // Show individual results
        console.log(`\n${colors.bright}Individual Results:${colors.reset}`);
        this.results.forEach(result => {
            const icon = result.success ? '✅' : (result.critical ? '❌' : '⚠️');
            const color = result.success ? colors.green : (result.critical ? colors.red : colors.yellow);
            console.log(`${color}${icon} ${result.name} (${result.duration}ms)${colors.reset}`);
        });
        
        console.log('');
    }

    generateCIReport() {
        const report = {
            workflow: this.workflowName,
            timestamp: new Date().toISOString(),
            totalTime: Date.now() - this.startTime,
            summary: {
                total: this.results.length,
                successful: this.results.filter(r => r.success).length,
                failed: this.results.filter(r => !r.success).length,
                criticalFailed: this.results.filter(r => !r.success && r.critical).length
            },
            results: this.results
        };
        
        console.log(`${colors.magenta}📄 CI Report:${colors.reset}`);
        console.log(JSON.stringify(report, null, 2));
    }
}

// Main execution
if (require.main === module) {
    const workflowName = process.argv[2];
    
    if (!workflowName) {
        console.log(`${colors.yellow}Usage: node qa-orchestrator.js <workflow>${colors.reset}`);
        console.log(`${colors.cyan}Available workflows:${colors.reset}`);
        Object.entries(workflows).forEach(([name, config]) => {
            console.log(`  ${colors.green}${name}${colors.reset} - ${config.description}`);
        });
        process.exit(1);
    }
    
    const orchestrator = new QAOrchestrator(workflowName);
    orchestrator.run().catch(error => {
        console.error(`${colors.red}❌ Orchestrator error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = { QAOrchestrator, workflows };