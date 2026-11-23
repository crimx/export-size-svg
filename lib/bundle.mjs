import { cwd } from "node:process";
import * as esbuild from "esbuild";
import { gzipSize } from "gzip-size";
import * as rollup from "rollup";
import { parseAst } from "rollup/parseAst";

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
 * @param {string} name
 * @param {(string | RegExp)[]} patterns
 * @returns {boolean}
 */
function matchesExternalSymbol(name, patterns) {
  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      if (pattern === name) return true;
    } else {
      if (pattern.global || pattern.sticky) {
        pattern.lastIndex = 0;
      }
      if (pattern.test(name)) return true;
    }
  }
  return false;
}

/**
 * @param {any} node
 * @param {string[]} [names]
 * @returns {string[]}
 */
function collectPatternNames(node, names = []) {
  if (!node) return names;
  switch (node.type) {
    case "Identifier":
      names.push(node.name);
      break;
    case "ArrayPattern":
      for (const el of node.elements) {
        if (el) collectPatternNames(el, names);
      }
      break;
    case "ObjectPattern":
      for (const prop of node.properties) {
        collectPatternNames(prop.type === "RestElement" ? prop.argument : prop.value, names);
      }
      break;
    case "AssignmentPattern":
      collectPatternNames(node.left, names);
      break;
    case "RestElement":
      collectPatternNames(node.argument, names);
      break;
  }
  return names;
}

/**
 * @param {string} code
 * @param {any[]} declarations
 * @param {(string | RegExp)[]} patterns
 * @returns {{ kept: string[], removed: string[] }}
 */
function partitionVariableDeclarators(code, declarations, patterns) {
  const kept = [];
  const removed = [];

  for (const decl of declarations) {
    if (decl.id.type === "Identifier") {
      if (matchesExternalSymbol(decl.id.name, patterns)) {
        removed.push(decl.id.name);
      } else {
        kept.push(code.slice(decl.start, decl.end));
      }
    } else if (decl.id.type === "ObjectPattern" && decl.id.properties.every((p) => p.type === "Property")) {
      const propKept = [];
      const propRemoved = [];
      for (const prop of decl.id.properties) {
        if (prop.value.type === "Identifier" && matchesExternalSymbol(prop.value.name, patterns)) {
          propRemoved.push(prop.value.name);
        } else {
          propKept.push(code.slice(prop.start, prop.end));
        }
      }
      if (propRemoved.length === 0) {
        kept.push(code.slice(decl.start, decl.end));
      } else {
        removed.push(...propRemoved);
        if (propKept.length > 0) {
          const init = decl.init ? ` = ${code.slice(decl.init.start, decl.init.end)}` : "";
          kept.push(`{ ${propKept.join(", ")} }${init}`);
        }
      }
    } else {
      const names = collectPatternNames(decl.id);
      if (names.length > 0 && names.every((n) => matchesExternalSymbol(n, patterns))) {
        removed.push(...names);
      } else {
        kept.push(code.slice(decl.start, decl.end));
      }
    }
  }

  return { kept, removed };
}

/**
 * @param {string} code
 * @param {(string | RegExp)[]} externalSymbols
 * @returns {string}
 */
function externalizeSymbols(code, externalSymbols) {
  const ast = parseAst(code);
  const externalized = new Set();
  let result = "";
  let cursor = 0;

  for (const node of ast.body) {
    let replacement;

    if (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") {
      const name = node.id?.name;
      if (name && matchesExternalSymbol(name, externalSymbols)) {
        externalized.add(name);
        replacement = "";
      }
    } else if (node.type === "VariableDeclaration") {
      const { kept, removed } = partitionVariableDeclarators(code, node.declarations, externalSymbols);
      if (removed.length > 0) {
        for (const name of removed) externalized.add(name);
        replacement = kept.length > 0 ? `${node.kind} ${kept.join(", ")};` : "";
      }
    } else if (node.type === "ExportNamedDeclaration" && node.declaration) {
      const decl = node.declaration;
      if (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") {
        const name = decl.id?.name;
        if (name && matchesExternalSymbol(name, externalSymbols)) {
          externalized.add(name);
          replacement = `export { ${name} };`;
        }
      } else if (decl.type === "VariableDeclaration") {
        const { kept, removed } = partitionVariableDeclarators(code, decl.declarations, externalSymbols);
        if (removed.length > 0) {
          for (const name of removed) externalized.add(name);
          const exportRemoved = `export { ${removed.join(", ")} };`;
          replacement = kept.length > 0 ? `export ${decl.kind} ${kept.join(", ")};\n${exportRemoved}` : exportRemoved;
        }
      }
    } else if (node.type === "ExportDefaultDeclaration") {
      const decl = node.declaration;
      if (
        (decl.type === "FunctionDeclaration" || decl.type === "ClassDeclaration") &&
        decl.id?.name &&
        matchesExternalSymbol(decl.id.name, externalSymbols)
      ) {
        externalized.add(decl.id.name);
        replacement = `export default ${decl.id.name};`;
      }
    }

    if (replacement !== undefined) {
      result += code.slice(cursor, node.start) + replacement;
      cursor = node.end;
    }
  }

  if (externalized.size === 0) {
    return code;
  }

  result += code.slice(cursor);
  return `import { ${[...externalized].join(", ")} } from "__export_size_svg_external__";\n${result}`;
}

/**
 * @param {string} code
 * @returns {string}
 */
function stripImportsAndExports(code) {
  const ast = parseAst(code);
  let result = "";
  let cursor = 0;

  for (const node of ast.body) {
    let stripEnd;
    if (node.type === "ImportDeclaration" || node.type === "ExportAllDeclaration") {
      stripEnd = node.end;
    } else if (node.type === "ExportNamedDeclaration") {
      stripEnd = node.declaration ? node.declaration.start : node.end;
    } else if (node.type === "ExportDefaultDeclaration") {
      stripEnd = node.declaration.type === "Identifier" ? node.end : node.declaration.start;
    }

    if (stripEnd !== undefined) {
      result += code.slice(cursor, node.start);
      cursor = stripEnd;
    }
  }

  result += code.slice(cursor);
  return result.trim();
}

/**
 * @typedef {{ title: string, size: number, bundled: string, minified: string }} ExportSizeResult
 * @typedef {{ title: string, exports: ExportSizeResult[] }} ExportGroupSizeResult
 */

/**
 * @param {import("./main").Options} options
 * @param {import("./main").ExportOption} exportOption
 * @param {string[]} [extraExternals]
 * @param {(string | RegExp)[]} [extraExternalSymbols]
 * @returns {Promise<ExportSizeResult>}
 */
async function bundleExport(options, exportOption, extraExternals, extraExternalSymbols) {
  const externals =
    extraExternals || exportOption.externals
      ? [...(extraExternals || []), ...(exportOption.externals || [])]
      : undefined;
  const externalSymbols =
    extraExternalSymbols || exportOption.externalSymbols
      ? [...(extraExternalSymbols || []), ...(exportOption.externalSymbols || [])]
      : undefined;
  let esbuilt = await esbuildBundle(options, exportOption.code, externals);
  if (externalSymbols?.length) {
    esbuilt = externalizeSymbols(esbuilt, externalSymbols);
  }
  const bundled = await rollupBundle(esbuilt);
  const minified = stripImportsAndExports(await minify(bundled));
  const size = await gzipSize(minified);
  return {
    title: exportOption.title,
    bundled,
    minified,
    size,
  };
}

/**
 * @param {import("./main").Options} [options]
 * @returns {Promise<(ExportSizeResult | ExportGroupSizeResult)[]>}
 * @throws {Error}
 */
export async function exportSizes(options) {
  if (!options?.exports || !Array.isArray(options.exports)) {
    throw new Error("Invalid or missing 'exports' option");
  }
  const result = [];
  for (const entry of options.exports) {
    if ("exports" in entry && Array.isArray(entry.exports)) {
      const groupExports = [];
      for (const child of entry.exports) {
        groupExports.push(await bundleExport(options, child, entry.externals, entry.externalSymbols));
      }
      result.push({
        title: entry.title,
        exports: groupExports,
      });
    } else {
      result.push(await bundleExport(options, entry));
    }
  }
  return result;
}
