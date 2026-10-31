'use strict';
// Independent CLI implementation: deliberately does NOT import browser engine.js.
// This is a recovery demo; not the historical HandoffGuard CLI.
const fs=require('node:fs');const crypto=require('node:crypto');
const VERSION='recovery-2026-10-31.2';
function fail(x){throw new Error(x)}
function parser(text){
 text=text.replace(/^\uFEFF/,'');if(text.length>4000000)fail('SIZE_LIMIT');
 let q=false,closed=false,cell='',row=[],table=[];
 for(let i=0;i<text.length;i++){
  let ch=text[i];
  if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(ch==='"'){q=false;closed=true;}else cell+=ch;}
  else if(closed){if(ch===','){row.push(cell);cell='';closed=false;}else if(ch==='\r'||ch==='\n'){row.push(cell);table.push(row);row=[];cell='';closed=false;if(ch==='\r'&&text[i+1]==='\n')i++;}else fail('MALFORMED_CSV');}
  else if(ch==='"'&&cell===''){q=true;}else if(ch==='"')fail('MALFORMED_CSV');else if(ch===','){row.push(cell);cell='';}else if(ch==='\r'||ch==='\n'){row.push(cell);table.push(row);row=[];cell='';if(ch==='\r'&&text[i+1]==='\n')i++;}else cell+=ch;
 }
 if(q)fail('MALFORMED_CSV');if(closed||row.length||cell!==''){row.push(cell);table.push(row);}
 if(!table.length)fail('MALFORMED_CSV');const headers=table.shift();
 if(headers.length>120||table.length>20000)fail('SIZE_LIMIT');
 if(headers.some(x=>!x)||new Set(headers).size!==headers.length)fail('DUPLICATE_COLUMN');
 if(table.some(r=>r.length!==headers.length))fail('MALFORMED_CSV');return {headers,rows:table};
}
function validate(c){if(!c||typeof c!=='object'||Array.isArray(c))fail('INVALID_CONTRACT');
 const keys=Object.keys(c).sort();if(keys.join()!=='editableColumns,keyColumn,requiredColumns')fail('INVALID_CONTRACT');
 const isStringArr=a=>Array.isArray(a)&&a.every(x=>typeof x==='string'&&x&&x.length<=120)&&a.length===new Set(a).size;
 if(typeof c.keyColumn!=='string'||!c.keyColumn||!isStringArr(c.requiredColumns)||!isStringArr(c.editableColumns)||!c.requiredColumns.includes(c.keyColumn)||c.editableColumns.includes(c.keyColumn)||c.editableColumns.some(x=>!c.requiredColumns.includes(x)))fail('INVALID_CONTRACT');
 return {keyColumn:c.keyColumn,requiredColumns:[...c.requiredColumns],editableColumns:[...c.editableColumns]};}
function analyze(original,returned,contract){const c=validate(contract),a=parser(original),b=parser(returned),findings=[];
 const push=(code,severity,detail,key='')=>findings.push({code,severity,detail,key});
 for(const h of c.requiredColumns)if(!a.headers.includes(h))push('MISSING_COLUMN','BLOCKER',`Original required column absent: ${h}`);
 for(const h of c.requiredColumns)if(!b.headers.includes(h))push('MISSING_COLUMN','BLOCKER',`Required column absent: ${h}`);
 for(const h of a.headers)if(!b.headers.includes(h)&&!c.requiredColumns.includes(h))push('MISSING_COLUMN','BLOCKER',`Original column absent: ${h}`);
 for(const h of b.headers)if(!a.headers.includes(h))push('EXTRA_COLUMN','BLOCKER',`Unexpected column: ${h}`);
 if(!a.headers.includes(c.keyColumn)||!b.headers.includes(c.keyColumn)){
 push('MISSING_COLUMN','BLOCKER',`Key column absent: ${c.keyColumn}`);
 }else{
 const m=(table,label)=>{const out=new Map();table.rows.forEach((r,i)=>{const key=r[table.headers.indexOf(c.keyColumn)];if(!key || !key.trim()){push('BLANK_KEY','BLOCKER',`${label}: blank key at data row ${i+1}`);return;}if(out.has(key)){push('DUPLICATE_KEY','BLOCKER',`${label}: duplicate key`,key);return;}out.set(key,new Map(table.headers.map((h,j)=>[h,r[j]])));});return out;};
 const old=m(a,'Original'),cur=m(b,'Returned');
 for(const key of old.keys())if(!cur.has(key))push('MEMBERSHIP_CHANGE','BLOCKER','Missing returned row',key);
 for(const key of cur.keys())if(!old.has(key))push('MEMBERSHIP_CHANGE','BLOCKER','Unexpected returned row',key);
 for(const [key,oldRow]of old){const newRow=cur.get(key);if(!newRow)continue;for(const h of a.headers){if(!newRow.has(h))continue;if(oldRow.get(h)!==newRow.get(h))push(c.editableColumns.includes(h)?'EDIT_REVIEW':'EDIT_FORBIDDEN',c.editableColumns.includes(h)?'REVIEW':'BLOCKER',`Column ${h} changed`,key);}}
 }
 findings.sort((a,b)=>[a.code,a.key,a.detail].join('\0').localeCompare([b.code,b.key,b.detail].join('\0')));
 const blockers=findings.filter(f=>f.severity==='BLOCKER').length,pending=findings.filter(f=>f.severity==='REVIEW').length;
 return {engineVersion:VERSION,contract:c,findings,blockers,pending,eligible:!blockers};
}
function args(argv){const o={};for(let i=0;i<argv.length;i++){if(!argv[i].startsWith('--')||!argv[i+1])fail('ARGUMENTS');o[argv[i].slice(2)]=argv[++i];}return o;}
function digest(r){return crypto.createHash('sha256').update(JSON.stringify(r),'utf8').digest('hex');}
if(require.main===module){
 try{
  const [action,...tail]=process.argv.slice(2),o=args(tail);if(!['analyze','verify'].includes(action))fail('USAGE');
  for(const field of ['original','returned','contract'])if(!o[field])fail('USAGE');
  const report=analyze(fs.readFileSync(o.original,'utf8'),fs.readFileSync(o.returned,'utf8'),JSON.parse(fs.readFileSync(o.contract,'utf8')));
  if(action==='analyze'){console.log(JSON.stringify({report,reportHash:digest(report)}));process.exitCode=report.blockers?2:0;}
  else {
   if(!o.packet)fail('USAGE');const packet=JSON.parse(fs.readFileSync(o.packet,'utf8'));
   const valid=packet.schema==='handoffguard-recovery-demo/v1'&&packet.engineVersion===VERSION&&packet.reportHash===digest(report)&&packet.advisoryTranslationIncluded===false&&report.eligible&&Array.isArray(packet.decisions)&&packet.decisions.length===report.pending;
   const seen=new Set();let ok=valid;
   if(valid)for(const d of packet.decisions){if(!Number.isInteger(d.findingIndex)||seen.has(d.findingIndex)||report.findings[d.findingIndex]?.severity!=='REVIEW'||!['accept','reject'].includes(d.decision)||typeof d.explanation!=='string'||d.explanation.trim().length<10||d.explanation.length>500){ok=false;break;}seen.add(d.findingIndex);}
   console.log(JSON.stringify({verified:ok,reportHash:digest(report),reviewed:ok?packet.decisions.length:0}));process.exitCode=ok?0:2;
  }
 }catch(e){console.error(JSON.stringify({error:e.message}));process.exitCode=2;}
}
module.exports={analyze,digest};
