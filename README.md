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

1. [🚨 The Problem It Solves](#-the-problem-it-solves)
2. [🚀 Key Features](#-key-features)
3. [⚙️ How It Works](#️-how-it-works)
4. [🛠 Built With](#-built-with)
5. [🧑‍💻 Local Development](#-local-development)
6. [🚧 Project Status](#-project-status)
7. [📦 Local Development](#-local-development)
8. [ 📁 Folder Structure](#-folder-structure)
9. [📄 License](#-license)

---

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

- **Platform-Native Name Sanitisation**  
  Converts names like `Spacing/5 (20px)` to `--spacing-5`, `spacing5`, `spacing_5`.

- **Context-Aware Unit Handling**  
  Appends `px` to numeric values except for unitless types like `line-height`.

<br>

## ⚙️ How It Works

1. **Organise Your Variables**  
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

---

<br>

## 🛠 Built With

<p>
  <a href="https://www.figma.com/plugin-docs/api/api-overview/"><img src="https://img.shields.io/badge/Figma_Plugin_API-000000?style=for-the-badge&logo=figma&logoColor=white" alt="Figma Plugin API"></a>&nbsp;
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-000000?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>&nbsp;
  <a href="https://open-props.style/"><img src="https://img.shields.io/badge/Open_Props-000000?style=for-the-badge&logoColor=white" alt="Open Props"></a>&nbsp;
  <a href="https://shoelace.style/"><img src="https://img.shields.io/badge/Shoelace-000000?style=for-the-badge&logoColor=white" alt="Shoelace"></a>&nbsp;
  <a href="https://www.jsdelivr.com/"><img src="https://img.shields.io/badge/jsDelivr-000000?style=for-the-badge&logo=jsdelivr&logoColor=white" alt="jsDelivr"></a>
</p>

---

<br>

## 🧑‍💻 Local Development

This project uses a CSS-first workflow. You **only edit one CSS file**, and then sync it into the plugin UI.

<br>

### ⚙️ Setup

1. Install [Node.js](https://nodejs.org/) (LTS version)
2. Run `npm init -y` to generate `package.json`
3. Run `npm install` to install dependencies

<br>

### 🔄 Sync CSS Changes

Use the terminal to run:

```bash
npm run sync
```

This runs `scripts/sync-css.sh`, which injects the CSS into the plugin’s UI file.


<br>

---

<br>


## 🙌 How to Contribute

* Open a PR or issue
* Stick to the CSS-first approach (edit `design-system.css`, then `npm run sync`)
* Follow the "Golden Workflow":



### ✨ The Golden Workflow

| Step | Action | Purpose |
| :--- | :--- | :--- |
| **1. Edit** |  **`docs/design-system.css`**. | Your single source of truth > Make all your style changes in. |
| **2. Preview** | **`docs/design-system-guide.html`** | See your changes live without any builds > Open in your browser. |
| **3. Sync** | **`npm run sync`** | Updates the Figma plugin's UI with your new styles > Run in your terminal. |
| **4. Verify** |  **`src/ui.html`**  | The final check to make sure everything works > Test in the Figma plugin. |

> **🛑 IMPORTANT**
> Never edit the `src/ui.html` file directly. All your changes will be deleted the next time you run the sync script.

<br>

---

<br>

### Project Structure
```text
token-exporter-ds/
├── docs/
│   ├── design-system-guide.html # Standalone design system documentation
│   └── design-system.css      # ✅ EDIT THIS FILE
├── scripts/
│   └── sync-css.sh              # The automation script
├── src/
│   ├── code.js                  # Main plugin logic
│   └── ui.html                  # ❌ DO NOT EDIT THIS FILE
├── package.json                 # Project scripts runner
└── README.md                    # Project documentation
```
> Tip: Use `docs/design-system-guide.html` to preview styles without opening Figma.
<br>

---

<br>

## 🚧 Project Status

This project is under active development. The [Live Design System](https://n8mills-ui.github.io/token-exporter-ds/docs/design-system-guide.html) always reflects the latest, bleeding-edge version of the styles and components.

The Figma plugin is updated periodically with stable features from the design system. We are currently implementing the automated build process outlined above, which will soon ensure the plugin and the design system are always perfectly in sync.


<br>

---

<br>

## 📦 Local Development

Want to run your own fork locally or test updates before publishing? Follow these steps:

1. Clone this repo:

```bash
git clone https://github.com/n8mills/token-exporter-ds.git
cd token-exporter-ds
```

2. Install dependencies:

```bash
npm install
```

3. Open `manifest.json` in your Figma plugin settings, and point to the correct `src/code.js` and `src/ui.html` paths.
4. Build or test your changes using the `npm run sync` script.

<br>

---

<br>


## 📁 Folder Structure

```
token-exporter-ds/
├── docs/                       # Design system guide & editable CSS
│   ├── design-system-guide.html
│   └── design-system.css
├── scripts/                    # Automation scripts (e.g. CSS injector)
│   └── sync-css.sh
├── src/                        # Plugin source (logic and UI)
│   ├── code.js
│   └── ui.html
├── .gitignore                  # Files to exclude from Git tracking
├── LICENSE                     # Open source license (MIT)
├── manifest.json              # Figma plugin configuration
├── package.json                # Dependencies and project scripts
├── package-lock.json           # Locked package versions (auto-generated)
└── README.md                   # Project documentation (you're here!)
```

<br>

---

<br>

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.








