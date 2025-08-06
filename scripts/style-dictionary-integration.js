/**
 * Style Dictionary Integration Module
 * Handles token processing through Style Dictionary for industry-standard transforms
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

/**
 * Validates that Style Dictionary is available
 */
export function validateStyleDictionaryAvailability() {
    try {
        const sdPath = path.join(projectRoot, 'node_modules', 'style-dictionary');
        return fs.existsSync(sdPath);
    } catch (error) {
        console.error('Error checking Style Dictionary availability:', error);
        return false;
    }
}

/**
 * Validates and sanitizes tokens for Style Dictionary processing
 */
function validateTokens(tokens) {
    if (!tokens || typeof tokens !== 'object') {
        return {};
    }

    const sanitized = {};
    let validCount = 0;
    let invalidCount = 0;

    for (const [key, value] of Object.entries(tokens)) {
        // Skip invalid keys
        if (!key || typeof key !== 'string') {
            invalidCount++;
            continue;
        }

        // Sanitize key for Style Dictionary
        const sanitizedKey = key.replace(/[^a-zA-Z0-9-_]/g, '-');
        
        // Validate value
        if (value === null || value === undefined) {
            console.log(`Empty value for token "${key}" - skipping`);
            invalidCount++;
            continue;
        }

        // Handle different value types
        if (typeof value === 'object' && value.value !== undefined) {
            sanitized[sanitizedKey] = value;
            validCount++;
        } else if (typeof value === 'string' || typeof value === 'number') {
            sanitized[sanitizedKey] = { value: String(value) };
            validCount++;
        } else if (typeof value === 'boolean') {
            console.log(`Unsupported value type for token "${key}": boolean - converting to string`);
            sanitized[sanitizedKey] = { value: String(value) };
            validCount++;
        } else {
            console.log(`Invalid token structure for "${key}" - skipping`);
            invalidCount++;
        }
    }

    console.log(`Token validation complete: ${validCount} valid, ${invalidCount} invalid/skipped`);
    return sanitized;
}

/**
 * Generates fallback transforms when Style Dictionary is unavailable
 */
export function getFallbackTransforms(tokens) {
    console.log('⚠️  Using fallback transforms (Style Dictionary unavailable)');
    
    if (!tokens || Object.keys(tokens).length === 0) {
        return {
            css: ':root {}',
            json: '{}'
        };
    }

    // Basic CSS generation
    const cssVars = Object.entries(tokens)
        .map(([key, value]) => {
            const val = typeof value === 'object' ? value.value : value;
            return `  --${key}: ${val};`;
        })
        .join('\n');

    return {
        css: `:root {\n${cssVars}\n}`,
        json: JSON.stringify(tokens, null, 2)
    };
}

/**
 * Main Style Dictionary integration function
 */
export async function integrateStyleDictionary(tokens = null) {
    console.log('🎨 Style Dictionary processing started...');
    
    // Validate tokens
    console.log('  ✓ Validating tokens...');
    const validatedTokens = tokens ? validateTokens(tokens) : {};
    
    if (Object.keys(validatedTokens).length === 0) {
        if (tokens && Object.keys(tokens).length > 0) {
            throw new Error('No valid tokens found after validation');
        }
        return getFallbackTransforms({});
    }

    // Check if Style Dictionary is available
    if (!validateStyleDictionaryAvailability()) {
        return getFallbackTransforms(validatedTokens);
    }

    const tempDir = path.join(projectRoot, 'temp_sd_output');
    const tempTokenFile = path.join(projectRoot, 'temp_tokens.json');
    const tempConfigFile = path.join(projectRoot, 'temp_sd_config.cjs');

    try {
        // Create temp directory
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Write tokens to temp file
        console.log('  ✓ Writing temporary tokens file...');
        fs.writeFileSync(tempTokenFile, JSON.stringify({
            color: {},
            size: {},
            ...validatedTokens
        }, null, 2));

        // Create Style Dictionary config
        console.log('  ✓ Creating Style Dictionary config...');
        const sdConfig = `
module.exports = {
    source: ['${tempTokenFile}'],
    platforms: {
        css: {
            transformGroup: 'css',
            buildPath: '${tempDir}/',
            files: [{
                destination: 'css/variables.css',
                format: 'css/variables',
                options: {
                    outputReferences: true
                }
            }]
        },
        json: {
            buildPath: '${tempDir}/',
            files: [{
                destination: 'json/tokens.json',
                format: 'json/nested'
            }]
        }
    }
};`;
        fs.writeFileSync(tempConfigFile, sdConfig);

        // Run Style Dictionary
        console.log('  ✓ Running Style Dictionary...');
        execSync(`node node_modules/style-dictionary/bin/style-dictionary build --config ${tempConfigFile}`, {
            cwd: projectRoot,
            stdio: 'inherit'
        });

        // Read outputs
        console.log('  ✓ Reading processed outputs...');
        const cssOutput = fs.readFileSync(path.join(tempDir, 'css/variables.css'), 'utf8');
        const jsonOutput = fs.readFileSync(path.join(tempDir, 'json/tokens.json'), 'utf8');

        console.log('✨ Style Dictionary processing complete');
        
        return {
            css: cssOutput,
            json: jsonOutput,
            success: true
        };

    } catch (error) {
        console.error('❌ Style Dictionary processing failed:', error.message);
        return getFallbackTransforms(validatedTokens);
    } finally {
        // Cleanup temp files
        try {
            if (fs.existsSync(tempTokenFile)) fs.unlinkSync(tempTokenFile);
            if (fs.existsSync(tempConfigFile)) fs.unlinkSync(tempConfigFile);
            if (fs.existsSync(tempDir)) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
    }
}

// Test the integration if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const testTokens = {
        'primary-color': '#007bff',
        'secondary-color': '#6c757d',
        'font-size-base': '16px',
        'spacing-unit': '8px'
    };

    integrateStyleDictionary(testTokens)
        .then(result => {
            console.log('✅ Style Dictionary integration test complete');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Style Dictionary integration test failed:', error);
            process.exit(1);
        });
}