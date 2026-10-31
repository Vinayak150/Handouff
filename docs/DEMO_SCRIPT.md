# Three-minute synthetic demo script — recovery candidate (not hosted)

**0:00–0:25** Explain the context: a team hands a controlled CSV back after changes; one change is allowed but needs review, another is forbidden. Load `blocked` synthetic example.

**0:25–0:55** Click Analyze. Show 1 blocker (forbidden amount change) + 1 reviewable status change; export disabled. Explain that no reviewer or language model can override blocker.

**0:55–1:35** Load reviewable synthetic example. Analyze; select one `EDIT_REVIEW` finding. Enter a substantive explanation and Accept; export becomes available. Explain result is local and deterministic.

**1:35–2:10** Click Sarvam Marathi assist; if operator has configured private demo code+Sarvam free credit, request an actual translation (record status only, not secrets). Otherwise show clean fail-closed English fallback. **Never call a mocked response "live".**

**2:10–2:45** Export packet. Use CLI `node cli.cjs verify --original fixtures/original.csv --returned fixtures/returned-reviewable.csv --contract fixtures/contract.json --packet <exported-packet-path>`; expected `verified:true`, exit 0. Replay blocked CSV against same packet: expected `verified:false`, exit 2.

**2:45–3:00** State evidence limits: no human studies, no customer savings/pricing, no historical baseline proof or verified hosted URL. This is a recovery reference, not the certified original submission.
