#!/usr/bin/env node

import { existsSync } from "fs";
import { writeFile, mkdir, readFile, rm } from "fs/promises";
import { join, isAbsolute, dirname } from "path";
import { cwd } from "process";
import sade from "sade";
import { fileURLToPath } from "url";

import { exportSizes } from "./bundle.mjs";
import { generateSVG } from "./svg.mjs";

async function main() {
  const __dirname = fileURLToPath(new URL(".", import.meta.url));
  const pkg = await readFile(join(__dirname, "../package.json"), "utf-8").then(JSON.parse);
  sade(pkg.name, true)
    .version(pkg.version)
    .option("--config, -c", "Custom config file path.")
    .option("--out, -o", "Output file path for the SVG.")
    .option("--debug", "Generate a debug json along with the SVG.")
    .action(start)
    .parse(process.argv);
}

async function start(args) {
  const cwdPath = cwd();

  const configPath = args.config || ".export-size-svg.mjs";
  const configAbsolutePath = isAbsolute(configPath) ? configPath : join(cwdPath, configPath);

  const options = await import(configAbsolutePath).then(module => module.default);

  const outOption = args.out || options.out;
  const outPath = outOption
    ? outOption.endsWith(".svg")
      ? outOption
      : join(outOption, "export-size.svg")
    : "./export-size.svg";
  const outAbsolutePath = isAbsolute(outPath) ? outPath : join(cwdPath, outPath);
  const outDirPath = dirname(outAbsolutePath);

  const sizes = await exportSizes(options, cwdPath);
  const svg = generateSVG(options.title, options.svg, sizes);

  if (!existsSync(outDirPath)) {
    await mkdir(outDirPath, { recursive: true });
  }
  await writeFile(outAbsolutePath, svg);

  if (args.debug) {
    const debugDir = join(outDirPath, "export-size-debug");
    if (existsSync(debugDir)) {
      await rm(debugDir, { recursive: true, force: true });
    }
    await mkdir(debugDir, { recursive: true });

    await writeFile(join(debugDir, "export-size.debug.json"), JSON.stringify(sizes, null, 2));
    for (const size of sizes) {
      await writeFile(join(debugDir, `${sanitize(size.title)}.bundled.js`), size.bundled);
      await writeFile(join(debugDir, `${sanitize(size.title)}.minified.js`), size.minified);
    }
  }

  console.log(`SVG file generated at: ${outAbsolutePath}`);
}

main().catch(console.error);

/**
 * @param {string} title
 * @returns {string}
 */
function sanitize(title) {
  // Normalize unicode
  if (typeof title.normalize === "function") {
    title = title.normalize("NFC");
  }

  // Replace path separators with underscore
  title = title.replace(/[/\\]+/g, "_");

  // Remove control chars and characters illegal on Windows/most filesystems
  // eslint-disable-next-line no-control-regex
  title = title.replace(/[\x00-\x1F\x7F<>:"|?*]/g, "");

  // Collapse multiple whitespace to a single underscore and trim
  title = title.replace(/\s+/g, "_").trim();

  // Remove leading/trailing dots and spaces (Windows dislikes trailing dots/spaces)
  title = title.replace(/^[. ]+|[. ]+$/g, "");

  // Avoid reserved Windows filenames like CON, PRN, AUX, NUL, COM1..COM9, LPT1..LPT9
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\..*)?$/i.test(title)) {
    title = "_" + title;
  }

  // Keep reasonably short (reserve room for extensions)
  const MAX_LEN = 200;
  if (title.length > MAX_LEN) title = title.slice(0, MAX_LEN).trim();

  return title;
}
