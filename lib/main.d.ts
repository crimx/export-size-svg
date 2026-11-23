import type { BuildOptions } from "esbuild";

export interface Options {
  /** Define the export entries or 1-level groups. */
  exports: (ExportOption | ExportGroupOption)[];
  /** Card title. */
  title?: string;
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

export interface ExportGroupOption {
  /** Group display title. */
  title: string;
  /** Export entries in this group (1-level only). */
  exports: ExportOption[];
  /** List of external dependency paths shared by entries in this group. @see {@link https://esbuild.github.io/api/#external} */
  externals?: string[];
}

export interface SVGOptions {
  /** The baseline size for comparison, defaults to the maximum export bundle size. */
  baselineSize?: number;
  cardWidth?: number;
  theme?: {
    titleColor?: string;
    groupTitleColor?: string;
    textColor?: string;
    progressColor?: string;
    progressTrackColor?: string;
    backgroundColor?: string;
  };
}

export function defineConfig(options: Options): Options;
