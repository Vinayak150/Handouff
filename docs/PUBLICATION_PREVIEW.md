# Publication preview and authorization boundary

**NOT DEPLOYED. NOT PUSHED. NO FORM SUBMITTED.**

For this recovery reference build, proposed public Pages static assets (only `dist/`): `index.html`, `app.js`, `engine.js`, `sample.js`, `session.js`, `style.css`, `sarvam-assistance.js`, `sarvam-assistance.css`, `_headers`, `_routes.json`.

Cloudflare would also deploy the server-only Function route `POST /api/sarvam/translate`. Its source, fixed templates and binding variable **names** can be visible if the repository is public, but encrypted binding **values** must never be committed. No sample CSV, contract, review packet, test output, internal docs, CLI or secret should be deployed as static assets. GitHub itself is a separate public exposure surface: if source is pushed to the currently public repo, the entire committed source and history are viewable.

**Changed exposure relative to the earlier static-only plan:** the API endpoint becomes internet-reachable. It is not a translation proxy: arbitrary text is rejected, and a shared token is required. This is **not a globally bounded, production-ready public API**. Do not configure the token outside supervised demos. Require explicit approval of this endpoint and repo changes before publication if the owner wants a hosted project.
