# export-size-svg

Generate SVG charts of minimized sizes for selected exports.

![@wopjs/disposable](https://crimx.github.io/export-size-svg/images/export-size.svg)

## Usage

Add a `.export-size-svg.mjs` configuration file to your project root.

```javascript
import { defineConfig } from "./lib/main.mjs";

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
