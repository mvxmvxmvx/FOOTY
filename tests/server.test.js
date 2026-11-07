import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createFootyServer} from '../src/server/index.js';

async function withServer(options,callback){
 const server=createFootyServer(options);
 server.listen(0,'127.0.0.1');
 await once(server,'listening');
 try{
  const address=server.address();
  return await callback('http://127.0.0.1:'+address.port);
 }finally{
  await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
 }
}

test('V13 browser bootstrap loads in local development only',async()=>{
 await withServer({host:'127.0.0.1',production:false,localPreview:true},async(base)=>{
  const res=await fetch(base+'/api/v1/bootstrap');
  assert.equal(res.status,200);
  assert.equal(res.headers.get('cache-control'),'no-store');
  const bank=await res.json();
  assert.equal(bank.entities.length,561);
  assert.equal(bank.facts.length,1411);
  assert.equal(bank.questions.length,91);
  assert.equal(bank.meta.scoring,'Editorial rarity estimates, not crowd frequencies.');
 });
});

test('full answer bank is blocked in production and on nonloopback bind',async()=>{
 for(const options of [{host:'0.0.0.0',production:false,localPreview:true},
  {host:'127.0.0.1',production:true,localPreview:true},
  {host:'127.0.0.1',production:false,localPreview:false}]){
  await withServer(options,async(base)=>{
   const res=await fetch(base+'/api/v1/bootstrap');
   assert.equal(res.status,403);
   assert.equal((await res.json()).error,'Prototype question bank disabled outside local development');
  });
 }
});

test('server-side verification still accepts curated answers and daily plan has seven rounds',async()=>{
 await withServer({host:'0.0.0.0',production:true},async(base)=>{
  const verify=await fetch(base+'/api/v1/verify',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({questionId:'q_played_premier_league',answer:'Arsenal'})
  });
  assert.equal(verify.status,200);
  const result=await verify.json();
  assert.equal(result.status,'accepted');
  assert.equal(result.canonical,'Arsenal');
  const day=await (await fetch(base+'/api/v1/daily?date=2026-11-04')).json();
  assert.equal(day.questionIds.length,7);
  assert.equal(new Set(day.questionIds).size,7);
  const lists=await (await fetch(base+'/api/v1/questions')).json();
  assert.equal(lists.length,91);
  assert.equal(lists.some(x=>'answers' in x),false);
 });
});

test('obsolete static answer-bank asset is never publicly served',async()=>{
 await withServer({host:'127.0.0.1',production:false,localPreview:true},async(base)=>{
  const res=await fetch(base+'/assets/bank.js');
  assert.equal(res.status,404);
 });
});
