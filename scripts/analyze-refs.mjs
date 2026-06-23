import fs from "node:fs/promises";
import path from "node:path";
import { ensureOutput, outputDir, readLines } from "./lib.mjs";

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}

await ensureOutput();

const [headerLine, ...body] = await readLines("data/reference-ads.csv");
const headers = parseCsvLine(headerLine);
const rows = body.map((line) => {
  const cells = parseCsvLine(line);
  return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
});

const byFormat = countBy(rows, "format");
const bySegment = countBy(rows, "segment");
const repeatedProofs = countBy(rows, "proof");

const report = [
  "# Reference Analysis",
  "",
  `References reviewed: ${rows.length}`,
  "",
  "## Format Pattern",
  "",
  ...Object.entries(byFormat).map(([format, count]) => `- ${format}: ${count}`),
  "",
  "## Segment Pattern",
  "",
  ...Object.entries(bySegment).map(([segment, count]) => `- ${segment}: ${count}`),
  "",
  "## Reusable Learning",
  "",
  "- Use one square creative format before expanding placements.",
  "- Keep the first-read hook specific: situation, test, structure, or offer.",
  "- Put product proof on the card so the viewer understands why this is different.",
  "- Avoid language that implies sensitive personal attributes about the viewer.",
  "",
  "## Proof Motifs",
  "",
  ...Object.entries(repeatedProofs).map(([proof, count]) => `- ${proof}: ${count}`),
  "",
].join("\n");

const out = path.join(outputDir, "reference-analysis.md");
await fs.writeFile(out, report);
console.log(`wrote ${out}`);
