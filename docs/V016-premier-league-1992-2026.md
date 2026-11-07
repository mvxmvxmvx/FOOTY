# Premier League season membership — complete 1992/93 to 2026/27

## Scope

FOOTY now records the **clubs participating in each Premier League season**, starting with the competition's 1992/93 creation and extending through the current 2026/27 campaign. This is **club-season membership**, not player appearances, league standings, or historical squads.

| Metric | Count |
| --- | ---: |
| Premier League seasons covered | 35 (1992/93–2026/27 inclusive) |
| Unique clubs represented | 51 |
| Complete club-season membership facts | 706 |
| New playable season questions | 35 |
| Memberships in 1992/93, 1993/94, 1994/95 | 22 each |
| Memberships in 1995/96–2026/27 | 20 each |
| Current season (2026/27) club members | 20 |

### Sources

1. [Premier League official clubs archive and season selector](https://www.premierleague.com/en/clubs): archived/current season club participant lists.
2. [List of Premier League clubs](https://en.wikipedia.org/wiki/List_of_Premier_League_clubs): independent club-by-club promotion/relegation spells; reviewed against exact season team counts and official current membership.
3. [Premier League 2026/27 season officially starts](https://www.premierleague.com/en/news/4673099/the-202627-premier-league-season-officially-starts/): Coventry, Hull and Ipswich confirmed promoted members, Burnley/Wolves/West Ham out.
4. [Premier League 2026/27 club overview](https://www.premierleague.com/en/news/4365156): official list of all 20 current clubs and six founding ever-present clubs.

The 2026/27 membership is valid **during the ongoing season**; it is not a prediction of the final table, promotion, or relegation. The club `Wimbledon FC` is retained as its own historical entity; no conflation with modern AFC Wimbledon or Milton Keynes Dons.

## Scoring and gameplay

- Facts are represented as `pl_season_YYYY_YYYY` club relations, referencing existing verified club entities and dated sources; no new club entity was needed.
- One new `classic` question per season: 'Name a club that played in the YYYY/YY Premier League season.' The engine accepts exactly those season participants and known canonical aliases.
- 1992/93 has 22 scored answers; 2026/27 has 20; 1995/96 onward have 20.
- A club's provisional rarity tier for a season is based on its *overall Premier League season count* as a consistent editorial starting heuristic: 1 season → 85; 2–3 → 60; 4–10 → 30; 11–20 → 15; 21+ → 10. This is a relative *historical footprint*, **not an observed human response frequency**, and may be adjusted by editorial review.
- The existing 51-club question 'Name a club that has played in the Premier League' continues to use its own curated membership relation. The archive adds specific season subsets; it does not duplicate that question.
- All 35 season-specific question templates participate in the existing Practice and Daily question pools. Review the rotation after playtesting to avoid too many similar history prompts in any seven-question match.

## Integrity checks

The automated tests enforce exactly 35 season relations, 706 unique membership facts, 51 clubs, 22/20 season size, the six founding ever-present clubs, 20 correct current members, historical promotion/relegation gaps, one-season club exceptions, typed-answer aliases, and verification rejecting nonmembers. Tests for the original 56 templates remain.

## Important next steps

**This does not add the players for every Premier League club across every season**. Player/club appearances need separate complete, verifiable senior playing records, careful handling of transfers and loans, historical club names, and the distinction between registered squad members, on-field appearances, and starting lineups. This requires a separate data-import and review effort before asking 'Name a player who appeared for Club A during 1998/99' or cross-club career questions.

Before merge: manual desktop/mobile review, check Daily retention across a dataset update, confirm question rotation variety, and review provisional rarity against question difficulty. The draft PR targets v0.1.15 rather than main.
