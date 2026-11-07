import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {importClubSeason} from '../src/lib/pl-player-seasons.js';
import {compile,verify} from '../src/lib/questions.js';
const bank=JSON.parse(fs.readFileSync(new URL('../data/curated-bank.json',import.meta.url),'utf8'));
const manifest=JSON.parse(fs.readFileSync(new URL('../data/premier-league/player-seasons/1992-1993/arsenal.json',import.meta.url),'utf8'));
const qid='q_pl_appear_1992_1993_arsenal';
const relation='pl_appear_1992_1993_arsenal';
test('1992/93 Arsenal has full reviewed player coverage with 462 starts, 29 players and league goals',()=>{
 assert.equal(manifest.coverage.status,'reviewed_complete');
 assert.equal(manifest.players.length,29);
 assert.equal(manifest.players.reduce((a,p)=>a+p.starts,0),462);
 assert.equal(manifest.players.reduce((a,p)=>a+p.substituteAppearances,0),69);
 assert.equal(manifest.players.reduce((a,p)=>a+p.goals,0),40);
 assert.equal(manifest.players.find(p=>p.name==='Perry Groves').starts,0);
});
test('imported player-club season matches verified count and accepts fringe players',()=>{
 const sourceBank=structuredClone(bank);
 sourceBank.questions=sourceBank.questions.filter(q=>q.id!==qid);
 sourceBank.facts=sourceBank.facts.filter(f=>f.relation!==relation);
 sourceBank.entities=sourceBank.entities.filter(e=>!manifest.players.some(p=>p.entityId===e.id&&!bank.facts.some(f=>f.entityId===e.id&&f.relation!==relation)));
 const out=importClubSeason(sourceBank,manifest);
 assert.equal(out.summary.verifiedPlayerSeasons,29);
 assert.equal(out.summary.totalStarts,462);
 assert.equal(out.summary.questionId,qid);
 const question=compile(out.bank).find(q=>q.id===qid);
 assert.equal(question.answers.length,29);
 for(const answer of question.answers)assert.equal(verify(question,answer.name).status,'accepted',answer.name);
 assert.equal(verify(question,'Perry Groves').status,'accepted');
 assert.equal(verify(question,'Gavin McGowan').status,'accepted');
 assert.equal(verify(question,'Thierry Henry').status,'not_applicable');
});
test('no incomplete or squad-only records can become scoreable PL appearance questions',()=>{
 const without=structuredClone(bank);
 without.questions=without.questions.filter(q=>q.id!==qid);
 without.facts=without.facts.filter(f=>f.relation!==relation);
 assert.throws(()=>importClubSeason(without,{...manifest,coverage:{...manifest.coverage,status:'pending'}}),/Unreviewed/);
 assert.throws(()=>importClubSeason(without,{...manifest,players:manifest.players.slice(0,20)}),/Incomplete/);
 const broken=structuredClone(manifest);broken.players[0].starts+=1;
 assert.throws(()=>importClubSeason(without,broken),/Invalid appearance|Starts do not reconcile/);
 const wrongClub=structuredClone(manifest);wrongClub.clubId='club_juventus';
 assert.throws(()=>importClubSeason(without,wrongClub),/Unknown Premier League club|did not participate/);
});
test('incomplete historical seasons cannot silently enter the active bank',()=>{
 const q=bank.questions.filter(q=>q.id.startsWith('q_pl_appear_'));
 for(const row of q){assert.ok(row.answers===undefined);assert.equal(row.confidence,'reviewed');}
 const ids=new Set(q.map(q=>q.id));
 assert.equal(ids.size,q.length);
 assert.ok(ids.has(qid));
 assert.ok(ids.has('q_pl_appear_1992_1993_manchester_united'));
 assert.equal(q.length,2,'only the two reviewed 1992/93 club pilots are scoreable');
});

const manUnited=JSON.parse(fs.readFileSync(new URL('../data/premier-league/player-seasons/1992-1993/manchester-united.json',import.meta.url),'utf8'));
test('Manchester United 1992/93 complete 20-player appearance ledger matches 42 games',()=>{
 assert.equal(manUnited.coverage.status,'reviewed_complete');
 assert.equal(manUnited.players.length,20);
 assert.equal(manUnited.players.reduce((n,p)=>n+p.starts,0),462);
 assert.equal(manUnited.players.reduce((n,p)=>n+p.substituteAppearances,0),41);
 assert.equal(manUnited.players.reduce((n,p)=>n+p.goals,0),66);
 const q=compile(bank).find(q=>q.id==='q_pl_appear_1992_1993_manchester_united');
 assert.ok(q);
 assert.equal(q.answers.length,20);
 for(const a of manUnited.players)assert.equal(verify(q,a.name).status,'accepted',a.name);
 assert.equal(verify(q,'Nicky Butt').status,'accepted');
 assert.equal(verify(q,'Danny Wallace').status,'accepted');
 assert.equal(verify(q,'David Beckham').status,'not_applicable');
});
test('all two reviewed 1992/93 club-seasons persist source-traceable audited stats',()=>{
 for(const manifestFile of [manifest,manUnited]){
  const slug=manifestFile.clubId.replace(/^club_/,'');
  const relation='pl_appear_1992_1993_'+slug;
  const facts=bank.facts.filter(f=>f.relation===relation);
  assert.equal(facts.length,manifestFile.players.length);
  assert.deepEqual(facts.map(f=>f.entityId).sort(),manifestFile.players.map(p=>p.entityId).sort());
  assert.ok(facts.every(f=>f.sources.length===2&&f.sources.every(id=>bank.sources[id]?.url)),relation);
 }
});
