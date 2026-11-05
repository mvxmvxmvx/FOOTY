/* FOOTY v0.1.14: seven-round match scoring, independent of editorial rarity.
 * Each correct verified answer = one goal. Timeouts/skips = missed attack
 * and a defensive counterattack. A failed defense concedes; a save does not. Starts at 6.0, perfect seven = 10.0.
 * Invalid guesses do not resolve a round. Old V13 daily saves remain readable.
 */
(function(root){
 'use strict';
 const ROUNDS=7, START_RATING=6.0, GOAL_DELTA=4/7, MISS_DELTA=-0.25, MIN_RATING=3.0;
 function fromResult(r){
   if(r?.event==='goal'||r?.event==='conceded'||r?.event==='neutral')return {event:r.event};
   return {event:Number(r?.points)>0?'goal':'conceded'};
 }
 function summarize(results){
   if(!Array.isArray(results)||results.length>ROUNDS)throw new RangeError('Invalid match length');
   let forGoals=0,againstGoals=0,missed=0;
   const events=results.map((r,i)=>{
     if(!r||!['goal','conceded','neutral'].includes(r.event))throw new TypeError('Invalid match event');
     if(r.event==='goal')forGoals++;
     if(r.event==='conceded')againstGoals++;
     if(r.event!=='goal')missed++
     return Object.freeze({round:i+1,event:r.event});
   });
   // Calculate from integer event counts to avoid cumulative rounding drift.
   const rawRating=Math.max(MIN_RATING,Math.min(10,START_RATING+GOAL_DELTA*forGoals+MISS_DELTA*missed));
   const rating=Number(rawRating.toFixed(1));
   const completed=results.length===ROUNDS;
   const outcome=!completed?'in-progress':forGoals>againstGoals?'win':forGoals<againstGoals?'loss':'draw';
   return Object.freeze({forGoals,againstGoals,missed,rating,played:results.length,remaining:ROUNDS-results.length,completed,outcome,events});
 }
 function summaryFromResults(results){return summarize(results.map(fromResult))}
 function needsPenalties(summary){return summary.completed&&summary.outcome==='draw'}
 const api=Object.freeze({ROUNDS,START_RATING,GOAL_DELTA,MISS_DELTA,summarize,fromResult,summaryFromResults,needsPenalties});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.FOOTY_MATCH=api;
})(typeof globalThis!=='undefined'?globalThis:this);
