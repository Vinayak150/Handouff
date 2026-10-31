// Optional advisory-only panel for the existing HandoffGuard findings screen.
// This module never imports the deterministic engine or writes review decisions.
const MAX_CACHE = 8;
const CACHE_MS = 5 * 60_000;
const LANG = 'mr-IN';

export function createTranslationClient({ fetchImpl = (...args) => fetch(...args), now = () => Date.now() } = {}) {
  const cache = new Map();
  let generation = 0;
  let pending = null;

  function invalidate() {
    generation++;
    pending?.controller.abort();
    pending = null;
    cache.clear();
  }
  function cacheGet(key) {
    const item = cache.get(key);
    if (!item) return null;
    if (now() - item.at >= CACHE_MS) { cache.delete(key); return null; }
    cache.delete(key); cache.set(key, item);
    return item.response;
  }
  function cachePut(key, response) {
    cache.set(key, { at: now(), response });
    while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
  }
  async function request({ findingCode, contextKey, accessCode, isCurrent = () => true } = {}) {
    if (typeof findingCode !== 'string' || !/^[A-Z_]{3,64}$/.test(findingCode)) return { kind: 'error', code: 'INVALID_FINDING' };
    if (typeof contextKey !== 'string' || contextKey.length === 0) return { kind: 'error', code: 'NO_ANALYSIS_CONTEXT' };
    if (typeof accessCode !== 'string' || accessCode.length < 32 || accessCode.length > 256 || !/^[a-zA-Z0-9_-]+$/.test(accessCode)) return { kind: 'error', code: 'ACCESS_CODE_REQUIRED' };
    const key = `${findingCode}|${LANG}`;
    const cached = cacheGet(key);
    if (cached && isCurrent(contextKey)) return { kind: 'success', value: cached, cached: true };
    if (pending && pending.contextKey === contextKey && pending.findingCode === findingCode) return pending.promise;
    if (pending) pending.controller.abort();
    const controller = new AbortController();
    const atGeneration = generation;
    const promise = (async () => {
      try {
        const response = await fetchImpl('/api/sarvam/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 'Accept': 'application/json',
            'X-HandoffGuard-Demo-Token': accessCode
          },
          body: JSON.stringify({ findingCode, targetLanguage: LANG }),
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal
        });
        const payload = await response.json();
        if (atGeneration !== generation || controller.signal.aborted || !isCurrent(contextKey)) return { kind: 'stale' };
        if (!response.ok) return { kind: 'error', code: typeof payload?.error?.code === 'string' ? payload.error.code : 'SERVICE_UNAVAILABLE' };
        if (payload.findingCode !== findingCode || payload.targetLanguage !== LANG
          || payload.sourceLanguage !== 'en-IN' || payload.model !== 'sarvam-translate:v1'
          || payload.advisoryOnly !== true || typeof payload.translatedText !== 'string'
          || !payload.translatedText.trim() || Array.from(payload.translatedText).length > 2000
          || typeof payload.englishTemplate !== 'string' || typeof payload.templateVersion !== 'string') {
          return { kind: 'error', code: 'INVALID_RESPONSE' };
        }
        cachePut(key, payload);
        return { kind: 'success', value: payload, cached: false };
      } catch {
        return controller.signal.aborted || atGeneration !== generation ? { kind: 'stale' } : { kind: 'error', code: 'SERVICE_UNAVAILABLE' };
      } finally {
        if (pending?.promise === promise) pending = null;
      }
    })();
    pending = { controller, contextKey, findingCode, promise };
    return promise;
  }
  return { request, invalidate, cacheSize: () => cache.size };
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Mount once beside the actual existing finding. Call showFinding() whenever
 * selected finding or analysis version changes, and clear() when analysis is
 * cancelled/invalidated. The host app owns review decisions and permissions.
 */
export function mountSarvamAssistance({ container, getCurrentContext, client = createTranslationClient() }) {
  if (!container || typeof getCurrentContext !== 'function') throw new Error('A container and current-context callback are required.');
  const root = element('section', undefined, 'sarvam-panel');
  root.setAttribute('aria-label', 'Advisory Marathi explanation');
  const heading = element('h3', 'Indian-language assistance — Marathi');
  const privacy = element('p', 'Only generic code-based English guidance is sent to Sarvam after you click. CSV values, IDs, filenames and reviewer notes are never sent.');
  const original = element('p', 'Choose a finding to see the authoritative English message.');
  const action = element('p', 'The deterministic next action remains authoritative.');
  const tokenLabel = element('label', 'Private demo access code');
  const tokenInput = element('input');
  tokenInput.type = 'password';
  tokenInput.autocomplete = 'off';
  tokenInput.maxLength = 256;
  tokenInput.id = 'handoffguard-sarvam-access';
  tokenLabel.htmlFor = tokenInput.id;
  const button = element('button', 'Explain selected finding in Marathi');
  button.type = 'button';
  const state = element('p', 'Not requested. English remains authoritative.');
  state.setAttribute('role', 'status');
  const translation = element('p', '');
  translation.lang = 'mr';
  root.append(heading, privacy, original, action, tokenLabel, tokenInput, button, state, translation);
  container.append(root);
  let current = null;
  let selectedGeneration = 0;
  button.disabled = true;

  function showFinding({ findingId, analysisVersion, findingCode, englishFinding, nextAction }) {
    client.invalidate();
    selectedGeneration++;
    current = { findingId, analysisVersion, findingCode };
    original.textContent = `Authoritative English finding: ${String(englishFinding ?? '')}`;
    action.textContent = `Deterministic next action: ${String(nextAction ?? '')}`;
    translation.textContent = '';
    state.textContent = 'Not requested. Marathi is advisory and cannot change review eligibility.';
    button.disabled = typeof findingCode !== 'string';
  }
  function clear() {
    client.invalidate();
    selectedGeneration++;
    current = null;
    button.disabled = true;
    tokenInput.value = '';
    translation.textContent = '';
    state.textContent = 'Analysis changed or cancelled. Select a current finding.';
  }
  button.addEventListener('click', async () => {
    if (!current) return;
    const snapshot = current;
    const generation = selectedGeneration;
    const contextKey = `${snapshot.analysisVersion}|${snapshot.findingId}`;
    const accessCode = tokenInput.value;
    tokenInput.value = '';
    state.textContent = 'Requesting Marathi guidance. English remains authoritative.';
    const result = await client.request({
      findingCode: snapshot.findingCode,
      contextKey,
      accessCode,
      isCurrent: key => {
        const latest = getCurrentContext();
        return selectedGeneration === generation && current === snapshot
          && latest?.analysisVersion === snapshot.analysisVersion
          && latest?.findingId === snapshot.findingId
          && key === `${latest.analysisVersion}|${latest.findingId}`;
      }
    });
    if (generation !== selectedGeneration || current !== snapshot) return;
    if (result.kind === 'success') {
      translation.textContent = result.value.translatedText; // inert text, never HTML
      state.textContent = result.cached ? 'Cached advisory Marathi guidance (not human reviewed).' : 'Sarvam response received. Translation accuracy has not been independently reviewed.';
    } else if (result.kind !== 'stale') {
      translation.textContent = '';
      state.textContent = `Marathi assistance unavailable (${result.code}). Continue using the English finding and next action.`;
    }
  });
  return { showFinding, clear, destroy: () => { clear(); root.remove(); } };
}
