# Token Exporter for Figma

![Token Exporter Hero Image](https://private-user-images.githubusercontent.com/128465128/463975158-947a34c3-57a7-4673-ad56-90a1c46642d0.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NTIwMzI2NTAsIm5iZiI6MTc1MjAzMjM1MCwicGF0aCI6Ii8xMjg0NjUxMjgvNDYzOTc1MTU4LTk0N2EzNGMzLTU3YTctNDY3My1hZDU2LTkwYTFjNDY2NDJkMC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNzA5JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDcwOVQwMzM5MTBaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1lZTZhZWI3MzBkYmM2MDJjNmM3OTQwOGIzMWY0YTJmZTAxN2E1ZTg3ZmFjZWY2YjI2ZWY2ZDI1NzRkYzJmOGEzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.e5UBGjdxilFiv_Mra-drxCq4vMj_oGiGPovKNm0IdLw)

> A simple, powerful Figma plugin to transform your design variables into production-ready code with one click.

This project was created by [Nate Mills](https://natemills.me) as a portfolio piece to demonstrate skills in design systems, tooling, and AI-assisted development.

[![Figma Community](https://img.shields.io/badge/Figma-Community-F7C600?style=for-the-badge&logo=figma&logoColor=black)](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
[![GitHub license](https://img.shields.io/github/license/n8mills-UI/token-exporter-ds?style=for-the-badge)](./LICENSE)

## Live Links

* **Install the Plugin:** [Figma Community Page](https://www.figma.com/community/plugin/1521741753717588633/token-exporter)
* **Live Design System Guide:** [View the Guide](https://n8mills-ui.github.io/token-exporter-ds/design-system-guide.html)
* **Live CSS File (CDN):** `https://cdn.jsdelivr.net/gh/n8mills-UI/token-exporter-ds/design-system.css`

## The Problem It Solves

Manual token exporting from Figma is slow, error-prone, and creates a disconnect between design and development. Existing tools often lack the flexibility to export for multiple platforms natively. This plugin solves that problem by providing a fast, automated, and multi-format export pipeline.

## Key Features

* **Multi-Format Export:** Natively export your tokens to 6 different formats, ensuring your code speaks the language of every platform:
    * CSS Variables
    * Swift (iOS)
    * Android XML
    * Flutter
    * JSON (W3C Design Token Standard)
    * Tailwind Config
* **Live CDN Hosting:** The exported `design-system.css` is instantly available via a jsDelivr CDN link, ready to be dropped into any web project.
* **Alias Resolution:** Automatically resolves complex variable aliases to their final, concrete values.
* **Smart & Clean Output:** Intelligently sanitizes token names for each platform (e.g., `camelCase` for Swift, `snake_case` for Android) and handles platform-specific units.

## How It Works

**Step 1: Export from Figma**
Run the plugin to export all your design tokens from your current file.


**Step 2: Sync with GitHub**
The plugin automatically pushes the generated `design-system.css` file to this GitHub repository.


**Step 3: Use in Your Project**
Grab the permanent CDN link and paste it into the `<head>` of your HTML file. Your project is now linked to your design system.


## Built With

* **Figma Plugin API** & **TypeScript** for robust plugin logic.
* **Open Props** as the foundational token system, providing over 435 battle-tested tokens.
* **Shoelace** for high-quality, accessible web components in the plugin's UI.
* **AI-Assisted Development** using tools like Claude and Gemini to accelerate coding and problem-solving.
* **jsDelivr** for fast and reliable CDN hosting.
