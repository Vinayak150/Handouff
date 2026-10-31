// Reconstruction-only deterministic engine, NOT the original cohort engine.
// All decisions derive solely from the two local files and contract.
export const ENGINE_VERSION = 'recovery-2026-10-31.2';
const MAX_CHARS = 4_000_000;
const MAX_ROWS = 20_000;
const MAX_COLUMNS = 120;

export function parseDelimited(input, delimiter = ',') {
  if (delimiter !== ',' && delimiter !== '\t') throw new Error('UNSUPPORTED_DELIMITER');
  if (typeof input !== 'string' || input.length > MAX_CHARS) throw new Error('SIZE_LIMIT');
  input = input.replace(/^\uFEFF/, '');
  const rows = []; let row = [], cell = '', quoted = false, afterQuote = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"' && input[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; afterQuote = true; }
      else cell += c;
    } else {
      if (afterQuote) {
        if (c === delimiter) { row.push(cell); cell = ''; afterQuote = false; }
        else if (c === '\n' || c === '\r') { row.push(cell); rows.push(row); row=[]; cell=''; afterQuote=false; if (c==='\r' && input[i+1]==='\n') i++; }
        else throw new Error('MALFORMED_CSV');
      } else if (c === '"' && cell === '') { quoted = true; }
      else if (c === '"') throw new Error('MALFORMED_CSV');
      else if (c === delimiter) { row.push(cell); cell=''; }
      else if (c === '\r' || c === '\n') { row.push(cell); rows.push(row); row=[]; cell=''; if (c==='\r' && input[i+1]==='\n') i++; }
      else cell += c;
    }
    if (rows.length > MAX_ROWS + 1 || row.length > MAX_COLUMNS) throw new Error('SIZE_LIMIT');
  }
  if (quoted) throw new Error('MALFORMED_CSV');
  if (afterQuote || row.length || cell !== '') { row.push(cell); rows.push(row); }
  if (!rows.length || rows[0].length === 0 || rows[0].every(x=>x==='')) throw new Error('MALFORMED_CSV');
  const headers = rows.shift();
  if (headers.length > MAX_COLUMNS) throw new Error('SIZE_LIMIT');
  if (headers.some(x=>x.length===0) || new Set(headers).size !== headers.length) throw new Error('DUPLICATE_COLUMN');
  if (rows.some(r=>r.length !== headers.length)) throw new Error('MALFORMED_CSV');
  if (rows.length > MAX_ROWS) throw new Error('SIZE_LIMIT');
  return {headers, rows};
}

export function validateContract(c) {
  if (typeof c === 'string') { try { c=JSON.parse(c); } catch { throw new Error('INVALID_CONTRACT'); } }
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('INVALID_CONTRACT');
  const keys = Object.keys(c).sort();
  if (keys.join(',') !== ['editableColumns','keyColumn','requiredColumns'].sort().join(',')) throw new Error('INVALID_CONTRACT');
  const isStrings = xs => Array.isArray(xs) && xs.every(x=>typeof x==='string'&&x.length>0&&x.length<=120) && new Set(xs).size===xs.length;
  if (typeof c.keyColumn !== 'string' || !c.keyColumn || !isStrings(c.editableColumns) || !isStrings(c.requiredColumns)) throw new Error('INVALID_CONTRACT');
  if (!c.requiredColumns.includes(c.keyColumn) || c.editableColumns.includes(c.keyColumn) || c.editableColumns.some(x=>!c.requiredColumns.includes(x))) throw new Error('INVALID_CONTRACT');
  return {keyColumn:c.keyColumn, requiredColumns:[...c.requiredColumns], editableColumns:[...c.editableColumns]};
}

function finding(code, severity, detail, key='') { return {code, severity, detail, key}; }
export function analyze({original, returned, contract, delimiter=','}) {
  const c=validateContract(contract); const o=parseDelimited(original, delimiter), r=parseDelimited(returned, delimiter);
  const findings=[];
  for(const h of c.requiredColumns) if(!o.headers.includes(h)) findings.push(finding('MISSING_COLUMN','BLOCKER',`Original required column absent: ${h}`));
  for(const h of c.requiredColumns) if(!r.headers.includes(h)) findings.push(finding('MISSING_COLUMN','BLOCKER',`Required column absent: ${h}`));
  for(const h of o.headers) if(!r.headers.includes(h) && !c.requiredColumns.includes(h)) findings.push(finding('MISSING_COLUMN','BLOCKER',`Original column absent: ${h}`));
  for(const h of r.headers) if(!o.headers.includes(h)) findings.push(finding('EXTRA_COLUMN','BLOCKER',`Unexpected column: ${h}`));
  if(!o.headers.includes(c.keyColumn) || !r.headers.includes(c.keyColumn)) {
    findings.push(finding('MISSING_COLUMN','BLOCKER',`Key column absent: ${c.keyColumn}`));
    return summary(findings,c);
  }
  const createMap=(table,label)=>{
    const m=new Map(); let i=0;
    for(const row of table.rows){
      const key=row[table.headers.indexOf(c.keyColumn)]; i++;
      if(!key || !key.trim()){ findings.push(finding('BLANK_KEY','BLOCKER',`${label}: blank key at data row ${i}`)); continue; }
      if(m.has(key)){ findings.push(finding('DUPLICATE_KEY','BLOCKER',`${label}: duplicate key`,key)); continue; }
      m.set(key,new Map(table.headers.map((h,j)=>[h,row[j]])));
    }
    return m;
  };
  const a=createMap(o,'Original'),b=createMap(r,'Returned');
  for(const key of a.keys()) if(!b.has(key)) findings.push(finding('MEMBERSHIP_CHANGE','BLOCKER','Missing returned row',key));
  for(const key of b.keys()) if(!a.has(key)) findings.push(finding('MEMBERSHIP_CHANGE','BLOCKER','Unexpected returned row',key));
  for(const [key,oldRow] of a) {
    const newRow=b.get(key); if(!newRow) continue;
    for(const h of o.headers) {
      if(!newRow.has(h)) continue;
      if(oldRow.get(h)!==newRow.get(h)) findings.push(finding(c.editableColumns.includes(h)?'EDIT_REVIEW':'EDIT_FORBIDDEN',c.editableColumns.includes(h)?'REVIEW':'BLOCKER',`Column ${h} changed`,key));
    }
  }
  return summary(findings,c);
}
function summary(findings,contract){
  // Stable ordering; deliberately excludes values from findings.
  findings.sort((a,b)=>[a.code,a.key,a.detail].join('\0').localeCompare([b.code,b.key,b.detail].join('\0')));
  return {engineVersion:ENGINE_VERSION,contract,findings,blockers:findings.filter(x=>x.severity==='BLOCKER').length,pending:findings.filter(x=>x.severity==='REVIEW').length,eligible:!findings.some(x=>x.severity==='BLOCKER')};
}
export function canonicalReport(result){
  return JSON.stringify({engineVersion:result.engineVersion,contract:result.contract,findings:result.findings,blockers:result.blockers,pending:result.pending,eligible:result.eligible});
}
export async function reportDigest(result){
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalReport(result)));
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
