/**
 * Shared Component Configuration
 * Single source of truth for component behavior and constants
 */

// Progress Flow Animation Config
export const PROGRESS_ANIMATION = {
    stages: [
        { percent: 25, label: "Analyzing", duration: 1500 },
        { percent: 50, label: "Packaging", duration: 1200 },
        { percent: 75, label: "Sanitizing", duration: 1300 },
        { percent: 100, label: "Finalizing", duration: 500 }
    ],
    successIcon: 'circle-check-big',
    totalDuration: 5000,
    resetDelay: 2500
};

// Icon System Config
export const ICON_CONFIG = {
    defaultSize: '1em',
    strokeWidth: 2,
    // Map old names to new names for consistency
    aliases: {
        'filters': 'sliders-horizontal',
        'check-circle': 'circle-check-big',
        'alert-circle': 'circle-alert',
        'x-circle': 'circle-x'
    }
};

// Button Config
export const BUTTON_CONFIG = {
    iconElement: 'i', // Use <i> not <span class="icon">
    iconAttribute: 'data-icon',
    sizes: {
        sm: { iconSize: '0.875em', gap: 'var(--size-1)' },
        md: { iconSize: '1em', gap: 'var(--size-2)' },
        lg: { iconSize: '1.125em', gap: 'var(--size-2)' }
    }
};

// Theme Toggle Config
export const THEME_TOGGLE_CONFIG = {
    storageKey: 'theme',
    defaultTheme: 'dark',
    themes: ['light', 'dark']
};