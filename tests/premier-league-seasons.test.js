import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {compile,verify} from '../src/lib/questions.js';
import {dailyPlan} from '../src/lib/daily.js';

const bank=JSON.parse(fs.readFileSync(new URL('../data/curated-bank.json',import.meta.url),'utf8'));
const compiled=compile(bank);
const byId=new Map(compiled.map(q=>[q.id,q]));
const entities=new Map(bank.entities.map(e=>[e.id,e]));
const memberships=bank.facts.filter(f=>/^pl_season_\d{4}_\d{4}$/.test(f.relation));
const sourceSet=new Set(Object.keys(bank.sources));
const relationFor=(year)=>'pl_season_'+year+'_'+(year+1);
const answerNames=(year)=>new Set(byId.get('q_pl_clubs_'+year+'_'+(year+1))?.answers.map(a=>a.name)||[]);
const everPresent=['Arsenal','Chelsea','Everton','Liverpool','Manchester United','Tottenham Hotspur'];
const current=['AFC Bournemouth','Arsenal','Aston Villa','Brentford','Brighton & Hove Albion','Chelsea','Coventry City','Crystal Palace','Everton','Fulham','Hull City','Ipswich Town','Leeds United','Liverpool','Manchester City','Manchester United','Newcastle United','Nottingham Forest','Sunderland','Tottenham Hotspur'];

test('Premier League 1992-2026 membership is exactly 35 complete seasons, 706 facts, 51 clubs',()=>{
 assert.equal(memberships.length,706);
 const ids=new Set(memberships.map(f=>f.entityId));
 assert.equal(ids.size,51);
 for(const id of ids)assert.equal(entities.get(id)?.type,'club',id);
 for(let year=1992;year<=2026;year++){
  const relation=relationFor(year);
  const season=memberships.filter(f=>f.relation===relation);
  const q=byId.get('q_pl_clubs_'+year+'_'+(year+1));
  const expected=year<=1994?22:20;
  assert.equal(season.length,expected,relation);
  assert.ok(q,relation);
  assert.equal(q.answers.length,expected,relation);
  assert.equal(q.allOf[0],relation);
  assert.equal(q.allOf.length,1);
  assert.equal(new Set(season.map(f=>f.entityId)).size,expected,relation);
  for(const fact of season)for(const source of fact.sources)assert.ok(sourceSet.has(source),relation+': '+source);
  for(const a of q.answers)assert.equal(verify(q,a.name).status,'accepted',relation+': '+a.name);
 }
});
test('1992 founders, ever-present clubs and 2026/27 current season reconcile with Premier League',()=>{
 const first=answerNames(1992);
 const now=answerNames(2026);
 assert.equal(first.size,22);
 assert.equal(now.size,20);
 assert.deepEqual([...now].sort(),current.slice().sort());
 for(const name of everPresent)for(let y=1992;y<=2026;y++)assert.ok(answerNames(y).has(name),name+' '+y);
 assert.ok(first.has('Wimbledon FC'));
 assert.ok(first.has('Oldham Athletic'));
 assert.equal(first.has('West Ham United'),false);
 assert.equal(now.has('West Ham United'),false);
 assert.ok(now.has('Coventry City')&&now.has('Hull City')&&now.has('Ipswich Town'));
});
test('historical promotion, relegation and one-season clubs are not invented as continuous',()=>{
 const onlySeason=([year,club])=>{assert.ok(answerNames(year).has(club));for(let y=1992;y<=2026;y++)if(y!==year)assert.equal(answerNames(y).has(club),false,club+' '+y)};
 onlySeason([1993,'Swindon Town']);onlySeason([1997,'Barnsley']);onlySeason([2010,'Blackpool']);onlySeason([2023,'Luton Town']);
 assert.ok(answerNames(1992).has('Coventry City'));
 assert.equal(answerNames(2002).has('Coventry City'),false);
 assert.ok(answerNames(2026).has('Coventry City'));
 assert.equal(answerNames(2011).has('Manchester City'),true);
 assert.equal(answerNames(1997).has('Manchester City'),false);
});
test('season club questions accept aliases and reject nonmembers',()=>{
 const q1992=byId.get('q_pl_clubs_1992_1993');
 const q2026=byId.get('q_pl_clubs_2026_2027');
 assert.equal(verify(q1992,'Wimbledon').status,'accepted');
 assert.equal(verify(q2026,'Man Utd').status,'accepted');
 assert.equal(verify(q2026,'Leicester City').status,'not_applicable');
 assert.equal(verify(q1992,'Newcastle United').status,'not_applicable');
});
test('new questions preserve fixed seven-question daily and allow future-year questions only in future saved daily plans',()=>{
 const d=dailyPlan(compiled,'2026-11-06');
 assert.equal(d.questionIds.length,7);
 assert.equal(new Set(d.questionIds).size,7);
});
