# FOOTY / 7-Nil — Locked scope and development track

## v0.1.15 — Match experience (this branch)

1. Match-first interface, bottom momentum-pitch card and compact event timeline.
2. Five-second, reviewed, multiple-choice counterattack following every skipped/timed-out attacking question. Save = no concession; wrong/expired = opposition goal. Defensive questions are **not** among the seven attacks and cannot spawn additional counters.
3. One simple, rarity-weighted momentum rule (start at 50, correct tiers 10/15/30/60/85/100 => +5/+8/+12/+18/+25/+35; miss => -14; clamp 0..100). Momentum is currently visual/storytelling only. It never changes question difficulty, game success, counter probability, or match rating.
4. Two distinct full-time results: a 6.0-start performance rating based on accuracy, and an editorial knowledge grade based on accepted-answer rarity. Rare+ and signature-moment counts.
5. Local profile match history: last 50 **completed** matches stored in browser localStorage, with normalized structured events (question ID, answer, rarity, shot, defense outcome, momentum); no account/cloud sync. Daily mid-match saves retain defense deadline.

### Existing rules retained

- Seven attacks; one goal per verified answer, regardless of rarity.
- 25-second main question timer and retryable invalid guesses.
- One shared seven-question Daily lineup in UTC, randomized Practice lineup.
- Rarity-based six cinematic styles and provisional Goal of the Match.
- Provisional editorial rarities are **not** statistically measured player response frequencies.

### Reviewed defensive question seed data

The pool in `public/assets/counter-questions.js` has 12 fixed prompts and hand-reviewed distractors. They use simple historical football facts and four choices.

Reference sources:
- FIFA World Cup winners: https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1982-2026-italy-argentina-germany-brazil-france-spain
- UEFA Champions League winners and finals: https://www.uefa.com/uefachampionsleague/news/0253-0d800ac7cffa-8147de94780e-1000--the-1999-champions-league-final-20-years-on-most-dramatic-ever/
- UEFA EURO 2016 Portugal: https://www.uefa.com/uefaeuro/history/news/0253-0d81bb224907-848e17427a3f-1000--portugal-become-tenth-different-euro-winner/
- UEFA EURO 2024 Spain: https://www.uefa.com/uefaeuro/history/news/028f-1b61cc9835db-185592165f27-1000--uefa-euro-2024-at-a-glance/
- Arsenal Invincibles: https://www.premierleague.com/en/news/693629

## Later — explicitly deferred

- Detailed animation polish and a One-in-a-Million movie-style cinematic; do not interrupt gameplay engineering for this.
- Four training variants (Friendly, Derby Day, European Night, Legends Only).
- Additional special opportunity types and momentum-driven defensive difficulty, with balancing; **no hidden question-difficulty modifiers** in v0.1.15. One optional Moment of Magic Practice opportunity is now implemented.
- Rewards, achievements, limited kits, profile showcase, custom boots/crowns, gallery and inventory.
- Downloadable/shareable match highlight videos; event-log foundations exist now.
- Multiplayer/ranked/tournaments; proper server-side gameplay authorization and anti-cheat.
- Penalty shootouts for draws.
- Remove/hide temporary animation test lab on public release.

## Pre-merge QA checklist

- [ ] Run `npm test` with Node >= 22.13.0
- [ ] Play full 7-goal match: 7–0, 10.0 rating, knowledge grade varies by answer rarity
- [ ] Miss/skip: check 5-second counter timer; verify a correct save keeps 0 conceded
- [ ] Miss/skip: wrong option or timeout concedes 1 with no *additional* match-rating deduction
- [ ] Counter does not add an eighth attacking question or trigger another counter
- [ ] Refresh Daily mid-counter: deadline should persist and expired defense should concede
- [ ] Refresh Daily mid-question: existing round deadline should persist
- [ ] Check momentum at low/high values and the full-time knowledge/Signature Moments panel
- [ ] Play Practice and Daily end-to-end on mobile and desktop; verify last-50 local history records
- [ ] Verify six goal animations and dev-only test lab still function

**Do not merge before visual and end-to-end QA.** This branch is based on `feature/v0.1.14-match-engine`, not currently on `main`.

## v0.1.15 feedback pass — distinct outcomes and momentum clarity

- Correct attack = attacking goal animation; successful counter defense = keeper intervention; failed counter defense = opposition goal. The counter result no longer reuses an attacking miss animation. Outcome classification is regression tested.
- Rare (85) and One-in-a-Million (100) answers receive a special staged presentation with elevated typography and crowd-energy effects. This is a gameplay-level reveal improvement, **not** the later bespoke movie-quality One-in-a-Million cinematic.
- Momentum now states which team has the initiative and describes the last swing using the answer/goal style or the missed attack, while transparently explaining that momentum currently affects atmosphere and the story, not question difficulty, correctness or actual counterattack odds.
- Goal-of-the-Match replay is explicitly made visible after a last-round defensive outcome.
- The current CSS/SVG graphic treatment remains a prototype; visual browser QA is essential. Further anime-style cinematic polish stays deferred as agreed.

## Momentum → Moment of Magic (implemented in this branch)

- In **Practice only**, reaching **80+ momentum** after an attack and before the final round unlocks a **one-time optional** offer *before* the next attack's 25-second clock starts.
- **Take the challenge:** an unused verified European-final or World Cup-final question replaces the upcoming normal attack. The replacement is drawn from the existing curated answer database, and only questions with at least one verified Rare+ answer are eligible.
- **Decline:** play the originally scheduled question without penalty. The one-time opportunity is then spent.
- During the challenge any verified answer still scores exactly **one goal**. The **Moment of Magic** accolade requires a verified answer with the current provisional editorial rarity of at least **60**. A more familiar verified answer still scores, but does not win that accolade.
- Wrong/no answer still means a missed attack and the existing **five-second counterattack**; no additional shot, no extra rating deduction, and never an eighth round.
- Successful accolade is called out in the post-round reveal, full-time report, sharing text and structured local match history, including `momentOfMagic: 'earned'` and the `'moment-of-magic'` accolade ID. This is *match-history recognition*, not a functional collectibles inventory.
- Daily challenge lineup, match rating, and general Knowledge Grade thresholds remain unchanged. Momentum never automatically changes question difficulty; this one optional choice is the only momentum-enabled question swap.
- Out of scope: special edition item drops, unlockable kits/boots, multiple special opportunity varieties, dynamic difficulty, One-in-a-Million full cinematic, video download.

### Moment of Magic QA to add to manual run

- [ ] Reach 80 via rarity; offer appears before next attacking round, not during the countdown
- [ ] Decline: normal question and no second offer, even if momentum stays at 80+
- [ ] Accept: verified special question replaces exactly one attack, 25-second clock begins after choice
- [ ] Common verified answer: one normal goal but no accolade; Rare+ (60+) answer: one goal plus local accolade
- [ ] Miss special question: normal defensive counterattack, no extra round or punishment
- [ ] Reach 80 on attack seven: no phantom eighth round
- [ ] Daily never offers choice or alters its fixed question lineup
- [ ] Full-time results and local saved event show whether special opportunity was earned or merely attempted
