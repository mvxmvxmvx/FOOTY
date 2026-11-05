import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/assets/goal-cinematics.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(source,context);
const Goals=context.FOOTY_GOALS;
test('six distinct shot types cover the curated answer tiers',()=>{
 assert.equal(Goals.styles.length,6);
 assert.equal(new Set(Goals.styles.map(s=>s.key)).size,6);
 assert.deepEqual(Array.from(Goals.styles,x=>x.points),[10,15,30,60,85,100]);
 for(const s of Goals.styles)assert.equal(Goals.forPoints(s.points).key,s.key);
});
test('unknown or missed answers receive no goal animation',()=>{
 assert.equal(Goals.forPoints(0),null);
 assert.equal(Goals.forPoints(undefined),null);
 assert.equal(Goals.bestGoal([{event:'conceded',answer:'No answer',points:0}]),null);
});
test('goal of match uses best verified finish, not latest answer',()=>{
 const match=[
  {event:'goal',answer:'Common',points:10},
  {event:'goal',answer:'Screamer',points:85},
  {event:'goal',answer:'Later',points:60},
  {event:'conceded',answer:'No answer',points:0}
 ];
 const award=Goals.bestGoal(match);
 assert.equal(award.round,2);
 assert.equal(award.answer,'Screamer');
 assert.equal(award.shot.key,'screamer');
});
test('ties use first spectacular goal and never miss',()=>{
 const award=Goals.bestGoal([
  {event:'goal',answer:'One',points:100},
  {event:'goal',answer:'Two',points:100},
  {event:'conceded',points:0}
 ]);
 assert.equal(award.round,1);
});
test('legacy saved daily goals remain eligible',()=>{
 const result=Goals.bestGoal([{points:30,answer:'Old'},{points:0}]);
 assert.equal(result.answer,'Old');
 assert.equal(result.shot.key,'finesse');
});
