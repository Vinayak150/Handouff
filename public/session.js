export function createReviewSession(report){
  const reviews=new Map();
  const keys=report.findings.map((f,i)=>`${i}|${f.code}|${f.key}|${f.detail}`);
  function decide(index,decision,explanation){
    if(!report.eligible) throw new Error('BLOCKED');
    if(!Number.isInteger(index) || index<0 || index>=keys.length) throw new Error('UNKNOWN_FINDING');
    if(report.findings[index].severity!=='REVIEW') throw new Error('NOT_REVIEWABLE');
    if(!['accept','reject'].includes(decision)) throw new Error('INVALID_DECISION');
    if(typeof explanation!=='string' || explanation.trim().length<10 || explanation.length>500) throw new Error('REVIEW_EXPLANATION_REQUIRED');
    reviews.set(keys[index],{findingIndex:index,decision,explanation:explanation.trim()});
  }
  function state(){return {eligible:report.eligible,complete:report.eligible&&reviews.size===report.pending,reviewed:reviews.size,pending:report.pending};}
  function exportDecisions(){if(!state().complete) throw new Error('REVIEW_INCOMPLETE');return [...reviews.values()].sort((a,b)=>a.findingIndex-b.findingIndex);}
  return {decide,state,exportDecisions};
}
