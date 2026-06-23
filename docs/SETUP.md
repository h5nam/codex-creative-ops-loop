# Setup

Use this checklist when adapting the workflow for a new brand.

## 1. Private Fork

```bash
cp .env.example .env
```

Never commit `.env` or production exports.

## 2. Brand Inputs

Edit `config/brand.json`:

- `name`
- `landingUrl`
- `offer`
- `voice`
- `policy`
- `palette`
- `creativeAngles`

Add optional approved assets under `assets/brand/`.

## 3. Reference Inputs

Edit `config/references.json` with brands and Meta Ad Library observations.

The workflow intentionally stores observations, not copied creative files. Use fields like format, visual pattern, hook, proof, CTA, landing page, and policy note.

## 4. Validate

```bash
npm run setup:check
```

For real generation credentials:

```bash
npm run setup:check:live
```

## 5. Run Dry-Run Loop

```bash
npm run demo
```

## 6. Generate Images

Dry-run prompt plan:

```bash
npm run image:generate
```

Real OpenAI call:

```bash
npm run image:generate -- --execute --limit=1
```

The default model is `gpt-image-2`. Override with `.env` only when intentionally testing another model.
