import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const rule = config.headers.find(item => item.source === '/(.*)');
const headers = new Map((rule?.headers ?? []).map(item => [item.key.toLowerCase(), item.value]));

test('Vercel deploys explicit restrictive HTTP security headers', () => {
  assert.ok(rule, 'global Vercel headers rule missing');
  const csp = headers.get('content-security-policy');
  assert.ok(csp?.includes("connect-src 'self'"));
  assert.ok(csp?.includes("script-src 'self'"));
  assert.ok(csp?.includes("frame-ancestors 'none'"));
  assert.ok(csp?.includes("object-src 'none'"));
  assert.equal(headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headers.get('x-frame-options'), 'DENY');
  assert.equal(headers.get('referrer-policy'), 'no-referrer');
  assert.ok(headers.get('permissions-policy')?.includes('camera=()'));
});

test('Vercel HTTP and HTML meta CSP allow same-origin Sarvam Function only', () => {
  const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
  const policy = headers.get('content-security-policy');
  assert.match(html, /connect-src 'self'/);
  assert.ok(policy.includes("connect-src 'self'"));
  assert.ok(!policy.includes('unsafe-inline'));
  assert.ok(!policy.includes('unsafe-eval'));
});
