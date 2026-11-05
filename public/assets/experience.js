/* FOOTY 0.1.15: pressure, answer rarity and independent knowledge grade.
   Pure functions; match rating remains the match engine's responsibility. */
(function(root){
 'use strict';
 const RARITY_MOMENTUM=Object.freeze({10:5,15:8,30:12,60:18,85:25,100:35});
 const START_MOMENTUM=50, MISS_MOMENTUM=-14;
 function clamp(value){return Math.max(0,Math.min(100,value))}
 function momentumDelta(result){
  if(!result||result.event!=='goal')return MISS_MOMENTUM;
  const p=Number(result.points)||0;
  return RARITY_MOMENTUM[p]??(p>=85?25:p>=60?18:p>=30?12:p>=15?8:5);
 }
 function timeline(results){
  let current=START_MOMENTUM;
  return (Array.isArray(results)?results:[]).map((r,i)=>{
   current=clamp(current+momentumDelta(r));
   return Object.freeze({round:i+1,momentum:current,delta:momentumDelta(r),event:r.event,rarity:Number(r.points)||0});
  });
 }
 function momentum(results){const t=timeline(results);return t.length?t.at(-1).momentum:START_MOMENTUM}
 function knowledge(results){
  const points=(Array.isArray(results)?results:[]).reduce((sum,r)=>sum+(r?.event==='goal'?Math.max(0,Number(r.points)||0):0),0);
  const average=Math.round(points/7);
  const grade=average>=70?'ENCYCLOPEDIA':average>=50?'ELITE':average>=30?'SPECIALIST':average>=15?'SHARP':'FOUNDATION';
  const rare=(results||[]).filter(r=>r?.event==='goal'&&Number(r.points)>=60).length;
  const signatures=(results||[]).filter(r=>r?.event==='goal'&&Number(r.points)>=85).length;
  return Object.freeze({points,average,grade,rare,signatures});
 }
 function resultEvent(result){
  if(result.event==='goal')return 'goal';
  if(result.counter?.outcome==='conceded'||result.event==='conceded')return 'conceded';
  return 'neutral';
 }
 const api=Object.freeze({RARITY_MOMENTUM,START_MOMENTUM,MISS_MOMENTUM,momentumDelta,timeline,momentum,knowledge,resultEvent});
 root.FOOTY_EXPERIENCE=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
