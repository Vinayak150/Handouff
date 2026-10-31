import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
import {allowedFindingCodes,getApprovedTemplate} from '../functions/_shared/templates.js';
const f=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('templates cover deterministic finding codes, no CSV identifiers or values in approved templates',()=>{
 for(const code of ['EDIT_REVIEW','EDIT_FORBIDDEN','MISSING_COLUMN','EXTRA_COLUMN','DUPLICATE_KEY','BLANK_KEY','MEMBERSHIP_CHANGE'])assert.equal(typeof getApprovedTemplate(code),'string');
 assert.equal(getApprovedTemplate('USER_TYPED_ARBITRARY_TEXT'),null);
 assert.ok(allowedFindingCodes().length>=7);
});
test('same-origin-only CSP matches between meta and hosted header policy',()=>{
 const html=f('../public/index.html'),headers=f('../public/_headers');
 assert.match(html,/connect-src 'self'/);assert.match(headers,/connect-src 'self'/);
 assert.doesNotMatch(html,/connect-src 'none'/);assert.doesNotMatch(headers,/connect-src 'none'/);
 for(const rule of ["script-src 'self'","object-src 'none'","base-uri 'none'"]) {assert.ok(html.includes(rule));assert.ok(headers.includes(rule));}
 assert.match(headers,/frame-ancestors 'none'/);
});
test('browser code never references Sarvam provider secret or external API',()=>{
 const files=['app.js','engine.js','session.js','sample.js','sarvam-assistance.js'];
 for(const name of files){const code=f('../public/'+name);assert.doesNotMatch(code,/SARVAM_API_KEY|api\.sarvam\.ai|api-subscription-key/);}
});
test('routes include only API function',()=>{
 const r=JSON.parse(f('../public/_routes.json'));assert.deepEqual(r.include,['/api/sarvam/*']);assert.deepEqual(r.exclude,[]);
});
test('no browser asset is a deployed secret or server function',()=>{
 const run=spawnSync(process.execPath,['scripts/build-pages.mjs'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});assert.equal(run.status,0,run.stderr);
 const actual=readdirSync(new URL('../dist/',import.meta.url)).sort();
 const allowed=['index.html','app.js','engine.js','session.js','sample.js','style.css','sarvam-assistance.js','sarvam-assistance.css','_headers','_routes.json'].sort();assert.deepEqual(actual,allowed);
});
test('cannot include arbitrary raw CSV values in translation request construction',()=>{
 const client=f('../public/sarvam-assistance.js');assert.match(client,/JSON\.stringify\(\{ findingCode, targetLanguage: LANG \}\)/);
 assert.doesNotMatch(client,/CSV\.stringify|originalCsv|returnedCsv|reviewerNote/);
});
