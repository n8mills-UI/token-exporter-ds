/**
 * Jest Test Setup
 * 
 * Configures the testing environment for validation flow tests
 * with Figma compatibility and performance monitoring.
 */

// Mock Figma environment globals
global.parent = {
    postMessage: jest.fn()
};

// Mock performance API with proper jest functions
global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => [])
};

// Ensure performance methods are properly mocked
Object.defineProperty(global, 'performance', {
    value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: jest.fn(() => []),
        getEntriesByName: jest.fn(() => [])
    },
    writable: true
});

// Mock requestAnimationFrame/cancelAnimationFrame
let rafId = 0;
global.requestAnimationFrame = jest.fn((callback) => {
    setTimeout(callback, 16); // ~60fps
    return ++rafId;
});

global.cancelAnimationFrame = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

// Mock URL API
global.URL = {
    createObjectURL: jest.fn(() => 'mock-url'),
    revokeObjectURL: jest.fn()
};

// Mock Blob
global.Blob = jest.fn(() => ({}));

// Mock JSZip for file bundling tests
global.JSZip = jest.fn(() => ({
    file: jest.fn(),
    generateAsync: jest.fn().mockResolvedValue(new Blob())
}));

// Figma compatibility helpers
global.figmaAssert = {
    noOptionalChaining: (code) => {
        expect(code).not.toMatch(/\?\./g);
        expect(code).not.toMatch(/\?\[/g);
    },
    
    noTemplateLiterals: (code) => {
        expect(code).not.toMatch(/`[^`]*\$\{[^}]*\}[^`]*`/g);
    },
    
    noDestructuring: (code) => {
        expect(code).not.toMatch(/function[^(]*\(\s*\{[^}]*\}\s*\)/g);
        expect(code).not.toMatch(/\(\s*\{[^}]*\}\s*\)\s*=>/g);
    },
    
    noNullishCoalescing: (code) => {
        expect(code).not.toMatch(/\?\?/g);
    }
};

// Performance testing helpers
global.performanceAssert = {
    withinBudget: (duration, budget) => {
        expect(duration).toBeLessThan(budget);
    },
    
    maintainsFps: (frameTimes, targetFps = 60) => {
        const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
        const actualFps = 1000 / avgFrameTime;
        expect(actualFps).toBeGreaterThan(targetFps * 0.9); // Allow 10% variance
    }
};

// Accessibility testing helpers
global.a11yAssert = {
    hasAriaLabel: (element) => {
        expect(element.getAttribute('aria-label')).toBeTruthy();
    },
    
    hasRole: (element, role) => {
        expect(element.getAttribute('role')).toBe(role);
    },
    
    isFocusable: (element) => {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            'a[href]'
        ];
        
        const isFocusable = focusableSelectors.some(selector => 
            element.matches && element.matches(selector)
        );
        
        expect(isFocusable).toBe(true);
    }
};

// Console spy setup
beforeEach(() => {
    // Suppress console logs in tests unless debugging
    if (!process.env.DEBUG_TESTS) {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    }
});

afterEach(() => {
    // Restore console
    if (console.log.mockRestore) {
        console.log.mockRestore();
        console.warn.mockRestore();
        console.error.mockRestore();
    }
    
    // Clear all timers
    jest.clearAllTimers();
    
    // Clear all mocks
    jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000);

// Unhandled promise rejection detection
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    throw reason;
});