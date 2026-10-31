# Source reconciliation — GitHub repository now initialized; original cohort baseline missing

**As-of:** 2026-10-31. **Original baseline equivalence:** UNVERIFIED. **Public GitHub source publication:** verified independently after all code transfer (commit SHA in release manifest).

- GitHub connector confirmed `Vinayak150/Handouff` was a public EMPTY repository on `main` with no commits (Git tree and commits endpoints returned HTTP 409). This means no original project was overwritten, and there was no earlier Git history to reconcile.
- On 31 October 2026 a provenance-only README was committed first at `49bd0a6a874fbd17b8383c7245eee09919a6f87c`, followed by the **independently reconstructed** recovery reference code, tests, fixtures and documentation on `main`.
- Do **not** label these commits a historical cohort baseline. The previously reviewed full HandoffGuard cohort ZIP still cannot be accessed, so a baseline-to-team feature-by-feature diff remains MISSING.
- The reconstruction supports CSV only; any historical TSV/worker/server/CLI behavior absent from this repository must be reconciled when the original source is available.
- **Web deployment:** a public repository is not a running URL. Refer to verification status for any separately observed Vercel/Cloudflare URL. Provider live verification requires a privately configured Sarvam credential and consented supervised test.

## Next operator actions

1. Clone the repository, capture `git rev-parse HEAD`, inspect all sources and run `npm run verify` on Node 22.
2. Obtain the real cohort baseline; diff features and independent replay behavior before asserting lineage or feature parity.
3. Inspect GitHub Actions; do not assume a passed local test means hosted CI passed.
4. Verify private environment bindings without exposing their values; perform a single supervised provider call only if free credits and spending constraints are confirmed.
5. Conduct human Marathi comprehension and workflow testing, capture consent and provenance, then update the evidence-led pitch.
