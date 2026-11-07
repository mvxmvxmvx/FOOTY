# FOOTY v0.1.16 — content and rarity audit

## Starting point and changes

- Initial baseline: **501 curated entities**, **617 reviewed relation facts**, **38 distinct relation keys**, **39 question templates**, and **37 referenced sources**. These are *not* 617 independently replayable questions.
- This first expansion adds **6 Football Connections templates**, taking the total to **45 question templates**. All six use the intersection (`allOf`) of two already-reviewed facts. They require at least two verified canonical answers, with explicit existing source IDs.
- No new player-club appearance facts were added or promoted from external research staging. No player-season/career data has been assumed complete.

### Added questions

| Template | Answers in current reviewed snapshot | Verified relations |
| --- | ---: | --- |
| Barcelona 2009 **and** 2011 UCL final starting XIs | 6 | `iconic_barca_2009` + `iconic_barca_2011` |
| Bayern 2013 **and** 2020 UCL final starting XIs | 4 | `iconic_bayern_2013` + `iconic_bayern_2020` |
| Premier League Golden Boot **and** men's Ballon d'Or | 3 | `won_pl_golden_boot` + `won_mens_ballon_dor` |
| Men's World Cup **and** men's European Championship winners | 4 | `won_mens_world_cup` + `won_euros` |
| Bundesliga **and** European Cup winners | 3 | `won_bundesliga` + `won_european_cup` |
| Italian top-flight **and** European Cup winners | 3 | `won_italian_top_division` + `won_european_cup` |

The new questions enter the existing balanced `classic` and `europe` Practice rotation. Daily remains a fixed seven-question lineup per UTC date; new templates enter the deterministic pool without altering a match already saved.

## Rarity: what we can and cannot say today

The six tiers are *editorial*, not player-frequency percentiles:

| Curated score | UI rarity |
| ---: | --- |
| 10 | Familiar |
| 15 | Solid Shout |
| 30 | Clever |
| 60 | Rare |
| 85 | Deep Cut |
| 100 | One in a Million |

The post-goal **Rarity Dossier** shows the verified answer, its curated rarity grade, and a factual comparison *within the answer pool for that one question*: e.g. '2 of 11 verified answers rank this rare or rarer.' This **is not** a claim that 2 of 11 players knew it, or a statistical rarity percentile. The best accepted answer receives a full-time spotlight and appears in share text.

Until real consenting player-response samples support measured answer rarity, don't display numerical percentages of players, popularity claims, or 'top x% of players'. Curated grades may have to change when observed frequency exists. An ethical future observed-rarity calculation should consider **question-specific answer opportunities**, valid unique participants, sample-size thresholds, time windows, and protection against gaming/repeated attempts. Local match history is not an eligible population sample.


## Second batch — four verified Champions League finals

The first curated player expansion uses historical match lineups published by UEFA (confirmed starting XIs, **no bench players**). This extends the scoreable bank without treating incomplete club-career membership data as exhaustive.

| Final | First club | Second club | New relation facts |
| --- | --- | --- | ---: |
| 2008 | Manchester United | Chelsea | 22 |
| 2014 | Real Madrid | Atlético Madrid | 22 |
| 2024 | Borussia Dortmund | Real Madrid | 22 |
| 2025 | Paris Saint-Germain | Inter Milan | 22 |

- **60 newly introduced player entities**, which are distinct from the 88 final-XI observations (some players were already present or started several finals).
- **88 verified player–starting-XI facts** across eight independent question pools.
- **Eight new starting-XI question templates**, plus **three source-grounded final-to-final crossover questions**: Chelsea 2008+2012 (4 answers), Real Madrid 2014+2017 (6), Madrid 2017+2024 (2).
- **Totals after both batches:** 561 entities, 705 facts, 56 question templates, 41 source references.
- Starters and substitutes are intentionally distinguished. A substitute who appeared later is *not* an accepted answer for a starting-XI question.
- Each player carries a provisional editorial rarity score (10–100) for its specific final; no real player-response frequencies or percentiles are asserted.

### Source checks (confirmed lineups)

- [UEFA 2008 final starting XIs](https://www.uefa.com/uefachampionsleague/news/025a-0ea65cda9562-d0b852985d36-1000--chelsea-seek-to-scale-old-trafford-fortress/)
- [UEFA 2014 final starting XIs](https://www.uefa.com/uefachampionsleague/news/0220-0e9b110ff81a-60010236cd6e-1000--real-madrid-v-atletico-background/)
- [UEFA 2024 final starting XIs](https://www.uefa.com/uefachampionsleague/news/028e-1b07e18d875a-ba78e4b9d9fc-1000--report-madrid-win-champions-league/)
- [UEFA 2025 PSG–Inter final starting XIs](https://www.uefa.com/uefachampionsleague/match/2044466--paris-vs-inter/lineups/)

The additional `tests/finals-expansion.test.js` covers every starting XI (exactly 11), representative players excluded for being substitutes, crossover membership, alias acceptance, and source tracing.

### Next content-development concerns

- Rarity grades assigned to this batch are **provisional editorial judgments** and should be reviewed against consistent criteria.
- Review same-name collisions, surname-only ambiguity, and era-specific spellings in the context of each question.
- This batch expands final-XI coverage only; it **does not** establish complete club careers, manager tenure, player nationalities or historical season appearances.

## Expansion gate

The next *true factual* expansion is reviewed player-club career spells, season/manager/transfer data and cross-club player lists. The existing private review/staging area contains candidate observations but **none of them are automatically publishable facts**. Require exact club identity, real senior appearances/season coverage, loan handling, sufficient source coverage, editorial review and tests before scored questions can be generated.

## QA / release gate

- [x] Six verified intersections have at least two answers each, existing source IDs and test coverage.
- [x] A separate rarity module and tests distinguish editorial grade from population statistics.
- [ ] Review new question wording against the cited original facts with a human editor.
- [ ] Run `npm test` and `npm run qa` on Node >= 22.13 for the latest expanded branch.
- [ ] Play several Practice matches; confirm new categories appear, accepted crossover names score, and low/high rarity dossiers display correctly.
- [ ] Test Daily fixed lineup and full-time sharing after the change.
- [ ] Test desktop and mobile readability for the rarity dossier.
- [ ] Do not merge until visual QA and editorial review.

The full animations, profiles/collectible inventories, public rarity leaderboards and shareable video export remain separate milestones.
