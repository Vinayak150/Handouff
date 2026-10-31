import { getApprovedTemplate, TEMPLATE_VERSION } from '../../_shared/templates.js';

const SARVAM_URL = 'https://api.sarvam.ai/translate';
const MODEL = 'sarvam-translate:v1';
const TARGET_LANGUAGE = 'mr-IN';
const MAX_BODY_BYTES = 512;
const MAX_PROVIDER_BYTES = 8192;
const MAX_TRANSLATED_CODEPOINTS = 2000;
const UPSTREAM_DEADLINE_MS = 8000;
const ISOLATE_MAX_ATTEMPTS = 5;
const ISOLATE_WINDOW_MS = 60_000;

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer'
};
function json(status, value) {
  return new Response(JSON.stringify(value), { status, headers: DEFAULT_HEADERS });
}
function fail(status, code, message) {
  return json(status, { error: { code, message } });
}
function validSecret(value) {
  return typeof value === 'string' && value.length >= 32 && value.length <= 256 && /^[a-zA-Z0-9_-]+$/.test(value);
}
async function tokenMatches(expected, provided) {
  if (!validSecret(expected) || !validSecret(provided)) return false;
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
    crypto.subtle.digest('SHA-256', encoder.encode(provided))
  ]);
  const a = new Uint8Array(left), b = new Uint8Array(right);
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a[i] ^ b[i];
  return mismatch === 0;
}
async function boundedUtf8(stream, maxBytes) {
  if (!stream) return '';
  const reader = stream.getReader();
  const parts = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('OVERSIZE');
      parts.push(value);
    }
  } catch (error) {
    try { await reader.cancel(); } catch {}
    throw error;
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
function exactShape(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  const keys = Object.keys(payload).sort();
  return keys.length === 2 && keys[0] === 'findingCode' && keys[1] === 'targetLanguage';
}

/**
 * Creates a handler with an intentionally *soft per-isolate* rate guard. Cloudflare
 * can restart/replicate isolates: this is NOT a global quota or spend cap. The
 * primary demo protections are the private access secret, allowlisted template,
 * explicit user click, and Sarvam's un-topped-up free credit balance.
 */
export function createTranslationHandler({ fetchImpl = (...args) => fetch(...args), now = () => Date.now(), maxAttempts = ISOLATE_MAX_ATTEMPTS } = {}) {
  let windowStartedAt = now();
  let attempted = 0;
  return async function handle(request, env = {}) {
    if (request.method !== 'POST') return fail(405, 'METHOD_NOT_ALLOWED', 'Use POST.');
    let url;
    try { url = new URL(request.url); } catch { return fail(400, 'INVALID_URL', 'Invalid request URL.'); }
    // Browser-only same-origin request. A private demo token is also required;
    // Origin alone is not authentication and can be forged by non-browsers.
    const origin = request.headers.get('Origin');
    if (!origin || origin !== url.origin || (request.headers.get('Sec-Fetch-Site') && request.headers.get('Sec-Fetch-Site') !== 'same-origin')) {
      return fail(403, 'ORIGIN_REJECTED', 'Use this application to request translations.');
    }
    if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return fail(415, 'INVALID_CONTENT_TYPE', 'Expected JSON.');
    }
    if (!validSecret(env.HANDOFFGUARD_DEMO_TOKEN)) {
      return fail(503, 'ACCESS_NOT_CONFIGURED', 'Hosted translation has not been enabled by the operator.');
    }
    if (!(await tokenMatches(env.HANDOFFGUARD_DEMO_TOKEN, request.headers.get('X-HandoffGuard-Demo-Token')))) {
      return fail(401, 'ACCESS_DENIED', 'The demo access code is not valid.');
    }
    const announced = Number(request.headers.get('Content-Length'));
    if (Number.isFinite(announced) && announced > MAX_BODY_BYTES) return fail(413, 'REQUEST_TOO_LARGE', 'Request is too large.');
    let payload;
    try { payload = JSON.parse(await boundedUtf8(request.body, MAX_BODY_BYTES)); }
    catch { return fail(400, 'INVALID_REQUEST', 'Provide a small, valid JSON request.'); }
    if (!exactShape(payload)) return fail(400, 'INVALID_FIELDS', 'Only findingCode and targetLanguage are supported.');
    const template = getApprovedTemplate(payload.findingCode);
    if (!template) return fail(422, 'UNSUPPORTED_FINDING', 'This finding has no approved translation template.');
    if (payload.targetLanguage !== TARGET_LANGUAGE) return fail(422, 'UNSUPPORTED_LANGUAGE', 'Only Marathi is currently supported.');
    if (typeof env.SARVAM_API_KEY !== 'string' || !env.SARVAM_API_KEY.trim()) {
      return fail(503, 'PROVIDER_NOT_CONFIGURED', 'Sarvam is not configured; the English finding remains authoritative.');
    }
    if (now() - windowStartedAt >= ISOLATE_WINDOW_MS) { windowStartedAt = now(); attempted = 0; }
    if (attempted >= maxAttempts) return fail(429, 'ISOLATE_RATE_LIMIT', 'Too many requests on this instance. Try later.');
    attempted++;

    let upstream;
    try {
      upstream = await fetchImpl(SARVAM_URL, {
        method: 'POST',
        headers: {
          'api-subscription-key': env.SARVAM_API_KEY,
          'Content-Type': 'application/json', 'Accept': 'application/json'
        },
        body: JSON.stringify({
          input: template, source_language_code: 'en-IN', target_language_code: TARGET_LANGUAGE,
          model: MODEL, mode: 'formal'
        }),
        redirect: 'error',
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_DEADLINE_MS)])
      });
    } catch {
      return fail(504, 'TRANSLATION_TIMEOUT_OR_NETWORK', 'Sarvam did not respond in time. The English finding remains available.');
    }
    if (upstream.status === 402) return fail(402, 'FREE_CREDITS_EXHAUSTED', 'Sarvam free credits are exhausted. No paid top-up has been authorized.');
    if ([401, 403].includes(upstream.status)) return fail(503, 'PROVIDER_CREDENTIAL_REJECTED', 'The provider credential was rejected.');
    if (upstream.status === 429) return fail(503, 'PROVIDER_RATE_LIMITED', 'Sarvam is currently rate limiting requests.');
    if (upstream.status !== 200) return fail(503, 'PROVIDER_UNAVAILABLE', 'Sarvam is unavailable.');
    if (!upstream.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
      return fail(502, 'PROVIDER_INVALID_RESPONSE', 'Sarvam returned an unexpected response.');
    }
    let provider;
    try { provider = JSON.parse(await boundedUtf8(upstream.body, MAX_PROVIDER_BYTES)); }
    catch { return fail(502, 'PROVIDER_INVALID_RESPONSE', 'Sarvam returned an invalid response.'); }
    if (!provider || typeof provider.translated_text !== 'string'
      || provider.translated_text.trim().length === 0
      || Array.from(provider.translated_text).length > MAX_TRANSLATED_CODEPOINTS
      || provider.source_language_code !== 'en-IN') {
      return fail(502, 'PROVIDER_INVALID_RESPONSE', 'Sarvam returned an invalid translation.');
    }
    const providerRequestId = typeof provider.request_id === 'string' && /^[a-zA-Z0-9._:-]{1,128}$/.test(provider.request_id)
      ? provider.request_id : null;
    return json(200, {
      findingCode: payload.findingCode,
      englishTemplate: template,
      translatedText: provider.translated_text,
      targetLanguage: TARGET_LANGUAGE,
      sourceLanguage: 'en-IN',
      model: MODEL,
      templateVersion: TEMPLATE_VERSION,
      providerRequestId,
      advisoryOnly: true
    });
  };
}

const handler = createTranslationHandler();
export function onRequest({ request, env }) { return handler(request, env); }
