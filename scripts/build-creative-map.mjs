import { readJson, slug, writeJson } from "./lib.mjs";

const brand = await readJson("config/brand.json");

const creatives = brand.creativeAngles.map((angle, index) => ({
  id: slug(angle.id ?? `${angle.format ?? "creative"}_${index + 1}`),
  format: angle.format ?? "text",
  situation: angle.situation,
  hook: angle.hook,
  punch: angle.punch,
  proof: angle.proof ?? brand.offer.proof,
  message: angle.message,
  cta: brand.offer.cta ?? "LEARN_MORE",
  imageBrief: angle.imageBrief
}));

await writeJson("data/creative-map.json", {
  brand: brand.name,
  campaign: brand.campaign,
  landingUrl: brand.landingUrl,
  offer: brand.offer,
  creatives
});

console.log(`wrote ${creatives.length} creatives to data/creative-map.json`);
