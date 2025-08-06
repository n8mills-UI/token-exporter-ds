// Shared template functions for Token Exporter
// Ensures identical HTML generation between plugin and guide

// Note: This uses vanilla JavaScript with no optional chaining
// to maintain Figma compatibility

const templates = {
  // Advanced Options Card Template (formerly Filters)
  filtersCard: function(options) {
    const defaults = {
      collections: [],
      showHeader: true,
      isCollapsed: true
    };
    
    // Merge options with defaults (no spread operator for Figma)
    const config = {};
    for (const key in defaults) {
      config[key] = options && options[key] !== undefined ? options[key] : defaults[key];
    }
    
    const headerHTML = config.showHeader ? 
      '<div style="display: flex; align-items: center; gap: var(--size-2); margin-bottom: var(--size-3);">' +
        '<i data-icon="sliders-horizontal" style="width: 1em; height: 1em;"></i>' +
        '<h4 class="text-label">Advanced Options</h4>' +
      '</div>' : '';
    
    const collectionItemsHTML = config.collections.map(function(collection) {
      const isSelected = collection.selected ? 'selected' : '';
      
      const badgesHTML = collection.badges.map(function(badge) {
        return '<span class="badge small ' + badge.color + '">' +
          '<span class="icon" data-icon="' + badge.icon + '"></span> ' + badge.count +
        '</span>';
      }).join('');
      
      return '<div class="collection-item ' + isSelected + '">' +
        '<div class="collection-checkbox"></div>' +
        '<div class="collection-info">' +
          '<div class="text-body-lg collection-name">' + collection.name + '</div>' +
          '<div class="collection-pills">' + badgesHTML + '</div>' +
        '</div>' +
        '<div class="text-caption collection-count">' + collection.total + ' tokens</div>' +
      '</div>';
    }).join('');
    
    return '<div class="card filter-section is-compact">' +
      '<div class="card-content">' +
        headerHTML +
        '<div class="collection-list">' +
          collectionItemsHTML +
        '</div>' +
      '</div>' +
    '</div>';
  },

  // Progress Animation Template
  progressBar: function(progress, stage) {
    return '<div class="progress-container">' +
      '<div class="progress-bar" style="width: ' + progress + '%"></div>' +
      '<div class="progress-stage">' + stage + '</div>' +
    '</div>';
  },

  // Progress Flow Demo Template
  progressFlowDemo: function(options) {
    const defaults = {
      idPrefix: 'guide'
    };
    
    const config = {};
    for (const key in defaults) {
      config[key] = options && options[key] !== undefined ? options[key] : defaults[key];
    }
    
    return '<div class="te-progress-loader" id="' + config.idPrefix + 'ProgressLoader">' +
      '<div class="te-icon-grid" id="' + config.idPrefix + 'IconGrid"></div>' +
      '<div class="te-celebration" id="' + config.idPrefix + 'Celebration"></div>' +
      '<div class="te-glass-status surface-glass" id="' + config.idPrefix + 'GlassStatus">' +
        '<p class="te-progress-percent glass-text-primary" id="' + config.idPrefix + 'ProgressPercent">0%</p>' +
        '<div class="te-progress-track progress-track">' +
          '<div class="te-progress-fill" id="' + config.idPrefix + 'ProgressFill"></div>' +
        '</div>' +
        '<p class="te-status-label glass-text-muted" id="' + config.idPrefix + 'StatusLabel">Ready to export</p>' +
      '</div>' +
    '</div>';
  },

  // Quick Export Card Template
  quickExportCard: function(options) {
    const defaults = {
      formats: [
        { value: 'css', label: 'CSS Variables' },
        { value: 'swift', label: 'Swift (iOS)' },
        { value: 'android', label: 'Android XML' },
        { value: 'flutter', label: 'Flutter' },
        { value: 'w3c', label: 'JSON (W3C)' },
        { value: 'tailwind', label: 'Tailwind Config' }
      ],
      showFiltersButton: true
    };
    
    const config = {};
    for (const key in defaults) {
      config[key] = options && options[key] !== undefined ? options[key] : defaults[key];
    }
    
    const formatOptionsHTML = config.formats.map(function(format) {
      return '<label class="format-option">' +
        '<input type="checkbox" value="' + format.value + '" class="format-checkbox">' +
        '<span>' + format.label + '</span>' +
      '</label>';
    }).join('');
    
    const filtersButton = config.showFiltersButton ?
      '<button class="btn btn-secondary btn-sm" id="toggle-advanced-mode" aria-label="Show advanced options" style="width: 100%;">' +
        '<i data-icon="sliders-horizontal"></i>' +
        '<span>Advanced Options</span>' +
      '</button>' : '';
    
    return '<div class="card export-section has-inner-structure">' +
      '<div class="card-content">' +
        '<div style="display: flex; align-items: center; gap: var(--size-2); margin-bottom: var(--size-2);">' +
          '<i data-icon="file-text" style="width: 1em; height: 1em;"></i>' +
          '<h4 class="text-label">Quick Export</h4>' +
        '</div>' +
        '<div class="format-select-wrapper">' +
          '<div class="format-select-container" id="format-select-container">' +
            '<button class="format-select-trigger" id="format-select-trigger" aria-expanded="false" aria-haspopup="true">' +
              '<span id="format-select-label">All Formats</span>' +
              '<i data-icon="chevron-down" class="icon-xs"></i>' +
            '</button>' +
            '<div class="format-select-dropdown" id="format-select-dropdown" hidden>' +
              formatOptionsHTML +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display: flex; flex-direction: column; gap: var(--size-1); margin-top: var(--size-1);">' +
          '<button class="btn btn-primary btn-sm" id="export-btn" aria-label="Export design tokens" style="width: 100%;">' +
            '<i data-icon="rocket"></i>' +
            '<span>Package Tokens</span>' +
          '</button>' +
          filtersButton +
        '</div>' +
      '</div>' +
    '</div>';
  },

  // Theme Toggle Template
  themeToggle: function(options) {
    const defaults = {
      ariaLabel: 'Toggle theme'
    };
    
    const config = {};
    for (const key in defaults) {
      config[key] = options && options[key] !== undefined ? options[key] : defaults[key];
    }
    
    return '<button class="theme-toggle" data-theme-toggle aria-label="' + config.ariaLabel + '">' +
      '<div class="sun-container icon-container">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">' +
          '<circle cx="12" cy="12" r="5"></circle>' +
          '<line x1="12" y1="1" x2="12" y2="3"></line>' +
          '<line x1="12" y1="21" x2="12" y2="23"></line>' +
          '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>' +
          '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>' +
          '<line x1="1" y1="12" x2="3" y2="12"></line>' +
          '<line x1="21" y1="12" x2="23" y2="12"></line>' +
          '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>' +
          '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>' +
        '</svg>' +
      '</div>' +
      '<div class="moon-container icon-container">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">' +
          '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>' +
        '</svg>' +
      '</div>' +
      '<div class="slider"></div>' +
    '</button>';
  },

  // Stats Container Template
  statsContainer: function(options) {
    const defaults = {
      stats: [
        { icon: 'package', value: 6, suffix: '', label: 'Export Formats' },
        { icon: 'atom', value: 435, suffix: 'plus', label: 'Design Tokens' },
        { icon: 'zap', value: 100, suffix: 'percent', label: 'Automated' },
        { icon: 'clock', value: 10, suffix: 'times', label: 'Faster Export' }
      ]
    };
    
    const config = {};
    for (const key in defaults) {
      config[key] = options && options[key] !== undefined ? options[key] : defaults[key];
    }
    
    const statsHTML = config.stats.map(function(stat) {
      const suffixClass = stat.suffix ? ' stat-suffix--' + stat.suffix : '';
      const suffixHTML = stat.suffix ? '<span class="stat-suffix' + suffixClass + '">' + 
        (stat.suffix === 'plus' ? '+' : stat.suffix === 'percent' ? '%' : stat.suffix === 'times' ? '×' : '') + 
        '</span>' : '';
      
      return '<div class="stat-item">' +
        '<span class="icon stat-icon" data-icon="' + stat.icon + '"></span>' +
        '<div class="stat-number text-gradient-brand">' +
          '<span class="stat-value" data-target="' + stat.value + '">0</span>' +
          suffixHTML +
        '</div>' +
        '<div class="stat-label">' + stat.label + '</div>' +
      '</div>';
    }).join('');
    
    return '<div class="stats-container-glass surface-glass">' +
      statsHTML +
    '</div>';
  },

  // Empty State Template
  emptyState: function(options) {
    const defaults = {
      title: 'Let\'s build!',
      subtitle: 'Create a variable collection in Figma to get started.',
      categories: [
        { icon: 'palette', color: 'cyan', label: 'color' },
        { icon: 'type', color: 'purple', label: 'text' },
        { icon: 'hash', color: 'orange', label: 'number' },
        { icon: 'toggle-right', color: 'pink', label: 'states' }
      ],
      learnMoreUrl: 'https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma',
      learnMoreText: 'Learn about Variables'
    };
    
    const config = {};
    for (const key in defaults) {
      config[key] = options && options[key] !== undefined ? options[key] : defaults[key];
    }
    
    const categoriesHTML = config.categories.map(function(category) {
      return '<div class="empty-state-category">' +
        '<span class="icon category-icon-' + category.color + '" data-icon="' + category.icon + '"></span>' +
        '<span class="text-label">' + category.label + '</span>' +
      '</div>';
    }).join('');
    
    return '<div class="card empty-state" id="empty-state">' +
      '<div class="flex flex-col items-center gap-1">' +
        '<div class="empty-state-icon">' +
          '<div class="token-exporter-logo large">' +
            '<svg viewBox="0 0 355 355" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<g clip-path="url(#clip0_empty_logo_refactor)">' +
                '<path d="M0 0H355V355H0V0Z" fill="url(#paint0_linear_empty_logo_refactor)"/>' +
                '<circle cx="133.5" cy="177.5" r="99.5" fill="black" fill-opacity="0.42"/>' +
                '<path d="M178 88.4824C210.612 104.817 233 138.543 233 177.5C233 216.456 210.611 250.182 178 266.517C145.389 250.182 123 216.456 123 177.5C123 138.543 145.388 104.817 178 88.4824Z" fill="black"/>' +
                '<circle cx="222.5" cy="177.5" r="99.5" fill="black" fill-opacity="0.42"/>' +
              '</g>' +
              '<defs>' +
                '<linearGradient id="paint0_linear_empty_logo_refactor" x1="177.5" y1="0" x2="177.5" y2="355" gradientUnits="userSpaceOnUse">' +
                  '<stop stop-color="#D2FF37"/>' +
                  '<stop offset="1" stop-color="#EEFF00"/>' +
                '</linearGradient>' +
                '<clipPath id="clip0_empty_logo_refactor">' +
                  '<rect width="355" height="355" rx="58" fill="white"/>' +
                '</clipPath>' +
              '</defs>' +
            '</svg>' +
          '</div>' +
        '</div>' +
        '<div class="flex flex-col items-center gap-1">' +
          '<div class="text-heading-lg empty-state-title">' + config.title + '</div>' +
          '<div class="text-body-md empty-state-subtitle">' + config.subtitle + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="empty-state-categories">' +
        categoriesHTML +
      '</div>' +
      '<a href="' + config.learnMoreUrl + '" class="btn btn-primary btn-sm btn-inline" target="_blank" rel="noopener noreferrer" aria-label="Learn about Variables in Figma">' +
        config.learnMoreText + ' <span class="icon" data-icon="external-link"></span>' +
      '</a>' +
    '</div>';
  }
};

// Export for ES modules
export { templates };

// Also add to window for browser usage
if (typeof window !== 'undefined') {
  window.templates = templates;
}
