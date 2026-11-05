
(async()=>{'use strict';
let BANK, DAILY_PLAN=null;
try {
  const response = await fetch('/api/v1/bootstrap', {cache:'no-store'});
  if (!response.ok) throw Error(`Database unavailable (${response.status})`);
  BANK=await response.json();
  const today = new Date().toISOString().slice(0,10);
  const planResponse=await fetch('/api/v1/daily?date='+encodeURIComponent(today),{cache:'no-store'});
  if(planResponse.ok) DAILY_PLAN=await planResponse.json();
} catch(err) {
  console.error('FOOTY initialization',err);
  const label=document.getElementById('dbversion');
  if(label)label.textContent='DATABASE CONNECTION ERROR — check the FOOTY server is running.';
  const start=document.getElementById('start');if(start)start.disabled=true;
  const daily=document.getElementById('startdaily');if(daily)daily.disabled=true;
  return;
}
const ENTITY=new Map(BANK.entities.map(e=>[e.id,e]));
const FACTS=new Map();for(const f of BANK.facts){if(!FACTS.has(f.relation))FACTS.set(f.relation,new Map());const rel=FACTS.get(f.relation);if(rel.has(f.entityId))throw Error('Duplicate relation/entity '+f.relation);rel.set(f.entityId,f)}
const normalize=s=>String(s||'').toLocaleLowerCase('en').replace(/ß/g,'ss').replace(/ø/g,'o').replace(/ł/g,'l').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/ı/g,'i').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'and').replace(/[^a-z0-9]/g,'').replace(/^the(?=[a-z])/, '');
// Only names already verified for this question are eligible.
const NAME_PARTICLES=new Set(['van','von','de','del','der','den','di','da','do','dos','du','la','le','mac','san','st']);
function playerSurnames(name){
  const words=String(name).replace(/[’']/g,"'").trim().split(/\s+/).filter(Boolean);
  if(words.length<2)return [];
  let start=words.length-1;
  while(start>0 && NAME_PARTICLES.has(normalize(words[start-1])))start--;
  const surname=words.slice(start).join(' ');
  // A surname with a particle must stay together (e.g. van Dijk, de Bruyne).
  return [surname];
}
function addLookup(lookup,key,answer){
  const n=normalize(key);if(!n)return;
  if(!lookup.has(n))lookup.set(n,new Map());
  lookup.get(n).set(answer.id,answer);
}
// Bounded Damerau-Levenshtein distance; a typo cannot bypass the answer bank.
function editDistance(a,b,cap){
  if(Math.abs(a.length-b.length)>cap)return cap+1;
  const rows=a.length+1,cols=b.length+1;
  const grid=Array.from({length:rows},()=>Array(cols).fill(0));
  for(let i=0;i<rows;i++)grid[i][0]=i;
  for(let j=0;j<cols;j++)grid[0][j]=j;
  for(let i=1;i<rows;i++){
    let best=cap+1;
    for(let j=1;j<cols;j++){
      const penalty=a[i-1]===b[j-1]?0:1;
      let d=Math.min(grid[i-1][j]+1,grid[i][j-1]+1,grid[i-1][j-1]+penalty);
      if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d=Math.min(d,grid[i-2][j-2]+1);
      grid[i][j]=d;best=Math.min(best,d);
    }
    if(best>cap)return cap+1;
  }
  return grid[a.length][b.length];
}
function typoTolerance(length){return length>=16?3:length>=9?2:length>=4?1:0}
function resolveAnswer(q,input){
  const n=normalize(input);
  const exact=q.lookup.get(n);
  if(exact){
    if(exact.size>1)return {state:'ambiguous',names:[...exact.values()].map(x=>x.name)};
    const answer=[...exact.values()][0];
    return {state:'valid',answer,kind:'exact',typed:input};
  }
  const tolerance=typoTolerance(n.length);
  if(!tolerance)return {state:'not-applicable'};
  const scores=new Map();
  for(const [alias,candidates] of q.lookup){
    if(Math.abs(alias.length-n.length)>tolerance)continue;
    const d=editDistance(n,alias,tolerance);
    if(d>tolerance)continue;
    for(const answer of candidates.values()){
      const prev=scores.get(answer.id);
      if(!prev||d<prev.distance)scores.set(answer.id,{answer,distance:d,alias});
    }
  }
  if(!scores.size)return {state:'not-applicable'};
  const ranked=[...scores.values()].sort((a,b)=>a.distance-b.distance);
  const first=ranked[0];
  // Do not guess when the best match has a rival at the same distance,
  // or when two long names are equally plausible (within one edit).
  const rivals=ranked.filter(x=>x.distance<=first.distance+(first.distance>=2?1:0));
  if(rivals.length>1)return {state:'ambiguous',names:rivals.slice(0,4).map(x=>x.answer.name)};
  return {state:'valid',answer:first.answer,kind:'autocorrect',typed:input};
}
function buildQuestion(q){
  const rels=q.allOf.map(key=>FACTS.get(key)||new Map());
  const ids=[...rels[0].keys()].filter(id=>rels.every(r=>r.has(id)));
  const answers=ids.map(id=>({id,name:ENTITY.get(id).name,points:Math.max(...rels.map(r=>r.get(id).points)),aliases:[...ENTITY.get(id).aliases]}));
  if(answers.length<2)throw Error('Question with too few answers '+q.id);
  const lookup=new Map();
  for(const a of answers){
    const e=ENTITY.get(a.id);
    const surnames=e.type==='player'?playerSurnames(a.name):[];
    a.surnames=surnames;
    for(const key of [a.name,...a.aliases,...surnames])addLookup(lookup,key,a);
  }
  return {...q,answers,lookup};
}
const questions=BANK.questions.map(buildQuestion);
const Match=globalThis.FOOTY_MATCH;
const Goals=globalThis.FOOTY_GOALS,Experience=globalThis.FOOTY_EXPERIENCE,Counters=globalThis.FOOTY_COUNTERS;
if(!Match||!Goals||!Experience||!Counters)throw Error('FOOTY gameplay modules failed to load');
const $=id=>document.getElementById(id);
let deck=[],index=0,total=0,results=[],remaining=25,lastTick=0,ticker=null,phase='home',locked=false,mode='practice',dailyKey=null,dailyRecord=null,roundDeadline=0;
const TROPHY_KEY='footy_deep_cuts_trophy_v1';
function matchSummary(){return Match.summaryFromResults(results)}
function renderScoreboard(){const m=matchSummary();$('goalsfor').textContent=m.forGoals;$('goalsagainst').textContent=m.againstGoals;const board=$('matchscoreboard');board.setAttribute('aria-label',`Your club ${m.forGoals}, opposition ${m.againstGoals}`);board.classList.toggle('perfect',m.forGoals===7&&m.againstGoals===0)}
let matchTrophies=0,revealTimers=[],counterDeadline=0,counterTicker=null,activeCounter=null,matchStartedAt=null;
let magicUsed=false,magicActive=false,magicQuestion=null;
function clearCounter(){clearInterval(counterTicker);counterTicker=null;activeCounter=null;counterDeadline=0;}
function clearReveals(){
 for(const timer of revealTimers)clearTimeout(timer);
 revealTimers=[];
 const scene=$('shotscene');if(scene)scene.className='shot-scene';
}
function later(fn,ms){revealTimers.push(setTimeout(fn,ms))}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shuffle(a){const copy=[...a];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function show(id){for(const el of ['home','play','end'])$(el).classList.toggle('hidden',el!==id)}
function drawLevels(){
 const m=matchSummary();
 $('siderating').textContent=m.rating.toFixed(1);
 $('sideknowledge').textContent=Experience.knowledge(results).grade;
 $('matchlog').innerHTML=results.length?results.map((r,i)=>`<div class="match-log-row"><span>${r.event==='goal'?'⚽':r.event==='conceded'?'🔴':r.counter?.outcome==='pending'?'⚡':'🛡'} ${String(i+1).padStart(2,'0')}'</span><strong>${r.event==='goal'?'GOAL':r.event==='conceded'?'CONCEDED':r.counter?.outcome==='pending'?'COUNTER':'SAVED'}</strong></div>`).join(''):'Kick off to begin your seven attacks.';
 renderMomentum();
}
function renderMomentum(){
 const momentum=Experience.momentum(results),last=Experience.timeline(results).at(-1);
 $('momentumvalue').textContent=momentum+'%';
 const magicProgress=$('magicprogress');
 if(mode==='daily')magicProgress.textContent='DAILY MATCH · The same seven questions for everyone; no special question swaps.';
 else if(magicActive)magicProgress.textContent='✦ MOMENT OF MAGIC · This attack is your one special challenge.';
 else if(magicUsed)magicProgress.textContent=results.some(r=>r.specialSuccess)?'✦ MOMENT OF MAGIC EARNED · Recorded in your match history.':'✦ SPECIAL OPPORTUNITY USED · One per Practice match.';
 else if(results.length>=7)magicProgress.textContent='FULL TIME · Your match momentum is recorded.';
 else magicProgress.textContent=momentum>=Experience.MAGIC_THRESHOLD?'✦ MOMENT OF MAGIC READY · Choose your special opportunity next.':`✦ ${Math.max(0,Experience.MAGIC_THRESHOLD-momentum)} MORE MOMENTUM TO UNLOCK A SPECIAL ATTACK (80)`;
 $('momentumfill').style.width=momentum+'%';
 $('momentumball').style.left=(6+momentum*.88)+'%';
 const state=momentum>=75?'YOU ARE DOMINATING':momentum>=58?'YOU HAVE THE INITIATIVE':momentum>=43?'EVEN MATCH':momentum>=25?'OPPOSITION PRESSING':'UNDER SERIOUS PRESSURE';
 $('momentumstate').textContent=state;
 $('momentumexplain').textContent=momentum>=58?'Your team is pushing toward the opposition goal.':momentum<43?'The opposition has pushed play toward your goal.':'Neither side has control. The next answer can change that.';
 $('momentumnote').textContent=last?(last.delta>0?'+':'')+last.delta+' LAST ATTACK':'KICKOFF · EVEN MATCH';
 if(!last){$('momentumreason').textContent='Rare answers create bigger momentum swings; misses lose ground.';return}
 const previous=results.at(-1);
 $('momentumreason').textContent=previous?.event==='goal'?
   `${previous.answer||'Verified answer'} · ${Goals.forPoints(previous.points)?.name||'Goal'} · +${last.delta} pressure`:
   `Missed attack · ${last.delta} pressure · ${previous?.counter?.outcome==='saved'?'counterattack stopped':'opposition counterattack'}`;
}

const DAILY_STORE='footy_daily_v11';
function todayUTC(){return new Date().toISOString().slice(0,10)}
function dayBefore(date){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
function readDaily(){try{const obj=JSON.parse(localStorage.getItem(DAILY_STORE)||'{}');return obj&&typeof obj==='object'&&obj.records&&typeof obj.records==='object'?obj:{records:{}}}catch(e){return {records:{}}}}
function writeDaily(data){try{localStorage.setItem(DAILY_STORE,JSON.stringify(data));return true}catch(e){return false}}
function stableHash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
function seededRandom(seed){let state=seed>>>0;return ()=>{state=(state+0x6D2B79F5)|0;let n=Math.imul(state^(state>>>15),1|state);n^=n+Math.imul(n^(n>>>7),61|n);return ((n^(n>>>14))>>>0)/4294967296}}
function seededShuffle(arr,rand){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function dailyDeck(date){if(DAILY_PLAN?.date===date && DAILY_PLAN.questionIds?.length===7){const selections=DAILY_PLAN.questionIds.map(id=>questions.find(q=>q.id===id));if(selections.every(Boolean))return selections;}const rand=seededRandom(stableHash('FOOTY-DAILY-V11|'+date));const pick=(kind,n)=>seededShuffle(questions.filter(q=>q.kind===kind),rand).slice(0,n);return seededShuffle([...pick('classic',2),...pick('squad',2),...pick('europe',2),...pick('world',1)],rand)}
function dailyStats(records){const days=Object.keys(records).filter(d=>records[d]?.status==='complete').sort();const complete=new Set(days);let best=0,run=0,last=null;for(const d of days){run=(last===dayBefore(d))?run+1:1;best=Math.max(best,run);last=d}let current=0;let d=todayUTC();if(!complete.has(d))d=dayBefore(d);while(complete.has(d)){current++;d=dayBefore(d)}return {current,best,played:days.length}}
function renderDailyHome(){const date=todayUTC(),data=readDaily(),rec=data.records[date],stats=dailyStats(data.records);if(DAILY_PLAN?.date===date){$('dailytitle').textContent=DAILY_PLAN.theme;}
 $('dailydate').textContent=date+' UTC';$('dailycurrent').textContent=stats.current;$('dailybest').textContent=stats.best;$('dailytotal').textContent=stats.played;
 $('startdaily').textContent=rec?.status==='complete'?'DAILY COMPLETE ✓':rec?.status==='active'?'RESUME DAILY →':"PLAY TODAY'S DAILY →";
 $('startdaily').disabled=rec?.status==='complete';
 $('dailystatus').innerHTML=rec?.status==='complete'?`<strong>Today: ${Match.summaryFromResults(rec.results||[]).forGoals}–${Match.summaryFromResults(rec.results||[]).againstGoals} · ${Match.summaryFromResults(rec.results||[]).rating.toFixed(1)}/10</strong> · Tomorrow's lineup unlocks at 00:00 UTC.`:rec?.status==='active'?(rec.results?.at(-1)?.counter?.outcome==='pending'?'Counterattack pending · Resume to defend. The timer continues while away.':`Daily in progress · Round ${Math.min(7,(rec.results?.length||0)+1)} of 7. Your attempt is saved.`):'Finish today’s seven rounds to extend your streak.';
}
function saveDaily(status){if(mode!=='daily'||!dailyKey)return;const data=readDaily();const rec={status,date:dailyKey,questionIds:deck.map(q=>q.id),results:results.map(r=>({...r})),score:total,cups:matchTrophies,startedAt:matchStartedAt||new Date().toISOString(),updatedAt:Date.now(),roundDeadline:phase==='play'?roundDeadline:0,counterDeadline:phase==='counter'?counterDeadline:0};data.records[dailyKey]=rec;dailyRecord=rec;writeDaily(data)}
function beginDaily(){const date=todayUTC(),data=readDaily(),rec=data.records[date];if(rec?.status==='complete'){renderDailyHome();return}
 clearInterval(ticker);clearCounter();clearReveals();mode='daily';dailyKey=date;matchStartedAt=rec?.startedAt||new Date().toISOString();magicUsed=false;magicActive=false;magicQuestion=null;
 deck=rec?.questionIds?.length===7?rec.questionIds.map(id=>questions.find(q=>q.id===id)):dailyDeck(date);
 if(deck.some(q=>!q)){deck=dailyDeck(date)}
 results=Array.isArray(rec?.results)?rec.results.slice(0,7):[];
 index=results.length;total=results.reduce((sum,r)=>sum+(Number(r.points)||0),0);
 matchTrophies=rec?.cups||0;
 const pending=results.length>0&&results.at(-1)?.counter?.outcome==='pending';
 if(pending){index=results.length-1;phase='counter';show('play');drawLevels();startCounter(rec?.counterDeadline||Date.now());return}
 if(index>=7){end();return}
 phase='play';show('play');drawLevels();load(rec?.roundDeadline||null);saveDaily('active');
}
function home(){clearInterval(ticker);clearCounter();clearReveals();phase='home';mode='practice';show('home');renderDailyHome();renderHistory()}
function balancedDeck(){
  // 2 classic/general + 2 iconic league squads + 2 European finals + 1 World Cup final.
  // The original 7-round rules, timer, rarity reel and trophy wins are unchanged.
  const pick=(kind,n)=>shuffle(questions.filter(q=>q.kind===kind)).slice(0,n);
  return shuffle([...pick('classic',2),...pick('squad',2),...pick('europe',2),...pick('world',1)]);
}
function start(){mode='practice';dailyKey=null;dailyRecord=null;clearInterval(ticker);clearCounter();clearReveals();deck=balancedDeck();index=0;total=0;matchTrophies=0;results=[];magicUsed=false;magicActive=false;magicQuestion=null;matchStartedAt=new Date().toISOString();phase='play';show('play');drawLevels();load()}
function offerMagic(){
 const candidates=Experience.eligibleMagicQuestions(questions,deck);
 if(!Experience.canOfferMagic(mode,results,magicUsed)||!candidates.length)return false;
 magicQuestion=shuffle(candidates)[0];phase='magic';locked=true;
 $('questionview').classList.add('hidden');$('counterview').classList.add('hidden');$('reveal').classList.add('hidden');$('magicview').classList.remove('hidden');
 renderScoreboard();drawLevels();return true;
}
function chooseMagic(accept){
 if(phase!=='magic')return;
 if(accept&&magicQuestion){deck[index]=magicQuestion;magicActive=true}else magicActive=false;
 magicQuestion=null;magicUsed=true;
 load(null,true);
}
function load(existingDeadline=null,skipMagicOffer=false){
 clearReveals();clearCounter();
 if(!skipMagicOffer&&offerMagic())return;
 locked=false;phase='play';$('magicview').classList.add('hidden');$('questionview').classList.remove('hidden');$('counterview').classList.add('hidden');$('reveal').classList.add('hidden');
 $('magiclive').classList.toggle('hidden',!magicActive);
  let q=deck[index];$('round').textContent=`ATTACK ${String(index+1).padStart(2,'0')} / 07`;
  $('roundpips').innerHTML=Array.from({length:7},(_,i)=>`<span class="pip ${i<index?'done':i===index?'current':''}"></span>`).join('');
  $('score').textContent=`${matchSummary().rating.toFixed(1)} MATCH RATING`;renderScoreboard();drawLevels();
  $('category').textContent=q.category;$('question').textContent=q.prompt;
  $('hint').textContent=q.hint+' · '+q.answers.length+' applicable answers';
  $('answer').value='';$('error').textContent='';$('answer').classList.remove('invalid');
  $('report').classList.add('hidden');$('reportstatus').textContent='';$('answer').disabled=false;
  $('clock').textContent='25';$('timerfill').style.width='100%';roundDeadline=(mode==='daily'&&existingDeadline)?existingDeadline:Date.now()+25000;remaining=Math.max(0,(roundDeadline-Date.now())/1000);
  $('matchlabel').textContent=mode==='daily'?'7-NIL · OFFICIAL DAILY MATCH':'7-NIL · PRACTICE FRIENDLY';$('matchdate').textContent=mode==='daily'?dailyKey+' UTC':'⚽ PRACTICE MODE';
  lastTick=performance.now();$('answer').focus();clearInterval(ticker);ticker=setInterval(tick,100);if(mode==='daily')saveDaily('active');tick();
}
function tick(){if(phase!=='play')return;const now=performance.now();remaining=mode==='daily'?Math.max(0,(roundDeadline-Date.now())/1000):Math.max(0,remaining-(now-lastTick)/1000);lastTick=now;
  $('clock').textContent=String(Math.ceil(remaining));$('timerfill').style.width=(remaining/25*100)+'%';$('timerfill').style.background=remaining<6?'#ff8178':'#d6fc69';if(remaining<=0)finish(null,'TIME IS UP')}
function feedback(message,mayReport=false){
  $('error').textContent=message;$('report').classList.toggle('hidden',!mayReport);$('reportstatus').textContent='';
  $('answer').classList.remove('invalid');void $('answer').offsetWidth;$('answer').classList.add('invalid');$('answer').focus();$('answer').select();
}
function submit(){
  if(locked||phase!=='play')return;
  const value=$('answer').value.trim();if(!value){feedback('Type an answer or choose Skip this round.');return}
  const q=deck[index],match=resolveAnswer(q,value);
  if(match.state==='not-applicable'){feedback('NOT APPLICABLE — no verified answer matches that entry. Try again.',true);return}
  if(match.state==='ambiguous'){feedback('WHICH ONE? Please use a full name: '+match.names.join(' / ')+'.');return}
  const accepted=match.answer;$('error').textContent='';$('answer').classList.remove('invalid');finish(accepted,'ANSWER ACCEPTED',match);
}

function answerListHTML(q){return q.answers.slice().sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name))
  .map(a=>'<div class="db-row"><span>'+escapeHTML(a.name)+'</span></div>').join('')}
function toggleDatabase(){const panel=$('fullanswers');const open=panel.classList.contains('hidden');panel.classList.toggle('hidden',!open);
  $('showanswers').textContent=open?'HIDE FULL ANSWER BANK ↑':`SHOW ACCEPTED ANSWERS (${deck[index].answers.length}) ↓`}
function animateScene(scene,style,scored){
 if(!scene)return;
 scene.className='shot-scene';
 scene.querySelector('.cin-call').textContent=scored?(style?.call||'GOAL!'):'CHANCE MISSED';
 void scene.offsetWidth;
 scene.classList.add(scored?'goal':'miss');
 if(scored&&style)scene.classList.add('finish-'+style.key);
}
function startShotAnimation(answer){
 const style=answer?Goals.forPoints(answer.points):null;
 $('shotdescription').textContent=style?`${style.name.toUpperCase()} · PROVISIONAL GOAL FLAIR`:'MISSED ATTACK';
 animateScene($('shotscene'),style,Boolean(answer));
}
function renderOutcomeScene(kind,points){
 const stage=$('outcomestage'),shoot=$('shotscene'),defense=$('defensescene'),signature=$('signatureoverlay');
 stage.className='outcome-stage outcome-'+kind;
 shoot.classList.toggle('hidden',kind!=='goal');
 defense.className='defense-scene'+(kind==='goal'?' hidden':'');
 signature.classList.add('hidden');
 $('outcomeeyebrow').textContent=kind==='goal'?'YOUR ATTACK · FINISH':kind==='saved'?'YOUR DEFENCE · BIG STOP':'OPPOSITION COUNTERATTACK · GOAL';
 if(kind==='goal'){
  const style=Goals.forPoints(points);
  $('shotdescription').textContent=(style?.name||'GOAL').toUpperCase()+' · ATTACK CONVERTED';
  animateScene(shoot,style,true);
  if(points>=85){
   signature.classList.remove('hidden');
   stage.classList.add('outcome-signature');
   $('signatureheadline').textContent=points>=100?'ONE IN A MILLION':'YOU KNOW BALL!';
   $('signaturecaption').textContent=points>=100?'THE STADIUM CANNOT BELIEVE THAT ANSWER':'WHAT A SHOUT · A DEEP-CUT MASTERCLASS';
  }
 }else{
  $('shotdescription').textContent=kind==='saved'?'GOALKEEPER SAVE · CLEAN SHEET PROTECTED':'OPPOSITION FINISH · BALL IN THE NET';
  defense.classList.add(kind==='saved'?'defense-saved':'defense-conceded');
  // Restart authored keeper and ball action on every counterattack.
  void defense.offsetWidth;
  defense.classList.add('defense-playing');
 }
}
function showRoundReveal(a,verdict,matchInfo=null){
 phase='reveal';$('questionview').classList.add('hidden');$('counterview').classList.add('hidden');$('reveal').classList.remove('hidden');
 const latest=results.at(-1),m=matchSummary(),points=a?.points||0;
 const kind=Experience.outcomeKind(latest);
 $('revealboard').textContent=`YOUR CLUB ${m.forGoals} – ${m.againstGoals} OPPOSITION`;
 $('verdict').textContent=kind==='goal'?'YOUR ATTACK CONVERTED':kind==='saved'?'YOUR GOALKEEPER DELIVERS':'OPPOSITION SCORES ON THE BREAK';
 $('matchevent').textContent=kind==='goal'?'⚽ GOAL!':kind==='saved'?'🧤 WHAT A SAVE!':'🔴 COUNTERATTACK GOAL!';
 const ratingBefore=Match.summaryFromResults(results.slice(0,-1)).rating;
 $('earned').textContent=`${m.rating>=ratingBefore?'+':''}${(m.rating-ratingBefore).toFixed(1)} RATING · ${m.rating.toFixed(1)} / 10.0`;
 $('earned').classList.toggle('negative',!a);
 $('revealanswer').textContent=kind==='goal'?'CORRECT · '+a.name:kind==='saved'?'DEFENSIVE ANSWER · '+(Counters.QUESTIONS.find(q=>q.id===latest.counter?.questionId)?.answer||'Correct'):'YOUR DEFENCE WAS BEATEN';
 const shot=Goals.forPoints(points);
 $('matchnote').textContent=kind==='goal'?(`${shot?.name||'Goal'} · +${Experience.momentumDelta(latest)} momentum`)+(points>=85?' · SIGNATURE MOMENT':''):kind==='saved'?'The keeper denies the breakaway. No opposition goal.':'The opposition beat the keeper. One goal conceded.';
 if(a&&matchInfo?.kind==='autocorrect')$('matchnote').textContent+=` · Matched “${matchInfo.typed}” to ${a.name}`;
 const magicBanner=$('magicroundstatus');magicBanner.classList.toggle('hidden',!latest.special);
 if(latest.special)magicBanner.textContent=latest.specialSuccess?'✦ MOMENT OF MAGIC EARNED — RARE+ ANSWER!':kind==='goal'?'✦ GOAL SCORED · A RARE+ ANSWER WAS NEEDED FOR THE ACCOLADE.':'✦ SPECIAL CHALLENGE MISSED · DEFENSIVE RESULT RECORDED.';
 $('next').textContent=index===6?'FINAL WHISTLE →':'NEXT ATTACK →';
 $('fullanswers').classList.add('hidden');$('fullanswers').innerHTML=answerListHTML(deck[index]);
 $('showanswers').textContent=`SHOW ACCEPTED ANSWERS (${deck[index].answers.length}) ↓`;
 renderOutcomeScene(kind,points);
 renderScoreboard();drawLevels();
 if(mode==='daily')saveDaily('active');
}

function startCounter(deadline=Date.now()+Counters.DURATION_MS){
 const latest=results.at(-1);
 if(!latest||latest.counter?.outcome!=='pending')return;
 clearCounter();phase='counter';locked=true;
 activeCounter=Counters.QUESTIONS.find(q=>q.id===latest.counter.questionId)||Counters.forRound(deck[index].id,index+1);
 counterDeadline=deadline;
 $('questionview').classList.add('hidden');$('reveal').classList.add('hidden');$('counterview').classList.remove('hidden');
 $('counterprompt').textContent=activeCounter.prompt;
 $('counteroptions').replaceChildren();
 for(const option of activeCounter.options){
  const btn=document.createElement('button');btn.type='button';btn.className='counter-option';btn.textContent=option;
  btn.onclick=()=>resolveCounter(option);$('counteroptions').appendChild(btn);
 }
 if(mode==='daily')saveDaily('active');
 const tickCounter=()=>{
  if(phase!=='counter')return;
  const ms=Math.max(0,counterDeadline-Date.now());
  $('counterclock').textContent=Math.ceil(ms/1000);
  $('counterfill').style.width=(ms/Counters.DURATION_MS*100)+'%';
  if(ms<=0)resolveCounter(null);
 };
 counterTicker=setInterval(tickCounter,50);tickCounter();
}
function resolveCounter(choice){
 if(phase!=='counter')return;
 // A late click cannot beat the persisted wall-clock deadline.
 const saved=Date.now()<counterDeadline&&Counters.judge(activeCounter,choice)==='saved';
 const latest=results.at(-1);
 latest.counter.outcome=saved?'saved':'conceded';
 latest.counter.choice=choice||null;
 latest.event=saved?'neutral':'conceded';
 clearCounter();
 showRoundReveal(null,saved?'COUNTERATTACK SAVED':'COUNTERATTACK CONCEDED');
}
function finish(a,verdict,matchInfo=null){
 if(locked||phase!=='play')return;
 locked=true;clearInterval(ticker);
 const points=a?.points||0;total+=points;
 const entry={questionId:deck[index].id,question:deck[index].prompt,answer:a?.name||'No answer',points,event:a?'goal':'neutral',verdict,at:Date.now()};
 if(magicActive){entry.special='moment-of-magic';entry.specialSuccess=!!a&&Experience.earnsMagicAccolade(entry.special,points);}
 if(!a){const defensive=Counters.forRound(deck[index].id,index+1);entry.counter={questionId:defensive.id,outcome:'pending',choice:null};}
 results.push(entry);renderScoreboard();drawLevels();
 if(!a){startCounter();return}
 showRoundReveal(a,verdict,matchInfo);
}
function advance(){if(phase!=='reveal')return;clearReveals();magicActive=false;if(index===6){end();return}index++;load()}
const PROFILE_STORE='footy_profile_v1';
function readProfile(){
 try{const p=JSON.parse(localStorage.getItem(PROFILE_STORE)||'{}');return p&&Array.isArray(p.matches)?p:{version:1,matches:[]}}
 catch{return {version:1,matches:[]}}
}
function storeMatch(){
 const profile=readProfile(),m=matchSummary(),knowledge=Experience.knowledge(results);
 const id=mode==='daily'?'daily:'+dailyKey:'practice:'+String(matchStartedAt||new Date().toISOString());
 if(profile.matches.some(match=>match?.id===id))return true;
 const timeline=Experience.timeline(results);
 const history={
  id,mode,startedAt:matchStartedAt||new Date().toISOString(),finishedAt:new Date().toISOString(),
  date:dailyKey||todayUTC(),score:{for:m.forGoals,against:m.againstGoals},
  rating:m.rating,knowledge:{grade:knowledge.grade,average:knowledge.average,rare:knowledge.rare,signatures:knowledge.signatures},
  momentum:Experience.momentum(results),bestGoal:Goals.bestGoal(results)?.shot.key||null,
  momentOfMagic:results.some(r=>r.specialSuccess)?'earned':results.some(r=>r.special)?'attempted':'not-played',
  accolades:results.some(r=>r.specialSuccess)?['moment-of-magic']:[],
  events:results.map((r,i)=>({
   attack:i+1,questionId:r.questionId||deck[i]?.id||null,question:r.question,
   answer:r.answer,rarity:Number(r.points)||0,shotStyle:r.event==='goal'?Goals.forPoints(r.points)?.key||null:null,
   result:r.event,defense:r.counter?{...r.counter}:null,at:r.at||null,
   special:r.special||null,specialSuccess:!!r.specialSuccess,
   momentumAfter:timeline[i]?.momentum??50
  }))
 };
 profile.matches.unshift(history);profile.matches=profile.matches.slice(0,50);
 try{localStorage.setItem(PROFILE_STORE,JSON.stringify(profile));return true}catch{return false}
}
function renderHistory(){
 const recent=readProfile().matches.filter(match=>match?.score&&match?.mode&&match?.date).slice(0,5);
 $('homehistory').innerHTML=recent.length?recent.map(match=>`<div class="history-row"><span>${escapeHTML(match.mode.toUpperCase())} · ${escapeHTML(match.date)}</span><strong>${match.score.for}–${match.score.against}</strong><span>${Number(match.rating).toFixed(1)} · ${escapeHTML(match.knowledge?.grade||'FOUNDATION')}${match.momentOfMagic==='earned'?' · ✦ MAGIC':''}</span></div>`).join(''):'No matches completed yet. Your last 50 matches will be kept on this device.';
}
function end(){
  clearCounter();clearReveals();phase='end';if(mode==='daily')saveDaily('complete');show('end');
  const m=matchSummary();
  const best=Goals.bestGoal(results);
  const award=$('goalaward');award.classList.toggle('hidden',!best);
  if(best){
   $('goalawardtitle').textContent=best.shot.name;
   $('goalawardmeta').textContent=`Attack ${best.round} · ${best.answer} · Goal flair is based on provisional rarity, not a measured popularity percentage.`;
   const preview=$('goalreplay');preview.replaceChildren($('shotscene').cloneNode(true));
   const clone=preview.firstElementChild;clone.removeAttribute('id');clone.classList.remove('hidden');
   animateScene(clone,best.shot,true);
   $('replaygoal').onclick=()=>{ $('goalawardtitle').textContent=best.shot.name;animateScene(clone,best.shot,true); };
   const lab=$('goaltestchoices');
   lab.replaceChildren();
   for(const style of Goals.styles){
     const button=document.createElement('button');
     button.type='button';button.className='goal-test-btn';button.textContent=style.name;
     button.onclick=()=>{$('goalawardtitle').textContent=style.name+' · PREVIEW';animateScene(clone,style,true)};
     lab.appendChild(button);
   }
  }else{$('goalreplay').replaceChildren();$('goaltestchoices').replaceChildren();}
  $('finalscore').textContent=`${m.forGoals} – ${m.againstGoals}`;
  const knowledge=Experience.knowledge(results);
  $('finalperformance').textContent=`${m.rating.toFixed(1)} / 10.0`;
  $('finalknowledge').textContent=knowledge.grade;
  $('finalmomentum').textContent=`FINAL MOMENTUM ${Experience.momentum(results)}% · ${knowledge.rare} RARE+ GOALS`;
  const signatures=results.map((r,i)=>({r,i})).filter(x=>x.r.event==='goal'&&Number(x.r.points)>=85);
  $('signaturemoments').classList.toggle('hidden',!signatures.length);
  $('signaturemoments').textContent=signatures.length?`✦ SIGNATURE MOMENTS · ${signatures.map(x=>`Attack ${x.i+1}: ${x.r.answer} (${Goals.forPoints(x.r.points).name})`).join(' · ')}`:'';
  const magicAttempt=results.find(r=>r.special==='moment-of-magic'),earned=results.find(r=>r.specialSuccess);
  $('magicresult').classList.toggle('hidden',!magicAttempt);
  $('magicresult').textContent=earned?`✦ MOMENT OF MAGIC · EARNED WITH ${earned.answer.toUpperCase()} · RARE+ CHALLENGE COMPLETE · SAVED TO LOCAL MATCH PROFILE`:magicAttempt?'✦ MOMENT OF MAGIC · CHALLENGE ATTEMPTED · NO RARE+ ACCOLADE THIS TIME':'';

  $('finaltitle').textContent=m.forGoals===7&&m.againstGoals===0?'7-NIL. PERFECT MATCH.':m.outcome==='win'?'FULL-TIME VICTORY!':m.outcome==='loss'?'THE OPPOSITION TAKE IT.':'FULL-TIME DRAW.';
  $('finaldesc').textContent=`You finished the seven-round ${mode==='daily'?'daily match':'friendly'} ${m.forGoals}–${m.againstGoals}. Your match rating is ${m.rating.toFixed(1)}/10.0.`;
  $('resultrows').innerHTML=results.map((r,i)=>'<div class="resultrow"><span class="muted">'+(i+1)+'.</span><div>'+escapeHTML(r.answer)+'<div class="muted">'+escapeHTML(r.question)+'</div></div><b>'+(r.event==='goal'?(r.specialSuccess?'✦ MAGIC · ':'⚽ ')+escapeHTML(Goals.forPoints(r.points)?.name||'GOAL'):r.event==='conceded'?'🔴 COUNTER GOAL':'🛡 SAVE')+'</b></div>').join('');
  $('dailyresult').classList.toggle('hidden',mode!=='daily');
  if(mode==='daily'){const st=dailyStats(readDaily().records);$('dailyresult').innerHTML=`<strong>🔥 ${st.current}-DAY STREAK</strong> · BEST ${st.best} DAYS<br>Daily #${dailyKey} · ${m.forGoals}–${m.againstGoals} · ${m.rating.toFixed(1)}/10.0<br>You've completed today's challenge. Come back tomorrow after 00:00 UTC.`}
  $('again').textContent=mode==='daily'?'PLAY PRACTICE →':'RUN IT BACK ↗';
  $('historysave').textContent=storeMatch()?'✓ Match events saved on this device for future highlights and profile gallery.':'Local storage unavailable — this match was not saved.';
}
function copyToClipboard(value,done){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(done).catch(()=>{prompt('Copy this text:',value)})}else{prompt('Copy this text:',value)}}
function reportMissing(){if(phase!=='play')return;
 const report={game:'FOOTY Deep Cuts',databaseVersion:BANK.meta.version,asOf:BANK.meta.asOf,questionId:deck[index].id,question:deck[index].prompt,proposedAnswer:$('answer').value.trim(),note:'Player-proposed answer: NOT accepted or scored; independent evidence review required.'};
 if(!report.proposedAnswer)return;
 copyToClipboard(JSON.stringify(report,null,2),()=>{$('reportstatus').textContent='Report copied. Paste it into our chat for review; this offline game does not automatically send reports.'});
}
$('magicaccept').onclick=()=>chooseMagic(true);$('magicdecline').onclick=()=>chooseMagic(false);
$('navdaily').onclick=()=>{home();document.getElementById('dailytitle')?.scrollIntoView({behavior:'smooth',block:'center'});};
$('navpractice').onclick=start;
$('navhistory').onclick=()=>{home();document.getElementById('homehistory')?.scrollIntoView({behavior:'smooth',block:'center'});};
$('brandhome').onclick=home;$('start').onclick=start;$('startdaily').onclick=beginDaily;$('again').onclick=start;$('homebtn').onclick=home;$('next').onclick=advance;$('skip').onclick=()=>finish(null,'ROUND SKIPPED');
$('answerform').addEventListener('submit',e=>{e.preventDefault();submit()});$('submitanswer').addEventListener('click',submit);
$('answer').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();submit()}});
$('answer').addEventListener('input',()=>{$('error').textContent='';$('answer').classList.remove('invalid');$('report').classList.add('hidden');$('reportstatus').textContent='' });
$('report').onclick=reportMissing;$('showanswers').onclick=toggleDatabase;
$('share').onclick=()=>{const m=matchSummary();const text=`⚽ 7-NIL / FOOTY ${mode==='daily'?'DAILY '+dailyKey:'PRACTICE'}\n${m.forGoals}–${m.againstGoals} · ${m.rating.toFixed(1)}/10.0 MATCH RATING\n`+results.map((r,i)=>`${i+1} ${r.event==='goal'||Number(r.points)>0?'⚽':'✕'}`).join(' · ')+(mode==='daily'?`\n🔥 ${dailyStats(readDaily().records).current}-day streak`:'')+(results.some(r=>r.specialSuccess)?'\n✦ MOMENT OF MAGIC EARNED':'');copyToClipboard(text,()=>{$('share').textContent='COPIED ✓';setTimeout(()=>{$('share').textContent='COPY RESULT'},1300)})};
// Read-only debug/sanity-check handle: useful for automated question-bank QA.
$('dbversion').textContent=`${BANK.questions.length} question templates · ${BANK.facts.length} answer facts · DATABASE V13`;
renderDailyHome();renderHistory();
window.FOOTY_QA=Object.freeze({matchSummary:()=>matchSummary(),dailyDeck:date=>dailyDeck(date).map(q=>q.id),dailyStats:()=>dailyStats(readDaily().records),history:()=>readProfile().matches,momentum:()=>Experience.momentum(results),knowledge:()=>Experience.knowledge(results),version:BANK.meta.version,questionCount:questions.length,factCount:BANK.facts.length,entityCount:BANK.entities.length,inspect:()=>questions.map(q=>({id:q.id,kind:q.kind,count:q.answers.length,answers:q.answers.map(a=>({name:a.name,points:a.points}))})),normalize,resolve:(id,value)=>{const q=questions.find(q=>q.id===id);if(!q)return {state:'no-question'};const r=resolveAnswer(q,value);return {state:r.state,answer:r.answer?.name,points:r.answer?.points,kind:r.kind,names:r.names}}});
})();
