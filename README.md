# Token Exporter for Figma

![Token Exporter Hero Image][(https://s3-figma-plugin-images-production-sig.figma.com/plugins/carousel/img/1521741753717588633/9f215e89a92da2cf3e49ce8c23796cbb1ce204f1?Expires=1753056000&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=OEMtDtJRcgtGOdalWBAo1mLe9EtS~t2DtkM6A~RM7JruZuQwgkzWj9ZnwCJApv7TSQnyPeV6nocKNt4cK8hQu5aB0LxiwV~8qmddC9NeGqdBGglrUE853tYvtFkHb4Sz-0u99BLUSntDZVj~6PC81akICPXDkGayTLKvS6x5k0qpG26TX57WBIixYvyMz-wSbomA8nRTbkJLEu5k1dAa5-iLqEDP0hZrCNno5qYIfqcDHpZOXYayPyfnDRJNwc9Gs0SP8CPdzABYtxQSKLL2~-vbsAB4QMd~echefsAL1lFgSAGW6bgVDYJeYA3aS6o3AMUlYpgnH59g65CPxlfZfg__)](https://github.com/n8mills-UI/token-exporter-ds/issues/1#issue-3214368580)

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
