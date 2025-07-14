# Token Exporter for Figma

![Token Exporter Hero Image](https://res.cloudinary.com/dbmvymdp1/image/upload/v1752106527/Figma_01_sk7ne5.png)

> A simple, powerful Figma plugin to transform your design variables into production-ready code with one click. It's a zero-config alternative to Style Dictionary, designed to make your design-to-development workflow seamless, fast, and error-free.

This project was created by [Nate Mills](https://natemills.me) to solve a common workflow problem for design and development teams.

[![Figma](https://img.shields.io/badge/Install_on_Figma-e8ff0c?style=for-the-badge&logo=figma&logoColor=black)](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
[![Live Design System](https://img.shields.io/badge/Live_Design_System-e8ff0c?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxwYXRoIGQ9Ik0xNCAySDRjLTEuMSAwLTIgLjktMiAydjE2YzAgMS4xLjkgMiAyIDJoMTZjMS4xIDAgMi0uOSAyLTJWOGwtNi02em0yIDE2SDh2LTJoOHYyem0wLTRIOHYtMmg4djJ6bS00LTRIOHYtMmg0djJ6Ii8+PC9zdmc+&logoColor=black)](https://n8mills-ui.github.io/token-exporter-ds/docs/design-system-guide.html)
[![See My Portfolio](https://img.shields.io/badge/See_My_Portfolio-e8ff0c?style=for-the-badge&logoColor=black)](https://natemills.me)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/millsdesign/)

<br>

## 📑 Table of Contents

1. [🧩 The Problem It Solves](#-the-problem-it-solves)
2. [🚀 Key Features](#-key-features)
3. [⚙️ How It Works](#️-how-it-works)
4. [🛠 Built With](#-built-with)
5. [🤝 How to Contribute & Development Workflow](#-how-to-contribute--development-workflow)
6. [📈 Project Status](#-project-status)
7. [📄 License](#-license)

---

<br>

## 🧩 The Problem It Solves

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

## 🤝 How to Contribute & Development Workflow

This section is for developers who want to contribute to the project.



### Project Philosophy

This system follows a **"CSS First"** approach. All style changes are made in a single source of truth (`design-system.css`). Due to Figma's security policy, we use an automation script to inject these styles directly into the plugin's UI file.

### ⚙️ One-Time Setup

First, let's get your local environment ready. You only need to do this once.

1.  **Install Node.js:** If you don't already have it, download and install the **LTS** version from the official website. This is what allows your computer to run the project's scripts.
    <br>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/Download_Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Download Node.js">
    </a>
2.  **Initialize the Project:** Open a terminal in the project's root folder and run `npm init -y` to create your `package.json` file.
3.  **Install Dependencies:** In the same terminal, run `npm install`. This command sets up the environment needed for our scripts.

### 🚀 The CSS Sync Command

After you've made a change to the styles, you need to sync them to the plugin.

> **Key Command:** In your VS Code terminal, just run:
> ```bash
> npm run sync
> ```

This command runs the `scripts/sync-css.sh` file, which automatically finds the latest CSS, and injects it into the plugin's `ui.html` file.

### ✨ The Golden Workflow

| Step | Action | Purpose |
| :--- | :--- | :--- |
| **1. 📝 Edit** | Make all your style changes in **`docs/design-system.css`**. | Your single source of truth. |
| **2. 🔬 Preview** | Open **`docs/design-system-guide.html`** in your browser. | See your changes live without any builds. |
| **3. 🔄 Sync** | Run **`npm run sync`** in your terminal. | Updates the Figma plugin's UI with your new styles. |
| **4. ✅ Verify** | Test the **`src/ui.html`** file in the Figma plugin. | The final check to make sure everything works. |

> **🛑 IMPORTANT**
> Never edit the `src/ui.html` file directly. All your changes will be deleted the next time you run the sync script.

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

<br>

---

<br>

## 📈 Project Status

This project is under active development. The [Live Design System](https://n8mills-ui.github.io/token-exporter-ds/docs/design-system-guide.html) always reflects the latest, bleeding-edge version of the styles and components.

The Figma plugin is updated periodically with stable features from the design system. We are currently implementing the automated build process outlined above, which will soon ensure the plugin and the design system are always perfectly in sync.

<br>

---

<br>

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.








