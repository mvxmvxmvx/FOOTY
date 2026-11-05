/* FOOTY v0.1.14 match rules. Pure, immutable reducer shared by browser and tests.
   Correct verified answer = goal; skipped/expired = concession; provisional
   editorial points remain separate. Invalid attempts do not end rounds. */
(function(root){
  'use strict';
  const ROUNDS=7;
  function summarize(results){
    if(!Array.isArray(results)||results.length>ROUNDS)throw new RangeError('Invalid match length');
    let forGoals=0,againstGoals=0,points=0;
    const events=results.map((r,i)=>{
      if(!r||!['goal','conceded','neutral'].includes(r.event))throw new TypeError('Invalid match event');
      const p=Number(r.points);
      if(!Number.isFinite(p)||p<0||p>100)throw new RangeError('Invalid editorial points');
      if(r.event==='goal'&&p===0)throw new RangeError('A goal needs a verified scored answer');
      if(r.event!=='goal'&&p!==0)throw new RangeError('Only correct answers score rarity points');
      if(r.event==='goal')forGoals++;else if(r.event==='conceded')againstGoals++;
      points+=p;
      return {round:i+1,event:r.event,points:p};
    });
    const completed=results.length===ROUNDS;
    const outcome=!completed?'in-progress':forGoals>againstGoals?'win':forGoals<againstGoals?'loss':'draw';
    return Object.freeze({forGoals,againstGoals,points,performance:Math.round(points/ROUNDS),played:results.length,remaining:ROUNDS-results.length,completed,outcome,events});
  }
  function fromResult(r){
    if(r?.event==='goal'||r?.event==='conceded'||r?.event==='neutral')return {event:r.event,points:r.points||0};
    // Supports V13 local daily saves without altering their validated results.
    return {event:Number(r?.points)>0?'goal':'conceded',points:Number(r?.points)||0};
  }
  function summaryFromResults(results){return summarize(results.map(fromResult))}
  function needsPenalties(summary){return summary.completed&&summary.outcome==='draw'}
  const api=Object.freeze({ROUNDS,summarize,fromResult,summaryFromResults,needsPenalties});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.FOOTY_MATCH=api;
})(typeof globalThis!=='undefined'?globalThis:this);
