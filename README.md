# Token Exporter for Figma

![Token Exporter Hero Image](https://private-user-images.githubusercontent.com/128465128/463975158-947a34c3-57a7-4673-ad56-90a1c46642d0.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTIwMzI2NTAsIm5iZiI6MTc1MjAzMjM1MCwicGF0aCI6Ii8xMjg0NjUxMjgvNDYzOTc1MTU4LTk0N2EzNGMzLTU3YTctNDY3My1hZDU2LTkwYTFjNDY2NDJkMC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNzA5JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDcwOVQwMzM5MTBaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1lZTZhZWI3MzBkYmM2MDJjNmM3OTQwOGIzMWY0YTJmZTAxN2E1ZTg3ZmFjZWY2YjI2ZWY2ZDI1NzRkYzJmOGEzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.e5UBGjdxilFiv_Mra-drxCq4vMj_oGiGPovKNm0IdLw)

> A simple, powerful Figma plugin to transform your design variables into production-ready code with one click. It's a zero-config alternative to Style Dictionary, designed to make your design-to-development workflow seamless, fast, and error-free.

This project was created by [Nate Mills](https://natemills.me) to solve a common workflow problem for design and development teams.

[![Install from Figma Community](https://img.shields.io/badge/Install%20from-Figma%20Community-F7C600?style=for-the-badge&logo=figma&logoColor=black)](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
[![View Live Guide](https://img.shields.io/badge/View-Live%20Guide-blue?style=for-the-badge&logo=storybook&logoColor=white)](https://n8mills-ui.github.io/token-exporter-ds/design-system-guide.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

## The Problem It Solves

Manual token exporting from Figma is slow, error-prone, and creates a disconnect between design and development. Existing tools often lack the flexibility to export for multiple platforms natively. This plugin solves that problem by providing a fast, automated, and multi-format export pipeline.

## Key Features

* **Multi-Format Export:** Natively export your tokens to 6 different formats, ensuring your code speaks the language of every platform:
    * CSS (Custom Properties)
    * Swift (iOS Development)
    * Android (XML)
    * Flutter (Dart)
    * JSON (W3C Standard)
    * Tailwind CSS (JavaScript Config)
* **Intelligent Alias Resolution:** Accurately resolves complex, nested variable aliases to their final, concrete values while preventing infinite loops.
* **Smart Name Sanitization:** Automatically converts your Figma variable names (e.g., `Spacing/5 (20px)`) into the correct format for each platform (`spacing-5` for CSS, `spacing5` for Swift, `spacing_5` for Android).
* **Context-Aware Unit Handling:** Correctly identifies unitless tokens (like `line-height` or `font-weight`) and applies `px` units to all other dimensions.

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

