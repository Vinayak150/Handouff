import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {execFileSync,spawnSync} from 'node:child_process';
import {parseDelimited,validateContract,analyze,reportDigest} from '../public/engine.js';import {createReviewSession} from '../public/session.js';
const root=new URL('../',import.meta.url);const file=p=>readFileSync(new URL(p,root),'utf8');const contract=JSON.parse(file('fixtures/contract.json'));const original=file('fixtures/original.csv'), blocked=file('fixtures/returned-blocked.csv'),reviewable=file('fixtures/returned-reviewable.csv');
test('quoted CSV parser supports BOM, escaped quotes, CRLF and newline-in-cell',()=>{const t=parseDelimited('\uFEFFid,name\r\n1,"A""B"\r\n2,"line\nwrap"\r\n');assert.deepEqual(t.rows,[['1','A"B'],['2','line\nwrap']]);});
for(const input of ['id,name\n1,"unterminated','id,name\n1,b"ad','id,id\n1,2','id,name\n1'])test(`invalid CSV is rejected: ${input.slice(0,20)}`,()=>assert.throws(()=>parseDelimited(input)));
test('duplicate key blocked',()=>{const x=analyze({original,returned:reviewable+'A001,X,Pending,100\n',contract});assert.equal(x.eligible,false);assert.ok(x.findings.some(f=>f.code==='DUPLICATE_KEY'));});
test('blank key blocked',()=>{const x=analyze({original,returned:reviewable+' ,X,Pending,100\n',contract});assert.ok(x.findings.some(f=>f.code==='BLANK_KEY'));});
test('membership change blocked',()=>{const x=analyze({original,returned:reviewable.replace('A002,Demo Two,Pending,250\n',''),contract});assert.ok(x.findings.some(f=>f.code==='MEMBERSHIP_CHANGE'));});
test('required missing column blocked',()=>{const x=analyze({original,returned:reviewable.replaceAll(',amount','').replaceAll(',100','').replaceAll(',250',''),contract});assert.ok(x.findings.some(f=>f.code==='MISSING_COLUMN'));});
test('extra column blocked',()=>{const x=analyze({original,returned:reviewable.replace('status,amount','status,amount,extra').replaceAll('Pending,250','Pending,250,x').replaceAll('Approved,100','Approved,100,x'),contract});assert.ok(x.findings.some(f=>f.code==='EXTRA_COLUMN'));});
test('permitted edit has review pending',()=>{const x=analyze({original,returned:reviewable,contract});assert.equal(x.eligible,true);assert.equal(x.pending,1);});
test('forbidden edit blocks any review approval',()=>{const x=analyze({original,returned:blocked,contract});const s=createReviewSession(x);assert.equal(x.blockers,1);assert.throws(()=>s.decide(1,'accept','cannot approve blockers'),/BLOCKED/);});
test('review requires reason and valid decision',()=>{const x=analyze({original,returned:reviewable,contract}),s=createReviewSession(x);assert.throws(()=>s.decide(0,'accept','tiny'),/REVIEW_EXPLANATION_REQUIRED/);assert.throws(()=>s.decide(0,'delete','Verified correction'),/INVALID_DECISION/);s.decide(0,'accept','Verified intentional status update');assert.equal(s.state().complete,true);});
test('invalid contract cannot grant key edit permission',()=>{assert.throws(()=>validateContract({keyColumn:'record_id',requiredColumns:['record_id'],editableColumns:['record_id']}));});
test('no findings is review complete without approval artifact',()=>{const x=analyze({original,returned:original,contract});assert.equal(x.pending,0);assert.equal(x.blockers,0);assert.equal(createReviewSession(x).state().complete,true);});
test('browser engine digest matches independent CLI report hash',async()=>{const x=analyze({original,returned:reviewable,contract});const result=spawnSync(process.execPath,['cli.cjs','analyze','--original','fixtures/original.csv','--returned','fixtures/returned-reviewable.csv','--contract','fixtures/contract.json'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).reportHash,await reportDigest(x));});
test('independent CLI rejects a bad packet',()=>{const r=spawnSync(process.execPath,['cli.cjs','verify','--original','fixtures/original.csv','--returned','fixtures/returned-reviewable.csv','--contract','fixtures/contract.json','--packet','fixtures/not-a-packet.json'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});assert.equal(r.status,2);});
test('different report hashes after forbidden edit',async()=>{const a=await reportDigest(analyze({original,returned:blocked,contract})),b=await reportDigest(analyze({original,returned:reviewable,contract}));assert.notEqual(a,b);});
test('independent CLI verifies a valid synthetic packet and rejects changed source',()=>{
 const ok=spawnSync(process.execPath,['cli.cjs','verify','--original','fixtures/original.csv','--returned','fixtures/returned-reviewable.csv','--contract','fixtures/contract.json','--packet','fixtures/review-packet-synthetic.json'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
 assert.equal(ok.status,0,ok.stderr);assert.equal(JSON.parse(ok.stdout).verified,true);
 const no=spawnSync(process.execPath,['cli.cjs','verify','--original','fixtures/original.csv','--returned','fixtures/returned-blocked.csv','--contract','fixtures/contract.json','--packet','fixtures/review-packet-synthetic.json'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
 assert.equal(no.status,2);assert.equal(JSON.parse(no.stdout).verified,false);
});
test('fifty seeded CSV variations match independent CLI reports exactly',async()=>{
 let seed=123456789;const next=()=>{seed=(1664525*seed+1013904223)>>>0;return seed;};
 const base=JSON.parse(file('fixtures/contract.json'));
 const baseOriginal=file('fixtures/original.csv');
 const {analyze:cliAnalyze}=await import('../cli.cjs');
 for(let n=0;n<50;n++){
  const mode=next()%4;
  let target=reviewable;
  if(mode===0)target=blocked;
  if(mode===1)target=original;
  if(mode===2)target=reviewable.replace('A002,Demo Two,Pending,250','A002,Demo Two,Approved,250');
  if(mode===3)target=reviewable.replace('A002,Demo Two,Pending,250','A002,Demo Two,Pending,251');
  const a=analyze({original:baseOriginal,returned:target,contract:base});
  const b=cliAnalyze(baseOriginal,target,base);
  assert.deepEqual(a,b,`Seeded case ${n}`);
 }
});

// A required field absent from the original cannot produce an eligible report.
test('contract-required original column absence is a specifically labeled blocker and CLI agrees', async () => {
 const originalMissing = original.replace('record_id,customer,status,amount', 'record_id,status,amount')
   .replace('A001,Demo One,Pending,100', 'A001,Pending,100')
   .replace('A002,Demo Two,Pending,250', 'A002,Pending,250');
 const returnedMissing = reviewable.replace('record_id,customer,status,amount', 'record_id,status,amount')
   .replace('A001,Demo One,Approved,100', 'A001,Approved,100')
   .replace('A002,Demo Two,Pending,250', 'A002,Pending,250');
 const browser = analyze({ original:originalMissing, returned:returnedMissing, contract });
 const {analyze:cliAnalyze} = await import('../cli.cjs');
 const independent = cliAnalyze(originalMissing, returnedMissing, contract);
 assert.equal(browser.eligible, false);
 assert.ok(browser.findings.some(f => f.code === 'MISSING_COLUMN' && f.detail.includes('Original required')));
 assert.deepEqual(independent, browser);
 assert.throws(() => createReviewSession(browser).exportDecisions(), /REVIEW_INCOMPLETE/);
});

test('browser file import invalidates previous eligible report before awaiting file I/O', () => {
 const app = file('public/app.js');
 const handler = app.indexOf("$(id).addEventListener('change', async event => {");
 assert.ok(handler >= 0);
 const invalidateAt = app.indexOf('invalidate();', handler);
 const awaitAt = app.indexOf('await file.text();', handler);
 assert.ok(invalidateAt > handler && invalidateAt < awaitAt);
 assert.match(app.slice(handler), /if \(atRun !== run\) return/);
});
