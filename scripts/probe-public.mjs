// Public URL read-only proof; no Sarvam key, access code, CSV values or provider use.
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('proof',{recursive:true});
const origin='https://handoffguard-wunderdevs.vercel.app';
const result={origin,checkedAt:new Date().toISOString(),rootStatus:null,assets:{},securityHeaders:{},missingOrInvalidTokenStatus:null,providerCall:'NOT RUN',success:false};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let error='';
for(let attempt=1;attempt<=12;attempt++){
 try{
  const home=await fetch(origin+'/',{redirect:'manual',signal:AbortSignal.timeout(12000)});
  const html=await home.text();
  result.rootStatus=home.status;
  result.securityHeaders={csp:home.headers.get('content-security-policy')?.includes("frame-ancestors 'none'")??false,nosniff:home.headers.get('x-content-type-options')==='nosniff',referrer:home.headers.get('referrer-policy')==='no-referrer'};
  const homeOK=home.status===200&&html.includes('HandoffGuard');
  const asset=await fetch(origin+'/engine.js',{redirect:'manual',signal:AbortSignal.timeout(12000)});
  result.assets['/engine.js']=asset.status;
  const wrong=await fetch(origin+'/api/sarvam/translate',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-HandoffGuard-Demo-Token':'intentionally_wrong_0123456789_ABCDEFG'},body:JSON.stringify({findingCode:'EDIT_REVIEW',targetLanguage:'mr-IN'}),redirect:'manual',signal:AbortSignal.timeout(12000)});
  result.missingOrInvalidTokenStatus=wrong.status;
  const failClosed=[401,403,503].includes(wrong.status);
  result.success=homeOK&&asset.status===200&&result.securityHeaders.csp&&result.securityHeaders.nosniff&&result.securityHeaders.referrer&&failClosed;
  if(result.success)break;
  error='Public site or header/unauthorized-API proof not yet passing';
 }catch(e){error=e?.message??String(e)}
 if(attempt<12)await wait(7000);
}
result.error=result.success?null:error;
writeFileSync('proof/public-hosted-check.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(!result.success)process.exitCode=2;
