import fs from "node:fs/promises";
import path from "node:path";
import { ensureOutput, loadEnv, outputDir, readJson, slug } from "./lib.mjs";

const args = new Set(process.argv.slice(2));
const execute = args.has("--execute");
const limitArg = [...args].find((arg) => arg.startsWith("--limit="));
const creativeArg = [...args].find((arg) => arg.startsWith("--creative="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;
const requestedCreative = creativeArg ? creativeArg.split("=")[1] : undefined;

await loadEnv();
await ensureOutput();

const brand = await readJson("config/brand.json");
const prompts = await readJson("config/prompts.json");
const creativeMap = await readJson("data/creative-map.json");
const references = await readJson("config/references.json");

const generatedDir = path.join(outputDir, "generated-images");
await fs.mkdir(generatedDir, { recursive: true });

const model = process.env.OPENAI_IMAGE_MODEL || brand.creativeDefaults?.imageModel || "gpt-image-2";
const size = process.env.OPENAI_IMAGE_SIZE || brand.creativeDefaults?.imageSize || "1024x1024";
const quality = process.env.OPENAI_IMAGE_QUALITY || brand.creativeDefaults?.imageQuality || "low";
const outputFormat = process.env.OPENAI_IMAGE_FORMAT || brand.creativeDefaults?.outputFormat || "png";

function referencePatternFor(creative) {
  const hit = references.ads.find((ad) => ad.segment === creative.format || ad.format === creative.format || ad.format?.includes(creative.format));
  return hit ? `${hit.format}; visual=${hit.visual}; hook=${hit.hook}; proof=${hit.proof}` : prompts.referencePatternFallback;
}

function promptFor(creative) {
  const replacements = {
    brandName: brand.name,
    audience: brand.audience?.primary ?? "",
    offer: brand.offer?.headline ?? brand.offer?.name ?? "",
    situation: creative.situation,
    referencePattern: referencePatternFor(creative),
    imageBrief: creative.imageBrief ?? "",
    voice: (brand.voice ?? []).join(", "),
    palette: JSON.stringify(brand.palette?.[creative.format] ?? brand.palette?.text ?? {})
  };

  return prompts.imagePromptTemplate
    .join("\n")
    .replace(/\{(\w+)\}/g, (_, key) => replacements[key] ?? "");
}

let creatives = creativeMap.creatives;
if (requestedCreative) creatives = creatives.filter((creative) => creative.id === requestedCreative);
if (Number.isFinite(limit)) creatives = creatives.slice(0, limit);

if (!creatives.length) {
  console.error("No creatives matched the requested filter.");
  process.exit(1);
}

const plan = creatives.map((creative) => ({
  creativeId: creative.id,
  model,
  size,
  quality,
  outputFormat,
  prompt: promptFor(creative),
  outputPath: `output/generated-images/${slug(creative.id)}.${outputFormat}`
}));

await fs.writeFile(path.join(outputDir, "image-generation-plan.json"), `${JSON.stringify({ mode: execute ? "EXECUTE" : "DRY_RUN", count: plan.length, plan }, null, 2)}\n`);
await fs.writeFile(
  path.join(outputDir, "image-prompts.md"),
  [
    "# Image Prompts",
    "",
    ...plan.flatMap((item) => [`## ${item.creativeId}`, "", "```text", item.prompt, "```", ""])
  ].join("\n")
);

if (!execute) {
  console.log(`dry-run only; wrote ${plan.length} image prompts to ${path.join(outputDir, "image-generation-plan.json")}`);
  console.log("run with --execute to call the OpenAI Image API");
  process.exit(0);
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is required for --execute");
  process.exit(1);
}

const results = [];
for (const item of plan) {
  const body = {
    model: item.model,
    prompt: item.prompt,
    size: item.size,
    quality: item.quality,
    output_format: item.outputFormat
  };

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    results.push({ creativeId: item.creativeId, ok: false, status: response.status, error: payload.error?.message ?? "OpenAI API request failed" });
    continue;
  }

  const image = payload.data?.[0]?.b64_json;
  if (!image) {
    results.push({ creativeId: item.creativeId, ok: false, status: response.status, error: "No b64_json image returned" });
    continue;
  }

  const target = path.join(generatedDir, `${slug(item.creativeId)}.${item.outputFormat}`);
  await fs.writeFile(target, Buffer.from(image, "base64"));
  results.push({ creativeId: item.creativeId, ok: true, outputPath: target, usage: payload.usage ?? null });
  console.log(`wrote ${target}`);
}

await fs.writeFile(path.join(outputDir, "image-generation-results.json"), `${JSON.stringify(results, null, 2)}\n`);

if (results.some((result) => !result.ok)) process.exit(1);
