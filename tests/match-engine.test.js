import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../public/assets/match-engine.js',import.meta.url),'utf8');
const context={};vm.runInNewContext(source,context);
const Match=context.FOOTY_MATCH;
const goal=(points=60)=>({event:'goal',points});
const conceded=()=>({event:'conceded',points:0});

test('all seven verified answers produce 7–0 and an independent editorial rating',()=>{
  const game=Match.summarize(Array(7).fill(null).map(()=>goal(10)));
  assert.equal(game.forGoals,7);
  assert.equal(game.againstGoals,0);
  assert.equal(game.points,70);
  assert.equal(game.performance,10);
  assert.equal(game.outcome,'win');
  assert.equal(game.completed,true);
});

test('goals and concessions never depend on 50-point rarity threshold',()=>{
  const game=Match.summarize([goal(10),goal(15),goal(30),goal(60),conceded(),conceded(),conceded()]);
  assert.equal(game.forGoals,4);
  assert.equal(game.againstGoals,3);
  assert.equal(game.performance,Math.round(115/7));
});

test('legacy saved daily records are correctly converted',()=>{
  const game=Match.summaryFromResults([{points:85},{points:0},{points:15}]);
  assert.equal(game.forGoals,2);
  assert.equal(game.againstGoals,1);
  assert.equal(game.played,3);
  assert.equal(game.outcome,'in-progress');
});

test('7 binary rounds cannot end tied, so penalties are future functionality',()=>{
  for(let goals=0;goals<=7;goals++){
    const game=Match.summarize([...Array(goals).fill(null).map(()=>goal()),...Array(7-goals).fill(null).map(conceded)]);
    assert.equal(Match.needsPenalties(game),false);
  }
});

test('neutral events support a future draw and shootout',()=>{
  const game=Match.summarize([goal(),goal(),goal(),conceded(),conceded(),conceded(),{event:'neutral',points:0}]);
  assert.equal(game.outcome,'draw');
  assert.equal(Match.needsPenalties(game),true);
});

test('reject impossible and invalid match records',()=>{
  assert.throws(()=>Match.summarize(Array(8).fill(null).map(goal)),RangeError);
  assert.throws(()=>Match.summarize([goal(0)]),RangeError);
  assert.throws(()=>Match.summarize([{event:'conceded',points:60}]),RangeError);
});
