# Cloudflare Pages Free deployment: operator runbook (NOT EXECUTED)

1. **Choose source**: do not force-push this recovery implementation over the original public `Vinayak150/Handouff` repository. Retrieve and inspect the original first. Use a reviewed feature branch or a separate approved repository; pin a commit SHA and record code ownership/license. Public GitHub JavaScript is inspectable by everyone.
2. **Preflight:** `npm test && npm run scenarios && npm run build`. Node 22+; no external package dependencies for the deterministic build. Verify `dist/` contains exactly ten allowlisted files. Verify `functions/` at project source root, not in `dist/`.
3. **Connect GitHub:** Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git. Select approved repository and branch. Framework **None**; root directory **repository root** (for this reconstructed package); build command `npm run build`; output `dist`; no build-time secret required. Verify account plan remains **Free**; no custom domain purchase or add-ons.
4. **Secret configuration:** add `SARVAM_API_KEY` and `HANDOFFGUARD_DEMO_TOKEN` as encrypted Pages bindings, with separate Preview/Production as needed. Never add values to GitHub, HTML, `.env`, committed `wrangler.toml`, logs or chat. Rotate if exposed.
5. **Safe rollout:** run the first deployment with `HANDOFFGUARD_DEMO_TOKEN` **unset** so translation fails closed, check asset routes and CSP. After explicit project authorization, set the demo token and Sarvam key only when monitoring usage for a controlled test. No global quota exists.
6. **After deployment:** record the **actual** `https://...pages.dev` URL and pinned commit in `IMPLEMENTATION_HANDOFF.md` only after observing them. Check static `GET /`, JS assets, `/api/sarvam/translate` wrong-token response 401, one opt-in real `mr-IN` response using `npm run live:check` and deliberately invalid token. Observe browser blocked and reviewable flows, export packet and independent CLI verify. Check request Network panel; no CSV contents to backend. Disable demo token after demonstration.
7. **Failure:** if Sarvam is missing, expired, rate limited or unavailable, the function returns sanitized errors and the English finding remains authoritative. It never grants review authority. On exhausted provider credits, do not silently top up.

Cloudflare docs: https://developers.cloudflare.com/pages/get-started/git-integration/ , https://developers.cloudflare.com/pages/functions/ , https://developers.cloudflare.com/pages/platform/limits/ . Provider docs: https://docs.sarvam.ai/api-reference/text/translate-text . Provider pricing/free credit eligibility must be confirmed against the operator's current Sarvam dashboard before enabling spending.

## Local provider integration testing

A simple static HTTP server **cannot** run Cloudflare Functions. To execute the Function locally with Wrangler (which requires installing/using Cloudflare's CLI and may need a signed-in account), run from the project root:

```sh
npm run build
npx wrangler pages dev dist
```

Provide secrets via a private local `.dev.vars` file outside version control or supported Wrangler interactive configuration. Never paste values in chat. The automated `npm test` suite uses **mock provider responses only** and incurs no provider calls. The `npm run live:check` script only attempts a real provider request when `HANDOFFGUARD_LIVE_ALLOW_PROVIDER=1` and the local operator token and exact HTTPS base URL are provided; otherwise it exits 2.

## Health and security

No backend health route exists. Static `GET /` checks availability; actual API readiness requires a protected POST. `/_headers` is a Pages configuration asset, not a public health endpoint. Validate CSP response header **and** the HTML meta CSP. No `X-Forwarded-For`-derived identity or global memory quota is relied upon. All public static assets are allowlisted in `scripts/build-pages.mjs`. Cloudflare deployment and actual browser security behavior are **NOT RUN** as of this archive.
