# Security engineer go/no-go checklist — HandoffGuard recovery candidate

Severity is relative to a public translation endpoint and the team's prototype submission. These are **not** independent penetration-test findings.

## P0: must pass before pushing to existing public GitHub `main`

- [ ] Obtain and pin actual `Vinayak150/Handouff` HEAD SHA; clone/check out source; inspect every file and prior commit history for secrets; create and review a focused branch/PR. Existing repo is public.
- [ ] Obtain the original cohort baseline ZIP or repository SHA. Review authorship, license, project scope and original client-visible UI/engine/CLI. Do not present new reconstruction as historical code.
- [ ] Run original test suite, synthetic scenario suite, CLI replay and UI browser flow on exact pinned SHA; compare original/new reports and exported packet hashes. Record differences and reasons.
- [ ] Approve public asset list **and** the new `POST /api/sarvam/translate` route; do not deploy the server endpoint without publication review.
- [ ] Use Cloudflare Pages Free only; no custom domain purchase, paid add-ons or API billing enablement. Validate actual Sarvam dashboard credit balance and auto-top-up status.
- [ ] Prove secrets only in encrypted host bindings, never Git history, browser, response bodies or access logs. Rotate any exposed access code/key.
- [ ] Demonstrate on actual HTTPS Pages origin: strict wrong-token 401, success with one real Marathi translation after explicit credit approval, no CSV data in provider request, and original report/packet unchanged.
- [ ] Confirm fail-closed behavior if no token, no key, 402 credit exhaustion, provider 429 and timeout; no change to blocker/review decisions.
- [ ] Capture independently observed URL, deployment/commit IDs, date, headers and sanitized verification evidence. Do not guess these identifiers.

## P1: must pass before general public availability

- [ ] Implement **global** rate and spend limits (Durable Objects, equivalent shared storage or provider enforced cap). Current 5/min per-isolate memory check is **not global**.
- [ ] Replace shared bearer demo token with per-user authentication/authorization or keep endpoint disabled outside supervised sessions. Origin restriction alone is insufficient.
- [ ] Review Content Security Policy in headers and HTML (both): `connect-src 'self'` to permit same-origin Function; never allow direct browser requests to `api.sarvam.ai`.
- [ ] Run keyboard, screen-reader, zoom, mobile, error-state and content safety browser checks; blocked admin Chromium in this workspace is **not** a pass.
- [ ] Review retention/consent/privacy terms for Sarvam and Cloudflare; don't input real personal/customer CSVs in demos.
- [ ] Scrutinize the full Git diff, secrets via a maintained scanner (e.g. Gitleaks) and manual repository-history review, GitHub workflow token permissions and supply-chain dependencies.
- [ ] Monitor rate, 402/429/5xx, aggregate usage and billing in provider dashboards without logging tokens, raw translations or CSV values.
- [ ] Define incident response: set `HANDOFFGUARD_DEMO_TOKEN` to empty/disabled or disable route, rotate compromised secrets, review logs without collecting sensitive contents, reverify.
- [ ] Confirm data limits, adversarial CSV parsing and independent replay edge cases against the **real** original engine and CLI, not merely this reconstructed one.

## P2: presentation/evidence integrity

- [ ] Get human Marathi review for blocker negation, review instructions and confusing terminology, with consent and rubric.
- [ ] Collect dated user interviews, observed real handoff scenarios, pain, current alternatives, credible payer and willingness evidence. No invented savings or adoption.
- [ ] Verify existing team PPTX/PDF labels reflect current source and actual running link; update them only after proof.
- [ ] Recheck authenticated form limits, repository URL, source archive limit, video optional status and explicit final submission authorization.

## Testable security properties already in this reconstruction

- Template allowlist; no arbitrary translation text from browser; 512-byte request cap, 8192-byte provider response cap, 2000-codepoint display cap, 8s deadline.
- Server-only provider key and sanitised error codes, redirects rejected, response no-store.
- Explicit translation click, stale response invalidation, DOM textContent, no model review power; report digest remains unaffected.
- File selection entirely local; no upload endpoint; output artifact public files enumerated and audited.
- 10 Sarvam MOCK tests plus engine/CLI/security tests; NOT a pen test, NOT a live call.

**Release authority:** operator must sign off P0 and P1 as applicable. A successful `npm run verify` is not a production release authorization.
