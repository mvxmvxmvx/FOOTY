// Integration smoke test against the deployed Supabase function.
// Creates one ephemeral guest session and completes seven rounds.
// Keeps capability tokens out of CI logs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const API='https://emcgyjlzxfpedxwlspfo.supabase.co/functions/v1/footy-beta';
const bank=JSON.parse(fs.readFileSync(new URL('../data/curated-bank.json',import.meta.url),'utf8'));
const entities=new Map(bank.entities.map(e=>[e.id,e]));
const relations=new Map();
for(const f of bank.facts){if(!relations.has(f.relation))relations.set(f.relation,new Map());relations.get(f.relation).set(f.entityId,f);}
async function call(payload){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(API,{method:'POST',headers:{
   'Content-Type':'application/json','Origin':'https://mvxmvxmvx.github.io'
  },body:JSON.stringify(payload),signal:controller.signal});
  const data=await response.json();
  if(!response.ok)throw Error('HTTP '+response.status+': '+(data.error||'unknown'));
  assert.equal(response.headers.get('access-control-allow-origin'),'https://mvxmvxmvx.github.io');
  return data;
 }finally{clearTimeout(timer);}
}
const started=await call({action:'start'});
assert.equal(started.ok,true);
assert.ok(typeof started.sessionId==='string'&&typeof started.token==='string');
assert.equal(started.round.total,7);
assert.ok(!('answers' in started.round) && !('answers' in started));
let round=started.round,score=0,accepted=0;
for(let i=0;i<7;i++){
 assert.equal(round.index,i);
 const q=bank.questions.find(x=>x.id===round.questionId);
 assert.ok(q,'Unexpected question ID');
 const rels=q.allOf.map(id=>relations.get(id));
 const possible=[...rels[0].keys()].filter(id=>rels.every(rel=>rel.has(id)));
 let guess='Not A Footballer 987654';
 if(i===0){
  const first=entities.get(possible[0]);
  assert.ok(first&&first.name);
  guess=first.name;
 }
 const reply=await call({action:'submit',sessionId:started.sessionId,token:started.token,guess});
 assert.equal(reply.completed,i+1);
 if(i===0){assert.equal(reply.verdict,'accepted','Canonical seed answer was not accepted');accepted++;score=reply.points;}
 else{assert.equal(reply.verdict,'not_applicable');assert.equal(reply.points,0);}
 assert.equal(reply.score,score);
 if(i===6)assert.equal(reply.done,true);
 else {assert.equal(reply.done,false);round=reply.next;}
}
const completed=await call({action:'resume',sessionId:started.sessionId,token:started.token});
assert.equal(completed.done,true);
assert.equal(completed.completed,7);
assert.equal(completed.score,score);
console.log(JSON.stringify({result:'PASS',completedRounds:7,verifiedAcceptedAnswers:accepted,
 badAnswersRejected:6,score,backend:'Supabase Edge Function',answersLeaked:false}));
