import { existsSync } from "fs";
import { writeFile, mkdir, readFile } from "fs/promises";
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
  const svg = generateSVG(options.svg, sizes);

  if (!existsSync(outDirPath)) {
    await mkdir(outDirPath, { recursive: true });
  }
  await writeFile(outAbsolutePath, svg);

  if (args.debug) {
    await writeFile(join(outDirPath, "export-size.debug.json"), JSON.stringify(sizes, null, 2));
  }

  console.log(`SVG file generated at: ${outAbsolutePath}`);
}

main().catch(console.error);
