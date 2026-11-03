# CSV contract and finding reference

HandoffGuard compares an original CSV against a returned CSV using a JSON editing contract. It classifies differences deterministically; Marathi translation is advisory.

## Contract

```json
{
  "keyColumn": "record_id",
  "requiredColumns": ["record_id", "customer", "status", "amount"],
  "editableColumns": ["status"]
}
```

- **keyColumn:** Unique, nonempty row identifier. It must appear in `requiredColumns` and cannot be editable.
- **requiredColumns:** Columns that must appear in the original and returned data.
- **editableColumns:** Required columns permitted to change **with a human review decision**.
- The contract accepts exactly these three keys. Column names are case-sensitive, nonempty strings no longer than 120 characters; duplicates are invalid.

See [sample contract](../fixtures/contract.json). In that example, changing `status` requires review; changing `amount` is forbidden.

## Finding classification

| Code | Severity | Condition |
| --- | --- | --- |
| `EDIT_REVIEW` | REVIEW | Value changed in an editable field |
| `EDIT_FORBIDDEN` | BLOCKER | Value changed in a protected field |
| `MISSING_COLUMN` | BLOCKER | A required or original column is absent |
| `EXTRA_COLUMN` | BLOCKER | Returned CSV contains an unexpected column |
| `DUPLICATE_KEY` | BLOCKER | More than one row uses the same key |
| `BLANK_KEY` | BLOCKER | A record key is blank |
| `MEMBERSHIP_CHANGE` | BLOCKER | A row was added or removed |

Any **BLOCKER** prevents export. An eligible **REVIEW** finding requires `accept` or `reject` plus a 10–500 character explanation. The browser invalidates previous review state when input is edited.

## Supported inputs and limits

- Browser upload supports CSV and JSON editing contracts, **not** XLSX files.
- The browser file selection cap is 4,000,000 bytes per file. The comparison engine also limits text length to 4,000,000 characters, with up to 20,000 data rows and 120 columns.
- Quoted CSV fields, escaped double quotes, embedded newlines, BOM, and CRLF are handled. Malformed rows and duplicate column headers are rejected.
- Keys and other field values are compared as strings; no currency/date normalization or fuzzy matching is provided.
- Review packet SHA-256 digests are consistency checks, **not** signatures or identity proofs.

## Replay

```bash
node cli.cjs verify \
  --original fixtures/original.csv \
  --returned fixtures/returned-reviewable.csv \
  --contract fixtures/contract.json \
  --packet fixtures/review-packet-synthetic.json
```

Exit code **0** means the supplied packet verified; **2** means a blocker, invalid verification, or command error. The included packet is synthetic test data, not a real user approval.

See [README](../README.md) and [Security model](SECURITY_MODEL.md).
