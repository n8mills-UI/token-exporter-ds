# Token Exporter for Figma

![Token Exporter Hero Image](https://res.cloudinary.com/dbmvymdp1/image/upload/v1752106527/Figma_01_sk7ne5.png)

> A simple, powerful Figma plugin to transform your design variables into production-ready code with one click. It's a zero-config alternative to Style Dictionary, designed to make your design-to-development workflow seamless, fast, and error-free.

This project was created by [Nate Mills](https://natemills.me) to solve a common workflow problem for design and development teams.



[![Figma](https://img.shields.io/badge/Install_on_Figma-e8ff0c?style=for-the-badge&logo=figma&logoColor=black)](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
[![Design System](https://img.shields.io/badge/Design_System-e8ff0c?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxwYXRoIGQ9Ik0xNCAySDRjLTEuMSAwLTIgLjktMiAydjE2YzAgMS4xLjkgMiAyIDJoMTZjMS4xIDAgMi0uOSAyLTJWOGwtNi02em0yIDE2SDh2LTJoOHYyem0wLTRIOHYtMmg4djJ6bS00LTRIOHYtMmg0djJ6Ii8+PC9zdmc+&logoColor=black)](https://n8mills-ui.github.io/token-exporter-ds/design-system-guide.html)
[![Portfolio](https://img.shields.io/badge/Portfolio-e8ff0c?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iYmxhY2siPjxwYXRoIGQ9Ik0xMiwyQzYuNDgsMiwyLDYuNDgsMiwxMnM0LjQ4LDEwLDEwLDEwczEwLTQuNDgsMTAtMTBTMTcuNTIsMiwxMiwyek0xMiw0YzEuNjYsMCwzLDIuMjQsMyw1cy0xLjM0LDUtMyw1cy0zLTIuMjQtMy01UzEwLjM0LDQsMTIsNHpNMTIsMjAuMmMtMi41LDAtNC43MS0xLjI4LTgtMy4yMmMwLTIuNjYsNS4zMy00LjA4LDgtNC4wOHM4LDEuNDIsOCw0LjA4QzE2LjcxLDE4LjkyLDE0LjUsMjAuMiwxMiwyMC4yeiIvPjwvc3ZnPg==&logoColor=black)](https://natemills.me)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyBmaWxsPSJ3aGl0ZSIgcm9sZT0iaW1nIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRpdGxlPkxpbmtlZEluPC90aXRsZT48cGF0aCBkPSJNMjAuNDQ3IDIwLjQ1aC0zLjU1NHYtNS41NjljMC0xLjMyLS4wMjctMy4wMTItMS44MzEtMy4wMTJzLTIuMTExIDEuNDQtMi4xMTEgMi45MnY1LjY2aC0zLjU1NFY5aDMuNDFWMC40NjVoLjA0N2MxLjAxMi0xLjY2NyAyLjc5MS0zLjQyMyA1LjYyOS0zLjQyMyA2LjAxMiAwIDcuMTI2IDMuOTYgNy4xMjYgOS4xMTR2MTAuMzQxaDB6TTMuNzY0IDcuNDI0YTMuNjYgMy42NiAwIDAgMS0zLjc2NCAwYTMuNjYgMy42NiAwIDAgMSAzLjc2NCAwTTUuNTQzIDIwLjQ1SDDEuOTg0VjloMy41NTl6TTIyLjQ1IDIwLjQ1aC0uMDAxdi0uMDAxaC4wMDF6Ii8+PC9zdmc+)](https://www.linkedin.com/in/millsdesign/)
---
<br>
<br>

## The Problem It Solves

Manual token exporting from Figma is slow, error-prone, and creates a disconnect between design and development. Existing tools often lack the flexibility to export for multiple platforms natively. This plugin solves that problem by providing a fast, automated, and multi-format export pipeline.

## Key Features

* **Multi-Format Export**
<br> Natively export your tokens to 6 different formats, ensuring your code speaks the language of every platform:
    * **CSS** (Custom Properties)
    * **Swift** (iOS Development)
    * **Android** (XML)
    * **Flutter** (Dart)
    * **JSON** (W3C Standard)
    * **Tailwind CSS** (JavaScript Config)
 
* **Intelligent Alias Resolution**
<br> Accurately resolves complex, nested variable aliases to their final, concrete values while preventing infinite loops.

* **Smart Name Sanitization**
<br> Automatically converts your Figma variable names (e.g., `Spacing/5 (20px)`) into the correct format for each platform (`spacing-5` for CSS, `spacing5` for Swift, `spacing_5` for Android).

* **Context-Aware Unit Handling**
<br> Correctly identifies unitless tokens (like `line-height` or `font-weight`) and applies `px` units to all other dimensions.

## How It Works

1.  **Organize Your Variables:** Ensure your design tokens (colors, numbers, strings) are organized in Figma variable collections.
2.  **Launch the Plugin:** Open Token Exporter. It will automatically detect and display your collections.
3.  **Filter Token Types:** Use the toggles to select which token types you want to export (Colors, Numbers, States, Text).
4.  **Select Collections:** Choose which variable collections you want to include.
5.  **Choose Formats:** Select one or more export formats from the dropdown.
6.  **Generate Your Tokens:** Click "Package Tokens" to generate and download your perfectly formatted files.

## Built With

* **Figma Plugin API** & **TypeScript** for robust plugin logic.
* **Open Props** as the foundational token system, providing over 435 battle-tested tokens.
* **Shoelace** for high-quality, accessible web components in the plugin's UI.
* **AI-Assisted Development** using tools like Claude and Gemini to accelerate coding and problem-solving.
* **jsDelivr** for fast and reliable CDN hosting.

