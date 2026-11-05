# FOOTY — Deep Cuts

FOOTY is a seven-round football knowledge and rarity game. Correct answers are validated against reviewed football records; rarer answers earn higher points. Features include a daily challenge, practice mode, streaks, a football-themed rarity reel and a trophy celebration for 100-point answers.

## Status

**V13 migration baseline (November 2026).** The curated seed contains **501 entities, 617 answer facts, 39 question types, 381 aliases and 37 source references**. The live Supabase project contains this seed in the private `footy` schema, with tables for future player careers, transfers, managers, stadiums, sponsors, awards and coverage review.

This repository is the version-controlled development home. Public hosting, player authentication, server-authoritative scoring, and broad historical career imports are **not yet deployed**.

## Gameplay

- 7 questions, 25 seconds per question
- Daily Challenge and unlimited Practice Mode
- Last-name recognition, conservative typo correction, and ambiguity handling
- Verified answers only. Invalid submissions keep the round open.
- Six rarity tiers, a stadium reel, and one trophy for every 100-point answer
- Local-browser streaks and trophies (no cloud synchronization yet)

## Architecture and security

- The existing curated data snapshot and playable frontend are maintained here.
- Supabase project `FOOTY` (US West) uses a **private `footy` PostgreSQL schema**, not exposed to anonymous clients.
- Dataset updates require evidence, completeness review, and approval before a new question is used for scoring.
- Never commit API keys, database URLs, passwords, or production secrets.
- Under construction: server-side API integration, an import pipeline, cloud accounts, and validated career-relationship questions.

## Project roadmap

1. Preserve the V13 playable website and establish a reproducible data snapshot.
2. Integrate API-backed data loading without exposing answer keys to competing clients.
3. Import approved historical player-club career data; track source and coverage.
4. Generate football connections and crossover questions from complete reviewed relations.
5. Improve matchday rotation, player accounts, and rarity analytics.

See `data/curated-bank.json` for the seed, `public/index.html` for the playable preview, and `supabase/README.md` for database deployment notes.

FOOTY is an independent fan project and is not affiliated with any football league or governing body.

## V14 — External football history import (November 2026)

We've opened a safe staging pipeline for Wikidata P54 club memberships.

- **287** previously curated club-season observations are stored in `footy.player_club_spells` (pending coverage review).
- **13** manually inspected external career claims across **four** players have been staged in `footy.external_career_claims` (all pending; none scores points).
- **11** exact Wikidata QID-to-FOOTY entity links have been recorded, covering four players and seven clubs.
- A **read-only** Wikidata Action API exporter and parser are now version-controlled in `scripts/fetch-wikidata.js` and `src/lib/wikidata.js`. It preserves date precision, identifies loans, quarantines unresolved team identities, and generates private staging SQL.
- A manual GitHub workflow, **Wikidata career research sample**, produces review artifacts without touching the live database.

See [V14 research/import guide](docs/V14-wikidata-import.md) for the workflow, safety checks and example SQL. The original four-player exporter has run successfully in GitHub Actions, and Wikidata P54 statements are now staged for review. The sampled claims are NOT verified senior appearances.

**None of V14's crossover candidates are currently available as scored trivia questions.** We still need audited career coverage and API-backed gameplay before launch.

## V14 — Premier League 2026/27 pre-January pilot

**First full-season pilot changed from 2024/25 to the ongoing 2026/27 Premier League**, using a dated research snapshot as of **November 4, 2026**. The snapshot in private Supabase now has **all 20 current club participants** (including Coventry, Hull and Ipswich), **three pending summer-transfer facts**, and **zero verified current-season player appearance records**. The Summer 2026 Transfer Mode remains **disabled**.

All 20 Premier League club Wikidata QIDs are verified and recorded. The workflow now targets review-only player–club membership candidates, with export logs preserved for troubleshooting. All research data stays in review, with no change to V13 scoring. We do **not** bulk-copy Premier League website squad lists because the site terms restrict database reuse.

See [2026/27 season checkpoint](docs/V14-epl-2026-27.md) and [GitHub Actions research workflow](.github/workflows/epl-season-research.yml) for the next steps.

## V14 — Evidence-first questions and rarity (November 2026)

FOOTY now retains **all 182** Arsenal/Wikidata research observations, including **143 undated** historical claims. These are staged in private Supabase as `pending`; none proves 2026/27 first-team appearances or feeds the scored game. The complete idempotent import is versioned in [`scripts/stage-epl-2026-27-arsenal.sql`](scripts/stage-epl-2026-27-arsenal.sql).

We have added **prototype** question-specific eligibility filtering (`src/lib/eligibility.js`) and a six-tier rarity model (`src/lib/rarity.js`). The proposed rarity scoring uses a prior, frozen question-version-specific player-choice rate when at least 500 valid responses exist. Until then, existing editorial points are explicitly provisional. **These modules are not yet connected to live scoring.**

See [Evidence archive, answer eligibility and rarity design](docs/V14-knowledge-and-rarity.md).

## V14 — Local preview, verified answer-set drafts and read-only overnight research

- **Run locally:** `npm run dev` starts the V13 browser preview on `127.0.0.1:4173`. This explicitly opts into the development-only `/api/v1/bootstrap` response containing the curated answer bank. **Never deploy this development process behind a reverse proxy or expose it publicly.**
- `npm start` does **not** enable the development-only answer-bank endpoint. The redundant `public/assets/bank.js` copy was removed. The full bank remains in `data/curated-bank.json` for the server.
- `src/lib/answer-sets.js` materializes **draft** eligible answer sets only from reviewed evidence with a complete scope review and a frozen, question-version-matched rarity input. It does not enable new live questions.
- The private global archive `footy.research_team_memberships` contains **182** Arsenal-source statements: **181 pending**, **1 rejected as a documented hoax**, with the original raw evidence retained. The 2026/27 season context must not be mistaken for a player appearance date.
- A **daily read-only GitHub Actions research sweep** rotates one Premier League club per day. It uploads source candidates and diagnostic files for 30 days, but does not automatically import claims into Supabase or change scored answers.

See [the verified November development handoff](docs/V14-development-session-2026-11-04.md) for exact work completed, remaining issues and the launch sequence.

## v0.1.14 — Seven-round Match Engine (feature branch)

- 7-Nil match presentation: a verified answer of **any** editorial rarity (including 10 points) scores one goal; a timeout or skipped round concedes one. Invalid guesses are not scored and can be retried within the round timer.
- Independent scorelines and rarity ratings: match result (e.g. 4–3) versus editorial performance (0–100 average of seven 0–100 round scores). The existing trophy system is retained.
- The official daily match still uses the shared UTC lineup and a single browser-local attempt; practice remains randomized and unlimited. V13 daily saves remain readable.
- Tests exercise match aggregation, 7–0, legacy daily data, and future draw compatibility.
- A seven-round binary goal/concession model never ties. Penalty shootouts are **deferred** pending a real neutral-round or alternative match rule; club customizer, live multiplayer, tournaments and ranked play are not part of this release.
- All scoring and answer keys remain **development-preview only**. Use `npm run dev` locally, not the unrestricted public internet; server-authoritative scoring is still required before launch.

## v0.1.14 match presentation update — match ratings and shooting pitch

- Solo matches begin at **6.0**. Each accepted answer contributes **+4/7** raw rating points; every skipped/timed-out attack contributes **−0.25**. The cumulative rating is clamped between **3.0 and 10.0** and displayed to one decimal. Seven correct answers yield **10.0**, regardless of the answer's provisional rarity data.
- A verified answer always scores one goal. A timeout or skip is a missed attack, receives a rating penalty, and (under the current single-player match model) concedes a goal. An unrecognized/ambiguous guess does not finish the round while time remains.
- The animated pitch is shown as a compact attacking preview while answering, then as an animated shot after a successful answer or miss. Animations respect reduced-motion preferences. The old rarity spin and editorial-point UI are removed.
- The curated database keeps its historical points for migration and research, but those points no longer affect match rating, goal events or visible results. Old locally saved daily challenge results continue to work.
- Penalty shootouts, club customization and multiplayer are deferred. Visual and full Node test-suite QA are required before merging.

## v0.1.14 — Goal cinematics test iteration

- A correct verified answer still scores exactly one goal, independently of rarity; the 6.0–10.0 rating remains accuracy-based.
- Six cosmetic goal presentations now use the existing *provisional* curated answer tiers: 10 tap-in; 15 driven; 30 finesse; 60 volley; 85 screamer; 100 bicycle kick. There is no random lottery reveal or point-based gameplay bonus.
- Solo mode uses a new SVG player, pitch, goalkeeper, goal net, ball trajectories, and style-specific motions. Each ball passes into the area bounded by the net, and the net reacts; reduced-motion settings are supported.
- **Goal of the Match (TEST)** selects the highest-tier verified goal of that match (first scored goal wins ties). At full time, replay it or preview all six finishing styles in the temporary animation test lab. Matches without goals have no award.
- Rarity tiers are still editorial placeholders. They communicate presentation flair, **not statistical player rarity**. Do not mistake a visual effect for a verified popularity rate.
- Full local/browser smoke testing is still required before merging the feature branch.

## v0.1.15 — Match UX and gameplay (draft PR)

The next gameplay sprint lives on `feature/v0.1.15-gameplay-ux`, branched from `feature/v0.1.14-match-engine`. See [the locked roadmap](docs/ROADMAP-v0.1.15.md) for scope, reviewed counterattack sources, manual QA and deferred features.

- A seven-attack match now contains *defensive five-second counters* following a missed/skipped attack. A successful defense prevents an opponent goal; a failed or timed-out defense concedes. Misses reduce match rating regardless of the defense result; defensive outcomes do not add attacks or chain.
- Each goal still counts as one. Curated answer rarity shifts the visual momentum indicator and determines goal flair and the separate Knowledge Grade; it does not alter match rating.
- The match interface displays the momentum pitch at the bottom, while the full-time report shows both match and knowledge grades and notable answers.
- Completed match events are saved locally in the player's browser (up to 50 matches, with IDs/answers/shot style/defense/momentum), ready for later gallery and video work.
- The existing Daily question lineup remains fixed for everyone by UTC date; Practice remains randomized. Counter deadlines are saved for Daily attempts.

To run: `npm test`, `npm run qa`, `npm run dev` then open `http://127.0.0.1:4173`. Do not merge without the visual QA checklist in the roadmap.
