// Shared data for template functions
// Example data that can be used in both plugin and guide contexts

const sampleData = {
  // Sample collections for filters card
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
      name: 'Typography', 
      selected: true,
      badges: [
        { color: 'purple', icon: 'type', count: 24 },
        { color: 'orange', icon: 'hash', count: 8 }
      ],
      total: 32
    },
    {
      name: 'Spacing',
      selected: false,
      badges: [
        { color: 'orange', icon: 'hash', count: 16 }
      ],
      total: 16
    },
    {
      name: 'Effects',
      selected: false,
      badges: [
        { color: 'cyan', icon: 'palette', count: 8 },
        { color: 'orange', icon: 'hash', count: 4 }
      ],
      total: 12
    },
    {
      name: 'Borders & Radii',
      selected: true,
      badges: [
        { color: 'orange', icon: 'hash', count: 10 }
      ],
      total: 10
    }
  ],

  // Sample stats for stats container
  stats: [
    { icon: 'package', value: 6, suffix: '', label: 'Export Platforms' },
    { icon: 'zap', value: 1, suffix: '', label: 'Click Export' },
    { icon: 'shield-check', value: 100, suffix: 'percent', label: 'Style Dictionary Valid' },
    { icon: 'clock', value: 60, suffix: 's', label: 'Export Time' }
  ],

  // Sample export formats for quick export card
  exportFormats: [
    { value: 'css', label: 'CSS Variables' },
    { value: 'swift', label: 'Swift (iOS)' },
    { value: 'android', label: 'Android XML' },
    { value: 'flutter', label: 'Flutter' },
    { value: 'w3c', label: 'JSON (W3C)' },
    { value: 'tailwind', label: 'Tailwind Config' }
  ]
};

// Export for ES modules
export { sampleData };

// Also add to window for browser usage
if (typeof window !== 'undefined') {
  window.sampleData = sampleData;
}
