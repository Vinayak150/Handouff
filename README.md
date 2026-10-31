# HandoffGuard — WUNDERDEVS recovery reference demo (NOT original cohort source)

**Status: hardened, independently reconstructed reference implementation, NOT DEPLOYED, LIVE SARVAM NOT VERIFIED; NOT the verified cohort baseline.**

The original HandoffGuard cohort ZIP remains unavailable for byte-level baseline comparison. On 31 October 2026, GitHub connector inspection confirmed `Vinayak150/Handouff` was a public, EMPTY repository with no commits; a provenance README was initialized at commit `49bd0a6a874fbd17b8383c7245eee09919a6f87c`. This README initialization does NOT constitute a source push or verified deployment. This repository is a **new independently reconstructed recovery candidate**, not a claim that the reviewed 97-test historical HandoffGuard engine or its security properties were preserved. The original source must be recovered, compared and restored before this candidate replaces it in the team submission.

## User demonstration (synthetic)

1. `Load blocked example` → `Analyze locally`: one forbidden amount change blocks approval, alongside one reviewable status change. Approval/export is unavailable.
2. `Load reviewable example` → `Analyze locally`: one allowed status change requires review. Select it and enter a reason (10–500 chars), then Accept or Reject.
3. Select the finding and click **Explain selected finding in Marathi**. The browser sends only the generic finding code, Marathi locale and a manually entered shared access code to its same-origin API. The Cloudflare Pages Function maps the code to a fixed English template and calls **Sarvam `sarvam-translate:v1`**. With no secrets configured, this intentionally fails closed; **not a canned Marathi success**.
4. `Export review packet` and independently verify with `cli.cjs` using the original + returned CSV + contract.

Do not use real user/customer files in a public demonstration or third-party chat. The demo fixtures are synthetic.

## Reproduce on Node 22+

```sh
npm test
npm run scenarios
npm run build
cd dist && python3 -m http.server 8878 --bind 127.0.0.1
```

Open `http://127.0.0.1:8878/`. The Python server is **static-only** and cannot execute the Sarvam Function; the English findings, review and export still work. For a real local Pages Function, use Wrangler as documented in `docs/DEPLOYMENT.md` and configure secrets privately.

Independent CLI (different implementation from `public/engine.js`):

```sh
node cli.cjs analyze --original fixtures/original.csv --returned fixtures/returned-blocked.csv --contract fixtures/contract.json
# expected exit code 2: one blocker
node cli.cjs analyze --original fixtures/original.csv --returned fixtures/returned-reviewable.csv --contract fixtures/contract.json
# expected exit code 0: one review finding
node cli.cjs verify --original fixtures/original.csv --returned fixtures/returned-reviewable.csv --contract fixtures/contract.json --packet fixtures/review-packet-synthetic.json
# expected exit code 0: verified true
```

`review-packet-synthetic.json` is test evidence, not a human-signed packet. Report digests are tamper-evident consistency checks, **not cryptographic signatures or reviewer identity proofs**.

## Source layout

- `public/`: 10 browser/Pages public assets, including Cloudflare `_headers` and `_routes.json`
- `functions/api/sarvam/translate.js`: server-only provider endpoint; secret values are never bundled
- `functions/_shared/templates.js`: fixed code-to-English-text allowlist
- `cli.cjs`: independent deterministic CLI and replay
- `tests/`: deterministic core, security config, mock Sarvam and parity tests
- `fixtures/`: synthetic CSVs, contract and review packet
- `verification/`: observed test/build/CLI outputs and environment limitations
- `docs/`: hosting, security, publication preview, release gates and team evidence status

**Required before replacing GitHub `main`:** inspect original cohort and current repo, establish pinned SHAs, compare features and licenses, merge/port non-regressively, run original test suite, verify real Sarvam and hosted flow, have human Marathi/user reviewers review, and review public release boundaries. This ZIP is a usable independent test candidate, **not the originally supplied full HandoffGuard**.

## 2026-10-31 security hardening revision

This package is `recovery-2026-10-31.2`, a recovery reference rather than an audited replacement for the original HandoffGuard. Its browser engine and independent CLI explicitly block and identify contract-required columns missing from the original file. Selecting a local file immediately invalidates any earlier exportable report, and superseded asynchronous reads are ignored. A fresh synthetic review packet is supplied for v.2; previous recovery v.1 packets are intentionally not replay-equivalent across engine versions.

Verification performed here: `npm test` 38/38 PASS, `npm run scenarios` 2/2 PASS, `npm run build` PASS, `npm run audit:release` PASS, independent positive/negative CLI replay exits as expected, `npm run live:check` without URL exits 2 / LIVE NOT VERIFIED. Evidence under `verification/phase11-*` and `verification/hardening-verification.json`. See `docs/SOURCE_RECONCILIATION_STATUS.md` and `docs/HUMAN_EVIDENCE_COLLECTION.md`.

**Release decision: NOT DEPLOYED, REFERENCE SOURCE NOT VERIFIED ON GITHUB, NOT A FINAL TEAM SUBMISSION.** No real provider call or hosted browser test was performed. Human interview, payer and Marathi review evidence are not available.