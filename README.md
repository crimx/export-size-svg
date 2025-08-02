# export-size-svg

Generate SVG charts of minimized sizes for selected exports.

[![Docs](https://img.shields.io/badge/Docs-read-%23fdf9f5)](https://crimx.github.io/export-size-svg/)
[![Build Status](https://github.com/crimx/export-size-svg/actions/workflows/build.yml/badge.svg)](https://github.com/crimx/export-size-svg/actions/workflows/build.yml)
[![npm-version](https://img.shields.io/npm/v/export-size-svg.svg)](https://www.npmjs.com/package/export-size-svg)

## Example

[![@embra/reactivity](https://embrajs.github.io/reactivity/assets/export-size.svg)](https://github.com/embrajs/reactivity)

## Usage

Add a `.export-size-svg.mjs` configuration file to your project root.

```javascript
import { defineConfig } from "export-size-svg";

export default defineConfig({
  exports: [
    { title: "Total", code: `export * from "./src"` },
    { title: "Core", code: `export { hello } from "./src"` },
    { title: "Total without Core", code: `export * from "./src"`, externals: ["./core"] },
  ],
});
```

### Usage in CLI

```bash
npx export-size-svg --out ./docs/images
```

### Usage in package

1. Install the package:
   ```bash
   npm install export-size-svg --save-dev
   ```
2. package.json:
   ```json
   {
     "scripts": {
       "export-size": "export-size-svg --out ./docs/images"
     }
   }
   ```

## Options

See [![Docs](https://img.shields.io/badge/Docs-read-%23fdf9f5)](https://crimx.github.io/export-size-svg/)
