import {analyze,reportDigest,ENGINE_VERSION} from './engine.js';
import {createReviewSession} from './session.js';
import {demo} from './sample.js';
import {mountSarvamAssistance} from './sarvam-assistance.js';

const $=id=>document.getElementById(id);
let run=0, report=null, session=null, currentSelection=null, original='', returned='', contract=null;
const assistance=mountSarvamAssistance({container:$('assistant'),getCurrentContext:()=>currentSelection});
const safeText=(id,v)=>{$(id).textContent=String(v);};
function load(kind){$('original').value=demo.original;$('returned').value=demo[kind];$('contract').value=JSON.stringify(demo.contract,null,2);invalidate();}
function invalidate(){run++;report=null;session=null;currentSelection=null;assistance.clear();safeText('status','Inputs changed; analyze again.');$('findings').replaceChildren();$('review').replaceChildren();$('export').disabled=true;}
async function analyse(){
  invalidate();original=$('original').value;returned=$('returned').value;try{contract=JSON.parse($('contract').value);report=analyze({original,returned,contract});session=createReviewSession(report);const version=run;
    safeText('status',`${report.blockers} blocker(s), ${report.pending} review finding(s). ${report.eligible?'Review eligible.':'BLOCKED: no approval.'}`);
    report.findings.forEach((f,i)=>{
      const b=document.createElement('button');b.type='button';b.className='finding';b.textContent=`${i+1}. ${f.severity}: ${f.code} — ${f.detail}${f.key?' [key '+f.key+']':''}`;
      b.addEventListener('click',()=>{
        currentSelection={analysisVersion:version,findingId:String(i)};
        assistance.showFinding({findingId:String(i),analysisVersion:version,findingCode:f.code,englishFinding:f.detail,nextAction:f.severity==='BLOCKER'?'Correct and reanalyze; not approvable.':'Review the permitted change and record a reason.'});
        const review=$('review');review.replaceChildren();if(f.severity==='REVIEW'&&report.eligible){
          const p=document.createElement('p');p.textContent='Review this change (required explanation, ≥10 characters)';const text=document.createElement('textarea');text.placeholder='Reason for decision';text.maxLength=500;const accept=document.createElement('button');accept.textContent='Accept';const reject=document.createElement('button');reject.textContent='Reject';
          for(const [btn,decision] of [[accept,'accept'],[reject,'reject']])btn.addEventListener('click',()=>{try{session.decide(i,decision,text.value);safeText('status',`Review ${session.state().reviewed}/${session.state().pending} complete`);$('export').disabled=!session.state().complete;}catch(e){safeText('status',e.message);}});
          review.append(p,text,accept,reject);
        }
      });$('findings').append(b);
    });$('export').disabled=!(session.state().complete&&report.eligible);
  }catch(e){safeText('status',`Unable to analyze: ${e.message}`);}
}
async function exportPacket(){
  if(!report||!session||!session.state().complete)return;
  const version=run, snapshot=report, active=session;
  const digest=await reportDigest(snapshot);
  if(run!==version || report!==snapshot || session!==active || !session.state().complete) return;
  const packet={schema:'handoffguard-recovery-demo/v1',engineVersion:ENGINE_VERSION,reportHash:digest,decisions:session.exportDecisions(),advisoryTranslationIncluded:false};
  const blob=new Blob([JSON.stringify(packet,null,2)+'\n'],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='review-packet.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);
}
$('sample-blocked').addEventListener('click',()=>load('blocked'));
$('sample-reviewable').addEventListener('click',()=>load('reviewable'));
$('analyze').addEventListener('click',analyse);$('export').addEventListener('click',exportPacket);
for(const id of ['original','returned','contract'])$(id).addEventListener('input',invalidate);
for(const [id,selector] of [['original-file','original'],['returned-file','returned'],['contract-file','contract']]){
  $(id).addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    // Invalidate an older exportable report *before* awaiting disk I/O.
    invalidate();
    const atRun = run;
    if (file.size > 4_000_000) {
      safeText('status', 'File too large; 4MB maximum');
      return;
    }
    try {
      const contents = await file.text();
      // A newer sample load, edit, analysis or file selection supersedes this I/O.
      if (atRun !== run) return;
      $(selector).value = contents;
      invalidate();
      safeText('status', 'File loaded. Analyze the new inputs before reviewing.');
    } catch {
      if (atRun === run) safeText('status', 'Could not read the file; no previous report is eligible.');
    }
  });
}
load('blocked');
