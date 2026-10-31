import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/sarvam/translate.js';
function response() {
  return { code:0,headers:{},data:null, status(n){this.code=n;return this},setHeader(k,v){this.headers[k.toLowerCase()]=v;return this},json(v){this.data=v;return this},send(v){this.data=JSON.parse(v);return this}};
}
test('Vercel adapter fails closed with no configured demo token',async()=>{
  const res=response();
  await handler({method:'POST',url:'/api/sarvam/translate',headers:{host:'handoffguard.example.test','x-forwarded-proto':'https',origin:'https://handoffguard.example.test','content-type':'application/json','x-handoffguard-demo-token':'a'.repeat(32)},body:{findingCode:'EDIT_REVIEW',targetLanguage:'mr-IN'}},res);
  assert.equal(res.code,503);assert.equal(res.data.error.code,'ACCESS_NOT_CONFIGURED');
});
test('Vercel adapter rejects malformed host before provider',async()=>{
  const res=response();await handler({method:'POST',url:'/api/sarvam/translate',headers:{host:'bad.example/path','x-forwarded-proto':'https'},body:{}},res);
  assert.equal(res.code,400);assert.equal(res.data.error.code,'INVALID_HOST');
});
