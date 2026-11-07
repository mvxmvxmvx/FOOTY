# Premier League player-history ingestion

## Goal

Build a complete, *appearance-verified* history for every club in every
Premier League season from 1992/93 to 2026/27. There are **706 club-seasons**
and **51 clubs** in the current league-membership ledger. **A club's presence
in a season does not establish its players.**

## Current reviewed player-season pilots

| Season | Club | League players | Starts | Substitute appearances | League goals | Status |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 1992/93 | Arsenal | 29 | 462 | 69 | 40 | Reviewed complete |
| 1992/93 | Manchester United | 20 | 462 | 41 | 66 | Reviewed complete |

**2 of 706 club-seasons reviewed complete; 704 pending.** Both available as
scored questions (29 / 20 verified accepted names, respectively). Existing
other historical questions are unaffected.

## Requirements for the next season or club

1. Identify the club using FOOTY's stable \`club_...\` ID and verify it was
   in the specified Premier League season.
2. Use the *Premier League* appearance list, NOT the entire football season,
   the club's registered squad or a Transfermarkt team photo/roster.
3. Record a stable \`player_...\` ID for each person, resolving namesake
   collisions manually. A player may appear for TWO PL clubs during the same
   season if transferred and actually played for each.
4. Record season starts, substitute appearances and league goals. Total
   appearances = starts + substitute appearances. A player with zero starts
   and at least one substitute appearance **must count**.
5. Reconcile the roster against a second source's player count and validate
   **11 × 42 = 462 starts** per club in 1992/93–1994/95, **11 × 38 = 418**
   for completed seasons from 1995/96 onward. This start-count reconciliation
   is for completed seasons; ongoing 2026/27 needs a separate dated snapshot
   rule before any "complete" claim.
6. Require named, traceable sources and explicit \`reviewed_complete\`
   coverage approval. Pending or partially reviewed manifests cannot score.
7. Maintain at least **11 verified accepted players per new game question**.
8. Run \`npm test\`, \`npm run qa\` and inspect historical names, substitutions,
   transfers and loan cases before promoting.

## Data model

Each reviewed JSON manifest at
\`data/premier-league/player-seasons/YYYY-YYYY/club-name.json\` has:

- league, start year, club ID and historical season label;
- review/coverage status and expected number of **appearing players**;
- source publisher, URL and reference IDs;
- player ID, name, position, starts, substitute appearances, total league
  appearances and league goals.

Player identities are global across seasons; player-season memberships are
separate records. Stats belong to the season, not to the player's entire
career. Club-spell history and transfer events can be derived from the
verified season observations *after* checking precise transfer dates.

The compact verified question bank stores a relation per reviewed club-season.
The review manifest retains the richer stats. Source links travel with every
fact. The importer refuses collisions, missing sources, incomplete squads,
nonparticipants and incorrect starting-XI totals.

### Adding a reviewed new club-season

Create a manifest using the existing two examples, verify it manually and run:

\`\`\`bash
node scripts/import-pl-player-seasons.js \
  --manifest data/premier-league/player-seasons/1992-1993/arsenal.json
\`\`\`

This is a **dry run**. The final reviewed import uses \`--write\`. Do NOT
re-import an existing season; the importer will refuse duplicated facts.
Report coverage:

\`\`\`bash
node scripts/pl-season-coverage.js
\`\`\`

## Source hierarchy

- Premier League official stats: historical appearances and goals available
  from 1992/93; more detailed stats added in later years.
- Crosscheck club-season league appearance tables from 11v11 and FBref.
- Transfermarkt roster archives are candidate discovery, **not evidence that
  a player made a Premier League appearance**.
- Wikidata P54 club memberships are useful to research identities and spells
  but are **not exhaustive, and do not prove league appearances**.
- Prefer storing independently checked *facts*, not bulk republishing
  proprietary provider tables. Review source licenses/terms before any
  automated collection or redistribution.

Sources:
- https://www.premierleague.com/en/stats/clarification
- https://www.11v11.com/teams/arsenal/tab/players/season/1993/comp/1/
- https://www.11v11.com/teams/manchester-united/tab/players/season/1993/comp/1/
- https://fbref.com/en/comps/9/1992-1993/1992-1993-Premier-League-Stats

## Career/connection game safety

The per-club history questions may go live only when the particular roster
is fully reviewed. "Played for both Manchester United and Arsenal at any
time" is **NOT safe to score** while most seasons are unreviewed. Otherwise
many legitimately correct names would be rejected. Broad career questions
require complete longitudinal coverage or a deliberately narrower date scope.

No made-up player-percentile statistics, missing appearances, inferred
transfers, or automatically "approved" roster rows.
