import { type BuildOptions } from "esbuild";

export interface Options {
  /** Define the export entries. */
  exports: ExportOption[];
  /** Directory to resolve entries from. */
  resolveDir?: string;
  /** Output file path for the SVG. */
  out?: string;
  /** Enable TSX support. Default false. */
  tsx?: boolean;
  /** Extra esbuild options. @see {@link https://esbuild.github.io/api/} */
  esbuildOptions?: BuildOptions;
  /** SVG card options. */
  svg?: SVGOptions;
}

export interface ExportOption {
  /** Display title. */
  title: string;
  /** Code for the entry. e.g. `export { hello } from "./src/main.ts";`. */
  code: string;
  /** List of external dependency paths to ignore. @see {@link https://esbuild.github.io/api/#external} */
  externals?: string[];
}

export interface SVGOptions {
  title?: string;
  /** The baseline size for comparison, defaults to the maximum export bundle size. */
  baselineSize?: number;
  cardWidth?: number;
  theme?: {
    titleColor?: string;
    textColor?: string;
    progressColor?: string;
    progressTrackColor?: string;
    backgroundColor?: string;
  };
}

export function defineConfig(options: Options): Options;
