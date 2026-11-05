import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/assets/match-engine.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(source,context);
const Match=context.FOOTY_MATCH;
const goal=(points=60)=>({event:'goal',points});
const conceded=()=>({event:'conceded',points:0});

test('perfect 7–0 ends on a 10.0 match rating regardless of answer rarity',()=>{
  for(const rarity of [10,30,60,100]){
    const game=Match.summarize(Array.from({length:7},()=>goal(rarity)));
    assert.equal(game.forGoals,7);
    assert.equal(game.againstGoals,0);
    assert.equal(game.rating,10);
    assert.equal(game.outcome,'win');
  }
});
test('everyone begins with a 6.0 rating',()=>{
 assert.equal(Match.summarize([]).rating,6.0);
});
test('correct answers raise rating; misses lower it and concede a goal',()=>{
 const first=Match.summarize([goal(10)]);
 const next=Match.summarize([goal(10),conceded()]);
 assert.equal(first.rating,6.6);
 assert.equal(next.rating,6.3);
 assert.equal(next.forGoals,1);
 assert.equal(next.againstGoals,1);
});
test('match rating is independent of editorial answer values',()=>{
 assert.equal(Match.summarize([goal(10),goal(15),conceded()]).rating,Match.summarize([goal(100),goal(100),conceded()]).rating);
});
test('existing local daily records migrate without changing match score',()=>{
 const game=Match.summaryFromResults([{points:85},{points:0},{points:15}]);
 assert.equal(game.forGoals,2);
 assert.equal(game.againstGoals,1);
 assert.equal(game.rating,6.9);
});
test('seven binary rounds cannot end tied',()=>{
 for(let n=0;n<=7;n++){
  const game=Match.summarize([...Array(n).fill(null).map(()=>goal()),...Array(7-n).fill(null).map(conceded)]);
  assert.equal(Match.needsPenalties(game),false);
 }
});
test('reject invalid match records',()=>{
 assert.throws(()=>Match.summarize(Array(8).fill(null).map(goal)),{name:'RangeError',message:'Invalid match length'});
 assert.throws(()=>Match.summarize([{event:'unknown'}]),{name:'TypeError',message:'Invalid match event'});
});
