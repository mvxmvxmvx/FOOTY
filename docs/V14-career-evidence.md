# V14 — Career Evidence, Source Policy and Question Safety

## What is live as of 2026-11-04
The Supabase project has **287 partial player-club season observations** representing **248 distinct people** and **14 clubs**. They were derived from 20 previously reviewed FOOTY question cohorts, not from a bulk third-party dataset. `backfill-career-evidence.sql` reproduces this import. Every row is source-linked, and the import is idempotent.

**These are evidence of club participation, not complete transfer histories.** A Champions League final XI proves a player represented that club that season, but it does **not** establish the exact contract dates, number of appearances or all other clubs in the player's career. Null dates and appearances are intentional.

Initial draft overlap examples: Ashley Cole (Arsenal/Chelsea), Thierry Henry (Arsenal/Barcelona), Arjen Robben (Chelsea/Bayern), Samuel Eto'o (Barcelona/Inter), Robert Lewandowski (Dortmund/Bayern).

## Crucial product rule
A partial two-club intersection can reveal *some* correct players. It cannot establish that everyone else is incorrect. **Do not promote these generated crossover questions to live gameplay** until the relevant club histories have adequately reviewed coverage. No changes were made to V13's scored Daily Challenge.

## Next scalable provider: Wikidata
- Wikidata's structured statements are published under **CC0**; in football careers `P54` (member of sports team) can carry `P580`/ `P582` start/end dates.
- Reconcile incoming identities by stable QIDs; names alone are insufficient, especially for homonyms, nicknames and accent variants.
- Distinguish loans, youth teams, reserve teams and senior appearances. Empty qualifiers cannot be interpreted as full-season tenure.
- Keep provider references, retrieval date, raw snapshots, normalization errors and reviewer status.
- Validate duplicate statements, inconsistent year ranges, and team-nation mix-ups.
- Import small controlled batches first, review errors, then scale with rate limits.
- Avoid republishing Transfermarkt-derived datasets without separately checking their underlying rights and terms. Open-source scraper licenses don't automatically grant rights to the scraped data.

## Review pipeline
1. **Discover** allowed data sources and their reuse conditions.
2. **Stage** imported statements with source, external identifier and temporal qualifiers.
3. **Resolve** players and clubs to canonical FOOTY entity IDs.
4. **Review** source quality and completeness by club/era before publishing generated questions.
5. **Release** approved question versions, never silently expanding accepted-answer sets mid-daily challenge.

Try `crossover-candidates.sql` in the Supabase SQL editor to view lower-bound overlap candidates. This query is intentionally read-only.

## Decision still open
Move from `player_club_spells` as a partial observation store to distinct `player_club_membership_evidence` and `player_contract_spells` when comprehensive career data arrives; contract date claims are not justified by one squad appearance.
