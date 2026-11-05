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

## Product-owner eligibility policy — agreed 2026-11-04

**Core rule: For an unqualified question asking which *clubs* a player "played for," require at least one verifiable senior first-team competitive appearance for that club.** Include domestic league, domestic cup and international club competition appearances. Exclude training, trials, purely being under contract, unused-bench listings and friendlies. Being in a club's youth system, reserve side or national side is not by itself proof of a senior first-team appearance.

| Relationship | Default for "played for [club]" | Reason |
|---|---|---|
| Permanent senior first-team appearance | **Count** | The player featured competitively for the club |
| Senior competitive appearance while on loan | **Count** for the borrowing club | Loan does not reduce the level of competition; do not label as permanent transfer |
| Loan contract but no confirmed senior competitive appearance | **Do not automatically count** | Contract / registration alone does not establish an appearance |
| Academy or youth-only appearance | **Do not count** | A youth association is a different relationship |
| Reserve or B-team-only appearance | **Do not automatically count for the first team** | The reserve entity and first team have different eligibility |
| Later senior return to a former youth club | **Count the confirmed senior spell** | A player can have two distinct relationships with the same parent club |
| Senior national-team appearance | **Not a club** | Eligible only for appropriate international representation questions |
| Underage national-team appearances (U15–U21, etc.) | **Ignore for default game** | Separate international-youth category, not club academy development |

### Examples established by the product owner

- **Ashley Cole / Crystal Palace:** his loan qualifies when supported by a senior competitive appearance, regardless of the loan contract's temporary nature.
- **Arjen Robben / FC Groningen:** earlier academy history does not count; his later senior appearances **do** count. Store youth and senior spells distinctly, never overwrite one with the other. Earlier senior football, if verified, also counts independently of the later return.
- **Samuel Eto'o / Real Madrid Castilla:** a Castilla-only appearance does not make a Real Madrid first-team appearance. If a separate Real Madrid first-team appearance is verified, that independently qualifies.
- **Thierry Henry / France U21:** U21 football is not club football. We don't need youth national-team facts for present game formats.

### Future optional category: academy upbringing

Potential explicit question: **"Name a player who came through Chelsea's youth academy."** This is separate from senior appearances and could include players who never made a Chelsea first-team appearance, provided an objective academy-membership definition, time coverage and reliable evidence are agreed before publishing.

Youth *national* teams are not interchangeable with *club academies*. Never infer a Chelsea academy relationship from England U19 or vice versa.

### Evidence and publication gates

1. Source P54 "member of sports team" is **membership evidence**, not by itself proof of competitive match participation. It remains a staged claim until match/appearance evidence is established.
2. Match-level or authoritative appearance statistics are needed to confirm senior eligibility. A season/squad roster is insufficient unless the question explicitly says "named in squad" or the source documents actual appearances.
3. Store claim type and review status separately: `senior_competitive_appearance`, `loan_membership`, `academy_membership`, `reserve_appearance`, `national_senior`, `national_youth`, and `unconfirmed_team_membership` are conceptual evidence categories, **not yet implemented database enum values**.
4. A player's eligibility for a first team does not transfer automatically from its academy, B team, or reserves, and vice versa.
5. Questions must state any unusual inclusion rule (e.g. "including academy players" or "including friendlies") explicitly. No silent exceptions.
6. Do not release a crossover question from this partial dataset. Even several verified correct answers cannot prove every other valid answer is represented.

**Status:** agreed as product policy and documented for the V14 implementation. This does **not** mean eligibility scoring is already running in the engine or that all underlying source claims have been individually reviewed.

## Engineering follow-up

- The five existing club IDs in this audit are now attached to `footy.external_entity_links` and to their source claims in the private database.
- New senior clubs to create after checking duplicates and aliases: LA Galaxy, FC Groningen, Anzhi Makhachkala, RCD Mallorca, Antalyaspor, Konyaspor, Qatar SC. Avoid incorrectly merging reserve/youth national teams into parent entities.
- The ID for Netherlands U15 (Q61768534) is supported by its link within [Robben's P54 profile](https://www.wikidata.org/wiki/Q43913); a direct entity-page lookup was not available. Flag for an additional check rather than assuming 100% independent verification.
- Maintain pending claims and reject unqualified scoring until source references and era/competition coverage are evaluated.
