import fs from "node:fs/promises";
import path from "node:path";
import { ensureOutput, outputDir, readJson, root } from "./lib.mjs";

const references = await readJson("config/references.json");
const columns = ["id", "segment", "format", "visual", "hook", "proof", "cta", "landing", "policy_note"];

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
  return text;
}

const rows = [
  columns.join(","),
  ...references.ads.map((ad) => columns.map((column) => csvCell(ad[column])).join(","))
];

await fs.writeFile(path.join(root, "data/reference-ads.csv"), `${rows.join("\n")}\n`);
await ensureOutput();
await fs.writeFile(
  path.join(outputDir, "reference-brands.md"),
  [
    "# Reference Brands",
    "",
    ...(references.referenceBrands ?? []).map((brand) => `- ${brand}`),
    "",
    "## Collection Method",
    "",
    references.collectionMethod ?? "Manual reference collection.",
    ""
  ].join("\n")
);

console.log(`wrote ${references.ads.length} reference rows to data/reference-ads.csv`);
