// Operator-only hosted smoke test. LIVE NOT VERIFIED unless a real external response was observed.
// No key, access code, CSV data or raw provider translation is printed.
const origin=process.env.HANDOFFGUARD_BASE_URL;
if(!origin||!/^https:\/\/[^/]+$/.test(origin)){console.error('LIVE NOT VERIFIED: set exact HTTPS HANDOFFGUARD_BASE_URL');process.exit(2);}
const result={origin,staticStatus:null,invalidCodeStatus:null,providerStatus:'NOT RUN',liveVerified:false};
try {
 const staticResponse=await fetch(origin+'/',{redirect:'error'});result.staticStatus=staticResponse.status;
 const headers=staticResponse.headers.get('content-security-policy')??'';
 result.hostedCsp=headers.includes("connect-src 'self'")&&headers.includes("script-src 'self'");
 const wrong=await fetch(origin+'/api/sarvam/translate',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'X-HandoffGuard-Demo-Token':'this-is-an-intentionally-invalid-token-123'},body:JSON.stringify({findingCode:'EDIT_REVIEW',targetLanguage:'mr-IN'}),redirect:'error'});
 result.invalidCodeStatus=wrong.status;
 if(process.env.HANDOFFGUARD_LIVE_ALLOW_PROVIDER==='1'){
  const token=process.env.HANDOFFGUARD_DEMO_TOKEN;
  if(!token||token.length<32)throw new Error('Missing demo token in local operator environment');
  const response=await fetch(origin+'/api/sarvam/translate',{method:'POST',headers:{'Content-Type':'application/json','Origin':origin,'X-HandoffGuard-Demo-Token':token},body:JSON.stringify({findingCode:'EDIT_REVIEW',targetLanguage:'mr-IN'}),redirect:'error'});
  const data=await response.json();result.providerHttpStatus=response.status;
  result.providerStatus=response.ok&&data?.model==='sarvam-translate:v1'&&data?.advisoryOnly===true&&data?.translatedText?.trim()&&data?.sourceLanguage==='en-IN'?'PASS':'FAIL';
 }
 result.liveVerified=result.staticStatus===200&&result.invalidCodeStatus===401&&result.hostedCsp===true&&result.providerStatus==='PASS';
 console.log(JSON.stringify(result,null,2));process.exit(result.liveVerified?0:2);
} catch(e){console.error(JSON.stringify({status:'LIVE NOT VERIFIED',reason:e.message}));process.exit(2);}
