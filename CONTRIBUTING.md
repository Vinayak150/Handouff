# Contributing to HandoffGuard

HandoffGuard is an independently reconstructed **recovery reference**. It is not the verified original WUNDERDEVS cohort implementation or a production-approved compliance system.

## Getting started

Requirements: Node.js 22+; Python 3 is optional for serving the local static build.

```bash
git clone https://github.com/Vinayak150/Handouff.git
cd Handouff
npm run verify
python3 -m http.server 8878 --directory dist --bind 127.0.0.1
```

Open http://127.0.0.1:8878/. This server is **static-only**: it does not execute the Sarvam serverless endpoint.

## Contribution workflow

1. Review existing issues and the [current evidence summary](docs/CURRENT_STATUS.md). Open an issue for a material behavior change before implementation.
2. Work from a feature branch. Keep commits focused and describe the user-visible problem.
3. Include regression tests with changes to comparison, review gating, packet format, or translation. Maintain parity between the independent CLI and browser engine.
4. Run `npm run verify` and report the **actual** results. Do not claim that tests you did not run passed.
5. Update the README or relevant runbook when behavior, deployment, security boundaries, or contract rules change.
6. Complete the [pull request template](.github/pull_request_template.md).

## Engineering invariants

- A forbidden field edit, missing column, duplicate key, or row membership change must **block** export.
- Editable-field changes require a human decision and a meaningful explanation.
- The independent `cli.cjs` implementation must not import `public/engine.js`; both should produce the same report and digest.
- Provider-generated Marathi is **advisory**, never a source of review authority.
- Browser CSV contents, record values, and reviewer notes must never be forwarded to Sarvam.
- The static build must preserve its explicit asset allowlist and must not include secrets or server code.
- Do not present the reference as verified historical cohort source or deployed production software without evidence.

Use **synthetic** fixtures and mock provider calls in tests. Do not commit credentials, confidential records, or real customer data. Avoid introducing new runtime dependencies unless clearly justified.

## Licensing and rights

There is currently **no approved root LICENSE**. Public availability alone does not grant permission to reuse or distribute the project. Confirm contribution rights with the maintainers before submitting code, and review [licensing status](docs/OSS_LICENSE_REVIEW.md).

For suspected vulnerabilities, follow [SECURITY.md](SECURITY.md). Do not disclose credentials or exploit details in a public issue.
