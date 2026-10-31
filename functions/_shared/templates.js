// HandoffGuard Phase 8/9 Sarvam demonstration templates.
// The application MUST align these codes with its deterministic engine before
// enabling the browser panel. Do not derive templates from CSV contents.
export const TEMPLATE_VERSION = '2026-10-31.1';

const TEMPLATES = Object.freeze({
  EDIT_REVIEW: 'This change is permitted by the configured editing contract but is not approved. Check the original and returned values, then write a review explanation before accepting or rejecting the finding.',
  EDIT_FORBIDDEN: 'This change violates the configured editing contract. It is a blocker. Correct the returned file or the rule, and run the analysis again. A review explanation cannot remove this blocker.',
  MISSING_COLUMN: 'The returned file is missing a required column. This is a blocker. Restore the required column or explicitly revise the contract, then analyze again.',
  EXTRA_COLUMN: 'The returned file contains a column that is not permitted by the contract. This is a blocker. Remove the unexpected column or explicitly revise the contract, then analyze again.',
  DUPLICATE_KEY: 'At least one row key is duplicated, so matching cannot be trusted. This is a blocker. Make the key unique and analyze again.',
  BLANK_KEY: 'A required row key is blank. This is a blocker. Supply a valid key and analyze again.',
  MEMBERSHIP_CHANGE: 'Rows were added or removed contrary to the configured membership rule. This is a blocker. Restore the required row membership or revise the contract explicitly.',
  MALFORMED_CSV: 'The input cannot be parsed under the selected CSV or TSV format. Correct the file formatting and analyze again.',
  REVIEW_EXPLANATION_REQUIRED: 'This finding is eligible for review, but the reviewer has not supplied a required explanation. Add a substantive explanation before finalizing the review.'
});

export function getApprovedTemplate(code) {
  return typeof code === 'string' && Object.hasOwn(TEMPLATES, code) ? TEMPLATES[code] : null;
}
export function allowedFindingCodes() { return Object.keys(TEMPLATES); }
