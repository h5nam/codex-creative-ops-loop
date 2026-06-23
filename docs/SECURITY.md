# Security

## Do Not Commit

- `.env`
- OpenAI API keys
- Meta access tokens
- ad account IDs
- page IDs
- pixel IDs
- raw customer data
- production campaign IDs
- private screenshots from Ads Manager

## Public Demo Boundary

This repository generates dry-run payloads only. The Meta script writes JSON for review and intentionally performs zero live writes.

## Reference Safety

Reference brands should be used to extract patterns:

- format
- visual structure
- hook category
- proof category
- funnel step
- policy risk

Do not copy their logos, trademarks, screenshots, exact images, or exact copy.

## OpenAI Image Generation

The image generator reads `OPENAI_API_KEY` only when `--execute` is supplied. Dry-run mode writes prompts and does not call the API.
