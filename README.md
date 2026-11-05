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

See [V14 research/import guide](docs/V14-wikidata-import.md) for the workflow, safety checks and example SQL. The exporter has not yet completed a verified live API harvest in GitHub Actions; until then, only the separately documented page-reviewed sample has been staged.

**None of V14's crossover candidates are currently available as scored trivia questions.** We still need audited career coverage and API-backed gameplay before launch.

## V14 — Premier League 2026/27 pre-January pilot

**First full-season pilot changed from 2024/25 to the ongoing 2026/27 Premier League**, using a dated research snapshot as of **November 4, 2026**. The snapshot in private Supabase now has **all 20 current club participants** (including Coventry, Hull and Ipswich), **three pending summer-transfer facts**, and **zero verified current-season player appearance records**. The Summer 2026 Transfer Mode remains **disabled**.

A bounded Wikidata discovery workflow has been added for the 16 still-unmapped Premier League club QIDs and candidate player–club memberships. All research data stays in review, with no change to V13 scoring. We do **not** bulk-copy Premier League website squad lists because the site terms restrict database reuse.

See [2026/27 season checkpoint](docs/V14-epl-2026-27.md) and [GitHub Actions research workflow](.github/workflows/epl-season-research.yml) for the next steps.
