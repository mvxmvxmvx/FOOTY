# V14 — Wikidata source adapter and review workflow

FOOTY now has **two distinct evidence tiers**:

1. **Curated historical club-season observations** — 287 partial memberships from previously reviewed squad/final data. These are *not* complete careers.
2. **Wikidata claim review staging** — 13 manually inspected P54 club-membership claims for four famous players, with 11 exact QID-to-FOOTY identity links (4 players and 7 clubs). All 13 are **pending**; none is currently in scored gameplay.

## Why this is important

Wikidata provides publicly reusable structured item statements under **CC0**. Footballers use *member of sports team* (`P54`) with optional start (`P580`), end (`P582`), loan (`P1642`) and youth (`P2094`) qualifiers.

However, **Wikidata is crowd-edited and incomplete**. Its P54 data can refer to youth sides or national teams; recorded match totals and exact start/end periods aren't always verified. We never infer a complete career from a handful of statements or assume a missing club means the player never played there.

## Source paths

- `data/external/wikidata-ids.json` — audited QID links to known player and club records.
- `src/lib/wikidata.js` — safe claim parser, keeps date *precision* and raw source statements.
- `scripts/fetch-wikidata.js` — small, bounded Wikidata Action API fetcher; **read-only**.
- `scripts/stage-wikidata-page-sample.sql` — reproducible idempotent SQL for the first 13 manually inspected Wikidata page claims (not fetched API statement GUIDs).
- `supabase/v14_wikidata_claim_staging.sql` — private staging tables already applied to the FOOTY Supabase project.
- `tests/wikidata.test.js` — tests for missing clubs, year/month/day precision, loans, youth flags and deprecated claims.
- `.github/workflows/wikidata-research.yml` — optional manually triggered GitHub Action that fetches a fresh sample and produces downloadable review artifacts; it **does not modify Supabase**.

## Running a source export

On a computer with Node.js 22+ and internet access:

```bash
npm test
npm run wikidata:export -- --out data/staging/claims.json --sql-out data/staging/stage.sql
```

Or on GitHub: **Actions → Wikidata career research sample → Run workflow**. A successful job provides `wikidata-review-sample` containing JSON and staging SQL (expires after 7 days).

FOOTY's ChatGPT working container cannot reach Wikidata directly, so the historical 13-claim starter sample was checked against the public Wikidata item pages. The live API exporter is present in GitHub, but **a successful GitHub-hosted harvest has not yet been verified**. Do not call these manually reviewed records an API harvest.

## Reviewing the export

1. Resolve every new player and team by **QID**, not by spelling or name similarity. Confirm identity with a second signal if ambiguous.
2. Keep `null` for unknown dates. A 2007 (year) qualifier stays `2007`; don't invent `2007-01-01`.
3. Detect loans using qualifier `P1642`. Do not assume non-loan when the qualifier is absent.
4. Quarantine unmapped clubs, youth/reserve sides, and national teams. Do **not** auto-create playable team records from unfamiliar QIDs.
5. Inspect statements' individual references and their publication rights; do not treat all statement metadata as authoritative.
6. Run the generated SQL only after reviewing it. This inserts into `footy.external_career_claims`, not `footy.player_club_spells` and not `footy.question_templates`.
7. Require a separate closed-world completeness check, editorial approval, and a question version before any new question enters the Daily Challenge.

## Useful read-only database checks

```sql
select provenance,review_status, count(*)
from footy.external_career_claims
group by provenance,review_status;

select p.name as player,c.name as club,e.observed_from,e.from_precision,
       e.observed_to,e.to_precision,e.loan_flag,e.review_status
from footy.external_career_claims e
left join footy.entities p on p.id=e.player_id
left join footy.entities c on c.id=e.club_id
order by p.name,e.observed_from;

select count(*) as unresolved
from footy.external_career_claims
where club_id is null or player_id is null or team_classification='unknown';
```

**No public API access was granted.** The private `footy` schema is not exposed to `anon` or `authenticated` clients. RLS is enabled, with no public policies.

Official references:
- https://www.wikidata.org/wiki/Wikidata:Data_access
- https://www.wikidata.org/wiki/Property:P54
- https://www.wikidata.org/wiki/Q45901
- https://www.wikidata.org/wiki/Q133556
- https://www.wikidata.org/wiki/Q43913
- https://www.wikidata.org/wiki/Q1255625

## Import checkpoint: 32-statement GitHub Actions sample

The first successful manually triggered research archive (`wikidata-review-sample.zip`) contained 32 unique P54 statement IDs across four player QIDs. It has now been staged in private Supabase alongside the earlier 13 manually inspected claims.

- **32/32** API claims have their complete original `raw_claim` JSON stored.
- **21/32** have one or more references embedded in their statement.
- **27/32** still lack a mapped FOOTY club ID; these are pending identity and type classification. The remainder have mapped IDs but are still unreviewed.
- **2** are marked with loan indicators.
- No new player-club observations or scored crossover questions were published from this sample.

The initial importer used `ON CONFLICT DO NOTHING`, which preserved the claims but could not repair missing `raw_claim` details on re-import. That is now corrected to **fill missing original JSON only**, without overwriting already stored raw statements or changing review approval.

A **successful fetch is not a completeness review**. Many Wikidata P54 statements lack direct references and some team QIDs represent national/youth/reserve teams. Future batches must resolve those separately before scoring.

## Next milestone

Fetch a fresh API sample in GitHub Actions, compare its raw P54 statements to the manually reviewed batch, map further club QIDs, then stage progressively larger batches. Only after a sampled dataset passes coverage audits do we consider new scored question formats.
