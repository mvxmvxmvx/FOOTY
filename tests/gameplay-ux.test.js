import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const load=file=>{const ctx={};vm.runInNewContext(fs.readFileSync(new URL('../public/assets/'+file,import.meta.url),'utf8'),ctx);return ctx};
const X=load('experience.js').FOOTY_EXPERIENCE;
const C=load('counter-questions.js').FOOTY_COUNTERS;
const M=load('match-engine.js').FOOTY_MATCH;
const goal=points=>({event:'goal',points});
const missed=(outcome='saved')=>({event:outcome==='conceded'?'conceded':'neutral',points:0,counter:{outcome}});
test('rarity drives momentum, not scored goals',()=>{
 assert.equal(X.momentum([goal(10)]),55);
 assert.equal(X.momentum([goal(100)]),85);
 assert.equal(M.summaryFromResults([goal(10)]).forGoals,1);
 assert.equal(M.summaryFromResults([goal(100)]).forGoals,1);
});
test('a missed attack swings momentum, regardless of defensive result',()=>{
 assert.equal(X.momentum([missed('saved')]),36);
 assert.equal(X.momentum([missed('conceded')]),36);
 assert.equal(M.summaryFromResults([missed('saved')]).againstGoals,0);
 assert.equal(M.summaryFromResults([missed('conceded')]).againstGoals,1);
 assert.equal(M.summaryFromResults([missed('saved')]).rating,5.8);
 assert.equal(M.summaryFromResults([missed('conceded')]).rating,5.8);
});
test('momentum clamps without hidden multipliers',()=>{
 assert.equal(X.momentum(Array.from({length:7},()=>goal(100))),100);
 assert.equal(X.momentum(Array.from({length:7},()=>missed())),0);
});
test('knowledge grade distinct from match performance',()=>{
 const common=Array.from({length:7},()=>goal(10)),legendary=Array.from({length:7},()=>goal(100));
 assert.equal(M.summaryFromResults(common).rating,M.summaryFromResults(legendary).rating);
 assert.equal(X.knowledge(common).grade,'FOUNDATION');
 assert.equal(X.knowledge(legendary).grade,'ENCYCLOPEDIA');
 assert.equal(X.knowledge(legendary).signatures,7);
});
test('counter questions have unique IDs, exactly four unique options and one answer',()=>{
 assert.ok(C.QUESTIONS.length>=10);
 const ids=new Set();
 for(const q of C.QUESTIONS){
  assert.ok(!ids.has(q.id));ids.add(q.id);
  assert.equal(q.options.length,4);
  assert.equal(new Set(q.options).size,4);
  assert.equal(q.options.filter(x=>x===q.answer).length,1);
  assert.equal(C.judge(q,q.answer),'saved');
  assert.equal(C.judge(q,q.options.find(x=>x!==q.answer)),'conceded');
 }
 assert.equal(C.DURATION_MS,5000);
});
test('counter selection is deterministic for daily resume',()=>{
 const q=C.forRound('a-question',4);
 assert.equal(q.id,C.forRound('a-question',4).id);
});
test('seven missed attacks with saves can finish 0-0',()=>{
 const game=M.summaryFromResults(Array.from({length:7},()=>missed('saved')));
 assert.equal(game.completed,true);
 assert.equal(game.forGoals,0);
 assert.equal(game.againstGoals,0);
 assert.equal(game.outcome,'draw');
});

test('distinct outcome classifications never render counter as own missed shot',()=>{
 assert.equal(X.outcomeKind({event:'goal',points:85}),'goal');
 assert.equal(X.outcomeKind({event:'neutral',counter:{outcome:'saved'}}),'saved');
 assert.equal(X.outcomeKind({event:'conceded',counter:{outcome:'conceded'}}),'conceded');
 assert.equal(X.outcomeKind({event:'neutral',counter:{outcome:'pending'}}),'pending');
});

test('Moment of Magic only becomes available once mid-Practice match at momentum 80+',()=>{
 assert.equal(X.MAGIC_THRESHOLD,80);
 assert.equal(X.MAGIC_RARITY_MIN,60);
 assert.equal(X.canOfferMagic('practice',[],false),false);
 assert.equal(X.canOfferMagic('practice',[goal(10)],false),false);
 assert.equal(X.canOfferMagic('practice',[goal(100)],false),true);
 assert.equal(X.canOfferMagic('daily',[goal(100)],false),false);
 assert.equal(X.canOfferMagic('practice',[goal(100)],true),false);
 assert.equal(X.canOfferMagic('practice',Array.from({length:7},()=>goal(100)),false),false);
});
test('Moment of Magic question only selects unused verified European or World finals with rare options',()=>{
 const q=[
  {id:'base',kind:'europe',answers:[{points:100}]},
  {id:'hard',kind:'world',answers:[{points:60},{points:10}]},
  {id:'easy',kind:'europe',answers:[{points:15},{points:30}]},
  {id:'wrong',kind:'classic',answers:[{points:100}]}
 ];
 const found=X.eligibleMagicQuestions(q,[q[0]]);
 assert.equal(found.length,1);
 assert.equal(found[0].id,'hard');
});
test('only rare+ verified success in the opted-in attack earns the local accolade',()=>{
 assert.equal(X.earnsMagicAccolade('moment-of-magic',60),true);
 assert.equal(X.earnsMagicAccolade('moment-of-magic',100),true);
 assert.equal(X.earnsMagicAccolade('moment-of-magic',30),false);
 assert.equal(X.earnsMagicAccolade('moment-of-magic',0),false);
 assert.equal(X.earnsMagicAccolade(null,100),false);
 const normal=M.summaryFromResults([goal(60)]);
 const special=M.summaryFromResults([{...goal(60),special:'moment-of-magic',specialSuccess:true}]);
 assert.equal(normal.rating,special.rating);
 assert.equal(normal.forGoals,special.forGoals);
});
