# FOOTY V14 — Development session handoff (2026-11-04, Pacific)

This file records actions performed and independently verified after authorization to advance the project without further product decisions. **No public release, scored-question expansion, account launch or destructive data migration was performed.**

## Verified completed work

### Local game preview repaired and isolated

- The browser's `public/assets/game.js` requested `GET /api/v1/bootstrap`, which the Node server had not implemented. The preview would fail on startup.
- `src/server/index.js` now provides this endpoint **only for explicit local development**, with `FOOTY_DEV_CLIENT_BANK=1`, a loopback bind address, and nonproduction settings.
- `npm run dev` enables this local-only compatibility mode. `npm start` does not enable it by default. **Never host the dev preview behind an Internet-facing reverse proxy.**
- The obsolete `public/assets/bank.js` contained the whole answer bank but was unused by current game logic; its HTML script tag and public asset were removed. The authoritative `data/curated-bank.json` is intact.
- HTTP tests cover the development bootstrap, rejection in public/production modes, 404 for obsolete bank asset, server validation, and seven-question daily plan.
- **Remaining security blocker:** `npm run dev` still performs client-side scoring and intentionally serves full answer data. A public competitive site must use server-authoritative scoring and must never use this development-only endpoint.

### Canonical, cross-season research archive

- Created private RLS-enabled `footy.research_team_memberships` with unique provider/statement identity, raw source text, team/player QIDs, collection context and separate review status.
- Archived **182** Arsenal P54 statements without deleting or changing the existing `footy.season_player_evidence` records. This avoids treating historical membership as a claim about the 2026/27 season.
- Retains **143** undated observations as research. All identities and dates remain provisional pending review; no source was automatically promoted to a verified senior competitive appearance.
- `src/lib/epl-season.js` generated SQL now stages both into the global archive and the original season research table **in one statement**. Conflicting archived statement URIs are not duplicated; existing review decisions remain intact. Validated SQL syntax using PostgreSQL `EXPLAIN`.
- Versioned schema and data backfill: `supabase/v14_global_research_memberships.sql`, `supabase/v14_research_review_notes.sql`, `scripts/backfill-global-research-memberships.sql`.

### A real misinformation example caught during research

- One Wikidata result, Q6782491 / **Masal Bugduv**, is a documented **fictional Moldovan footballer** used in a 2008 media hoax. The fact that its P54 team claim appeared in an Arsenal search proves a raw P54 statement is insufficient for scoring.
- Both archived and snapshot copies were explicitly marked `rejected` with preserved raw source data and an independent review note.
- Evidence: [The Irish Times on the hoax](https://www.irishtimes.com/sport/soccer/football-transfer-speculation-the-original-fake-news-1.3156950); [Irish Independent](https://www.independent.ie/sport/soccer/silly-season-how-a-figment-of-an-irish-journalists-imagination-made-it-on-to-the-times-top-50-most-wanted-young-players/35999638.html). Reproducible review: `scripts/reject-masal-bugduv-claim.sql`.
- **Verified latest archive:** 182 statements total = **181 pending / 1 rejected**. **0 approved senior appearances / 0 new scored answers**.

### Server-only future answer-set materialization

- Added `src/lib/answer-sets.js` and `tests/answer-sets.test.js`.
- Requires a dated `reviewed_complete` coverage decision before materializing an open-ended question. Applies the already-existing question-specific eligibility filters.
- Uses the existing six rarity tiers; provisional editorial scores are explicitly provisional, and crowd scores must match the exact question version and come from a strictly earlier frozen snapshot.
- Refuses to materialize if an eligible answer lacks valid rarity inputs, or if fewer than two approved answers exist. Generates a deterministic integrity checksum to detect answer-set changes, **not** to authenticate users.
- Draft-only. **This does not publish new questions or integrate them into the running website.**

### Unattended, read-only research automation

- Added `.github/workflows/epl-nightly-research.yml`, scheduled for **07:37 UTC daily**.
- Each scheduled run chooses one of 20 verified 2026/27 Premier League club QIDs using a deterministic day rotation, runs tests/QA, fetches one bounded Wikidata membership candidate batch, and uploads review artifacts/logs for **30 days**.
- Uses `permissions: contents: read`, no database credential and **no Supabase writes or game publication**. A later human or reviewed importer must process the artifacts before expiry.
- Public WDQS may throttle or time out. Reaching the 250-row limit marks possible truncation; **the sweep is not comprehensive appearances coverage**.
- The November 4 season snapshot is immutable. Later transfers/January updates require a new snapshot, not overwriting that checkpoint.
- This schedule is newly committed; its first scheduled run is **not yet confirmed**. If daily automation is too noisy or unwanted, disable this workflow under GitHub Actions.

## GitHub and Supabase checks

- Automated repository CI (`npm test` + `npm run qa`) returned green following the server, test, staging and review updates.
- Temporary intermediate CI failures during development were caused by a malformed regular expression and an over-escaped test assertion; both were corrected and subsequent runs succeeded.
- The research archive, season staging, fact counts and private-schema access were rechecked with read-only Supabase SQL.
- `footy.facts` remains **617**; `footy.season_club_participants` remains **20** for EPL 2026/27; `footy.season_player_evidence` remains **182**; `footy.research_team_memberships` is **182**. Summer Transfer Mode remains **disabled**.
- The `anon` database role has no usage permission on the private `footy` schema and no read access to the archive table.

## Gaps / risks — do not misstate as done

1. **Not an actual 2026/27 first-team appearance roster.** Wikidata P54 is team membership, not proof of competitive appearances. Missing dates, historical associations, reserve/youth/women's teams and genuine misinformation need review.
2. **Coverage is incomplete.** One club produced 182 raw statements; importing 20 similar batches is not equivalent to verified coverage, and raw results can be truncated at 250 per club.
3. **Question-time materialization and rarity are prototypes, not server-connected gameplay.** No crowd statistics or secure multiplayer submissions exist yet.
4. **The existing browser preview remains intentionally insecure as a competitive service.** It contains/obtains the complete verified answer bank in local development and checks answers in browser JavaScript. Do not deploy this mode publicly.
5. **Automation collects artifacts; it does not yet write findings into Supabase.** Source validation, extraction reliability and secure ingestion need to be engineered and audited. Don't add privileged DB secrets to a public workflow.
6. **The old source bank is still only 39 curated question templates.** A beta can launch from a carefully reviewed set, without completing all football history first.

## Recommended next order

1. Confirm the local `npm run dev` preview works end-to-end on desktop/mobile.
2. Define a licensed/independently sourced method of verifying current-season first-team competitive appearances; prove completeness for ONE club/season before scaling to 20.
3. Design a server-side, rate-limited answer validation path and persist question-versioned frozen answer sets. Run acceptance and security tests; keep the dev bootstrap disabled in any public deployment.
4. Persist question-version-aware play submissions, enforce deduplication, and compute rarity snapshots from genuine previous eligible answers only when sample size is sufficient.
5. Gradually build new modes from reviewed data: Transfer Trail first; open-ended Summer Arrivals only with closed and audited window coverage.
6. Playtest with friends, correct answer disputes, audit privacy/hosting costs, then publish a beta. No need to buy a paid data provider until verified licensing and value justify it.

## Quick read-only verification SQL

```sql
select 'global' as source, review_status, count(*) from footy.research_team_memberships group by review_status
union all
select 'season' as source, review_status, count(*) from footy.season_player_evidence group by review_status;

select enabled,coverage_status from footy.season_game_modes where mode_key='summer_2026_transfers';

select has_schema_privilege('anon','footy','usage') as anon_schema_access,
       has_table_privilege('anon','footy.research_team_memberships','select') as anon_archive_read;
```

Keep using `npm run dev` **locally only**. No user action is necessary to preserve this work in GitHub/Supabase.
