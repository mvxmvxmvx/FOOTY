# FOOTY v0.1.16 — content and rarity audit

## Starting point and changes

- Baseline: **501 curated entities**, **617 reviewed relation facts**, **38 distinct relation keys**, **39 question templates**, and **37 referenced sources**. These are *not* 617 independently replayable questions.
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

## Expansion gate

The next *true factual* expansion is reviewed player-club career spells, season/manager/transfer data and cross-club player lists. The existing private review/staging area contains candidate observations but **none of them are automatically publishable facts**. Require exact club identity, real senior appearances/season coverage, loan handling, sufficient source coverage, editorial review and tests before scored questions can be generated.

## QA / release gate

- [x] Six verified intersections have at least two answers each, existing source IDs and test coverage.
- [x] A separate rarity module and tests distinguish editorial grade from population statistics.
- [ ] Review new question wording against the cited original facts with a human editor.
- [ ] Run `npm test` and `npm run qa` on Node >= 22.13.
- [ ] Play several Practice matches; confirm new categories appear, accepted crossover names score, and low/high rarity dossiers display correctly.
- [ ] Test Daily fixed lineup and full-time sharing after the change.
- [ ] Test desktop and mobile readability for the rarity dossier.
- [ ] Do not merge until visual QA and editorial review.

The full animations, profiles/collectible inventories, public rarity leaderboards and shareable video export remain separate milestones.
