import fs from "node:fs/promises";
import path from "node:path";
import { ensureOutput, outputDir, readJson, readLines } from "./lib.mjs";

const data = await readJson("data/creative-map.json");
const creativeMap = new Map(data.creatives.map((creative) => [creative.id, creative]));
const events = (await readLines("data/lead-events.jsonl")).map((line) => JSON.parse(line));
await ensureOutput();

const grouped = new Map();
for (const event of events) {
  const row = grouped.get(event.utm_content) ?? { leads: 0, qualified: 0 };
  row.leads += 1;
  if (event.qualified) row.qualified += 1;
  grouped.set(event.utm_content, row);
}

const ranked = [...grouped.entries()].sort((a, b) => b[1].qualified - a[1].qualified || b[1].leads - a[1].leads);
const winner = ranked[0];
const winnerCreative = winner ? creativeMap.get(winner[0]) : null;

const report = [
  "# Weekly Decision Report",
  "",
  `Total leads: ${events.length}`,
  `Qualified leads: ${events.filter((event) => event.qualified).length}`,
  "",
  "## Creative Ranking",
  "",
  "| UTM Content | Situation | Leads | Qualified | Decision |",
  "| --- | --- | ---: | ---: | --- |",
  ...ranked.map(([utm, row], index) => {
    const creative = creativeMap.get(utm);
    const decision = index === 0 ? "scale / make variations" : row.qualified === 0 ? "rewrite hook" : "keep testing";
    return `| ${utm} | ${creative?.situation ?? "unknown"} | ${row.leads} | ${row.qualified} | ${decision} |`;
  }),
  "",
  "## Next Action",
  "",
  winnerCreative
    ? `Create two new variations around "${winnerCreative.situation}" because it produced the strongest qualified-lead signal in this sample.`
    : "No winner yet. Keep collecting events.",
  ""
].join("\n");

const out = path.join(outputDir, "weekly-report.md");
await fs.writeFile(out, report);
console.log(`wrote ${out}`);

