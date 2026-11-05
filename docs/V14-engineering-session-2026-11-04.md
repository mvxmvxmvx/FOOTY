# FOOTY V14 — Engineering audit and work session
_2026-11-04 (Los Angeles time) | State verified against connected GitHub Actions and Supabase_

## Scope and boundaries

This was a **development-only** pass. Do not equate the deployed V13-style browser prototype with a production-ready website. No feature was enabled or newly reviewed as playable, no player data was deleted, and no production auth or leaderboard was set up.

## Confirmed data state

| Metric | Verified |
| --- | ---: |
| Original curated FOOTY seed (entities/facts/templates) | 501 / 617 / 39 |
| Existing curated player-club-season observations | 287 |
| Player identities in private Supabase | 344 (including 3 summer-transfer sample players) |
| PL 2026/27 participants and verified Wikidata club QIDs | 20 / 20 |
| Arsenal Wikidata P54 statements, source-archived | 182 |
| Arsenal season-research candidate rows | 182 |
| Missing start date on Arsenal statements | 143 |
| Arsenal candidate review statuses | 181 pending, 1 rejected, 0 reviewed |
| Verified Arsenal men's PL 2026/27 appearances from this batch | 0 |
| Summer-transfer sample events | 3, pending |
| Summer-transfer game mode | **Disabled** |
| Public browsing of the private `footy` schema (anon/auth roles) | **Denied** |

The Arsenal observation universe contains historical, possibly women's or youth and undated associations; **Wikidata P54 membership does not prove senior competitive participation**. The 182 statements have been archived for future historical research, not silently treated as 2026/27 gameplay answers. Lack of a start date means unknown, not current.

## Completed engineering improvements

### 1. Future-proof rarity analytics (prototype only)

Added `src/lib/rarity-aggregate.js` and `tests/rarity-aggregate.test.js`. The pure aggregate logic only counts matching, server-verified and server-accepted Daily Mode events from human accounts. It drops bots/staff, practice, unknown answer IDs, other question versions, impossible timestamps, after-snapshot events and duplicate user-answer choices. It exposes aggregate counts, never raw user IDs.

Rarity remains frozen by question version and cutoff. Its denominator is distinct accepted account-answer selections, not unique players and not all database records. The prior `src/lib/rarity.js` still requires a 500-selection sample before crowd-based scoring; otherwise reviewed editorial points remain explicitly provisional.

**Not implemented:** secure user identity, persistent submissions, privacy/rate-limit policy, scores shown to online users. No observed popularity is available from real FOOTY players yet.

### 2. Answer set time boundaries

Hardened `src/lib/answer-sets.js` so club-appearance question `asOf` and transfer `windowEnd` must be valid calendar dates and may not fall after `publishDate`. Tests reject future 2026/27 match records and winter 2027 window data from a November 2026 published question.

### 3. Transfer-type correctness

Hardened `src/lib/eligibility.js`: standard `transfer_arrival` prompts default to `permanent`, `loan` or `free` deals. `loan_return` and `unknown` are not silently included; a different question must explicitly enable those types. Extended eligibility and materialization tests.

**Still needed:** explicit verified completion/registration evidence, because `announced_on` alone can reflect a deal that never closed. No transfer answers have been published.

### 4. Validation and security verification

- GitHub Actions FOOTY checks after all changes: **45 tests passed, 0 failed**, QA accepted **623 canonical answers across 39 existing questions**.
- The private `footy` schema is still inaccessible to `anon` and `authenticated`; new archive tables retain RLS. The Supabase security advisor reports **INFO: RLS enabled with no policies** on private research tables, which is an intentional deny-by-default configuration, not permission to expose those tables.
- Existing public game code is still the V13 browser client. It uses a full bundled-bank bootstrap that is deliberately restricted to loopback development and does not work in production. Public server routes are not an authenticated, rate-limited live scoring platform.

## Unattended process and its limitations

`.github/workflows/epl-nightly-research.yml` is present: scheduled, read-only, rotates one verified EPL club per day, runs tests, and uploads export artifacts. It uses **no Supabase write credentials** and does not enable questions.

**Critical gap:** GitHub artifacts expire after 30 days and are not automatically ingested into long-term Supabase research. The nightly schedule has not been established as having executed successfully yet. Further work should implement a secure, limited pending-only archive ingest with explicit credentials and audit trails; never grant scheduled imports scoring or publication rights.

## Launch blockers (in priority order)

1. Obtain appropriately licensed, current and historic *appearance-level* evidence. Wikidata P54-only discovery is incomplete and mixes relationships.
2. Verify team/player identity and source rights in a scalable, reviewed pipeline. Design completeness gates per open-ended question; don't claim 182 is a complete 2026/27 Arsenal squad.
3. Finish server-side question materialization with authenticated review/approval and immutable scored answer snapshots. Current eligibility/rarity functions are **prototype modules**.
4. Integrate a client with server-authoritative verify and rarity, without exposing full accepted-answer sets; deploy to staging with durable data and logs.
5. Implement account/guest identity protections, abuse limits, daily submissions and leaderboard integrity if these features ship in V1.
6. Run representative playtests: reject invalid responses, accept all valid answers for declared coverage, test spelling, duplicate names, mobile UI and daily time boundaries.
7. Publish a restricted friends-and-family beta **before** attempting exhaustive football history. Transfer Mode can follow once its deal-completion and coverage policy is settled.

## Recommended next discrete task

**Implement a secure pending-only historical-evidence ingest** for automated research artifacts, then run a small second-club sample and audit results. Do not connect broad unverifiable P54 data to live gameplay. A small complete senior appearance dataset and beta backend remain higher value than a huge unverified archive.

## Relevant references

- [Arsenal discovery workflow run](https://github.com/mvxmvxmvx/FOOTY/actions/runs/41954990496).
- [2026/27 research overview](V14-epl-2026-27.md).
- [Knowledge-base and rarity policy](V14-knowledge-and-rarity.md).
- [Nightly read-only workflow](../.github/workflows/epl-nightly-research.yml).
- [Current curated questions QA](../scripts/qa.js).
