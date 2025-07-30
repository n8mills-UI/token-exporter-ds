export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        
        // Figma plugin globals
        figma: "readonly",
        __html__: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "args": "none" }]
    }
  }
];