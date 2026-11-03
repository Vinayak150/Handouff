# Security policy

## Support scope

This repository is an independent **recovery reference demonstration**, not an audited production service. There is **no production release or guaranteed security response SLA**.

## Reporting vulnerabilities

Do not open a public issue containing exploit details, sensitive data, credentials, or working attack examples.

1. Visit the repository [Security page](https://github.com/Vinayak150/Handouff/security) and use **Report a vulnerability** if private vulnerability reporting is enabled.
2. Otherwise contact the repository maintainer through an already established private channel to arrange responsible disclosure.
3. Include the affected commit, expected impact, and safe reproduction steps using synthetic fixtures. Never share private API tokens or customer records.

The maintainers should coordinate remediation and publication before any public disclosure. No bug bounty, response deadline, or production support commitment is implied.

## Current security limitations

- The optional translation service uses a **shared demo access token**, not authenticated user accounts.
- The per-isolate rate limiter is **not** a global request quota or hard spending cap.
- The SHA-256 review-packet digest is **not** a digital signature or reviewer identity proof.
- The application has no durable production audit trail or full security certification.
- Source-level equivalence to the unavailable original cohort implementation is unverified.
- Live hosting, provider behavior, and handling of real-world sensitive data require independent review.

Keep provider credentials in privately configured server-side secrets. Browser analysis is local; the optional API is designed to forward only approved generic finding templates to Sarvam, not CSV contents or notes. Do not use real customer data for public demonstrations.

See [Security model](docs/SECURITY_MODEL.md), [Configuration](CONFIGURATION.md), and [Release security checklist](docs/RELEASE_SECURITY_CHECKLIST.md).
