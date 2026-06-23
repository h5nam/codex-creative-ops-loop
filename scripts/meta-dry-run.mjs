import fs from "node:fs/promises";
import path from "node:path";
import { ensureOutput, loadEnv, outputDir, readJson, redact } from "./lib.mjs";

await loadEnv();
const data = await readJson("data/creative-map.json");
const meta = await readJson("config/meta.json");
await ensureOutput();

function buildUrl(utmContent) {
  const url = new URL(data.landingUrl);
  url.searchParams.set("utm_source", meta.utm?.source ?? "meta");
  url.searchParams.set("utm_medium", meta.utm?.medium ?? "paid_social");
  url.searchParams.set("utm_campaign", data.campaign);
  url.searchParams.set("utm_content", utmContent);
  return url.toString();
}

const pageId = redact(process.env[meta.pageIdEnv], "PAGE_REDACTED");
const accountId = redact(process.env[meta.adAccountIdEnv], "act_REDACTED");
const pixelId = redact(process.env[meta.pixelIdEnv], "PIXEL_REDACTED");
const graphApiVersion = process.env.META_GRAPH_API_VERSION || meta.graphApiVersion;

const payloads = data.creatives.map((creative, index) => ({
  name: `ad_${String(index + 1).padStart(2, "0")}_${creative.id}`,
  status: meta.status ?? "PAUSED",
  ad_account_id: accountId,
  creative: {
    name: `cr_${creative.id}`,
    object_story_spec: {
      page_id: pageId,
      link_data: {
        link: buildUrl(creative.id),
        message: creative.message,
        name: creative.punch,
        description: creative.proof,
        call_to_action: {
          type: "LEARN_MORE",
          value: { link: buildUrl(creative.id) }
        }
      }
    }
  },
  tracking_specs: {
    pixel_id: pixelId,
    utm_content: creative.id
  }
}));

const out = path.join(outputDir, "meta-dry-run-payloads.json");
await fs.writeFile(out, JSON.stringify({
  mode: "DRY_RUN",
  writes: 0,
  graphApiVersion,
  campaign: {
    name: data.campaign,
    objective: meta.campaignObjective,
    buying_type: meta.buyingType,
    status: meta.status
  },
  requiredEnv: [meta.accessTokenEnv, meta.adAccountIdEnv, meta.pageIdEnv, meta.pixelIdEnv],
  payloads
}, null, 2));

console.log(`dry-run only; wrote ${payloads.length} redacted payloads to ${out}`);
