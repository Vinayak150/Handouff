# WUNDERDEVS / HandoffGuard — engineering and release handoff

**As-of:** 2026-10-31. **Classification:** independent, reconstructed **recovery reference demo**. **Deployment:** **NOT DEPLOYED**. **Real Sarvam:** **NOT VERIFIED**. **Production/security certification:** **NOT CLAIMED**.

## 1. Locations, versions and provenance

- Proposed team GitHub repository: `https://github.com/Vinayak150/Handouff`, public, default branch `main` (metadata-only identification). **Source contents and HEAD commit NOT RETRIEVED**, so this archive is **not linked to a pinned Git commit**.
- Recovery source in this build session: `/mnt/data/hg_recovery_release/`; created as an independent reference when the earlier original/cohort archive and existing Git repo source could not be retrieved. Source archive generated separately. **Do not overwrite original HandoffGuard or assert historical lineage.**
- Reference engine version: `recovery-2026-10-31.2`, in `public/engine.js` and independent `cli.cjs`. Fixed Sarvam template version `2026-10-31.1` in `functions/_shared/templates.js`.
- Earlier Phase 9 draft slides and evidence materials: `/mnt/data/WUNDERDEVS_Phase9_Submission_Prep/`; previous overlay: `/mnt/data/handoffguard_sarvam_free_overlay/`. Current reference includes both a deterministic core and the adapted Sarvam overlay, **but not the historical engine or tests**.

## 2. Start, build, verify (Node 22+; no npm install required for core checks)

```sh
npm test
npm run scenarios
npm run build
cd dist && python3 -m http.server 8878 --bind 127.0.0.1
# open http://127.0.0.1:8878/ in a browser
```

Local Python serves **static assets only**, not Cloudflare Pages Functions. Browser analysis/review/export works without credentials; Marathi translation **fails closed** without a configured protected Function.

```sh
node cli.cjs analyze --original fixtures/original.csv --returned fixtures/returned-blocked.csv --contract fixtures/contract.json
# expected exit 2 (blocker)
node cli.cjs analyze --original fixtures/original.csv --returned fixtures/returned-reviewable.csv --contract fixtures/contract.json
# expected exit 0 (reviewable)
node cli.cjs verify --original fixtures/original.csv --returned fixtures/returned-reviewable.csv --contract fixtures/contract.json --packet fixtures/review-packet-synthetic.json
# expected exit 0, verified true
```

The packet is a **synthetic fixture**, not a signed human audit. Before public hosting, run `npm run build`, connect an approved reviewed Git branch to Cloudflare Pages Free, use framework None, root `.`, build command `npm run build`, output `dist`, and keep `functions/` at project root. See `docs/DEPLOYMENT.md` and `docs/PUBLICATION_PREVIEW.md`.

## 3. Demonstrated/tested flow and provider identity

- **Blocked sample**: status + forbidden amount changes; `1` blocker, `1` review finding; cannot accept or export.
- **Reviewable sample**: status change only; `0` blockers, `1` review finding; requires a substantive human-entered explanation before accept/reject and packet export.
- **Export/replay**: packet contains report SHA-256 consistency digest and decisions only. Independent CLI (separate parser and matcher, no import of browser `engine.js`) verifies the synthetic reviewable packet and rejects replay against blocked returned CSV. Digest **is not a cryptographic signature**.
- **Language assistance**: `POST /api/sarvam/translate` to Cloudflare Function, real provider configured as `https://api.sarvam.ai/translate`, **`sarvam-translate:v1`**, `en-IN` → `mr-IN`, formal. Browser sends **only** code `findingCode`, locale `targetLanguage`, and a transient bearer demo token header. Function maps code to versioned generic template; **never forwards rows, filenames, contract, notes or arbitrary text to Sarvam**. English remains authoritative; provider output only reaches an inert `textContent` display and is **not** in the exported packet.

Environment variable names, never values: `SARVAM_API_KEY`, `HANDOFFGUARD_DEMO_TOKEN` (encrypted Cloudflare bindings); `HANDOFFGUARD_BASE_URL`, `HANDOFFGUARD_LIVE_ALLOW_PROVIDER` (operator opt-in live-check shell). **No Grok API. No provider secret in this source/archive.**

## 4. Observed verification and evidence paths

- `npm test`: **38/38 PASS**, 0 failed, 0 skipped. Includes **10 MOCK Sarvam tests** from prior overlay; deterministic core, CLI, header/asset privacy, 50 seeded engine/CLI parity cases. `verification/test-log.txt`.
- `npm run scenarios`: **2/2 synthetic example flows PASS**. `verification/scenarios-log.txt`.
- `npm run build`: exact ten-file static asset allowlist **PASS**. `verification/build-log.txt`.
- CLI: reviewable packet **verified true, exit 0**; blocked analysis **exit 2**; blocked packet replay **verified false, exit 2**. `verification/cli-log.txt`.
- `node --check` on executable JavaScript: **PASS** (see verification manifest).
- Automated Chromium browser attempt: **NOT RUN TO COMPLETION** — environment returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` on local/intercepted routes. No actual browser screenshot/interaction proof is claimed; operator must reproduce in own browser. `verification/browser-attempt.txt`.
- Earlier clean extraction: **PASS** on the previous candidate ZIP: 36 tests, 2 synthetic scenarios, static build, release audit and independent replay. Current revision is separately verified in `verification/hardening-verification.json`. `verification/release-verification.json`. These apply to **this reference candidate only**.
- Original historical HandoffGuard `97` tests and `24` scenarios were **reported in earlier conversation but not reproduced**, because original code is unavailable.

## 5. Data and security boundaries

Files are selected locally; browser parses and compares, and renders text using inert text sinks. Analysis returns code, severity, column and row key in local UI. The browser only sends the **approved finding code and locale** and a shared demo-code header on an explicit Marathi request. Cloudflare receives standard request metadata and that token; Sarvam receives only a generic approved English template and server-side API authentication. The data-handling statements are **source-observed and mock-tested**; full hosted network observation is **UNVERIFIED**. Downloaded review packet may contain human-entered review explanation, under user control. Do not paste real customer data into Grok or other external services.

Function controls observed in source: strict same-origin Origin gate; fixed JSON schema/body cap; fixed template allowlist; constant-length SHA-256 comparison of demo token; upstream timeout and response cap; no-store; sanitized provider errors; typed response; 5 requests/60 s **per isolate**. **Shared token is not authenticated identity, and process-local counters are not a global cost/rate bound.** The safest default is to leave `HANDOFFGUARD_DEMO_TOKEN` unset so the endpoint returns `ACCESS_NOT_CONFIGURED` until a supervised demo. Rotate token after any exposure. Use provider no-top-up and monitoring; do not promise ₹0 beyond provider credits and current free hosting terms.

## 6. Open defects and non-negotiable release gates

**P0 — Release blockers:** recover actual cohort baseline and current GitHub contents/commit; compare and preserve original deterministic engine/CLI; merge changes without regression; inspect public repo Git history for credentials and verify licensing/attribution. Provide real Sarvam key privately in operator dashboard, verify actual provider output and one controlled wrong-token failure on a **real** deployed URL. Get explicit approval for the new public API surface before public launch. Do **not** upload this reference ZIP claiming original lineage.

**P1 — Security/engineering:** browser and accessibility tests not executable in current admin-restricted environment; run on authorized workstation. No durable global quota or user auth; keep translation disabled except supervised demo. No penetration test, threat-model signoff, robust file import normalization for every real-world CSV/TSV, security CI history scan or full customer privacy review. No browser screenshot currently attested.

**P2 — Product limitations:** reconstruction supports CSV, not XLSX/TSV UI, OCR or fuzzy matching; editing policy is minimal; packet digest is not a digital signature or reviewer authentication; API cache is local client-only; no user accounts, storage or audit log. The original product may have features not represented in this reference.

## 7. Human evidence and submission

User interviews, observed sessions, validated user quotes, willingness-to-pay, fees, saved time, adoption, Marathi comprehension/signoff and independent security/accessibility audit are **MISSING**. Use the evidence collection forms in the earlier Phase 9 package. The eight-slide PPTX and PDF, demonstration script, source/history worksheet, submission disclosure and field text were prepared; submission files still lack **verified original source**, baseline diff, actual hosted running link, real Sarvam recording, human evidence and form recheck. **No public code push, Pages deployment, payment or form submission was performed.**

## Final engineering decision

**READY FOR TECHNICAL REVIEW / NOT READY FOR PRODUCTION OR FINAL TEAM SUBMISSION.** The reference implements and tests the required *concept*, but software equivalence with original HandoffGuard, a real provider call, hosted URL and human value evidence are all **UNVERIFIED**. The next owner must either supply the original source/repo access for a genuine non-regression merge or explicitly approve this independently reconstructed reference as a new baseline; publication and final submission remain separate approval gates.


## 8. Hardened recovery revision — 2026-10-31.2

`public/engine.js` and independent `cli.cjs` now explicitly reject and label required columns missing from the original dataset; this improves diagnostics, and previous checks also prevented approval through missing returned/extra-column checks. `public/app.js` invalidates an eligible report before file read I/O and discards asynchronous file reads superseded by subsequent changes. Added two regression tests, raising the current suite from 36 to **38 passing tests**, with 2/2 synthetic scenarios and ten-file public asset audit PASS. The versioned synthetic fixture digest was regenerated; v.1 packets are not claimed to replay with v.2.

Source reconciliation, hosted Sarvam, human research and current GitHub commit remain **NOT VERIFIED**. The `npm run live:check` command without a real URL explicitly exited 2; this is a safety gate, not a live test. See `docs/SOURCE_RECONCILIATION_STATUS.md`, `docs/HUMAN_EVIDENCE_COLLECTION.md` and `verification/hardening-verification.json`.

## 9. Current attempt to finish end-to-end

The Git metadata provider identifies public `Vinayak150/Handouff` `main`, but no source SHA or file-tree fetch succeeded. Container `git ls-remote` failed DNS resolution and public web URL fetch missed cache. The reference archive was hardened independently; **no merge, push, PR, or deployed URL** is attributable to this work. No Sarvam credentials were available in the execution environment and `npm run live:check` exited 2 without a URL; **zero real Sarvam requests** were made here. Real human evidence and fluent-Marathi review are **not in the provided materials**. See `docs/SOURCE_RECONCILIATION_STATUS.md`, `docs/HUMAN_EVIDENCE_COLLECTION.md`, `docs/RELEASE_PROOF_GATES.md`, `docs/HARDENING_DIFF.patch` and `verification/hardening-verification.json`.
