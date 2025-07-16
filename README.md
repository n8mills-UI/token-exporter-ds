# Token Exporter for Figma

![Token Exporter Hero Image](https://res.cloudinary.com/dbmvymdp1/image/upload/v1752106527/Figma_01_sk7ne5.png)

> A simple, powerful Figma plugin to transform your design variables into production-ready code with one click. It's a zero-config alternative to Style Dictionary, designed to make your design-to-development workflow seamless, fast, and error-free.

<br>

[![Figma](https://img.shields.io/badge/Install_on_Figma-e8ff0c?style=for-the-badge&logo=figma&logoColor=black)](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
[![Live Design System](https://img.shields.io/badge/Live_Design_System-e8ff0c?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxwYXRoIGQ9Ik0xNCAySDRjLTEuMSAwLTIgLjktMiAydjE2YzAgMS4xLjkgMiAyIDJoMTZjMS4xIDAgMi0uOSAyLTJWOGwtNi02em0yIDE2SDh2LTJoOHYyem0wLTRIOHYtMmg4djJ6bS00LTRIOHYtMmg0djJ6Ii8+PC9zdmc+&logoColor=black)](https://n8mills-ui.github.io/token-exporter-ds/docs/design-system-guide.html)
[![See My Portfolio](https://img.shields.io/badge/See_My_Portfolio-e8ff0c?style=for-the-badge&logoColor=black)](https://natemills.me)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/millsdesign/)


This project was created by [Nate Mills](https://natemills.me) to solve a common workflow problem for design and development teams.

---



<br>

## Table of Contents

1. [🚨 The Problem It Solves](#-the-problem-it-solves)
2. [🚀 Key Features](#-key-features)
3. [⚙️ How It Works](#️-how-it-works)
4. [🛠 Built With](#-built-with)
5. [👨‍💻 Development Workflow](#-development-workflow)
6. [📁 Project Structure](#-project-structure)
7. [🍴 Running Your Own Fork](#-running-your-own-fork)
8. [📄 License](#-license)


<br>

## 🚨 The Problem It Solves

Manual token exporting from Figma is slow, error-prone, and creates a disconnect between design and development. Existing tools often lack the flexibility to export for multiple platforms natively. This plugin solves that problem by providing a fast, automated, and multi-format export pipeline.

<br>

## 🚀 Key Features

- **Multi-Platform Token Export**  
  Natively export your tokens to 6 different formats:
  - **CSS** (W3C Custom Properties)
  - **Swift** (for iOS)
  - **Android** (XML Resources)
  - **Flutter** (Dart)
  - **JSON** (W3C Design Token Standard)
  - **Tailwind CSS** (Theme Configuration)

- **Intelligent Alias Resolution**  
  Resolves deeply nested aliases to final values and avoids infinite loops.

- **Platform-Native Name Sanitization**  
  Converts names like `Spacing/5 (20px)` to `--spacing-5`, `spacing5`, `spacing_5`.

- **Context-Aware Unit Handling**  
  Appends `px` to numeric values except for unitless types like `line-height`.

<br>

## ⚙️ How It Works

1. **Organize Your Variables**  
   Use Figma variable collections for your tokens.

2. **Launch the Plugin**  
   It auto-detects your collections.

3. **Filter Token Types**  
   Choose token types: Colors, Numbers, States, Text.

4. **Select Collections**  
   Pick the variable collections you want to export.

5. **Choose Formats**  
   Select one or more export formats from the dropdown.

6. **Generate Tokens**  
   Click **Package Tokens** and download the results.

<br>

[![Install Token Exporter on Figma](https://img.shields.io/badge/Install_Token_Exporter_on_Figma-black?style=for-the-badge&logo=figma&logoColor=white)](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)



<br>

## 🛠 Built With

<p>
  <a href="https://www.figma.com/plugin-docs/api/api-overview/"><img src="https://img.shields.io/badge/Figma_Plugin_API-000000?style=for-the-badge&logo=figma&logoColor=white" alt="Figma Plugin API"></a>&nbsp;
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-000000?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>&nbsp;
  <a href="https://open-props.style/"><img src="https://img.shields.io/badge/Open_Props-000000?style=for-the-badge&logoColor=white" alt="Open Props"></a>&nbsp;
  <a href="https://shoelace.style/"><img src="https://img.shields.io/badge/Shoelace-000000?style=for-the-badge&logoColor=white" alt="Shoelace"></a>&nbsp;
  <a href="https://www.jsdelivr.com/"><img src="https://img.shields.io/badge/jsDelivr-000000?style=for-the-badge&logo=jsdelivr&logoColor=white" alt="jsDelivr"></a>
</p>



<br>

## 👨‍💻 Development Workflow

This project uses a **CSS-first workflow**. All styles originate from a single source of truth (`design-system.css`) and are automatically bundled and synchronized into the plugin UI.

### ⚠️ Important Constraints

- **Figma CSP Restrictions**: The Figma plugin environment blocks external CSS `@import` rules for security. Our build script works around this by automatically bundling these files.
- **File Size Limit**: The `design-system-guide.html` is ~50KB - use `update` commands only, never `rewrite`.
- **CSS Location**: The main CSS file is hosted on GitHub and served via jsDelivr CDN for the live design system guide.

<br>

### 🔧 Prerequisites

1.  Install [Node.js](https://nodejs.org/) (LTS version).
2.  Install `curl` if it's not already on your system (it's pre-installed on macOS and most Linux distributions).
3.  Clone the repository and run `npm install` to install dependencies.

<br>

### ✨ The Golden Workflow

| Step | Action | Purpose |
| :--- | :--- | :--- |
| **1. Edit** | **`design-system.css`** | Single source of truth for all your custom styles. |
| **2. Preview** | **`docs/design-system-guide.html`** | Open this file in a browser for a live preview of your changes. |
| **3. Sync** | **`npm run sync`** | Bundles all CSS and injects it into the plugin's UI file. |
| **4. Verify** | **Reload the plugin** in Figma | Final testing in the actual plugin environment. |

> **🛑 CRITICAL WARNING**
> NEVER edit `src/ui.html` directly! All changes will be overwritten every time you run the sync script.

<br>

### 🔄 The Sync Process

The `npm run sync` command executes the `scripts/sync-css.sh` script, which now performs an automated bundling process:

1.  **Fetches External CSS**: It uses `curl` to download the content of the Shoelace and Open Props stylesheets defined by the `@import` URLs in `design-system.css`.
2.  **Reads Local CSS**: It reads your custom styles from `design-system.css`, ignoring the `@import` rules themselves.
3.  **Bundles Everything**: It combines the fetched external styles and your local styles into a single, temporary CSS bundle.
4.  **Injects into Template**: It creates the final `src/ui.html` by injecting this complete CSS bundle into the `src/ui.template.html` file.

This ensures the final `ui.html` is a self-contained file with no external dependencies, making it fully compliant with Figma's security policies.

<br>

### 🎯 Quick Start Commands

```bash
# One-time setup
npm install

# Daily workflow
npm run sync      # Sync CSS to plugin after making style changes
npm run dev       # (If configured) Watch for changes and sync automatically
npm run clean     # Remove backup files created by the script
```


<br>



## 📁 Project Structure

```text
token-exporter-ds/
├── design-system.css            # ✅ EDIT THIS - Source of truth for all styles
├── docs/
│   └── design-system-guide.html # Live documentation (uses external CSS link)
├── scripts/
│   └── sync-css.sh              # Automation script for CSS injection
├── src/
│   ├── code.js                  # Plugin logic (TypeScript compiled)
│   └── ui.html                  # ❌ DO NOT EDIT - Plugin UI (inline CSS)
├── manifest.json                # Figma plugin configuration
├── package.json                 # NPM scripts and dependencies
├── package-lock.json            # 🔒 AUTO-GENERATED – Do not edit
├── LICENSE                      # ✅ Free to use, modify, and share under the MIT License.
└── README.md                    # This file
```

### 📝 File Details

- **`design-system.css`** (~40KB): Edit all styles here. Hosted on GitHub, served via jsDelivr CDN.
- **`docs/design-system-guide.html`** (~50KB): Documentation site. Links to external CSS.
- **`src/ui.html`** (~15KB): Plugin interface. Uses inline CSS due to Figma's security restrictions.
- **`manifest.json`**: Defines allowed domains for the plugin (cdnjs, jsdelivr, etc.)


<br>

## 🍴 Running Your Own Fork

Want to run your own version or test changes locally?

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/token-exporter-ds.git
   cd token-exporter-ds
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Update Figma Plugin Settings**
   - Open Figma Desktop
   - Go to Plugins → Development → Import plugin from manifest
   - Select your local `manifest.json` file

4. **Make Your Changes**
   - Edit `design-system.css`
   - Run `npm run sync`
   - Test in Figma

5. **Deploy Your Version**
   - Push to your GitHub fork
   - Update the jsDelivr URL in `design-system-guide.html` to point to your repo
   - The guide will now use your CSS version



<br>

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.



<br>

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **CSS First**: All style changes must start in `design-system.css`
2. **Test Thoroughly**: Verify changes work in both the guide and plugin
3. **Follow Conventions**: Use existing naming patterns and token structure
4. **Document Changes**: Update comments in CSS for significant changes

For major changes, please open an issue first to discuss what you would like to change.



<br>

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/n8mills-UI/token-exporter-ds/issues)
- **Plugin Support**: [Figma Community](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
- **Portfolio**: [natemills.me](https://natemills.me)

<br>

---

<br>



```

████████╗ ██████╗ ██╗  ██╗███████╗███╗   ██╗     ███████╗██╗  ██╗██████╗  
╚══██╔══╝██╔═══██╗██║ ██╔╝██╔════╝████╗  ██║     ██╔════╝╚██╗██╔╝██╔══██╗
   ██║   ██║   ██║█████╔╝ █████╗  ██╔██╗ ██║     █████╗   ╚███╔╝ ██████╔╝
   ██║   ██║   ██║██╔═██╗ ██╔══╝  ██║╚██╗██║     ██╔══╝   ██╔██╗ ██╔═══╝ 
   ██║   ╚██████╔╝██║  ██╗███████╗██║ ╚████║     ███████╗██╔╝ ██╗██║       ██╗
   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝     ╚══════╝╚═╝  ╚═╝╚═╝       ╚═╝
==============================================================================
[STATUS: ONLINE] : [PROJECT: TOKEN EXPORTER v4.0.8] : [ARCHITECT: NATE MILLS]
==============================================================================

███╗   ██╗ █████╗ ████████╗███████╗     ███╗   ███╗██╗██╗     ██╗     ███████╗
████╗  ██║██╔══██╗╚══██╔══╝██╔════╝     ████╗ ████║██║██║     ██║     ██╔════╝
██╔██╗ ██║███████║   ██║   █████╗       ██╔████╔██║██║██║     ██║     ███████╗
██║╚██╗██║██╔══██║   ██║   ██╔══╝       ██║╚██╔╝██║██║██║     ██║     ╚════██║
██║ ╚████║██║  ██║   ██║   ███████╗     ██║ ╚═╝ ██║██║███████╗███████╗███████║
╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝   ╚══════╝     ╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚══════╝

┌─[ SYSTEM ANALYSIS ]────────────────────────────────────────────────────────┐
│ [ UID: N8-MILLS ]...................................................[OK]   │
│ [ CLASS: UI/UX ARCHITECT ]..........................................[ACT]  │
│ [ SPECIALIZATION: DESIGN SYSTEMS & FIGMA TOOLING ]..................[INIT] │
│ [ AFFILIATION: BRIDGING DESIGN AND ENGINEERING ]....................[SYNC] │
│ [ EXPERIENCE: 20+ YEARS CRAFTING DIGITAL EXPERIENCES ]..............[LOAD] │
│ [ CURRENT FOCUS: AI-POWERED DESIGN WORKFLOWS ]......................[EXEC] │
└────────────────────────────────────────────────────────────────────────────┘
┌─[ CORE MODULES ]───────────────────────────────────────────────────────────┐
│  Design Systems Architecture ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%  │
│  Component Engineering ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%  │
│  Token Management Systems ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%  │
│  Figma Plugin Development ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%  │
│  AI Integration Protocols ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%  │
└────────────────────────────────────────────────────────────────────────────┘




