/* Player-facing editorial rarity. There is NO player population estimate yet.
   Question-relative counts are based solely on the reviewed answer bank. */
(function(root){
 'use strict';
 const TIERS=Object.freeze([
  Object.freeze({score:10,name:'Familiar',short:'FAMILIAR',icon:'●'}),
  Object.freeze({score:15,name:'Solid Shout',short:'SOLID SHOUT',icon:'◆'}),
  Object.freeze({score:30,name:'Clever',short:'CLEVER',icon:'✦'}),
  Object.freeze({score:60,name:'Rare',short:'RARE',icon:'★'}),
  Object.freeze({score:85,name:'Deep Cut',short:'DEEP CUT',icon:'✧'}),
  Object.freeze({score:100,name:'One in a Million',short:'ONE IN A MILLION',icon:'♛'})
 ]);
 function tier(points){
  const p=Number(points);
  if(!Number.isFinite(p)||p<=0)return null;
  return TIERS.filter(t=>t.score<=p).at(-1)||TIERS[0];
 }
 function compare(points,answers){
  const t=tier(points);
  if(!t||!Array.isArray(answers)||answers.length===0)return null;
  const scores=answers.map(a=>Number(a.points)).filter(n=>Number.isFinite(n)&&n>0);
  if(!scores.length)return null;
  const asRareOrRarer=scores.filter(p=>p>=t.score).length;
  const strictlyRarer=scores.filter(p=>p>Number(points)).length;
  return Object.freeze({tier:t,score:Number(points),total:scores.length,asRareOrRarer,strictlyRarer,relativeShare:asRareOrRarer/scores.length});
 }
 function summary(results){
  const scored=(results||[]).filter(r=>r?.event==='goal'&&tier(r.points));
  const highest=scored.slice().sort((a,b)=>Number(b.points)-Number(a.points))[0]||null;
  return Object.freeze({goals:scored.length,rare:scored.filter(r=>Number(r.points)>=60).length,deepCuts:scored.filter(r=>Number(r.points)>=85).length,legendary:scored.filter(r=>Number(r.points)>=100).length,best:highest});
 }
 const api=Object.freeze({TIERS,tier,compare,summary});
 root.FOOTY_RARITY=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
