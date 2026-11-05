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
- Meaningful momentum-driven special opportunities and defensive difficulty, with balancing; no hidden modifiers in v0.1.15.
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
