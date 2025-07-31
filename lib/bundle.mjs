import * as esbuild from "esbuild";
import { gzipSize } from "gzip-size";
import { cwd } from "process";
import * as rollup from "rollup";

/**
 * @param {import("./main").Options} options
 * @param {string} code
 * @param {string[]} [externals]
 * @returns {Promise<string>}
 * @throws {Error}
 */
async function esbuildBundle(options, code, externals) {
  const esbuildOptions = options.esbuildOptions || {};
  const result = await esbuild.build({
    mainFields:
      !esbuildOptions.platform || esbuildOptions.platform === "node"
        ? ["module", "main"]
        : ["browser", "module", "main"],
    format: "esm",
    target: "esnext",
    logLevel: "error",
    ...esbuildOptions,
    stdin: {
      contents: code,
      loader: options.tsx ? "tsx" : "ts",
      resolveDir: options.resolveDir || cwd(),
      sourcefile: `_ExporT_SizE_SvG_.${options.tsx ? "tsx" : "ts"}`,
    },
    external: [...(externals || []), ...(esbuildOptions.external || [])],
    outdir: "dist",
    minify: false,
    bundle: true,
    metafile: true,
    write: false,
    define: {
      __NODE__: `false`,
      "process.env.NODE_ENV": `"production"`,
      ...esbuildOptions.define,
    },
    loader: {
      ".aac": "file",
      ".css": "file",
      ".eot": "file",
      ".flac": "file",
      ".gif": "file",
      ".jpeg": "file",
      ".jpg": "file",
      ".mp3": "file",
      ".mp4": "file",
      ".ogg": "file",
      ".otf": "file",
      ".png": "file",
      ".svg": "file",
      ".ttf": "file",
      ".wav": "file",
      ".webm": "file",
      ".webp": "file",
      ".woff": "file",
      ".woff2": "file",
      ...esbuildOptions.loader,
    },
  });

  return result.outputFiles[0].text;
}

/**
 * @param {string} code
 * @returns {Promise<string>}
 * @throws {Error}
 */
async function rollupBundle(code) {
  const stdinPlugin = {
    name: "stdin",
    resolveId(id) {
      if (id == "stdin.js") return id;
      return { id, external: true };
    },
    load() {
      return code;
    },
  };
  const ret = await rollup.rollup({ input: "stdin.js", plugins: [stdinPlugin] });
  const result = await ret.generate({ format: "es" });
  return result.output[0].code;
}

/**
 * @param {string} code
 * @returns {Promise<string>}
 * @throws {Error}
 */
async function minify(code) {
  const result = await esbuild.transform(code, {
    minify: true,
    minifyIdentifiers: true,
    minifySyntax: true,
  });
  return result.code;
}

/**
 * @param {import("./main").Options} [options]
 * @returns {Promise<{ title: string, size: number, bundled: string, minified: string }[]>}
 * @throws {Error}
 */
export async function exportSizes(options) {
  if (!options?.exports || !Array.isArray(options.exports)) {
    throw new Error("Invalid or missing 'exports' option");
  }
  const result = [];
  for (const exportOption of options.exports) {
    const bundled = await rollupBundle(await esbuildBundle(options, exportOption.code, exportOption.externals));
    const minified = await minify(bundled);
    const size = await gzipSize(minified);
    result.push({
      title: exportOption.title,
      bundled,
      minified,
      size,
    });
  }
  return result;
}
