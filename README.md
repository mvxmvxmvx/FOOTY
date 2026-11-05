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
