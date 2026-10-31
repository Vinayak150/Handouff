// Optional Vercel Hobby fail-closed adapter for Cloudflare Pages-compatible handler.
// The same deterministic English template allowlist and Sarvam provider code are reused.
// No credentials belong in source control; the provider remains disabled until explicitly configured.
import { createTranslationHandler } from '../../functions/api/sarvam/translate.js';

const translate = createTranslationHandler();

export default async function handler(req, res) {
  const method = typeof req.method === 'string' ? req.method : 'GET';
  const forwardedProto = String(req.headers['x-forwarded-proto'] ?? 'https').split(',')[0].trim();
  const host = String(req.headers.host ?? '');
  // A malformed Host should fail closed, never permit translation.
  if (forwardedProto !== 'https' || !/^[a-zA-Z0-9.-]+(?::[0-9]+)?$/.test(host)) {
    res.status(400).setHeader('Cache-Control', 'no-store').json({error:{code:'INVALID_HOST',message:'Invalid request host.'}});
    return;
  }
  const url = new URL(req.url ?? '/', `https://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
  }
  let body;
  if (method === 'POST') {
    // Vercel normally parses JSON, but preserve exact code + language shape.
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? null);
  }
  let request;
  try {request = new Request(url, { method, headers, ...(method === 'POST' ? { body } : {}) });}
  catch {res.status(400).json({error:{code:'INVALID_REQUEST',message:'Invalid request.'}}); return;}
  const response = await translate(request, {
    HANDOFFGUARD_DEMO_TOKEN: process.env.HANDOFFGUARD_DEMO_TOKEN,
    SARVAM_API_KEY: process.env.SARVAM_API_KEY
  });
  for (const [key, value] of response.headers.entries()) res.setHeader(key, value);
  res.status(response.status).send(await response.text());
}
