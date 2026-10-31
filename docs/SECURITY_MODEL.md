# Security model and engineering limitations

## Trust boundaries

1. **Untrusted user local files** are parsed in the browser, capped to 4 million characters/20,000 rows/120 columns. Files are never requested by the Function. Browser code renders data-derived text using `textContent` and uses only static markup. Contract keys/column lists are restricted to expected fields.
2. **Browser -> Pages Function** only after explicit click. Same-origin JSON contains `findingCode` and `targetLanguage`; a transient shared access code is in `X-HandoffGuard-Demo-Token`, then cleared from its input. This shared bearer code is **not user identity**, is readable by anyone who knows it, and can be replayed.
3. **Pages Function -> Sarvam** uses fixed, versioned English templates, not user-provided text; secret `SARVAM_API_KEY` is used in server-side authentication header only. Provider sees generic template and ordinary request metadata, not local CSV, contract or review notes. Provider retention and privacy practices were not audited.
4. **Provider -> browser** translated text is advisory, shown with `textContent`. No provider result is imported into the engine, session, packet hash, review decision, or CLI.
5. **Browser download** packet contains a report SHA-256 digest and review decisions with optional notes, but not CSV values or translation. A hash is **not a signature**: no authenticated reviewer identity, signatures, role controls or legal attestation exist.

## Breakpoint register

| Severity | Risk | Required mitigation before real public service |
|---|---|---|
| **P0** | Original cohort/current GitHub source missing; this is a reconstructed reference engine | Restore source, pin commit, compare true baseline, retain existing features, run previous regressions |
| **P0** | No live Sarvam API call, no hosted URL or Cloudflare deploy observation | Verify operator account/credit, supervised real call, actual URL and response headers; then record sanitized evidence |
| **P0** | `HANDOFFGUARD_DEMO_TOKEN` is shared, not per-user authorization | Keep Function disabled except supervised demo; implement durable auth, abuse controls and quotas before open access |
| **P1** | Five attempts/60 s rate counter resets/replicates per isolate; no hard global cost ceiling | Durable distributed quota or explicit provider-side spend ceiling; monitor and disable after demo |
| **P1** | Browser automated navigation blocked by test platform policy | Run browser/keyboard/accessibility/privacy flow on authorized workstation, record observations |
| **P1** | Current GitHub repo is public; full history not scanned | Secret scan all branches/history, license/attribution, static-public list, dependency provenance before push |
| **P1** | No production audit, no HTTP load test, no penetration test | Security review and provider-response hardening before production claims |
| **P2** | CSV-specific parser; no XLSX, TSV UI or locale-aware numeric formats; row keys and strings treated literally | Document to testers; expand only with fixture-driven tests and CLI parity |
| **P2** | Template language quality/negation not human-reviewed | Marathi proficiency review of blocker vs review explanations |
| **P2** | No digital signature, authenticated reviewer, account or audit log | Do not claim legally binding review or nonrepudiation |

## Controls actually tested

Mock tests verify credential gating, strict origin/content fields, fixed templates, 402/429/network failures, sanitized output, stale client response rejection and soft instance throttle. Static tests verify no provider key or direct Sarvam API URL in public assets, `_routes.json` scope and `connect-src 'self'` consistency. Engine/CLI deterministic parity and packet replay are tested on synthetic fixtures. These do **not** establish production Cloudflare security, provider availability or data retention guarantees.
