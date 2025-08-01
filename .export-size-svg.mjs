import { defineConfig } from "./lib/main.mjs";

export default defineConfig({
  title: "Example: @wopjs/disposable",
  out: "./docs/images",
  exports: [
    { title: "*", code: `export * from "@wopjs/disposable"` },
    { title: "disposableStore", code: `export { disposableStore } from "@wopjs/disposable"` },
    { title: "disposableMap", code: `export { disposableMap } from "@wopjs/disposable"` },
    { title: "disposableOne", code: `export { disposableOne } from "@wopjs/disposable"` },
  ],
  svg: {
    baselineSize: 1000,
    cardWidth: 350,
  },
});
