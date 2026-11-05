# V14 — Full evidence archive, question-time eligibility, and rarity (design adopted)

**Decision (2026-11-04): KEEP all legally reusable observations, including old, undated, youth, women's, and contradictory records. Do not turn them into playable answers automatically.**

## Architecture: four separate jobs

1. **Research ingest**: retain raw source observations (source item/statement IDs, dates with precision, provenance, license, claimed player/club ID). Pending means *unverified*, not *deleted*. Record contradictions; never infer continuing membership from an absent end date.
2. **Evidence review**: resolve player and team identities, competition class, women's/men's, academy/reserve/first-team relationship, and verifiable senior competitive appearances. A Wikidata P54 membership alone does not satisfy the senior-appearance rule.
3. **Question materialization**: a question definition specifies the precise club/competition/season/date/relationship/transfer-window conditions. Produce a versioned, audited *eligible answer set* from approved evidence. Questions with incomplete open-ended coverage stay disabled. Materialize/freeze before players start; do not let the client query a raw database or award itself points.
4. **Rarity scoring**: only after the answer is eligible, evaluate its rarity **for that question version**, from real prior-player choices when statistically sufficient. Frozen score snapshots must be computed on the server ahead of a daily challenge.

This preserves a useful career archive while preventing false acceptance. **Stored ≠ verified ≠ eligible ≠ scored.**

## What changed after Arsenal's first 2026/27 discovery run

[GitHub run 41954990496](https://github.com/mvxmvxmvx/FOOTY/actions/runs/41954990496) returned 182 unique P54 player-team statements for the Arsenal club Wikidata item; 143 lack a start date. Many represent historic/youth/women's-team links, not 2026/27 men's first-team appearances.

Previous temporary staging code rejected the undated observations from the generated SQL. That was too restrictive for a *historical knowledge base*. Now:

- `src/lib/epl-season.js`'s `seasonStageSql` accepts **all 182** when they meet basic identity/provenance integrity checks; all are staged with `review_status='pending'`, `player_id=NULL`, `appearances=NULL`, `evidence_type='wikidata_membership'`.
- The `partitionSeasonCandidates` dated/undated report remains **review triage only**. It is not a deletion filter. The `snapshot_id` is the *research collection context*, never an assertion that the person appeared in the 2026/27 Premier League.
- The generated `club_arsenal-stage.sql` file stores the full list. Its pending observations cannot modify `footy.facts`, `footy.question_templates` or the current scoring engine.
- The pre-existing GitHub Actions ZIP is intact; applying the pending SQL to Supabase is a distinct explicit action and must be verified. **Do not claim it has been imported unless the database confirms.**

In a later phase, move cross-season evidence into a canonical global evidence table, rather than treating a 2026/27 research snapshot as a footballer career.

## Example filter rules (prototype: `src/lib/eligibility.js`)

- **2026/27 Arsenal senior appearance**: eligible only if `club_id='club_arsenal'`, the snapshot matches, the record is `reviewed`, evidence type is `competitive_appearance`, `appearances >= 1`, a canonical `player_id` exists, and the evidence date is on or before the question's as-of date. No extrapolation from missing P54 dates.
- **Summer 2026 arrivals**: approved transfer event to the specified club and transfer window. **Open-ended mode stays disabled until the entire window/club cohort passes coverage review**. A specific, fully verified Transfer Trail prompt may launch earlier without assuming complete league coverage.
- **Senior vs academy / reserves / international / women's divisions**: each is a different relationship, and only an explicitly matching question includes it.
- **Loans**: a verified senior competitive appearance for the loan club counts; a loan contract alone is not proof of an appearance.
- **Historical anything-ever**: consult the canonical reviewed player-club evidence, not just the 2026/27 research archive.

The current pure filter functions are an API/answer-set **prototype**, not a claim that website or server scoring is connected to Supabase.

## Six rarity tiers — proposed initial numerical policy

FOOTY already uses six fixed point values and tier names. Preserve their visuals and trophy mechanics.

| % of previous valid responses choosing that answer to this exact versioned question | Points | Tier |
| ---: | ---: | --- |
| 0–0.2% | **100** | ONE IN A MILLION (marketing name, not literal 1 in 1,000,000) |
| >0.2–1% | **85** | DEEP CUT |
| >1–3% | **60** | RARE |
| >3–10% | **30** | SOLID SHOUT |
| >10–25% | **15** | TECHNICALLY... |
| >25% | **10** | OBVIOUS! |

**Rate = distinct eligible prior responses choosing answer / all eligible valid responses submitted to the same question version in the same game population.** An invalid submission never enters the denominator. A user's repeated guesses are deduplicated by canonical answer, user identity and round. Practice, bots, rerolls, private tests and staff accounts are excluded from competitive daily rarity analytics.

- Require **at least 500 valid prior responses per question version** before presenting crowd-derived rarity as observed data; threshold is a provisional parameter, to adjust with traffic and stability analysis.
- Below that threshold, use **clearly labeled editorial rarity estimates** (the six existing V13 point values), but never describe them as empirical user statistics.
- New approved answers with no editorial score and insufficient real crowd history must remain *unscored/pending* rather than receiving a made-up bonus.
- Compute and **freeze** rarity snapshots on the server ahead of the game day/season round. Daily users should get identical points for the same answer, not changing odds as friends submit it.
- A rarity score is **question-specific**. The same footballer could be an obvious answer to one prompt and an exceptional deep cut for another.
- Preserve a record of `source='community' | 'editorial_provisional'`, sample size, snapshot date, question version, points and published eligible-answer-set revision.
- Avoid using internet searches, subjective fame metrics, Wikidata statement counts or the number of database rows as *measured player-choice rarity*.
- Account-level analytics must be secure and minimal; aggregating anonymous or repeated gameplay without controls can be manipulated.

### Implementation

- `src/lib/rarity.js`: pure point-tiers, rarity classification, sampling and snapshot requirement.
- `tests/rarity.test.js`: tier boundaries, provisional scoring, invalid aggregate handling and eligibility-first rule.
- `src/lib/eligibility.js`, `tests/eligibility.test.js`: strict question-specific selection over reviewed evidence.
- Existing V13 website still uses **editorial** points in its bundled bank until the server-authoritative backend, immutable versioned answer sets and population analytics are deployed.

## Important limitations

Even all records from one Wikidata query are not exhaustive, and some are mislabeled. A result below the 250-row query cap is **not** a completeness certificate. In future, use paginated, well-scoped research imports and additional independent licensed appearance evidence, with source/competition labels, to establish the answer universe.

The 2026/27 snapshot is a point-in-time research context. It is not a data license, historical career completion guarantee, or current competitive squad.
