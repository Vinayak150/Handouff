# Configuration and secrets — no values in source

| Binding name | Location | Purpose |
|---|---|---|
| `SARVAM_API_KEY` | Cloudflare Pages encrypted secret / private local `.dev.vars` only | Sarvam provider authentication; never sent to browser |
| `HANDOFFGUARD_DEMO_TOKEN` | Cloudflare Pages encrypted secret / private local `.dev.vars` only | 32–256-character alphanumeric/`_-` shared demo access gate; not user authentication |
| `HANDOFFGUARD_BASE_URL` | Operator shell only | Exact verified hosted HTTPS origin for the opt-in live check |
| `HANDOFFGUARD_LIVE_ALLOW_PROVIDER` | Operator shell only | Explicit opt-in (`1`) before a real Sarvam provider call in `npm run live:check` |

No Grok or xAI API integration. No provider keys or access-code values are present in this archive or browser bundle.

**Free-cost limitation:** Sarvam free credits are limited; provider billing settings and automatic top-ups are outside this application. Do not assume a per-isolate memory counter prevents global usage or spend. The function's five requests/60 seconds per isolate is a **soft local guard** only. A public unlimited demo is not authorized: keep `HANDOFFGUARD_DEMO_TOKEN` unset except for supervised demos, monitor actual provider request usage, and disable translation when finished. Add durable shared quotas/billing controls and identity access before open public use.

**Local secret storage:** `.dev.vars` is ignored by Git and excluded from the build and ZIP. Never paste keys in chat or test logs. Cloudflare dashboard: Workers & Pages → Pages project → Settings → Variables and Secrets (configure both bindings as secrets, not public browser variables).
