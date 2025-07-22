# Token Exporter for Figma

![Token Exporter Hero Image](https://res.cloudinary.com/dbmvymdp1/image/upload/v1752106527/Figma_01_sk7ne5.png)

> A simple, powerful Figma plugin to transform your design variables into production-ready code with one click. It's a zero-config alternative to Style Dictionary, designed to make your design-to-development workflow seamless, fast, and error-free.

<br>

## 🚀 Quick Start

This project has two key parts: the Figma plugin and its live design system.

*   **Get the Plugin**: Install the Token Exporter directly from the Figma Community to start exporting your design tokens.
*   **View the Live Design System**: Explore the complete component library and design tokens that power the plugin.

[![Figma](https://img.shields.io/badge/Install_on_Figma-e8ff0c?style=for-the-badge&logo=figma&logoColor=black)](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
[![Live Design System](https://img.shields.io/badge/Live_Design_System-e8ff0c?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxwYXRoIGQ9Ik0xNCAySDRjLTEuMSAwLTIgLjktMiAydjE2YzAgMS4xLjkgMiAyIDJoMTZjMS4xIDAgMi0uOSAyLTJWOEwtNi02em0yIDE2SDh2LTJoOHYyem0wLTRIOHYtMmg4djJ6bS00LTRIOHYtMmg0djJ6Ii8+PC9zdmc+&logoColor=black)](https://n8mills-ui.github.io/token-exporter-ds/docs/design-system-guide.html)

### About the Creator

This project was created by **Nate Mills**, a UI Designer with 20 years of experience building scalable and accessible design systems.

[![See My Portfolio](https://img.shields.io/badge/See_My_Portfolio-e8ff0c?style=for-the-badge&logoColor=black)](https://natemills.me)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/millsdesign/)

<br>

---

<br>

## 📖 Table of Contents

1.  [🎯 The Problem It Solves](#-the-problem-it-solves)
2.  [✨ Key Features](#-key-features)
3.  [⚙️ How It Works](#️-how-it-works)
4.  [🛠️ Development Workflow](#️-development-workflow)
5.  [📂 Project Structure](#-project-structure)
6.  [🍴 Running Your Own Fork](#-running-your-own-fork)
7.  [🤝 Contributing](#-contributing)
8.  [💬 Support](#-support)
9.  [📜 License](#-license)

<br>

---

<br>

## 🎯 The Problem It Solves

Manual token exporting from Figma is slow, error-prone, and creates a disconnect between design and development. Existing tools often lack the flexibility to export for multiple platforms natively. This plugin solves that problem by providing a fast, automated, and multi-format export pipeline.

<br>

---

<br>

## ✨ Key Features

-   **Multi-Platform Token Export**
    Natively export your tokens to 6 different formats:
    -   **CSS** (W3C Custom Properties)
    -   **Swift** (for iOS)
    -   **Android** (XML Resources)
    -   **Flutter** (Dart)
    -   **JSON** (W3C Design Token Standard)
    -   **Tailwind CSS** (Theme Configuration)

-   **Accessibility Features**
    ARIA labels, semantic HTML, keyboard navigation, and screen reader support for key interactions.

-   **Intelligent Alias Resolution**
    Resolves deeply nested aliases to final values and avoids infinite loops.

-   **Platform-Native Name Sanitization**
    Converts names like `Spacing/5 (20px)` to `--spacing-5`, `spacing5`, or `spacing_5`.

-   **Context-Aware Unit Handling**
    Appends `px` to numeric values except for unitless types like `line-height`.

<br>

---

<br>

## ⚙️ How It Works

1.  **Organize Your Variables**: Use Figma variable collections for your tokens.
2.  **Launch the Plugin**: It auto-detects your collections.
3.  **Filter & Select**: Choose which token types and collections you want to export.
4.  **Choose Formats**: Select one or more export formats from the dropdown.
5.  **Generate Tokens**: Click "Export Tokens" and download the results.

<br>

---

<br>

## 🛠️ Development Workflow

This project uses a fully automated, component-based architecture. A single build script (`npm run sync`) compiles all source files (CSS and HTML partials) into final, production-ready assets. This creates a **Single Source of Truth** for both styles and component structure, eliminating manual syncing and ensuring the plugin UI and the design system guide are always identical.

### The Golden Workflow

1.  **✍️ Edit Source Files**:
    -   For **styles**, edit `docs/design-system.css`.
    -   For **shared HTML components**, edit the relevant partial in `src/components/`.
    -   For **page structure**, edit the `*.template.html` files.
2.  **🔄 Run the Build Script**: In your terminal, run the single command:
    ```bash
    npm run sync
    ```
    _Note: This now automatically runs Figma compatibility checking before building to prevent deployment of incompatible code._
3.  **👀 Review the Output**:
    -   Refresh the **generated** `docs/design-system-guide.html` in your browser for a pixel-perfect preview.
    -   Reload the plugin in Figma for final verification.

### 🔍 Figma Compatibility Checking

Our build process includes automatic compatibility validation to prevent Figma plugin errors:

-   **Automatic Validation**: `npm run sync` now runs `figma-check` first to catch compatibility issues
-   **Manual Check**: Run `npm run figma-check` independently to validate specific files
-   **Common Issues Detected**: 
    -   Optional chaining syntax (`?.`) that causes "Unexpected token" errors
    -   Catch blocks without parameters that aren't supported
    -   Template literals and other modern syntax incompatible with Figma's environment
-   **Safety First**: Build process stops if compatibility issues are found, preventing broken deployments

### ♿ Accessibility Testing

The design system includes built-in accessibility validation:

-   **Guide Layout Page**: Open `docs/guide-layout.html` to view the system truth source with integrated accessibility testing
-   **WCAG AA Compliance**: Automatically checks color contrast ratios for text and background combinations
-   **Interactive Testing**: Use the built-in buttons to check accessibility, highlight violations, and test design token combinations
-   **Console Helpers**: The accessibility checker provides console commands:
    -   `checkA11y()` - Run accessibility scan and get detailed report
    -   `highlightA11y()` - Visually highlight accessibility violations
    -   `clearA11y()` - Clear violation highlights
    -   `testTokens()` - Test all design token color combinations

### ⚠️ Important Constraints

-   **Figma CSP Restrictions**: The Figma plugin environment blocks external CSS `@import` rules. Our build script solves this by automatically fetching and bundling all remote stylesheets into the final `ui.html`.
-   **Figma JavaScript Environment**: Figma has specific JavaScript limitations. Always run `figma-check` before testing to catch compatibility issues early.
-   **Source vs. Output**: **Never edit `.html` files directly.** They are generated build artifacts. Only edit `.template.html` and component partial files.

### ✨ Enhanced Experience Features

**Interactive Terminal Profile Card**: The design system now includes an enhanced creator profile with:
-   **ASCII Art Headers**: Epic "TOKEN EXPORTER" and "NATE MILLS" block letter displays
-   **Live Code Animation**: Interactive terminal showing creator profile as JavaScript with syntax highlighting  
-   **Glitch Effects**: Professional terminal interface with auto-glitch animations
-   **Re-run Functionality**: Interactive "[RE-RUN]" button to restart typing animations
-   **Responsive Design**: Optimized for both desktop and mobile viewing

**Consolidated Icon System**: A modern, maintainable icon architecture with:
-   **Single Source of Truth**: All 60+ icons centralized in `_icon-system.html`
-   **No Conflicts**: Eliminated duplicate definitions and load order issues
-   **Data-Driven Rendering**: Uses `data-icon` attributes with `window.renderPluginIcons()`
-   **CSS Design Tokens**: Icon sizing controlled via `--icon-xs` through `--icon-xl` tokens
-   **Performance Optimized**: Reduced bundle size by removing redundant SVG code

<br>

---

<br>

## 📂 Project Structure

The project is organized into source files and build artifacts.
```text
token-exporter-ds/
├── docs/
│ ├── design-system.css # ✅ EDIT THIS - Source of truth for all styles.
│ ├── design-system-guide.template.html # ✅ EDIT THIS - Blueprint for the live guide.
│ ├── design-system-guide.html # ❌ DO NOT EDIT - Generated by script.
│ ├── guide-layout.html # System truth source with accessibility checking
│ └── guide-layout.css # Styling for guide layout demo page
│
├── src/
│ ├── components/
│ │ ├── _*.html # ✅ EDIT THIS - Reusable HTML components.
│ │ └── icons/
│ │     └── _icon-system.html # ✅ EDIT THIS - Consolidated icon system (60+ icons)
│ │
│ ├── ui.template.html # ✅ EDIT THIS - Blueprint for the plugin UI body.
│ ├── ui.html # ❌ DO NOT EDIT - Generated by script.
│ └── code.js # ✅ EDIT THIS - Plugin logic.
│
├── scripts/
│ ├── sync.sh # The master build script
│ ├── figma-compat-check.js # Figma compatibility validator
│ ├── fix-template-literals.js # Template literal fixer
│ └── accessibility-checker.js # WCAG AA contrast validation tool
│
├── _sandbox/ # Personal testing files (ignored by git)
├── .gitignore
├── CLAUDE.md # Project instructions for Claude Code
├── LICENSE
├── manifest.json
├── package-lock.json
├── package.json
└── README.md # This file.
```

### 📝 File Details

- **`design-system.css`**: Edit all styles here. Hosted on GitHub, served via jsDelivr CDN. Now includes guide layout specifications.
- **`docs/design-system-guide.html`**: Documentation site. Links to external CSS.
- **`docs/guide-layout.html`**: System truth source for all layout standards with integrated accessibility testing.
- **`scripts/accessibility-checker.js`**: Lightweight WCAG AA contrast validation tool for design system compliance.
- **`src/ui.html`**: Plugin interface. Uses inline CSS due to Figma's security restrictions.
- **`manifest.json`**: Defines allowed domains for the plugin (cdnjs, jsdelivr, etc.)

<br>

---

<br>

## 🍴 Running Your Own Fork

1.  **Fork & Clone** the repository.
2.  **Install Dependencies**: Run `npm install` to set up the project.
3.  **Run the Initial Build**: Run `npm run sync` to generate the initial HTML files.
4.  **Import into Figma**:
    -   Open the Figma Desktop app.
    -   Go to `Plugins` > `Development` > `Import plugin from manifest...`
    -   Select the local `manifest.json` file from this project.
5.  **Development Workflow**:
    -   Edit the source files (`.css`, `.template.html`, `_*.html`, `code.js`).
    -   Run `npm run figma-check` to validate Figma compatibility (optional - automatically runs with sync).
    -   Run `npm run sync` to build your changes.
    -   Reload the plugin in Figma to test.

### Available Scripts

-   `npm start` - Alias for `npm run dev` (watch mode)
-   `npm run sync` - Main build command (includes figma-check validation)
-   `npm run dev` - Watch mode that auto-rebuilds when source files change  
-   `npm run build` - Alias for `npm run sync`
-   `npm run figma-check` - Validate code for Figma plugin compatibility issues
-   `npm run test` - Run figma-check and JavaScript linting together
-   `npm run lint:js` - Lint JavaScript files using ESLint (uses legacy flat config)
-   `npm run format` - Auto-fix CSS formatting issues with stylelint
-   `npm run sync:skip-checks` - Build without compatibility checking (not recommended)
-   `npm run clean` - Remove backup files (ui.html.backup)


<br>

---

<br>

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1.  **CSS First**: All style changes must start in `docs/design-system.css`.
2.  **Test Thoroughly**: Verify changes work in both the guide and the plugin.
3.  **Follow Conventions**: Use existing naming patterns and token structure.
4.  **Document Changes**: Update comments in CSS for significant changes.

For major changes, please open an issue first to discuss what you would like to change.

<br>

---

<br>

## 💬 Support

-   **Issues**: [GitHub Issues](https://github.com/n8mills-UI/token-exporter-ds/issues)
-   **Plugin Support**: [Figma Community](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
-   **Portfolio**: [natemills.me](https://natemills.me)

<br>

---

<br>

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.





```

████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗     ███████╗██╗  ██╗██████╗  
╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║     ██╔════╝╚██╗██╔╝██╔══██╗
   ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║     █████╗   ╚███╔╝ ██████╔╝
   ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║     ██╔══╝   ██╔██╗ ██╔═══╝ 
   ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║     ███████╗██╔╝ ██╗██║       ██╗
   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝     ╚══════╝╚═╝  ╚═╝╚═╝       ╚═╝

==============================================================================

   [STATUS: ONLINE] : [PROJECT: TOKEN EXPORTER] : [ARCHITECT: NATE MILLS]

==============================================================================

███╗   ██╗ █████╗ ████████╗███████╗     ███╗   ███╗██╗██╗     ██╗     ███████╗
████╗  ██║██╔══██╗╚══██╔══╝██╔════╝     ████╗ ████║██║██║     ██║     ██╔════╝
██╔██╗ ██║███████║   ██║   █████╗       ██╔████╔██║██║██║     ██║     ███████╗
██║╚██╗██║██╔══██║   ██║   ██╔══╝       ██║╚██╔╝██║██║██║     ██║     ╚════██║
██║ ╚████║██║  ██║   ██║   ███████╗     ██║ ╚═╝ ██║██║███████╗███████╗███████║
╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝   ╚══════╝     ╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚══════╝

┌─[ PURPOSE & MISSION ]──────────────────────────────────────────────────────┐
│                                                                            │
│ Building bridges between design and development through Token Exporter—    │
│ a plugin that transforms Figma variables into production-ready code for    │
│ 6 platforms: CSS, Swift, Android, Flutter, JSON, and Tailwind.             │
│                                                                            │
│ 20+ years crafting scalable design systems that empower teams to ship      │
│ consistent, accessible experiences faster.                                 │
│                                                                            │
│ One click. Six platforms. Zero inconsistencies.                            │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌─[ ACTIVE PROJECTS ]────────────────────────────────────────────────────────┐
│                                                                            │
│  Token Exporter Plugin ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ACTIVE   │
│  Design System Architecture ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ONGOING   │
│  Multi-Platform Token Generation ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ COMPLETE   │
│  Developer Experience Tools ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ EVOLVING   │
│  AI-Enhanced Design Workflows ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RESEARCH     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
