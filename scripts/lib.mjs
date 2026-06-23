import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const outputDir = path.join(root, "output");
export const configDir = path.join(root, "config");

export async function ensureOutput() {
  await fs.mkdir(outputDir, { recursive: true });
}

export async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));
}

export async function writeJson(relativePath, value) {
  const target = path.join(root, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, `${JSON.stringify(value, null, 2)}\n`);
}

export async function readLines(relativePath) {
  const text = await fs.readFile(path.join(root, relativePath), "utf8");
  return text.split(/\r?\n/).filter(Boolean);
}

export async function loadEnv(relativePath = ".env") {
  const envPath = path.join(root, relativePath);
  try {
    const text = await fs.readFile(envPath, "utf8");
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator === -1) continue;
      const key = line.slice(0, separator).trim();
      let value = line.slice(separator + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
    return true;
  } catch {
    return false;
  }
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "");
}

export function redact(value, fallback = "REDACTED") {
  if (!value || /REDACTED|example/i.test(value)) return fallback;
  const text = String(value);
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}
