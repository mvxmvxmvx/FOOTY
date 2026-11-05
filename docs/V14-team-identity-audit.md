# FOOTY V14 — Wikidata team identity audit

Research sample: GitHub Actions Wikidata P54 batch, 32 statement records (4 players).
Of 27 originally unresolved references, there are 26 distinct QIDs. Classification completed against the original sample and Wikidata entity pages on 2026-11-04.

**Current breakdown for 32 statements:** 17 senior club *candidates*, 12 national teams (including U15–U21), 2 youth-club records and 1 reserve record.
The 17 club statements include 5 existing mappings from the original import, 5 newly linked existing FOOTY clubs, and 7 unmapped club statements (representing seven new club entities except FC Groningen appears twice, one youth and one senior). All claims remain `pending` and are not enabled for scoring.

**Crucial:** The category below is a *team-identity classification*. It is not approval of every player-team membership claim or the completeness of any career. In particular, FC Groningen has a youth and a senior observation, which must be classified separately.

| Wikidata QID | Team | Category | FOOTY entity | Notes |
| --- | --- | --- | --- | --- |
| [Q3590033](https://www.wikidata.org/wiki/Q3590033) | France U16 | national_team | Not yet mapped | Henry — youth national team |
| [Q1450568](https://www.wikidata.org/wiki/Q1450568) | France U17 | national_team | Not yet mapped | Henry — youth national team |
| [Q1450557](https://www.wikidata.org/wiki/Q1450557) | France U18 | national_team | Not yet mapped | Henry — youth national team |
| [Q2701714](https://www.wikidata.org/wiki/Q2701714) | France U19 | national_team | Not yet mapped | Henry — youth national team |
| [Q1344163](https://www.wikidata.org/wiki/Q1344163) | France U20 | national_team | Not yet mapped | Henry — youth national team |
| [Q1277549](https://www.wikidata.org/wiki/Q1277549) | France U21 | national_team | Not yet mapped | Henry — youth national team |
| [Q47774](https://www.wikidata.org/wiki/Q47774) | France senior national team | national_team | Not yet mapped | Henry — senior national team |
| [Q19467](https://www.wikidata.org/wiki/Q19467) | Crystal Palace | senior_club | `club_crystal_palace` | Ashley Cole — loan |
| [Q2739](https://www.wikidata.org/wiki/Q2739) | Roma | senior_club | `club_roma` | Ashley Cole |
| [Q204357](https://www.wikidata.org/wiki/Q204357) | LA Galaxy | senior_club | Not yet mapped | Ashley Cole — club not yet in FOOTY |
| [Q47762](https://www.wikidata.org/wiki/Q47762) | England senior national team | national_team | Not yet mapped | Ashley Cole — senior national team |
| [Q19470](https://www.wikidata.org/wiki/Q19470) | Derby County | senior_club | `club_derby_county` | Ashley Cole |
| [Q601723](https://www.wikidata.org/wiki/Q601723) | Netherlands U17 | national_team | Not yet mapped | Robben — youth national team |
| [Q514714](https://www.wikidata.org/wiki/Q514714) | Netherlands U19 | national_team | Not yet mapped | Robben — youth national team |
| [Q24711](https://www.wikidata.org/wiki/Q24711) | FC Groningen | senior_club | Not yet mapped | Robben — BOTH youth 1996–2000 and senior 2020–2021 statements; per-claim classification is essential |
| [Q1837832](https://www.wikidata.org/wiki/Q1837832) | VV Bedum | youth_club | Not yet mapped | Robben — youth club (do not count as senior) |
| [Q61768534](https://www.wikidata.org/wiki/Q61768534) | Netherlands U15 | national_team | Not yet mapped | Robben — verified through link from player Q43913; direct item page unavailable, recheck |
| [Q19353](https://www.wikidata.org/wiki/Q19353) | Anzhi Makhachkala | senior_club | Not yet mapped | Eto'o — club not yet in FOOTY |
| [Q1457](https://www.wikidata.org/wiki/Q1457) | Sampdoria | senior_club | `club_sampdoria` | Eto'o |
| [Q8835](https://www.wikidata.org/wiki/Q8835) | RCD Mallorca | senior_club | Not yet mapped | Eto'o — club not yet in FOOTY |
| [Q5794](https://www.wikidata.org/wiki/Q5794) | Everton | senior_club | `club_everton` | Eto'o |
| [Q43710](https://www.wikidata.org/wiki/Q43710) | Antalyaspor | senior_club | Not yet mapped | Eto'o — club not yet in FOOTY |
| [Q175309](https://www.wikidata.org/wiki/Q175309) | Cameroon senior national team | national_team | Not yet mapped | Eto'o — senior national team |
| [Q12217](https://www.wikidata.org/wiki/Q12217) | Real Madrid Castilla | reserve | Not yet mapped | Eto'o — reserve side, separate from Real Madrid first team |
| [Q513840](https://www.wikidata.org/wiki/Q513840) | Konyaspor | senior_club | Not yet mapped | Eto'o — club not yet in FOOTY |
| [Q1051203](https://www.wikidata.org/wiki/Q1051203) | Qatar SC | senior_club | Not yet mapped | Eto'o — club not yet in FOOTY |

## Product-owner decision (recommended defaults)

- Loans: **count** as playing for the loan club if the player featured for its senior team. Do not infer a permanent transfer.
- Academy/youth team: **do not count** as playing for the senior club unless the question explicitly includes youth football.
- Reserve/B team: **do not automatically count** toward first-team club crossover questions; e.g., playing for Real Madrid Castilla alone is not the same as playing for Real Madrid's first team.
- National and age-group representative teams: **separate from clubs**. They can drive national-team questions but not two-*club* crossovers.

Ask the product owner to confirm or challenge these before generating scored crossovers.

## Engineering follow-up

- The five existing club IDs in this audit are now attached to `footy.external_entity_links` and to their source claims in the private database.
- New senior clubs to create after checking duplicates and aliases: LA Galaxy, FC Groningen, Anzhi Makhachkala, RCD Mallorca, Antalyaspor, Konyaspor, Qatar SC. Avoid incorrectly merging reserve/youth national teams into parent entities.
- The ID for Netherlands U15 (Q61768534) is supported by its link within [Robben's P54 profile](https://www.wikidata.org/wiki/Q43913); a direct entity-page lookup was not available. Flag for an additional check rather than assuming 100% independent verification.
- Maintain pending claims and reject unqualified scoring until source references and era/competition coverage are evaluated.
