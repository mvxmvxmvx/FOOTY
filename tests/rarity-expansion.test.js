import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context={};
vm.runInNewContext(fs.readFileSync(new URL('../public/assets/rarity.js',import.meta.url),'utf8'),context);
const R=context.FOOTY_RARITY;
const bank=JSON.parse(fs.readFileSync(new URL('../data/curated-bank.json',import.meta.url),'utf8'));
const relation=new Map();
for(const fact of bank.facts){
 if(!relation.has(fact.relation))relation.set(fact.relation,new Map());
 relation.get(fact.relation).set(fact.entityId,fact);
}
test('rarity grades are editorial tiers rather than invented population statistics',()=>{
 assert.equal(R.tier(10).short,'FAMILIAR');
 assert.equal(R.tier(60).short,'RARE');
 assert.equal(R.tier(85).short,'DEEP CUT');
 assert.equal(R.tier(100).short,'ONE IN A MILLION');
 assert.equal(R.tier(0),null);
});
test('relative rarity count is calculated within verified answer pool only',()=>{
 const detail=R.compare(85,[{points:10},{points:30},{points:85},{points:100}]);
 assert.equal(detail.score,85);
 assert.equal(detail.total,4);
 assert.equal(detail.asRareOrRarer,2);
 assert.equal(detail.strictlyRarer,1);
 assert.equal(detail.relativeShare,.5);
 assert.equal(R.compare(10,[]),null);
});
test('rarity summary picks highest accepted answer only, ties do not fabricate uniqueness',()=>{
 const x=R.summary([{event:'goal',answer:'A',points:15},{event:'conceded',points:0},{event:'goal',answer:'B',points:85},{event:'goal',answer:'C',points:100}]);
 assert.equal(x.goals,3);
 assert.equal(x.rare,2);
 assert.equal(x.deepCuts,2);
 assert.equal(x.legendary,1);
 assert.equal(x.best.answer,'C');
});
test('six Football Connections templates use reviewed relation intersections with >= 2 verified answers',()=>{
 const expected=['q_double_barca_2009_2011','q_double_bayern_2013_2020','q_pl_golden_boot_ballon_dor','q_won_euros_world_cup','q_bundesliga_european_double','q_seriea_european_double'];
 for(const id of expected){
  const q=bank.questions.find(x=>x.id===id);
  assert.ok(q,id);
  assert.equal(q.confidence,'reviewed');
  assert.equal(q.allOf.length,2);
  assert.ok(q.sources.length>=2);
  for(const source of q.sources)assert.ok(bank.sources[source],id+' missing source '+source);
  const ids=[...relation.get(q.allOf[0]).keys()].filter(key=>q.allOf.every(rel=>relation.get(rel)?.has(key)));
  assert.ok(ids.length>=2,id+' too few answers');
  assert.ok(ids.every(x=>bank.entities.some(e=>e.id===x)),id+' missing verified entity');
 }
 assert.equal(bank.questions.length,91);
});
