import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateSnapshot,teamQidProposal,wdqsQuery,parseWdqsBatch,seasonStageSql} from '../src/lib/epl-season.js';
const config=JSON.parse(fs.readFileSync(new URL('../data/seasons/epl-2026-27-prejanuary.json',import.meta.url),'utf8'));
const arsenal=config.clubs.find(c=>c.id==='club_arsenal');
const binding=(player,statement,from=null,to=null)=>({
 person:{value:'http://www.wikidata.org/entity/'+player},
 statement:{value:'http://www.wikidata.org/entity/statement/'+statement},
 personLabel:{value:'Test Player'},
 ...(from?{start:{value:from}}:{}),
 ...(to?{end:{value:to}}:{})
});
test('2026/27 snapshot has 20 distinct clubs and is fixed to Nov 4',()=>{
 assert.equal(validateSnapshot(config).clubs.length,20);
 assert.equal(config.clubs.find(c=>c.id==='club_coventry_city').wikidataQid,'Q19580');
 assert.equal(config.clubs.filter(c=>c.qidStatus==='verified').length,20);
 assert.equal(config.phase,'pre_january');
 assert.throws(()=>validateSnapshot({...config,asOf:'2027-03-01'}),/Wrong snapshot/);
});
test('QID discovery is candidate-only and cannot silently bind teams',()=>{
 const x=teamQidProposal({search:[{id:'Q123',label:'Test',description:'fictional team'}]},
   {id:'club_sunderland',name:'Sunderland'});
 assert.equal(x.status,'needs_manual_review');
 assert.equal(x.candidates[0].qid,'Q123');
 assert.equal(x.candidates[0].url,'https://www.wikidata.org/wiki/Q123');
});
test('query is bounded and cannot be run for unverified QID',()=>{
 assert.match(wdqsQuery('Q9617','2026-07-01','2026-11-04',250),/LIMIT 250/);
 assert.match(wdqsQuery('Q9617','2026-07-01','2026-11-04',250),/ps:P54 wd:Q9617/);
 assert.throws(()=>wdqsQuery('Arsenal','2026-07-01','2026-11-04'),/Unverified/);
});
test('a P54 membership is pending and never a senior appearance',()=>{
 const fixture={results:{bindings:[binding('Q45901','Q45901-ABCD','1999-08-03T00:00:00Z',null),
 binding('Q43913','Q43913-ABCD'),binding('Q45901','Q45901-ABCD')]}};
 const {claims,manifest}=parseWdqsBatch(fixture,arsenal,config,3);
 assert.equal(claims.length,2);
 assert.equal(manifest.possibly_truncated,true);
 assert.equal(claims[0].player_id,null);
 assert.equal(claims[0].appearances,null);
 assert.equal(claims[0].review_status,'pending');
 assert.equal(claims[0].evidence_type,'wikidata_membership');
 assert.equal(claims[0].raw_evidence.timestamp_precision,'unknown_not_inferred');
 const unverified={...config.clubs.find(c=>c.id==='club_leeds_united'),wikidataQid:null,qidStatus:'unmapped'};
 assert.throws(()=>parseWdqsBatch(fixture,unverified,config,3),/unverified team/);
});
test('staging SQL never grants scored-game eligibility',()=>{
 const batch=parseWdqsBatch({results:{bindings:[binding('Q45901','Q45901-ABCD')]}},arsenal,config);
 const sql=seasonStageSql(batch);
 assert.match(sql,/insert into footy.season_player_evidence/i);
 assert.match(sql,/join footy.season_club_participants/i);
 assert.doesNotMatch(sql,/insert into footy.facts/i);
 assert.doesNotMatch(sql,/insert into footy.question_templates/i);
 assert.match(sql,/null,null,i.source_id/);
 assert.throws(()=>seasonStageSql({claims:[{claim_key:'abc'}]}),/Only unreviewed/);
});
