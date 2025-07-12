# Token Exporter for Figma

![Token Exporter Hero Image](https://res.cloudinary.com/dbmvymdp1/image/upload/v1752106527/Figma_01_sk7ne5.png)

> A simple, powerful Figma plugin to transform your design variables into production-ready code with one click. It's a zero-config alternative to Style Dictionary, designed to make your design-to-development workflow seamless, fast, and error-free.

This project was created by [Nate Mills](https://natemills.me) to solve a common workflow problem for design and development teams.

[![Figma](https://img.shields.io/badge/Install_on_Figma-e8ff0c?style=for-the-badge&logo=figma&logoColor=black)](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
[![Live Design System](https://img.shields.io/badge/Live_Design_System-e8ff0c?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxwYXRoIGQ9Ik0xNCAySDRjLTEuMSAwLTIgLjktMiAydjE2YzAgMS4xLjkgMiAyIDJoMTZjMS4xIDAgMi0uOSAyLTJWOGwtNi02em0yIDE2SDh2LTJoOHYyem0wLTRIOHYtMmg4djJ6bS00LTRIOHYtMmg0djJ6Ii8+PC9zdmc+&logoColor=black)](https://n8mills-ui.github.io/token-exporter-ds/docs/design-system-guide.html)
[![See My Portfolio](https://img.shields.io/badge/See_My_Portfolio-e8ff0c?style=for-the-badge&logoColor=black)](https://natemills.me)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/millsdesign/)

<br>

## Table of Contents
1. [The Problem It Solves](#the-problem-it-solves)
2. [Key Features](#key-features)
3. [How It Works](#how-it-works)
4. [Built With](#built-with)
5. [How to Contribute & Development Workflow](#how-to-contribute--development-workflow)
6. [Project Status](#project-status)

---

<br>

## The Problem It Solves

Manual token exporting from Figma is slow, error-prone, and creates a disconnect between design and development. Existing tools often lack the flexibility to export for multiple platforms natively. This plugin solves that problem by providing a fast, automated, and multi-format export pipeline.

<br>

## Key Features

* **Multi-Platform Token Export**
    Natively export your tokens to 6 different formats, ensuring your code speaks the language of every platform:
    * **CSS** (W3C Custom Properties)
    * **Swift** (for iOS)
    * **Android** (XML Resources)
    * **Flutter** (Dart)
    * **JSON** (W3C Design Token Standard)
    * **Tailwind CSS** (Theme Configuration)

* **Intelligent Alias Resolution**
    Accurately resolves deeply nested variable aliases to their final, concrete values while preventing infinite loops.

* **Platform-Native Name Sanitization**
    Automatically converts your Figma variable names (e.g., `Spacing/5 (20px)`) into the correct format for each target platform (`--spacing-5` for CSS, `spacing5` for Swift, `spacing_5` for Android).

* **Context-Aware Unit Handling**
    Correctly identifies unitless tokens (like `line-height` or `font-weight`) and applies `px` units to all other numeric dimensions.

<br>

## How It Works

1.  **Organize Your Variables:** Ensure your design tokens (colors, numbers, strings) are organized in Figma variable collections.
2.  **Launch the Plugin:** Open Token Exporter. It will automatically detect and display your collections.
3.  **Filter Token Types:** Use the toggles to select which token types you want to export (Colors, Numbers, States, Text).
4.  **Select Collections:** Choose which variable collections you want to include.
5.  **Choose Formats:** Select one or more export formats from the dropdown.
6.  **Generate Your Tokens:** Click "Package Tokens" to generate and download your perfectly formatted files.

<br>

<a href="https://www.figma.com/community/plugin/1521741753717588633/token-exporter">
  <img src="https://img.shields.io/badge/Install_Token_Exporter_on_Figma-black?style=for-the-badge&logo=figma&logoColor=white" alt="Install on Figma">
</a>

<br>

---

<br>

## Built With

<p>
  <a href="https://www.figma.com/plugin-docs/api/api-overview/"><img src="https://img.shields.io/badge/Figma_Plugin_API-000000?style=for-the-badge&logo=figma&logoColor=white" alt="Figma Plugin API"></a>&nbsp;
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-000000?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>&nbsp;
  <a href="https://open-props.style/"><img src="https://img.shields.io/badge/Open_Props-000000?style=for-the-badge&logoColor=white" alt="Open Props"></a>&nbsp;
  <a href="https://shoelace.style/"><img src="https://img.shields.io/badge/Shoelace-000000?style=for-the-badge&logoColor=white" alt="Shoelace"></a>&nbsp;
  <a href="https://www.jsdelivr.com/"><img src="https://img.shields.io/badge/jsDelivr-000000?style=for-the-badge&logo=jsdelivr&logoColor=white" alt="jsDelivr"></a>
</p>

<br>

---

<br>

## How to Contribute & Development Workflow

This section is for developers who want to contribute to the project.

### Project Philosophy

This system follows a "CSS First" approach. All style changes, bug fixes, and new tokens are made in a single source of truth (`src/design-system.css`). This ensures consistency and maintainability.

Due to Figma's Content Security Policy (CSP), the plugin cannot link to external stylesheets. Therefore, we use a simple build process to inject the master CSS file into the plugin's HTML. This document outlines that process.

### One-Time Setup

1.  **Install Node.js:** If you don't already have it, download and install Node.js from the official website. This gives you the ability to run JavaScript scripts from your terminal.
    <br>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Download_Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Download Node.js">
    </a>
2.  **Initialize the Project:** If you've just cloned the repository, run `npm init -y` to create a `package.json` file.
3.  **Install Dependencies:** Open your terminal (see below) in the project's root folder and run this one command:
    ```bash
    npm install
    ```
    This will read the `package.json` file and install the necessary development tools, like `clean-css`.

### The Development Terminal

You can use any command-line terminal, but the easiest way is to use the one built into VS Code.

* **How to open it:** In VS Code, go to the top menu and select `Terminal` > `New Terminal`. A panel will open at the bottom of your editor. This is where you will run the build command.

### The Build Command

After making any change to `src/design-system.css`, you must run the build script to update the plugin file.

1.  Open the terminal in VS Code.
2.  Type the following command and press Enter:
    ```bash
    node build.js
    ```
That's it. The script will automatically take the latest CSS, minify it, and inject it into `dist/ui.html`. The `dist/ui.html` file is now ready to be used in your Figma plugin.

### ✨ The Golden Workflow

1.  **📝 Edit the Source of Truth:** Make all your style changes in the `src/design-system.css` file.
2.  **🔬 Verify in the Guide (Optional but Recommended):** Open the `docs/design-system-guide.html` file in your browser. Since it links directly to the CSS, your changes will appear there instantly. This is a great way to test without running the build.
3.  **🚀 Build the Plugin:** Run `node build.js` in your terminal.
4.  **📦 Use the Final File:** The `dist/ui.html` file is now updated and ready for use.

> **Warning**
> **NEVER edit `dist/ui.html` directly.** Your changes will be overwritten the next time the build script is run.

### Project Structure

```
token-exporter/
├── src/
│   ├── design-system.css    # ✅ EDIT THIS FILE. The single source of truth for all styles.
│   └── ui.template.html     # Plugin HTML template. DO NOT EDIT unless changing structure.
├── build/
│   └── build.js             # The automation script. DO NOT EDIT.
├── dist/
│   └── ui.html              # ❌ DO NOT EDIT THIS FILE. It is generated by the build script.
└── docs/
    └── design-system-guide.html # Documentation site for testing and reference.
```

<br>

---

<br>

## Project Status

This project is under active development. The [Live Design System](https://n8mills-ui.github.io/token-exporter-ds/docs/design-system-guide.html) always reflects the latest, bleeding-edge version of the styles and components.

The Figma plugin is updated periodically with stable features from the design system. We are currently implementing the automated build process outlined above, which will soon ensure the plugin and the design system are always perfectly in sync.

<br>

---

<br>

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
