import fs from "node:fs/promises";
import path from "node:path";
import { ensureOutput, escapeHtml, outputDir, readJson, slug } from "./lib.mjs";

const data = await readJson("data/creative-map.json");
const brand = await readJson("config/brand.json");
await ensureOutput();
const creativeDir = path.join(outputDir, "creatives");
await fs.rm(creativeDir, { recursive: true, force: true });
await fs.mkdir(creativeDir, { recursive: true });

const fallbackPalette = {
  text: { bg: "#FDFCF9", ink: "#111513", accent: "#2D6A4F", chip: "#D4E6DA" },
  photo: { bg: "#101411", ink: "#FFFFFF", accent: "#C17B5F", chip: "#F0DDD3" },
  test: { bg: "#12251D", ink: "#F7F3EA", accent: "#F2CF8C", chip: "#D4E6DA" }
};
const palette = { ...fallbackPalette, ...(brand.palette ?? {}) };

function svgFor(creative) {
  const colors = palette[creative.format] ?? palette.text;
  return `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1080" fill="${colors.bg}"/>
  <rect x="64" y="76" width="280" height="56" rx="28" fill="${colors.chip}"/>
  <text x="92" y="113" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="#111513">${escapeHtml(creative.format.toUpperCase())}</text>
  <text x="64" y="230" font-family="Arial, sans-serif" font-size="68" font-weight="800" fill="${colors.ink}">${escapeHtml(creative.hook)}</text>
  <text x="64" y="346" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${colors.accent}">${escapeHtml(creative.punch)}</text>
  <foreignObject x="64" y="500" width="900" height="190">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; font-size: 38px; line-height: 1.35; color: ${colors.ink};">${escapeHtml(creative.message)}</div>
  </foreignObject>
  <rect x="64" y="790" width="780" height="74" rx="12" fill="${colors.chip}"/>
  <text x="96" y="838" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#111513">${escapeHtml(creative.proof)}</text>
  <text x="64" y="920" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${colors.ink}" opacity="0.74">${escapeHtml(brand.name)} · ${escapeHtml(creative.cta ?? "LEARN_MORE")}</text>
  <text x="64" y="972" font-family="Arial, sans-serif" font-size="28" fill="${colors.ink}" opacity="0.65">utm_content=${escapeHtml(creative.id)}</text>
</svg>`;
}

const links = [];
for (const creative of data.creatives) {
  const name = `${slug(creative.id)}.svg`;
  await fs.writeFile(path.join(creativeDir, name), svgFor(creative));
  links.push(`<li><a href="creatives/${name}">${escapeHtml(creative.id)}</a> - ${escapeHtml(creative.situation)}</li>`);
}

await fs.writeFile(
  path.join(outputDir, "contact-sheet.html"),
  `<!doctype html><meta charset="utf-8"><title>Creative Contact Sheet</title><style>body{font-family:system-ui;margin:32px} iframe{width:260px;height:260px;border:1px solid #ddd;margin:8px}</style><h1>Creative Contact Sheet</h1>${data.creatives.map((c) => `<iframe src="creatives/${slug(c.id)}.svg"></iframe>`).join("")}<ul>${links.join("\n")}</ul>`
);

console.log(`wrote ${data.creatives.length} creatives to ${creativeDir}`);
