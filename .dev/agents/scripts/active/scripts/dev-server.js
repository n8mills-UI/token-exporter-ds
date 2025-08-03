#!/usr/bin/env node

/**
 * Development Server for Token Exporter
 * Provides live reload, hot CSS injection, and development tools
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

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

class DevServer {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.wsPort = options.wsPort || 3001;
        this.clients = new Set();
        this.watcher = null;
    }
    
    async start() {
        console.log(`\n${colors.bright}🚀 Token Exporter Development Server${colors.reset}\n`);
        
        // Start HTTP server
        this.startHttpServer();
        
        // Start WebSocket server for live reload
        this.startWebSocketServer();
        
        // Start file watcher
        await this.startWatcher();
        
        console.log(`\n${colors.green}✓ Development server ready!${colors.reset}`);
        console.log(`${colors.cyan}→ Design Guide: http://localhost:${this.port}${colors.reset}`);
        console.log(`${colors.cyan}→ Plugin UI: http://localhost:${this.port}/plugin${colors.reset}`);
        console.log(`${colors.yellow}→ Press Ctrl+C to stop${colors.reset}\n`);
    }
    
    startHttpServer() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        this.server.listen(this.port, () => {
            console.log(`${colors.green}✓${colors.reset} HTTP server running on port ${this.port}`);
        });
    }
    
    startWebSocketServer() {
        this.wss = new WebSocketServer({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log(`${colors.cyan}→${colors.reset} Client connected for live reload`);
            this.clients.add(ws);
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
        
        console.log(`${colors.green}✓${colors.reset} WebSocket server running on port ${this.wsPort}`);
    }
    
    async startWatcher() {
        const chokidar = await import('chokidar');
        
        this.watcher = chokidar.watch([
            'docs/design-system.css',
            'docs/design-system-guide.html',
            'src/ui.html',
            'src/components/**/*.html'
        ], {
            ignoreInitial: true
        });
        
        this.watcher.on('change', (filePath) => {
            const relativePath = path.relative(projectRoot, filePath);
            console.log(`${colors.yellow}📝 File changed: ${relativePath}${colors.reset}`);
            
            // Determine reload type
            let reloadType = 'full';
            if (filePath.endsWith('.css')) {
                reloadType = 'css';
            }
            
            // Notify clients
            this.broadcast({
                type: 'reload',
                reloadType,
                file: relativePath,
                timestamp: Date.now()
            });
        });
        
        console.log(`${colors.green}✓${colors.reset} File watcher started`);
    }
    
    handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // Add CORS headers for development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (url.pathname === '/') {
            this.serveDesignGuide(res);
        } else if (url.pathname === '/plugin') {
            this.servePluginUI(res);
        } else if (url.pathname === '/api/reload-script') {
            this.serveReloadScript(res);
        } else if (url.pathname.startsWith('/api/')) {
            this.handleApiRequest(url, res);
        } else {
            this.serveStaticFile(url.pathname, res);
        }
    }
    
    serveDesignGuide(res) {
        const guidePath = path.join(projectRoot, 'docs/design-system-guide.html');
        
        if (!fs.existsSync(guidePath)) {
            this.serve404(res, 'Design guide not found. Run `npm run build` first.');
            return;
        }
        
        let content = fs.readFileSync(guidePath, 'utf8');
        
        // Inject live reload script
        const reloadScript = this.getReloadScript();
        content = content.replace('</body>', `${reloadScript}</body>`);
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
    }
    
    servePluginUI(res) {
        const pluginPath = path.join(projectRoot, 'src/ui.html');
        
        if (!fs.existsSync(pluginPath)) {
            this.serve404(res, 'Plugin UI not found. Run `npm run build` first.');
            return;
        }
        
        let content = fs.readFileSync(pluginPath, 'utf8');
        
        // Inject live reload script
        const reloadScript = this.getReloadScript();
        content = content.replace('</body>', `${reloadScript}</body>`);
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
    }
    
    serveStaticFile(pathname, res) {
        // Remove leading slash and resolve relative to project root
        const filePath = path.join(projectRoot, 'docs', pathname.slice(1));
        
        if (!fs.existsSync(filePath)) {
            this.serve404(res);
            return;
        }
        
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            this.serve404(res);
            return;
        }
        
        // Determine content type
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        };
        
        const contentType = contentTypes[ext] || 'text/plain';
        
        res.writeHead(200, { 
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    }
    
    handleApiRequest(url, res) {
        if (url.pathname === '/api/build') {
            this.handleBuildRequest(res);
        } else if (url.pathname === '/api/check') {
            this.handleCheckRequest(res);
        } else {
            this.serve404(res);
        }
    }
    
    async handleBuildRequest(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        try {
            const { spawn } = await import('child_process');
            const build = spawn('npm', ['run', 'build'], { cwd: projectRoot });
            
            let output = '';
            build.stdout.on('data', (data) => output += data);
            build.stderr.on('data', (data) => output += data);
            
            build.on('close', (code) => {
                res.end(JSON.stringify({
                    success: code === 0,
                    output: output,
                    timestamp: Date.now()
                }));
            });
            
        } catch (error) {
            res.end(JSON.stringify({
                success: false,
                error: error.message,
                timestamp: Date.now()
            }));
        }
    }
    
    async handleCheckRequest(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        try {
            const { spawn } = await import('child_process');
            const check = spawn('npm', ['run', 'check'], { cwd: projectRoot });
            
            let output = '';
            check.stdout.on('data', (data) => output += data);
            check.stderr.on('data', (data) => output += data);
            
            check.on('close', (code) => {
                res.end(JSON.stringify({
                    success: code === 0,
                    output: output,
                    timestamp: Date.now()
                }));
            });
            
        } catch (error) {
            res.end(JSON.stringify({
                success: false,
                error: error.message,
                timestamp: Date.now()
            }));
        }
    }
    
    serve404(res, message = 'Not Found') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
                <head><title>404 Not Found</title></head>
                <body>
                    <h1>404 Not Found</h1>
                    <p>${message}</p>
                    <p><a href="/">← Back to Design Guide</a></p>
                </body>
            </html>
        `);
    }
    
    getReloadScript() {
        return `
            <script>
                // Live reload functionality
                (function() {
                    const ws = new WebSocket('ws://localhost:${this.wsPort}');
                    
                    ws.onmessage = function(event) {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'reload') {
                            if (data.reloadType === 'css') {
                                // Hot CSS reload
                                const links = document.querySelectorAll('link[rel="stylesheet"]');
                                links.forEach(link => {
                                    const href = new URL(link.href);
                                    href.searchParams.set('t', data.timestamp);
                                    link.href = href.toString();
                                });
                                console.log('🔥 Hot reloaded CSS:', data.file);
                            } else {
                                // Full page reload
                                console.log('🔄 Reloading page:', data.file);
                                window.location.reload();
                            }
                        }
                    };
                    
                    ws.onopen = function() {
                        console.log('🔗 Connected to dev server');
                    };
                    
                    ws.onclose = function() {
                        console.log('❌ Disconnected from dev server');
                        // Try to reconnect after 1 second
                        setTimeout(() => window.location.reload(), 1000);
                    };
                })();
                
                // Development tools
                if (window.location.search.includes('dev-tools')) {
                    // Add development overlay
                    const devTools = document.createElement('div');
                    devTools.style.cssText = \`
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 10px;
                        border-radius: 5px;
                        font-family: monospace;
                        font-size: 12px;
                        z-index: 10000;
                    \`;
                    
                    devTools.innerHTML = \`
                        <div>🛠️ Dev Tools</div>
                        <button onclick="fetch('/api/build').then(r=>r.json()).then(d=>alert(d.success?'Build complete':'Build failed'))">Build</button>
                        <button onclick="fetch('/api/check').then(r=>r.json()).then(d=>alert(d.success?'Checks passed':'Checks failed'))">Check</button>
                    \`;
                    
                    document.body.appendChild(devTools);
                }
            </script>
        `;
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(data);
            }
        });
    }
    
    stop() {
        console.log(`\n${colors.yellow}Stopping development server...${colors.reset}`);
        
        if (this.watcher) {
            this.watcher.close();
        }
        
        if (this.server) {
            this.server.close();
        }
        
        if (this.wss) {
            this.wss.close();
        }
        
        console.log(`${colors.green}✓ Development server stopped${colors.reset}\n`);
    }
}

// CLI interface
const args = process.argv.slice(2);
const port = parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1]) || 3000;

const devServer = new DevServer({ port });

// Graceful shutdown
process.on('SIGINT', () => {
    devServer.stop();
    process.exit(0);
});

// Start server
devServer.start().catch(console.error);