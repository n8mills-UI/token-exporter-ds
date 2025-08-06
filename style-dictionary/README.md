# Token Files Directory

This directory is where token files exported from the Figma Token Exporter plugin should be placed for validation.

## How to Export Tokens

1. Open your Figma file with design variables
2. Run the Token Exporter plugin
3. Select your desired export format (W3C JSON recommended for validation)
4. Save the exported JSON file(s) to this directory

## Validation

Once you have token files in this directory, you can validate them by running:

```bash
npm run tokens:validate
```

This will check for:
- Valid token structure
- Circular references
- Correct color formats
- Valid token types

## Example Token Structure

```json
{
  "color": {
    "primary": {
      "$value": "#D2FF37",
      "$type": "color"
    },
    "text": {
      "default": {
        "$value": "{color.gray.900}",
        "$type": "color"
      }
    }
  }
}
```

## Note

If you're not using the token validation workflow, you can safely ignore this directory. The Token Exporter plugin works independently and doesn't require token files to be stored here.