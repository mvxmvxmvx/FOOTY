# FOOTY friends beta — playable GitHub Pages + Supabase milestone

**Status (2026-11-05):** Supabase server API deployed and end-to-end seven-round test passed. Static website committed at `beta/`. GitHub Pages **NOT YET ENABLED** on the private repository. A user with repository administration rights must enable Pages, or create a separate public frontend-only Pages repository. Do not claim the expected Pages URL is live before the deployment workflow succeeds.

## Architecture

- GitHub `beta/index.html`, `beta/style.css`, `beta/app.js`: mobile-friendly static browser game. No secrets or list of accepted answers shipped to the browser.
- GitHub Actions `.github/workflows/deploy-footy-beta.yml`: deploys **only** `beta/` to GitHub Pages (does not publish source and research files).
- Supabase Edge Function `footy-beta`: public guest-session JSON API at `https://emcgyjlzxfpedxwlspfo.supabase.co/functions/v1/footy-beta`. Requests use a random session-token capability, origin checks, a two-hour expiry and one accepted submission per round. Server runs 25-second rounds with two seconds of grace.
- Supabase `public.footy_beta_questions`, `public.footy_beta_answers`: 39 existing reviewed V13 questions, 623 curated answer records with editorial points. **No** unverified V14 player claims.
- Supabase `public.footy_beta_sessions`, `public.footy_beta_submissions`: guest-beta round state, scores and submissions. All four tables have RLS and deny direct `anon` / `authenticated` access; only the Edge Function's server credentials access them.

## To activate the GitHub Pages site (requires repository owner)

1. Open **[FOOTY → Settings → Pages](https://github.com/mvxmvxmvx/FOOTY/settings/pages)** in a browser with admin access.
2. Under **Build and deployment**, select **GitHub Actions** as the source. If Pages is not offered because `FOOTY` is private on GitHub Free, **do not turn this research repository public**. Instead upgrade to an eligible GitHub plan or create a separate **public frontend-only** repository; only `beta/` should be published.
3. Open **[Deploy FOOTY friends beta](https://github.com/mvxmvxmvx/FOOTY/actions/workflows/deploy-footy-beta.yml)** and select **Run workflow** after Pages is enabled.
4. Wait until the deployment run shows green. The expected public project URL, subject to GitHub's own confirmation, is **https://mvxmvxmvx.github.io/FOOTY/**.
5. On phone, tap **Play a Round**, guess seven questions, check that correct answers receive points and wrong/timed-out answers score zero.

GitHub workflow diagnostics: first attempt failed at `configure-pages@v5` because the site was not enabled. The second attempt, with automatic `enablement:true`, failed because `GITHUB_TOKEN` cannot create a Pages site (`Resource not accessible by integration`). The owner must enable Pages manually.

## Automated verification

`scripts/smoke-beta.mjs` uses the hosted Supabase API to create an ephemeral session, verify a legitimate existing canonical answer, reject six invalid answers, and finish seven rounds. It additionally checks answer-bank privacy and attempts invalid-session-token/unknown-origin calls. The workflow `.github/workflows/footy-beta-smoke.yml` invokes this test in GitHub Actions.

[First successful full seven-round live API test](https://github.com/mvxmvxmvx/FOOTY/actions/runs/42027853957). Score was 15 in that test (test selected a random first question and the first eligible curated answer). This is an API integration success, not a browser-device screenshot or deployed Pages URL.

## Known constraints before broad distribution

- **Guest beta only:** no authentication, public leaderboards, anti-farming reputation system or permanent accounts.
- **Rarity is provisional/editorial:** existing reviewed point values 10/15/30/60/85/100; crowd-frequency rarity remains a tested *prototype*.
- **No live V14 careers:** Wikidata memberships are archived for research, not approved senior appearances.
- **Game data is private to backend:** browser gets a single question and a scored result, not 623 accepted answers.
- **Not hardened for large-scale public traffic:** a public anonymous `start` endpoint can generate many sessions. Introduce abuse/rate controls and expiration cleanup before wide release.
- **Browser gameplay test pending:** CI validates API 7-round flow; complete one manual GitHub Pages browser game after site activation.

## Failed fallback and reason

We attempted a temporary `footy-play` Supabase Edge Function returning inline HTML. Supabase intentionally rewrites HTML responses to `text/plain` on default project domains, so this **cannot host an interactive webpage** without a paid/custom domain. That URL is **not** a playable link. We retain the GitHub Pages static site as the frontend solution.

Official reference: https://supabase.com/docs/guides/functions/http-methods

## Main V13/V14 status

This is an isolated friends beta using the curated V13 bank on a real Supabase session API. The full old V13 browser in `public/` remains unchanged and is **not** production-deployed. The V14 football knowledge-graph research and transfer-mode work are separate and remain under review.
