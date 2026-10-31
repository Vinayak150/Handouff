import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';import {analyze,reportDigest} from '../public/engine.js';import {createReviewSession} from '../public/session.js';
const src=readFileSync('fixtures/original.csv','utf8'),c=JSON.parse(readFileSync('fixtures/contract.json','utf8'));
const blocked=analyze({original:src,returned:readFileSync('fixtures/returned-blocked.csv','utf8'),contract:c});
const reviewable=analyze({original:src,returned:readFileSync('fixtures/returned-reviewable.csv','utf8'),contract:c});
assert.equal(blocked.blockers,1);assert.equal(blocked.pending,1);assert.equal(blocked.eligible,false);
assert.equal(reviewable.blockers,0);assert.equal(reviewable.pending,1);assert.equal(reviewable.eligible,true);
const session=createReviewSession(reviewable);session.decide(0,'accept','Verified intentional demo status change');assert.equal(session.state().complete,true);assert.equal((await reportDigest(reviewable)).length,64);
console.log(JSON.stringify({status:'PASS',scenarios:[{name:'blocked',blockers:blocked.blockers,pending:blocked.pending},{name:'reviewable',blockers:reviewable.blockers,pending:reviewable.pending,reviewed:1}]},null,2));
