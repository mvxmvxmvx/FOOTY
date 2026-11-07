/* Goal flair is a cosmetic presentation of provisionally curated rarity tiers.
 * It has NO influence on goals, match rating or answer validity. */
(function(root){
 'use strict';
 const styles=Object.freeze([
  {points:10,key:'tap-in',name:'Tap-in',call:'CALM FINISH',detail:'A familiar answer earns a simple, composed finish.'},
  {points:15,key:'driven',name:'Driven finish',call:'LOW AND HARD',detail:'A solid shout earns a stronger, more decisive finish.'},
  {points:30,key:'finesse',name:'Finesse',call:'BENT INTO THE CORNER',detail:'A clever answer earns a finish with extra finesse.'},
  {points:60,key:'volley',name:'Volley',call:'ON THE VOLLEY',detail:'A rare answer deserves the technique of a volley.'},
  {points:85,key:'screamer',name:'Top-bins screamer',call:'WHAT A STRIKE!',detail:'A deep-cut answer deserves an outrageous top-corner strike.'},
  {points:100,key:'bicycle',name:'Bicycle kick',call:'GOAL OF THE SEASON?!',detail:'The rarest editorial grade earns our most spectacular finish.'}
 ]);
 function forPoints(points){
  const p=Number(points);
  if(!Number.isFinite(p)||p<=0)return null;
  return styles.find(x=>x.points===p)||styles.filter(x=>p>=x.points).at(-1)||styles[0];
 }
 function bestGoal(results){
  if(!Array.isArray(results))return null;
  let best=null;
  for(let i=0;i<results.length;i++){
   const r=results[i];
   if(!r||!(r.event==='goal'||(!r.event&&Number(r.points)>0)))continue;
   const shot=forPoints(r.points);
   if(shot&&(!best||shot.points>best.shot.points)){
    best={round:i+1,answer:String(r.answer||'Verified answer'),shot};
   }
  }
  return best;
 }
 const api=Object.freeze({styles,forPoints,bestGoal});
 root.FOOTY_GOALS=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
