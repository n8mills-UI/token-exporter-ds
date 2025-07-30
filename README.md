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
4.  [🏗️ Architectural Overview](#️-architectural-overview)
5.  [🛠️ Development Workflow](#️-development-workflow)
6.  [📂 Project Structure](#-project-structure)
7.  [🍴 Running Your Own Fork](#-running-your-own-fork)
8.  [🤝 Contributing](#-contributing)
9.  [💬 Support](#-support)
10. [📜 License](#-license)

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
    ARIA labels, semantic HTML, keyboard navigation, screen reader support, and `prefers-reduced-motion` support for users with vestibular disorders.

-   **Intelligent Alias Resolution**
    Resolves deeply nested aliases to final values and avoids infinite loops.

-   **Platform-Native Name Sanitization**
    Converts names like `Spacing/5 (20px)` to `--spacing-5`, `spacing5`, or `spacing_5`.

-   **Context-Aware Unit Handling**
    Appends `px` to numeric values except for unitless types like `line-height`.

-   **Performance Optimizations**
    Intersection Observer API for efficient animations, comprehensive performance monitoring, and responsive design optimized for all device sizes.

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

## 🏗️ Architectural Overview

This project follows a simple, streamlined architecture:

*   **Source Files:** Edit these to make changes
    *   `design-system.css` - All styles
    *   `src/components/` - Reusable HTML partials
    *   `*.template.html` - Page templates

*   **Generated Files:** Auto-built, never edit directly
    *   `ui.html`, `design-system-guide.html`

*   **Two Master Scripts:** All functionality in 2 files
    *   `scripts/build.js` - Handles all building and bundling
    *   `scripts/check.js` - Runs all quality checks

<br>

---

<br>

## 🛠️ Development Workflow

Simple, streamlined development with just 2 master scripts. We've simplified from 20+ scripts down to 2 focused tools that handle everything.

### The Golden Workflow

1.  **✍️ Edit Source Files**:
    -   **Styles**: `docs/design-system.css`
    -   **Components**: `src/components/_*.html`
    -   **Templates**: `*.template.html` files
    
2.  **🚀 Build**:
    ```bash
    npm run build    # Build once
    npm run dev      # Watch mode (auto-rebuilds)
    ```
    
3.  **✅ Check Quality**:
    ```bash
    npm run check     # Essential checks (quick ~10s)
    npm run audit     # EVERYTHING - Full system audit with reports
    ```

### 🔍 Quality Assurance

**One command to check everything:**
```bash
npm run audit  # Runs ALL quality checks and generates reports
```

This single command runs:
- ✅ Build verification
- ✅ Code quality checks (Figma compatibility, ESLint, CSS architecture)
- ✅ Semantic token usage validation
- ✅ CSS complexity analysis
- ✅ Accessibility testing
- ✅ Token validation with Style Dictionary
- 📊 Generates visual reports in `reports/` folder

For quick checks during development:
```bash
npm run check  # Just the essentials (~10 seconds)
```

### 🎯 The Audit Command - Your One-Stop Quality Check

Don't remember all the tools? Just run:
```bash
npm run audit
```

This runs **everything** automatically:
- ✅ Builds your project
- ✅ Checks code quality
- ✅ Validates CSS architecture
- ✅ Tests accessibility
- ✅ Analyzes complexity
- 📊 Generates visual reports

Reports are saved to the `reports/` folder with:
- **css-stats.json** - Detailed metrics about your CSS
- **specificity.html** - Visual graph of CSS specificity

### ♿ Accessibility Features

The design system is built with accessibility in mind:

-   **WCAG AA Compliance**: All color combinations and text contrasts meet accessibility standards
-   **Semantic HTML**: Proper heading hierarchy and semantic markup throughout
-   **Keyboard Navigation**: Full keyboard support for all interactive elements
-   **Screen Reader Support**: ARIA labels and live regions for dynamic content
-   **Motion Sensitivity**: `prefers-reduced-motion` media query support to respect users with vestibular disorders by disabling animations when requested


<br>

---

<br>

## 📂 Project Structure

Clean, simple structure with only what matters:
```text
token-exporter-ds/
├── docs/
│   ├── design-system.css               # ✅ EDIT - All styles
│   ├── design-system-guide.template.html # ✅ EDIT - Guide template
│   └── design-system-guide.html        # ❌ Generated - Don't edit
│
├── src/
│   ├── components/                     # ✅ EDIT - HTML partials
│   │   ├── _*.html                     # Reusable components
│   │   └── icons/
│   │       └── _icon-system.html       # 60+ icons
│   ├── code.js                         # ✅ EDIT - Plugin logic
│   ├── ui.template.html                # ✅ EDIT - Plugin UI template
│   └── ui.html                         # ❌ Generated - Don't edit
│
├── vendor/                             # Local dependencies
│   └── open-props/                     # CSS framework files
│
├── scripts/                            # Just 2 master scripts!
│   ├── build.js                        # All build operations
│   └── check.js                        # All quality checks
│
├── manifest.json                       # Figma plugin config
├── package.json                        # 7 simple npm commands
└── CLAUDE.md                           # AI assistant instructions
```


<br>

---

<br>

## 🍴 Running Your Own Fork

1.  **Fork & Clone** the repository.
2.  **Install Dependencies**: Run `npm install` to set up the project.
3.  **Run the Initial Build**: Run `npm run build` to generate the initial HTML files.
4.  **Import into Figma**:
    -   Open the Figma Desktop app.
    -   Go to `Plugins` > `Development` > `Import plugin from manifest...`
    -   Select the local `manifest.json` file from this project.
5.  **Development Workflow**:
    -   Edit source files (CSS, templates, components)
    -   Run `npm run build` to compile changes
    -   Or use `npm run dev` for auto-rebuild on file changes
    -   Reload the plugin in Figma to test

### 🎯 Essential Commands

Just 5 commands to remember:

```bash
npm start         # Start development (watch mode)
npm run build     # Build the project
npm run check     # Quick quality check (~10s)
npm run audit     # Full audit with reports (~60s)
npm run format    # Auto-fix CSS issues
```

**That's it!** The `audit` command runs all the industry-standard tools:
- Wallace (CSS complexity)
- CSS Stats (metrics)
- Pa11y (accessibility)
- Style Dictionary (token validation)
- Plus all our custom checks


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


---



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
