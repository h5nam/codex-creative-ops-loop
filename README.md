# Codex Creative Ops Loop

Codex로 Meta 광고 소재 운영 루프를 복제 가능하게 만드는 공개 템플릿입니다.

```text
브랜드 설정 + 레퍼런스 브랜드
-> 레퍼런스 분석
-> 크리에이티브 맵 생성
-> gpt-image-2 이미지 프롬프트 / 이미지 생성
-> Codex 텍스트 오버레이
-> Meta dry-run payload
-> 리드 UTM 디코딩
-> 주간 의사결정 리포트
```

이 공개 버전에는 샘플 데이터와 redacted payload만 들어 있습니다. 실제 브랜드 자산, OpenAI API key, Meta 계정 값은 private fork의 `.env`에 넣어 사용하세요.

## 빠른 시작

```bash
cp .env.example .env
npm run demo
```

`npm run demo`는 OpenAI나 Meta API를 호출하지 않습니다. 설정 검증, 레퍼런스 ingest, creative map 생성, 이미지 프롬프트 작성, SVG 광고 카드 합성, redacted Meta payload 생성, 샘플 리드 디코딩, 주간 리포트 생성을 모두 로컬에서 실행합니다.

## 내 브랜드로 바꾸는 방법

1. `config/brand.json` 수정
   - 브랜드명, 랜딩 URL, 오퍼, 톤, 정책 규칙, 팔레트, `creativeAngles`를 바꿉니다.
2. `config/references.json` 수정
   - Meta Ad Library에서 본 레퍼런스 브랜드와 광고 관찰값을 넣습니다.
3. `assets/brand/`에 선택적 브랜드 자산 추가
   - 로고, 제품 사진, 승인된 visual reference, 브랜드 가이드 등을 넣습니다.
4. `.env`에 private credential 추가
   - `OPENAI_API_KEY`: gpt-image-2 이미지 생성용
   - Meta env 값: dry-run payload 검토용
5. 루프 실행

```bash
npm run setup:check
npm run refs:ingest
npm run analyze:refs
npm run creative:plan
npm run image:generate
npm run compose:cards
npm run meta:dry-run
npm run report:weekly
```

실제로 OpenAI Image API를 호출해 한 개 소재만 생성하려면:

```bash
npm run image:generate -- --execute --limit=1
```

생성 이미지는 `output/generated-images/`에 저장됩니다. 이 템플릿은 이미지 모델에 “읽을 수 있는 텍스트 없는 배경”을 만들게 하고, headline/proof/CTA는 Codex가 로컬 렌더러로 얹습니다. 그래서 카피 variation과 UTM mapping을 안정적으로 관리할 수 있습니다.

## 폴더 구조

```text
config/
  brand.json             # 브랜드, 오퍼, 타깃, 정책, 팔레트, creative angle
  references.json        # 레퍼런스 브랜드와 Meta Ad Library 관찰값
  meta.json              # Meta env 이름과 안전한 dry-run 기본값
  prompts.json           # gpt-image-2 프롬프트 템플릿
assets/
  brand/                 # private 브랜드 입력값
  reference/             # 선택적 레퍼런스 스크린샷 또는 export
data/
  reference-ads.csv      # config/references.json에서 생성
  creative-map.json      # config/brand.json에서 생성
  lead-events.jsonl      # 리포팅 데모용 fake/sanitized lead event
scripts/
  validate-config.mjs
  ingest-references.mjs
  build-creative-map.mjs
  generate-openai-images.mjs
  compose-cards.mjs
  meta-dry-run.mjs
  decode-leads.mjs
  weekly-report.mjs
```

## 운영 원칙

- `.env`, access token, ad account ID, page ID, pixel ID, 고객 데이터, production campaign ID를 커밋하지 마세요.
- 레퍼런스 광고는 “패턴 입력값”으로만 사용하세요. 로고, 상표, 스크린샷, 이미지, 카피를 그대로 복제하지 마세요.
- 새 campaign/ad는 review 전까지 `PAUSED` 상태를 기본으로 두세요.
- 이 공개 kit는 live Meta write를 하지 않습니다. 실제 write는 private fork에서 별도 `--execute` 플로우로 구현하세요.
- CPA, ROAS, 매출, lead quality는 dashboard/CRM export 근거가 있을 때만 검증된 수치로 말하세요.

## 문서

- `docs/SETUP.md`: 새 브랜드 적용 체크리스트
- `docs/WORKFLOW.md`: 전체 운영 루프
- `docs/SECURITY.md`: 공개/비공개 경계와 보안 규칙

---

## English Summary

Reusable git kit for a Codex-driven Meta creative workflow:

```text
brand config + reference brands
-> reference analysis
-> creative map
-> gpt-image-2 image prompts / image generation
-> Codex text overlay
-> Meta dry-run payloads
-> lead decoding
-> weekly decision report
```

The public version contains sample data and redacted payloads only. Put real brand files, API keys, and Meta account values in a private fork.

Quick start:

```bash
cp .env.example .env
npm run demo
```

To generate one image with the OpenAI Image API:

```bash
npm run image:generate -- --execute --limit=1
```

The template keeps image generation and text overlay separate: the image model creates background visuals without readable text, and Codex renders copy, proof, CTA, and UTM-controlled variants locally.
