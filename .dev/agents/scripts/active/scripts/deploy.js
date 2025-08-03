#!/usr/bin/env node

/**
 * Deployment Script for Token Exporter
 * Handles zero-downtime deployments with rollback capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
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

class DeploymentManager {
    constructor(options = {}) {
        this.environment = options.environment || 'production';
        this.dryRun = options.dryRun || false;
        this.skipTests = options.skipTests || false;
        this.rollbackVersion = null;
    }
    
    async deploy() {
        console.log(`\n${colors.bright}🚀 Starting deployment to ${this.environment}${colors.reset}`);
        
        if (this.dryRun) {
            console.log(`${colors.yellow}🧪 DRY RUN MODE - No actual deployment will occur${colors.reset}\n`);
        }
        
        try {
            // Step 1: Pre-deployment checks
            await this.preDeploymentChecks();
            
            // Step 2: Build for production
            await this.buildForProduction();
            
            // Step 3: Run tests and quality checks
            if (!this.skipTests) {
                await this.runQualityChecks();
            }
            
            // Step 4: Create deployment package
            await this.createDeploymentPackage();
            
            // Step 5: Deploy to environment
            await this.deployToEnvironment();
            
            // Step 6: Post-deployment validation
            await this.postDeploymentValidation();
            
            console.log(`\n${colors.green}✅ Deployment completed successfully!${colors.reset}`);
            console.log(`${colors.cyan}🌍 Live at: https://token-exporter.design${colors.reset}\n`);
            
        } catch (error) {
            console.error(`\n${colors.red}❌ Deployment failed: ${error.message}${colors.reset}`);
            
            if (!this.dryRun && this.rollbackVersion) {
                console.log(`${colors.yellow}🔄 Initiating rollback...${colors.reset}`);
                await this.rollback();
            }
            
            process.exit(1);
        }
    }
    
    async preDeploymentChecks() {
        console.log(`${colors.blue}[1/6]${colors.reset} Pre-deployment checks`);
        
        // Check git status
        const { stdout: gitStatus } = await execAsync('git status --porcelain');
        if (gitStatus.trim() && !this.dryRun) {
            throw new Error('Working directory is not clean. Commit or stash changes first.');
        }
        
        // Check if on correct branch
        const { stdout: currentBranch } = await execAsync('git rev-parse --abbrev-ref HEAD');
        const branch = currentBranch.trim();
        
        if (this.environment === 'production' && branch !== 'main') {
            console.log(`${colors.yellow}⚠ Warning: Deploying from branch '${branch}' to production${colors.reset}`);
        }
        
        // Get current commit for rollback
        const { stdout: currentCommit } = await execAsync('git rev-parse HEAD');
        this.rollbackVersion = currentCommit.trim().substring(0, 8);
        
        console.log(`  ${colors.green}✓${colors.reset} Git status clean`);
        console.log(`  ${colors.green}✓${colors.reset} Current branch: ${branch}`);
        console.log(`  ${colors.green}✓${colors.reset} Rollback version: ${this.rollbackVersion}`);
    }
    
    async buildForProduction() {
        console.log(`\n${colors.blue}[2/6]${colors.reset} Building for production`);
        
        if (this.dryRun) {
            console.log(`  ${colors.yellow}→${colors.reset} Skipping build (dry run)`);
            return;
        }
        
        const startTime = Date.now();
        
        try {
            // Clean previous builds
            await execAsync('rm -rf dist/');
            
            // Run optimized build
            const { stdout, stderr } = await execAsync('npm run build:optimized');
            
            const buildTime = Date.now() - startTime;
            console.log(`  ${colors.green}✓${colors.reset} Build completed in ${buildTime}ms`);
            
            // Validate build outputs
            const requiredFiles = [
                'src/ui.html',
                'docs/design-system-guide.html',
                'docs/design-system.css'
            ];
            
            for (const file of requiredFiles) {
                if (!fs.existsSync(path.join(projectRoot, file))) {
                    throw new Error(`Required build output missing: ${file}`);
                }
            }
            
            console.log(`  ${colors.green}✓${colors.reset} All required files generated`);
            
        } catch (error) {
            throw new Error(`Build failed: ${error.message}`);
        }
    }
    
    async runQualityChecks() {
        console.log(`\n${colors.blue}[3/6]${colors.reset} Quality checks`);
        
        if (this.dryRun) {
            console.log(`  ${colors.yellow}→${colors.reset} Skipping quality checks (dry run)`);
            return;
        }
        
        try {
            // Run comprehensive audit
            const { stdout, stderr } = await execAsync('npm run audit', {
                timeout: 60000 // 60 second timeout
            });
            
            console.log(`  ${colors.green}✓${colors.reset} All quality checks passed`);
            
        } catch (error) {
            if (error.code === 1) {
                throw new Error('Quality checks failed. Fix issues before deploying.');
            } else {
                throw new Error(`Quality check error: ${error.message}`);
            }
        }
    }
    
    async createDeploymentPackage() {
        console.log(`\n${colors.blue}[4/6]${colors.reset} Creating deployment package`);
        
        if (this.dryRun) {
            console.log(`  ${colors.yellow}→${colors.reset} Skipping package creation (dry run)`);
            return;
        }
        
        // Create deployment metadata
        const deploymentInfo = {
            version: process.env.npm_package_version || '1.0.0',
            commit: this.rollbackVersion,
            branch: (await execAsync('git rev-parse --abbrev-ref HEAD')).stdout.trim(),
            timestamp: new Date().toISOString(),
            environment: this.environment,
            buildFiles: [
                'src/ui.html',
                'docs/design-system-guide.html',
                'docs/design-system.css'
            ]
        };
        
        fs.writeFileSync(
            path.join(projectRoot, 'docs/.deployment-info.json'),
            JSON.stringify(deploymentInfo, null, 2)
        );
        
        // Calculate file sizes
        let totalSize = 0;
        deploymentInfo.buildFiles.forEach(file => {
            const filePath = path.join(projectRoot, file);
            if (fs.existsSync(filePath)) {
                const size = fs.statSync(filePath).size;
                totalSize += size;
                console.log(`  ${colors.cyan}→${colors.reset} ${file}: ${Math.round(size / 1024)}KB`);
            }
        });
        
        console.log(`  ${colors.green}✓${colors.reset} Package created (${Math.round(totalSize / 1024)}KB total)`);
    }
    
    async deployToEnvironment() {
        console.log(`\n${colors.blue}[5/6]${colors.reset} Deploying to ${this.environment}`);
        
        if (this.dryRun) {
            console.log(`  ${colors.yellow}→${colors.reset} Skipping actual deployment (dry run)`);
            console.log(`  ${colors.yellow}→${colors.reset} Would deploy to: https://token-exporter.design`);
            return;
        }
        
        try {
            if (this.environment === 'production') {
                // Deploy to GitHub Pages via gh-pages action
                console.log(`  ${colors.cyan}→${colors.reset} Triggering GitHub Pages deployment`);
                
                // Commit build files if needed
                await execAsync('git add docs/');
                
                try {
                    await execAsync(`git commit -m "build: Production build ${this.rollbackVersion}"`);
                } catch (error) {
                    // No changes to commit
                }
                
                // Push to trigger deployment
                await execAsync('git push origin main');
                
            } else if (this.environment === 'preview') {
                // Deploy to Netlify for previews
                console.log(`  ${colors.cyan}→${colors.reset} Deploying to Netlify preview`);
                
                const { stdout } = await execAsync('npx netlify deploy --dir=docs --prod=false');
                const previewUrl = stdout.match(/Deploy URL: (.+)/)?.[1];
                
                if (previewUrl) {
                    console.log(`  ${colors.green}✓${colors.reset} Preview deployed: ${previewUrl}`);
                }
            }
            
            console.log(`  ${colors.green}✓${colors.reset} Deployment completed`);
            
        } catch (error) {
            throw new Error(`Deployment failed: ${error.message}`);
        }
    }
    
    async postDeploymentValidation() {
        console.log(`\n${colors.blue}[6/6]${colors.reset} Post-deployment validation`);
        
        if (this.dryRun) {
            console.log(`  ${colors.yellow}→${colors.reset} Skipping validation (dry run)`);
            return;
        }
        
        const baseUrl = this.environment === 'production' 
            ? 'https://token-exporter.design'
            : 'https://preview.token-exporter.design';
        
        try {
            // Wait for deployment to propagate
            console.log(`  ${colors.cyan}→${colors.reset} Waiting for deployment to propagate...`);
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Health check
            const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${baseUrl}`);
            const statusCode = parseInt(stdout.trim());
            
            if (statusCode === 200) {
                console.log(`  ${colors.green}✓${colors.reset} Site is accessible (HTTP ${statusCode})`);
            } else {
                throw new Error(`Site returned HTTP ${statusCode}`);
            }
            
            // Quick accessibility check
            try {
                await execAsync(`npx pa11y ${baseUrl} --threshold 5`);
                console.log(`  ${colors.green}✓${colors.reset} Accessibility check passed`);
            } catch (error) {
                console.log(`  ${colors.yellow}⚠${colors.reset} Accessibility issues detected (non-blocking)`);
            }
            
        } catch (error) {
            throw new Error(`Post-deployment validation failed: ${error.message}`);
        }
    }
    
    async rollback() {
        console.log(`\n${colors.yellow}🔄 Rolling back to version ${this.rollbackVersion}${colors.reset}`);
        
        try {
            // Reset to previous commit
            await execAsync(`git reset --hard ${this.rollbackVersion}`);
            
            // Force push to trigger redeployment
            await execAsync('git push origin main --force-with-lease');
            
            console.log(`  ${colors.green}✓${colors.reset} Rollback completed`);
            
        } catch (error) {
            console.error(`  ${colors.red}✗${colors.reset} Rollback failed: ${error.message}`);
            console.error(`  ${colors.red}Manual intervention required!${colors.reset}`);
        }
    }
}

// CLI interface
const args = process.argv.slice(2);
const options = {
    environment: args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production',
    dryRun: args.includes('--dry-run'),
    skipTests: args.includes('--skip-tests')
};

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
${colors.bright}Token Exporter Deployment Tool${colors.reset}

Usage:
  ${colors.cyan}npm run deploy${colors.reset}                    Deploy to production
  ${colors.cyan}node scripts/deploy.js --env=preview${colors.reset}  Deploy to preview
  ${colors.cyan}node scripts/deploy.js --dry-run${colors.reset}      Test deployment without executing

Options:
  ${colors.cyan}--env=ENV${colors.reset}        Target environment (production|preview)
  ${colors.cyan}--dry-run${colors.reset}        Test run without actual deployment
  ${colors.cyan}--skip-tests${colors.reset}     Skip quality checks (not recommended)
  ${colors.cyan}--help${colors.reset}           Show this help

Examples:
  ${colors.gray}# Production deployment${colors.reset}
  ${colors.gray}npm run deploy${colors.reset}
  
  ${colors.gray}# Preview deployment${colors.reset}
  ${colors.gray}npm run deploy:preview${colors.reset}
  
  ${colors.gray}# Test deployment${colors.reset}
  ${colors.gray}npm run deploy -- --dry-run${colors.reset}
`);
    process.exit(0);
}

// Run deployment
const deployManager = new DeploymentManager(options);
deployManager.deploy().catch(console.error);