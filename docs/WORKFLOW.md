# Workflow

## Operating Loop

1. Collect Meta Ad Library reference observations.
2. Use Codex to summarize reusable patterns.
3. Convert brand offer and reference patterns into creative angles.
4. Generate image backgrounds with `gpt-image-2`.
5. Add text overlays with deterministic code.
6. Generate redacted Meta payloads and review UTMs.
7. Decode lead events by `utm_content`.
8. Decide weekly: scale, rewrite, pause, or create variants.

## Why Text Overlay Is Code

Image generation is good for photographic or illustrative backgrounds, but paid social tests need fast copy variation and exact UTM mapping. The kit generates background imagery without readable text, then uses Codex-controlled rendering for hook, punch, proof, CTA, and campaign IDs.

## Reuse Contract

A new brand should only need to replace:

- `config/brand.json`
- `config/references.json`
- files under `assets/brand/`
- `.env`
- sample lead export in `data/lead-events.jsonl`

The scripts should remain reusable.
