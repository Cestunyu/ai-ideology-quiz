# Current AI Governance Persona State

Last updated: 2026-07-06

## Current Boundary

- This repository is the AI Governance Persona app repo.
- The personal homepage has been split into `/Users/yuun/Documents/GitHub/linenyu-site`.
- `https://ai-persona.linenyu.com/` belongs to this repo.
- `https://linenyu.com/` belongs to the `linenyu-site` repo.
- Root `/` in this repo redirects to `/en/`.
- Vercel is the only active deployment route for this repo.
- EdgeOne and GitHub Pages deployment files have been removed from the active app repo.

## Current Deliverable

- `/en/` and `/cn/` are the production quiz/result/share pages.
- `/fun/` is a language-aware lightweight entry route. `/fun/cn/` and `/fun/en/` use the production quiz/result/share shell with the lightweight question set, persona weights, 18-question count, separate draft keys, local-only result behavior, and no formal-quiz navigation link.
- `data/quiz.en.json` and `data/quiz.zh.json` are the canonical quiz sources.
- `npm run quiz:sync-html` pushes canonical JSON into the embedded page constants.
- `api/`, `lib/`, `admin/`, and `supabase/` provide the Vercel + Supabase result-storage path.
- `ai-governance-spectrum*.html` and `ai-*profiles*.html` remain public supporting browse/profile pages.

## Recent Checkpoints

- 2026-07-06: Replaced the GitHub Actions `VERCEL_TOKEN` secret with a LinenYu-scoped Vercel token, reran release run 28800340563, and confirmed both `Release gate` and `Deploy production` succeeded. Live checks on `https://ai-persona.linenyu.com/fun/cn/` and `/fun/en/` found the corrected profile-avatar paths and zero old `../assets/profile-pictures/` references.
- 2026-07-06: Fixed `/fun/cn/` and `/fun/en/` result/share avatar paths from `../assets/...` to `../../assets/...`; the old path resolved to `/fun/assets/...` and made final profile pictures fail to load. Added release-check coverage for the fun avatar asset path.
- 2026-06-29: Ran three fresh respondent-agent passes on `/en/`, `/cn/`, and `/fun/`; added explicit pilot/not-validated caveats on intro and result pages; softened “closest reference” to “nearby reference point”; clarified C03/R01/H04 canonical wording without changing scores; split the lightweight route into `/fun/en/` and `/fun/cn/`; updated fun gates and release checks for both locales.
- 2026-06-28: Rebuilt `/fun/` from the Chinese production `index.html` shell so entry, pager, result page, map, nearest-person block, classification stability, share image, and save-image flow stay aligned; only the lightweight questions/count/scoring differ.
- 2026-06-28: Made `/fun/` independent from the production quiz navigation and added automatic next-question advance after single-answer selection.
- 2026-06-28: Promoted the fun persona quiz out of `demos/` into `/fun/` as a public lightweight version with its own question/scoring set, result flow, draft persistence, and release gates.
- 2026-06-28: Added GitHub Actions release automation: push/PR runs release gate plus bundle build; production deploy is available through a manual workflow using `VERCEL_TOKEN`, with opt-in push-to-prod via `AUTO_DEPLOY_PRODUCTION=true`.
- 2026-06-25: Created branch `codex/structure-cleanup`.
- 2026-06-25: Committed checkpoint `fc87938` for the working Vercel dynamic state before restructuring.
- 2026-06-25: Committed `3cb86c1` to clarify Vercel as the default route and make quiz edits data-first.
- 2026-06-25: Split the personal homepage into `/Users/yuun/Documents/GitHub/linenyu-site`.
- 2026-06-25: Removed personal homepage assets and old EdgeOne/GitHub Pages deployment files from this app repo.
- 2026-06-25: User confirmed the two obsolete Tencent Cloud / EdgeOne projects were deleted externally.

## Active Product Order

1. Modularize the frontend so quiz data, scoring, rendering, sharing, and locale copy are no longer trapped inside monolithic HTML files.
2. Continue personal homepage work in `/Users/yuun/Documents/GitHub/linenyu-site`.
3. Finish Supabase/Vercel production env setup and strict live verification.
4. Keep quiz copy changes data-first: edit `data/quiz.*.json`, run `npm run quiz:sync-html`, then run `npm run release:check`.
5. Review quiz items for audience fit, fun, accessibility, and measurement validity.

## Active Files

- `README.md`
- `AGENTS.md`
- `TODO.json`
- `data/quiz.zh.json`
- `data/quiz.en.json`
- `cn/index.html`
- `en/index.html`
- `fun/index.html`
- `fun/cn/index.html`
- `fun/en/index.html`
- `demos/fun-persona-quiz-gate.json`
- `demos/fun-persona-quiz-gate-en.json`
- `scripts/run-fun-persona-gate.mjs`
- `index.html`
- `api/`
- `lib/`
- `admin/`
- `supabase/quiz-results-schema.sql`
- `scripts/sync-html-from-canonical.js`
- `scripts/check-quiz-sync.js`
- `scripts/check-vercel-dynamic-release.js`
- `scripts/build-vercel-dynamic-bundle.js`
- `scripts/deploy-vercel-dynamic.sh`
- `docs/vercel-supabase-go-live.md`
- `docs/secrets.md`

## Next Session

1. Run another fresh human or respondent-agent pass on `/fun/en/` and `/fun/cn/`, watching for unstable profile results and jargon in result/reference copy.
2. Start frontend modularization from the current `/en/`, `/cn/`, and bilingual `/fun/` pages.
3. Keep GitHub Actions production deploy automation green; `AUTO_DEPLOY_PRODUCTION=true`, `VERCEL_PROJECT_NAME=ai-governance-persona`, `VERCEL_SCOPE=linen-yu`, and the LinenYu-scoped `VERCEL_TOKEN` are now configured.
4. If production storage is still needed, run the Supabase schema and set Vercel env vars using `docs/vercel-supabase-go-live.md`.

## Open Questions

- How far should frontend modularization go before moving to a framework?
- Should the app keep duplicated `/en/` and `/cn/` HTML during the first refactor, or generate both from shared modules?
- Should the production quiz use neutral profile labels while keeping meme labels only in share/result layers?
