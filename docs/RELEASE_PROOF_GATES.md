# WUNDERDEVS release proof gates — status after hardening

| Gate | Status | Required proof |
|---|---|---|
| Source and known commit | **MISSING** | Clone `Handouff/main`, record full SHA and file manifest |
| Original cohort baseline → team diff | **MISSING** | Original archive/commit, reviewed changed-file list |
| Security bugfixes in recovered reference | **COMPLETE** | 38/38 tests and paired independent CLI tests |
| Offline blocked/reviewable/export/replay demo | **COMPLETE (reference only)** | `verification/phase11-*` logs plus synthetic fixture |
| Live Sarvam `mr-IN` response | **NOT RUN** | Operator-provided `SARVAM_API_KEY`, actual response and request ID (redacted) |
| Cloudflare Pages Free environment | **NOT RUN** | Operator dashboard, encrypted secrets, verified Free plan and logged deployment |
| Actual public HTTPS URL / CSP | **MISSING** | HTTP checks from the real `*.pages.dev` deployment |
| Wrong-token and provider-error check on live URL | **NOT RUN** | 401 + controlled provider failure, no secret exposure |
| Browser keyboard/privacy/accessibility walkthrough | **NOT RUN** | Real browser session on actual URL |
| Marathi comprehension / interviews / payer | **MISSING** | Consent-based human evidence; `HUMAN_EVIDENCE_COLLECTION.md` |
| Public Git branch or PR | **NOT RUN** | Reviewed approved branch, secret/history scan |
| Final team submission | **NOT RUN** | Reviewed source & deck, rechecked form, explicit authorization |

## Hosted operator check (must be performed by the owner)

Set `SARVAM_API_KEY` and `HANDOFFGUARD_DEMO_TOKEN` as **encrypted** Cloudflare Pages bindings, never in files or chat. Confirm no paid add-on, custom domain purchase or auto-top-up. Only after Cloudflare returns an actual HTTPS URL, export `HANDOFFGUARD_BASE_URL` and a private operator copy of `HANDOFFGUARD_DEMO_TOKEN`; run `HANDOFFGUARD_LIVE_ALLOW_PROVIDER=1 npm run live:check`. This script does one real provider test plus wrong-token and static checks, exits 0 only if all pass, and never prints raw translation or secret values. Clear the demo token and disable the Function when the supervised demo ends. The provider credit balance is not known here; an isolate-local limiter is NOT a global hard spending ceiling.

No direct Cloudflare account connection, API key, live Sarvam response, deploy, Git push or form submission was observed here.
