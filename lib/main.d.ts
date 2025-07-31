import { type BuildOptions } from "esbuild";

export interface Options {
  exports: ExportOption[];
  /** Directory to resolve entries from. */
  resolveDir?: string;
  /** Output file path for the SVG. */
  out?: string;
  /** Enable TSX support. Default false. */
  tsx?: boolean;
  /** Extra esbuild options. */
  esbuildOptions?: BuildOptions;
  /** SVG card options. */
  svg?: SVGOptions;
}

export interface ExportOption {
  /** Display title. */
  title: string;
  /** Code for the entry. e.g. `export { hello } from "./src/main.ts";`. */
  code: string;
  /** List of external dependency paths to ignore. */
  externals?: string[];
}

export interface SVGOptions {
  title?: string;
  /** The baseline size for comparison, defaults to the maximum export bundle size. */
  baselineSize?: number;
  cardWidth?: number;
  titleColor?: string;
  progressColor?: string;
  backgroundColor?: string;
}

export function defineConfig(options: Options): Options;
