import test from 'node:test';
import assert from 'node:assert/strict';
import { createTranslationHandler } from '../functions/api/sarvam/translate.js';
import { getApprovedTemplate, TEMPLATE_VERSION } from '../functions/_shared/templates.js';
import { createTranslationClient } from '../public/sarvam-assistance.js';

const origin = 'https://handoffguard.pages.dev';
const token = 't'.repeat(48);
const env = { HANDOFFGUARD_DEMO_TOKEN: token, SARVAM_API_KEY: 'mock-provider-key' };
const valid = { findingCode: 'EDIT_REVIEW', targetLanguage: 'mr-IN' };
function req(body=valid, extraHeaders={}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request(`${origin}/api/sarvam/translate`, {
    method: 'POST',
    headers: {
      'Origin': origin, 'Content-Type': 'application/json',
      'X-HandoffGuard-Demo-Token': token, ...extraHeaders
    }, body: data
  });
}
function providerSuccess(text='बदलास पुनरावलोकन आवश्यक आहे.', requestId='mock-request') {
  return new Response(JSON.stringify({
    translated_text: text, source_language_code: 'en-IN', request_id: requestId
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
async function errorCode(response) { const body=await response.json(); return body?.error?.code; }

test('MOCK: genuine Sarvam request shape, approved template, key only in auth header', async () => {
  let recorded;
  const handle = createTranslationHandler({ fetchImpl: async (url, init) => {
    recorded = { url, init }; return providerSuccess();
  }});
  const response = await handle(req(), env);
  assert.equal(response.status, 200);
  const output = await response.json();
  assert.equal(output.findingCode,'EDIT_REVIEW');
  assert.equal(output.advisoryOnly,true);
  assert.equal(output.templateVersion,TEMPLATE_VERSION);
  assert.equal(output.translatedText,'बदलास पुनरावलोकन आवश्यक आहे.');
  assert.equal(recorded.url,'https://api.sarvam.ai/translate');
  assert.equal(recorded.init.headers['api-subscription-key'],'mock-provider-key');
  assert.deepEqual(JSON.parse(recorded.init.body), {
    input:getApprovedTemplate('EDIT_REVIEW'), source_language_code:'en-IN',
    target_language_code:'mr-IN', model:'sarvam-translate:v1', mode:'formal'
  });
  assert.doesNotMatch(recorded.init.body,/mock-provider-key|filename|csv|record_id/i);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('MOCK: missing access token and missing provider key do not invoke Sarvam', async () => {
  let calls=0;
  const handle=createTranslationHandler({fetchImpl:async()=>{calls++;return providerSuccess();}});
  assert.equal(await errorCode(await handle(req(),{SARVAM_API_KEY:'mock-provider-key'})), 'ACCESS_NOT_CONFIGURED');
  assert.equal(await errorCode(await handle(req(valid,{'X-HandoffGuard-Demo-Token':'bad'}),env)), 'ACCESS_DENIED');
  assert.equal(await errorCode(await handle(req(),{HANDOFFGUARD_DEMO_TOKEN:token})), 'PROVIDER_NOT_CONFIGURED');
  assert.equal(calls,0);
});

test('MOCK: origin, body fields, language, and finding code are rejected before provider call', async () => {
  let calls=0;
  const handle=createTranslationHandler({fetchImpl:async()=>{calls++;return providerSuccess();}});
  assert.equal(await errorCode(await handle(req(valid,{Origin:'https://other.example'}),env)), 'ORIGIN_REJECTED');
  assert.equal(await errorCode(await handle(req({...valid,sourceCsv:'private-value'}),env)), 'INVALID_FIELDS');
  assert.equal(await errorCode(await handle(req({...valid,targetLanguage:'hi-IN'}),env)), 'UNSUPPORTED_LANGUAGE');
  assert.equal(await errorCode(await handle(req({...valid,findingCode:'UNKNOWN_CODE'}),env)), 'UNSUPPORTED_FINDING');
  assert.equal(await errorCode(await handle(req('{bad-json'),env)), 'INVALID_REQUEST');
  assert.equal(await errorCode(await handle(req({...valid,padding:'x'.repeat(2000)}),env)), 'INVALID_REQUEST');
  assert.equal(calls,0);
});

test('MOCK: exhausted signup credits map to explicit free-credit failure', async () => {
  const handle=createTranslationHandler({fetchImpl:async()=>new Response('private raw provider body', {status:402})});
  const response=await handle(req(),env);
  assert.equal(response.status,402);
  assert.equal(await errorCode(response),'FREE_CREDITS_EXHAUSTED');
});

test('MOCK: provider rate-limit, authentication, timeout, malformed and HTML-like output are bounded', async () => {
  const cases=[
    {fetchImpl:async()=>new Response('private',{status:429}), code:'PROVIDER_RATE_LIMITED'},
    {fetchImpl:async()=>new Response('private',{status:403}), code:'PROVIDER_CREDENTIAL_REJECTED'},
    {fetchImpl:async()=>{throw new Error('secret private error')}, code:'TRANSLATION_TIMEOUT_OR_NETWORK'},
    {fetchImpl:async()=>new Response('not json',{status:200,headers:{'Content-Type':'application/json'}}),code:'PROVIDER_INVALID_RESPONSE'},
    {fetchImpl:async()=>new Response(JSON.stringify({translated_text:'',source_language_code:'en-IN'}),{status:200,headers:{'Content-Type':'application/json'}}),code:'PROVIDER_INVALID_RESPONSE'}
  ];
  for(const item of cases){
    const handler=createTranslationHandler({fetchImpl:item.fetchImpl});
    assert.equal(await errorCode(await handler(req(),env)),item.code);
  }
  const handler=createTranslationHandler({fetchImpl:async()=>providerSuccess('<img src=x onerror=alert(1)>')});
  const output=await (await handler(req(),env)).json();
  assert.equal(output.translatedText,'<img src=x onerror=alert(1)>');
});

test('MOCK: process-local throttle is bounded but not a distributed quota', async () => {
  let calls=0; const handler=createTranslationHandler({maxAttempts:1,fetchImpl:async()=>{calls++;return providerSuccess();}});
  assert.equal((await handler(req(),env)).status,200);
  assert.equal(await errorCode(await handler(req(),env)),'ISOLATE_RATE_LIMIT');
  assert.equal(calls,1);
});

test('MOCK: client sends only code and locale in JSON; access secret stays in separate same-origin header', async () => {
  let init;
  const client=createTranslationClient({fetchImpl:async(url,options)=>{
    assert.equal(url,'/api/sarvam/translate');init=options;
    return new Response(JSON.stringify({
      findingCode:'EDIT_REVIEW', targetLanguage:'mr-IN', sourceLanguage:'en-IN', model:'sarvam-translate:v1',
      translatedText:'मार्गदर्शन',englishTemplate:'English guidance',templateVersion:TEMPLATE_VERSION,advisoryOnly:true
    }), {status:200,headers:{'Content-Type':'application/json'}});
  }});
  const r=await client.request({findingCode:'EDIT_REVIEW',contextKey:'epoch-1|finding-1',accessCode:token,isCurrent:()=>true});
  assert.equal(r.kind,'success');
  assert.equal(init.headers['X-HandoffGuard-Demo-Token'],token);
  assert.deepEqual(JSON.parse(init.body),valid);
  assert.equal(init.body.includes(token),false);
  assert.equal(client.cacheSize(),1);
});

test('MOCK: stale analysis responses are discarded and not cached', async () => {
  let finish;
  const client=createTranslationClient({fetchImpl:()=>new Promise(resolve=>{finish=resolve;})});
  const pending=client.request({findingCode:'EDIT_REVIEW',contextKey:'old|finding',accessCode:token,isCurrent:()=>true});
  client.invalidate();
  finish(new Response(JSON.stringify({findingCode:'EDIT_REVIEW',targetLanguage:'mr-IN',sourceLanguage:'en-IN',model:'sarvam-translate:v1',translatedText:'stale',englishTemplate:'abc',templateVersion:TEMPLATE_VERSION,advisoryOnly:true}),{status:200}));
  const result=await pending;
  assert.equal(result.kind,'stale');
  assert.equal(client.cacheSize(),0);
});

test('MOCK: repeated clicks coalesce while pending and reuse bounded advisory cache', async () => {
  let count=0;
  let resolveFetch;
  const client=createTranslationClient({fetchImpl:async()=>{
    count++;
    return new Promise(resolve=>{resolveFetch=resolve;});
  }});
  const args={findingCode:'EDIT_REVIEW',contextKey:'analysis-10|finding-7',accessCode:token,isCurrent:()=>true};
  const a=client.request(args);
  const b=client.request(args);
  assert.equal(count,1);
  resolveFetch(new Response(JSON.stringify({
    findingCode:'EDIT_REVIEW',targetLanguage:'mr-IN',sourceLanguage:'en-IN',model:'sarvam-translate:v1',
    englishTemplate:'English source',translatedText:'मराठी मार्गदर्शन',templateVersion:TEMPLATE_VERSION,advisoryOnly:true
  }),{status:200,headers:{'Content-Type':'application/json'}}));
  assert.equal((await a).kind,'success');
  assert.equal((await b).kind,'success');
  const cached=await client.request(args);
  assert.equal(cached.kind,'success');
  assert.equal(cached.cached,true);
  assert.equal(count,1);
});

test('MOCK: no evidence of CSV data, filenames or identifiers sent to Sarvam despite injected request fields', async () => {
  let calls=0;
  const handle=createTranslationHandler({fetchImpl:async()=>{calls++;return providerSuccess();}});
  const input={...valid,originalCsv:'user@example.com,123456789',fileName:'customer-data.csv',reviewerExplanation:'private note'};
  const result=await handle(req(input),env);
  assert.equal(result.status,400);
  assert.equal(await errorCode(result),'INVALID_FIELDS');
  assert.equal(calls,0);
});
