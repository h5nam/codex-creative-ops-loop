import fs from "node:fs/promises";
import path from "node:path";
import { ensureOutput, exists, loadEnv, outputDir, readJson, root } from "./lib.mjs";

const strictLive = process.argv.includes("--strict-live");
await ensureOutput();
await loadEnv();

const errors = [];
const warnings = [];

for (const file of ["config/brand.json", "config/references.json", "config/meta.json", "config/prompts.json"]) {
  if (!(await exists(file))) errors.push(`Missing ${file}`);
}

const brand = errors.length ? null : await readJson("config/brand.json");
const references = errors.length ? null : await readJson("config/references.json");
const meta = errors.length ? null : await readJson("config/meta.json");

if (brand) {
  for (const key of ["name", "campaign", "landingUrl", "offer", "creativeAngles"]) {
    if (!brand[key]) errors.push(`config/brand.json missing ${key}`);
  }
  try {
    new URL(brand.landingUrl);
  } catch {
    errors.push("config/brand.json landingUrl must be an absolute URL");
  }
  if (!Array.isArray(brand.creativeAngles) || brand.creativeAngles.length === 0) {
    errors.push("config/brand.json creativeAngles must include at least one creative");
  }
  for (const asset of brand.assets ?? []) {
    const assetPath = path.join(root, asset.path);
    try {
      await fs.access(assetPath);
    } catch {
      const message = `${asset.path} not found`;
      if (asset.required) errors.push(message);
      else warnings.push(message);
    }
  }
}

if (references && (!Array.isArray(references.ads) || references.ads.length === 0)) {
  errors.push("config/references.json ads must include at least one reference row");
}

if (meta) {
  for (const key of ["pageIdEnv", "adAccountIdEnv", "pixelIdEnv", "accessTokenEnv"]) {
    if (!meta[key]) errors.push(`config/meta.json missing ${key}`);
  }
}

if (strictLive && meta) {
  const liveEnv = [
    "OPENAI_API_KEY",
    meta.accessTokenEnv,
    meta.adAccountIdEnv,
    meta.pageIdEnv,
    meta.pixelIdEnv
  ];
  for (const name of liveEnv) {
    const value = process.env[name];
    if (!value || /REDACTED|example/i.test(value)) errors.push(`Missing live env ${name}`);
  }
}

const report = [
  "# Setup Check",
  "",
  `Strict live mode: ${strictLive ? "yes" : "no"}`,
  "",
  "## Errors",
  "",
  ...(errors.length ? errors.map((error) => `- ${error}`) : ["- none"]),
  "",
  "## Warnings",
  "",
  ...(warnings.length ? warnings.map((warning) => `- ${warning}`) : ["- none"]),
  ""
].join("\n");

await fs.writeFile(path.join(outputDir, "setup-check.md"), report);

if (errors.length) {
  console.error(report);
  process.exit(1);
}

console.log(`config ok; wrote ${path.join(outputDir, "setup-check.md")}`);
