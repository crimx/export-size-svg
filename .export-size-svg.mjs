import { defineConfig } from "./lib/main.mjs";

export default defineConfig({
  out: "./docs/images",
  exports: [
    { title: "disposableStore", code: `export { disposableStore } from "@wopjs/disposable"` },
    { title: "disposableMap", code: `export { disposableMap } from "@wopjs/disposable"` },
    { title: "disposableOne", code: `export { disposableOne } from "@wopjs/disposable"` },
  ],
  svg: {
    title: "Example: @wopjs/disposable",
    baselineSize: 1000,
    cardWidth: 350,
  },
});
