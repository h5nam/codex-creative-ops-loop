import fs from "node:fs/promises";
import path from "node:path";
import { ensureOutput, outputDir, readJson, readLines } from "./lib.mjs";

const data = await readJson("data/creative-map.json");
const creativeMap = new Map(data.creatives.map((creative) => [creative.id, creative]));
const events = (await readLines("data/lead-events.jsonl")).map((line) => JSON.parse(line));
await ensureOutput();

const rows = events.map((event) => {
  const creative = creativeMap.get(event.utm_content);
  return {
    created_at: event.created_at,
    channel: `${event.utm_source}/${event.utm_medium}`,
    utm_content: event.utm_content,
    format: creative?.format ?? "unknown",
    situation: creative?.situation ?? "unknown",
    message: creative?.message ?? "unknown",
    qualified: Boolean(event.qualified)
  };
});

const md = [
  "# Decoded Leads",
  "",
  "| Time | Channel | UTM Content | Format | Situation | Qualified |",
  "| --- | --- | --- | --- | --- | --- |",
  ...rows.map((row) => `| ${row.created_at} | ${row.channel} | ${row.utm_content} | ${row.format} | ${row.situation} | ${row.qualified ? "yes" : "no"} |`),
  ""
].join("\n");

const out = path.join(outputDir, "decoded-leads.md");
await fs.writeFile(out, md);
console.log(`wrote ${out}`);

