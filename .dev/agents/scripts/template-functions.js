#!/usr/bin/env node

/**
 * Template Function Implementation System
 * Automates component synchronization between plugin and design guide
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

/**
 * Template function system
 */
class TemplateFunctionSystem {
    constructor() {
        this.templatesPath = path.join(projectRoot, 'src/shared/templates.js');
        this.componentsDir = path.join(projectRoot, 'src/components');
        this.templates = new Map();
        this.loadTemplates();
    }
    
    loadTemplates() {
        if (!fs.existsSync(this.templatesPath)) {
            console.log(`${colors.yellow}⚠ Templates file not found, creating...${colors.reset}`);
            this.createTemplatesFile();
        }
        
        try {
            const templateContent = fs.readFileSync(this.templatesPath, 'utf8');
            
            // Simple parser for template functions
            // In production, this would use a proper JS parser
            const functionRegex = /(\w+):\s*\(([^)]*)\)\s*=>\s*{([^}]*(?:{[^}]*}[^}]*)*)}/gs;
            let match;
            
            while ((match = functionRegex.exec(templateContent)) !== null) {
                const [, name, params, body] = match;
                this.templates.set(name, {
                    name,
                    params: params.split(',').map(p => p.trim()).filter(p => p),
                    body: body.trim()
                });
            }
            
            console.log(`${colors.green}✓${colors.reset} Loaded ${this.templates.size} template functions`);
        } catch (error) {
            console.error(`${colors.red}✗${colors.reset} Error loading templates: ${error.message}`);
        }
    }
    
    createTemplatesFile() {
        const templateContent = `/**
 * Shared Template Functions
 * Single source of truth for component HTML generation
 */

export const templates = {
    // Filters Card Component
    filtersCard: (options = {}) => {
        const { 
            collections = [], 
            showHeader = true,
            compact = false 
        } = options;
        
        return \`
            <div class="card filter-section\${compact ? ' is-compact' : ''}">
                <div class="card-content">
                    \${showHeader ? \`
                        <div style="display: flex; align-items: center; gap: var(--size-2); margin-bottom: var(--size-3);">
                            <i data-icon="sliders-horizontal" style="width: 1em; height: 1em;"></i>
                            <h4 class="text-label">Filters</h4>
                        </div>
                    \` : ''}
                    <div class="collection-list">
                        \${collections.map(collection => \`
                            <div class="collection-item \${collection.selected ? 'selected' : ''}">
                                <div class="collection-checkbox"></div>
                                <div class="collection-info">
                                    <div class="text-body-lg collection-name">\${collection.name}</div>
                                    <div class="collection-pills">
                                        \${collection.badges.map(badge => \`
                                            <span class="badge small \${badge.color}">
                                                <span class="icon" data-icon="\${badge.icon}"></span> \${badge.count}
                                            </span>
                                        \`).join('')}
                                    </div>
                                </div>
                                <div class="text-caption collection-count">\${collection.total} tokens</div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
            </div>
        \`;
    },

    // Quick Export Card Component
    quickExportCard: (options = {}) => {
        const { 
            format = 'css',
            showAdvanced = false,
            exportCount = 0 
        } = options;
        
        return \`
            <div class="card quick-export-card">
                <div class="card-content">
                    <div class="export-header">
                        <div class="format-selector">
                            <select class="format-select">
                                <option value="css" \${format === 'css' ? 'selected' : ''}>CSS Custom Properties</option>
                                <option value="json" \${format === 'json' ? 'selected' : ''}>JSON</option>
                                <option value="swift" \${format === 'swift' ? 'selected' : ''}>Swift</option>
                                <option value="android" \${format === 'android' ? 'selected' : ''}>Android XML</option>
                                <option value="flutter" \${format === 'flutter' ? 'selected' : ''}>Flutter</option>
                                <option value="tailwind" \${format === 'tailwind' ? 'selected' : ''}>Tailwind</option>
                            </select>
                        </div>
                        <button class="btn btn-primary export-btn">
                            <i data-icon="download"></i>
                            Export \${exportCount > 0 ? exportCount + ' tokens' : 'All'}
                        </button>
                    </div>
                    \${showAdvanced ? \`
                        <div class="advanced-options">
                            <div class="option-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" class="prefix-checkbox">
                                    <span>Add prefix</span>
                                </label>
                                <input type="text" class="prefix-input" placeholder="my-prefix-">
                            </div>
                        </div>
                    \` : ''}
                </div>
            </div>
        \`;
    },

    // Progress Animation Component
    progressAnimation: (options = {}) => {
        const { 
            progress = 0,
            stage = 'Ready',
            complete = false 
        } = options;
        
        return \`
            <div class="progress-container \${complete ? 'complete' : ''}">
                <div class="progress-bar-wrapper">
                    <div class="progress-bar" style="width: \${progress}%"></div>
                </div>
                <div class="progress-stage">\${stage}</div>
                \${complete ? \`
                    <div class="success-icon">
                        <i data-icon="circle-check-big"></i>
                    </div>
                \` : ''}
            </div>
        \`;
    },

    // Theme Toggle Component
    themeToggle: (options = {}) => {
        const { currentTheme = 'light' } = options;
        
        return \`
            <button class="theme-toggle btn-icon" data-theme-toggle>
                <i data-icon="\${currentTheme === 'light' ? 'sun' : 'moon'}"></i>
                <span class="sr-only">Toggle theme</span>
            </button>
        \`;
    },

    // Stats Container Component
    statsContainer: (options = {}) => {
        const { stats = [] } = options;
        
        return \`
            <div class="stats-container">
                \${stats.map(stat => \`
                    <div class="stat-item">
                        <div class="stat-value">\${stat.value}</div>
                        <div class="stat-label">\${stat.label}</div>
                    </div>
                \`).join('')}
            </div>
        \`;
    }
};

// Animation configurations
export const animations = {
    exportProgress: {
        stages: [
            { progress: 0, text: 'Analyzing variables...', duration: 0 },
            { progress: 25, text: 'Packaging tokens...', duration: 1500 },
            { progress: 50, text: 'Sanitizing output...', duration: 2700 },
            { progress: 75, text: 'Finalizing export...', duration: 4000 },
            { progress: 100, text: 'Export complete!', duration: 4500 }
        ],
        
        start: (updateCallback, completeCallback) => {
            animations.exportProgress.stages.forEach(stage => {
                setTimeout(() => {
                    updateCallback(stage.progress, stage.text);
                    
                    if (stage.progress === 100) {
                        setTimeout(completeCallback, 500);
                    }
                }, stage.duration);
            });
        }
    }
};
`;
        
        // Create directory if it doesn't exist
        const sharedDir = path.dirname(this.templatesPath);
        if (!fs.existsSync(sharedDir)) {
            fs.mkdirSync(sharedDir, { recursive: true });
        }
        
        fs.writeFileSync(this.templatesPath, templateContent);
        console.log(`${colors.green}✓${colors.reset} Created templates file: ${this.templatesPath}`);
    }
    
    /**
     * Generate static HTML from template functions
     */
    generateStaticComponents() {
        console.log(`\n${colors.blue}📝 Generating static components from templates${colors.reset}`);
        
        // Component configurations for static generation
        const componentConfigs = [
            {
                name: 'filters-card',
                template: 'filtersCard',
                data: {
                    collections: [
                        {
                            name: 'Brand',
                            selected: true,
                            badges: [
                                { color: 'cyan', icon: 'palette', count: 12 },
                                { color: 'pink', icon: 'toggle-right', count: 2 }
                            ],
                            total: 14
                        },
                        {
                            name: 'Semantic',
                            selected: false,
                            badges: [
                                { color: 'green', icon: 'eye', count: 8 },
                                { color: 'orange', icon: 'type', count: 4 }
                            ],
                            total: 12
                        },
                        {
                            name: 'Layout',
                            selected: true,
                            badges: [
                                { color: 'blue', icon: 'move', count: 6 }
                            ],
                            total: 6
                        }
                    ]
                }
            },
            {
                name: 'quick-export-card',
                template: 'quickExportCard',
                data: {
                    format: 'css',
                    showAdvanced: false,
                    exportCount: 32
                }
            },
            {
                name: 'progress-animation',
                template: 'progressAnimation',
                data: {
                    progress: 0,
                    stage: 'Ready to export',
                    complete: false
                }
            },
            {
                name: 'theme-toggle',
                template: 'themeToggle',
                data: {
                    currentTheme: 'light'
                }
            },
            {
                name: 'stats-container',
                template: 'statsContainer',
                data: {
                    stats: [
                        { value: '32', label: 'Tokens' },
                        { value: '4', label: 'Collections' },
                        { value: '6', label: 'Formats' }
                    ]
                }
            }
        ];
        
        let generatedCount = 0;
        
        for (const config of componentConfigs) {
            const outputPath = path.join(this.componentsDir, `_${config.name}.html`);
            
            try {
                // Generate HTML from template function (simplified execution)
                const html = this.executeTemplate(config.template, config.data);
                
                const componentContent = `<!-- Auto-generated from templates.js -->
<!-- Template: ${config.template} -->
<!-- Generated: ${new Date().toISOString()} -->

${html}`;
                
                fs.writeFileSync(outputPath, componentContent);
                console.log(`  ${colors.green}✓${colors.reset} Generated: ${config.name}.html`);
                generatedCount++;
                
            } catch (error) {
                console.error(`  ${colors.red}✗${colors.reset} Failed to generate ${config.name}: ${error.message}`);
            }
        }
        
        console.log(`\n${colors.green}✓${colors.reset} Generated ${generatedCount} static components`);
        return generatedCount;
    }
    
    /**
     * Simple template execution (in production, use a proper template engine)
     */
    executeTemplate(templateName, data) {
        if (!this.templates.has(templateName)) {
            throw new Error(`Template function '${templateName}' not found`);
        }
        
        // For now, we'll return a placeholder
        // In a full implementation, this would execute the actual template function
        return `<div class="component-${templateName}">
    <!-- Component generated from template function: ${templateName} -->
    <!-- Data: ${JSON.stringify(data, null, 2)} -->
</div>`;
    }
    
    /**
     * Bundle templates for plugin use
     */
    bundleForPlugin() {
        console.log(`\n${colors.blue}📦 Bundling templates for plugin${colors.reset}`);
        
        const templateContent = fs.readFileSync(this.templatesPath, 'utf8');
        
        // Transform for Figma compatibility (no optional chaining, template literals, etc.)
        let transformedContent = templateContent;
        
        // Replace template literals with string concatenation
        transformedContent = transformedContent.replace(/`([^`]*\$\{[^}]+\}[^`]*)`/g, (match) => {
            // This is a simplified transformation
            // In production, use a proper AST transformer
            return '"' + match.slice(1, -1).replace(/\$\{([^}]+)\}/g, '" + ($1) + "') + '"';
        });
        
        // Replace optional chaining
        transformedContent = transformedContent.replace(/(\w+)\?\./g, '$1 && $1.');
        
        const bundlePath = path.join(projectRoot, '.build-cache/plugin-templates.js');
        
        // Ensure directory exists
        const bundleDir = path.dirname(bundlePath);
        if (!fs.existsSync(bundleDir)) {
            fs.mkdirSync(bundleDir, { recursive: true });
        }
        
        fs.writeFileSync(bundlePath, transformedContent);
        console.log(`  ${colors.green}✓${colors.reset} Plugin bundle created: ${bundlePath}`);
        
        return bundlePath;
    }
    
    /**
     * Validate component synchronization
     */
    validateSync() {
        console.log(`\n${colors.blue}🔍 Validating component synchronization${colors.reset}`);
        
        const issues = [];
        
        // Check if all templates have corresponding component files
        this.templates.forEach((template, name) => {
            const componentPath = path.join(this.componentsDir, `_${name}.html`);
            
            if (!fs.existsSync(componentPath)) {
                issues.push({
                    type: 'missing-component',
                    template: name,
                    file: componentPath
                });
            }
        });
        
        // Check if component files are using @include in templates
        const templateFiles = [
            path.join(projectRoot, 'src/ui.template.html'),
            path.join(projectRoot, 'docs/design-system-guide.template.html')
        ];
        
        for (const templateFile of templateFiles) {
            if (fs.existsSync(templateFile)) {
                const content = fs.readFileSync(templateFile, 'utf8');
                
                // Find hardcoded component content
                this.templates.forEach((template, name) => {
                    const componentFile = `_${name}.html`;
                    const includeDirective = `<!-- @include src/components/${componentFile} -->`;
                    
                    if (!content.includes(includeDirective)) {
                        // Check if component content is hardcoded
                        const componentPath = path.join(this.componentsDir, componentFile);
                        if (fs.existsSync(componentPath)) {
                            const componentContent = fs.readFileSync(componentPath, 'utf8');
                            const componentLines = componentContent.split('\n')
                                .slice(2, 6)
                                .map(line => line.trim())
                                .filter(line => line.length > 10);
                            
                            const isHardcoded = componentLines.some(line => content.includes(line));
                            
                            if (isHardcoded) {
                                issues.push({
                                    type: 'hardcoded-component',
                                    template: name,
                                    file: templateFile,
                                    suggestion: includeDirective
                                });
                            }
                        }
                    }
                });
            }
        }
        
        // Report issues
        if (issues.length === 0) {
            console.log(`  ${colors.green}✓${colors.reset} All components are properly synchronized`);
            return true;
        } else {
            console.log(`  ${colors.red}✗${colors.reset} Found ${issues.length} synchronization issues:`);
            
            issues.forEach(issue => {
                if (issue.type === 'missing-component') {
                    console.log(`    • Missing component file for template '${issue.template}'`);
                    console.log(`      Expected: ${issue.file}`);
                } else if (issue.type === 'hardcoded-component') {
                    console.log(`    • Hardcoded component '${issue.template}' in ${path.basename(issue.file)}`);
                    console.log(`      Fix: Replace with ${issue.suggestion}`);
                }
            });
            
            return false;
        }
    }
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

const system = new TemplateFunctionSystem();

switch (command) {
    case 'generate':
        system.generateStaticComponents();
        break;
        
    case 'bundle':
        system.bundleForPlugin();
        break;
        
    case 'validate':
        system.validateSync();
        break;
        
    case 'sync':
        system.generateStaticComponents();
        system.bundleForPlugin();
        system.validateSync();
        break;
        
    default:
        console.log(`
${colors.bright}Template Function System${colors.reset}

Usage:
  ${colors.cyan}node scripts/template-functions.js <command>${colors.reset}

Commands:
  ${colors.cyan}generate${colors.reset}  Generate static components from templates
  ${colors.cyan}bundle${colors.reset}    Bundle templates for plugin use
  ${colors.cyan}validate${colors.reset}  Validate component synchronization
  ${colors.cyan}sync${colors.reset}      Run all operations (generate + bundle + validate)

Examples:
  ${colors.gray}npm run templates:sync${colors.reset}
  ${colors.gray}node scripts/template-functions.js generate${colors.reset}
`);
        break;
}