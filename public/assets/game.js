
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
const Goals=globalThis.FOOTY_GOALS;
if(!Match||!Goals)throw Error('Match or goal cinematics engine failed to load');
const $=id=>document.getElementById(id);
let deck=[],index=0,total=0,results=[],remaining=25,lastTick=0,ticker=null,phase='home',locked=false,mode='practice',dailyKey=null,dailyRecord=null,roundDeadline=0;
const TROPHY_KEY='footy_deep_cuts_trophy_v1';
function matchSummary(){return Match.summaryFromResults(results)}
function renderScoreboard(){const m=matchSummary();$('goalsfor').textContent=m.forGoals;$('goalsagainst').textContent=m.againstGoals;const board=$('matchscoreboard');board.setAttribute('aria-label',`Your club ${m.forGoals}, opposition ${m.againstGoals}`);board.classList.toggle('perfect',m.forGoals===7&&m.againstGoals===0)}
let matchTrophies=0,revealTimers=[];
function clearReveals(){
 for(const timer of revealTimers)clearTimeout(timer);
 revealTimers=[];
 const scene=$('shotscene');if(scene)scene.className='shot-scene';
}
function later(fn,ms){revealTimers.push(setTimeout(fn,ms))}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shuffle(a){const copy=[...a];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function show(id){for(const el of ['home','play','end'])$(el).classList.toggle('hidden',el!==id)}
function drawLevels(){const m=matchSummary();$('siderating').textContent=m.rating.toFixed(1);$('matchlog').innerHTML=m.events.length?m.events.map(e=>`<div class="match-log-row"><span>${e.event==='goal'?'⚽':e.event==='conceded'?'✕':'–'} ${String(e.round).padStart(2,'0')}'</span><strong>${e.event==='goal'?'GOAL':e.event==='conceded'?'MISSED':'NO GOAL'}</strong></div>`).join(''):'Kick off to begin your seven attacks.';}
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
 $('dailystatus').innerHTML=rec?.status==='complete'?`<strong>Today: ${Match.summaryFromResults(rec.results||[]).forGoals}–${Match.summaryFromResults(rec.results||[]).againstGoals} · ${Match.summaryFromResults(rec.results||[]).rating.toFixed(1)}/10</strong> · Tomorrow's lineup unlocks at 00:00 UTC.`:rec?.status==='active'?`Daily in progress · Round ${Math.min(7,(rec.results?.length||0)+1)} of 7. Your attempt is saved.`:'Finish today’s seven rounds to extend your streak.';
}
function saveDaily(status){if(mode!=='daily'||!dailyKey)return;const data=readDaily();const rec={status,date:dailyKey,questionIds:deck.map(q=>q.id),results:results.map(r=>({...r})),score:total,cups:matchTrophies,updatedAt:Date.now(),roundDeadline:phase==='play'?roundDeadline:0};data.records[dailyKey]=rec;dailyRecord=rec;writeDaily(data)}
function beginDaily(){const date=todayUTC(),data=readDaily(),rec=data.records[date];if(rec?.status==='complete'){renderDailyHome();return}
 clearInterval(ticker);clearReveals();mode='daily';dailyKey=date;
 deck=rec?.questionIds?.length===7?rec.questionIds.map(id=>questions.find(q=>q.id===id)):dailyDeck(date);
 if(deck.some(q=>!q)){deck=dailyDeck(date)}
 results=Array.isArray(rec?.results)?rec.results.slice(0,7):[];
 index=results.length;total=results.reduce((sum,r)=>sum+(Number(r.points)||0),0);
 matchTrophies=rec?.cups||0;
 if(index>=7){saveDaily('complete');end();return}
 phase='play';show('play');drawLevels();load(rec?.roundDeadline||null);saveDaily('active');
}
function home(){clearInterval(ticker);clearReveals();phase='home';mode='practice';show('home');renderDailyHome()}
function balancedDeck(){
  // 2 classic/general + 2 iconic league squads + 2 European finals + 1 World Cup final.
  // The original 7-round rules, timer, rarity reel and trophy wins are unchanged.
  const pick=(kind,n)=>shuffle(questions.filter(q=>q.kind===kind)).slice(0,n);
  return shuffle([...pick('classic',2),...pick('squad',2),...pick('europe',2),...pick('world',1)]);
}
function start(){mode='practice';dailyKey=null;dailyRecord=null;clearInterval(ticker);clearReveals();deck=balancedDeck();index=0;total=0;matchTrophies=0;results=[];phase='play';show('play');drawLevels();load()}
function load(existingDeadline=null){
  clearReveals();locked=false;phase='play';$('questionview').classList.remove('hidden');$('reveal').classList.add('hidden');
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
function finish(a,verdict,matchInfo=null){
  if(locked)return;locked=true;phase='reveal';clearInterval(ticker);
  const before=matchSummary().rating;const pts=a?.points||0;total+=pts;const event=a?'goal':'conceded';results.push({question:deck[index].prompt,answer:a?.name||'No answer',points:pts,event,verdict});renderScoreboard();drawLevels();if(mode==='daily')saveDaily('active');
  $('questionview').classList.add('hidden');$('reveal').classList.remove('hidden');
  const now=matchSummary().rating;
  $('revealboard').textContent=`YOUR CLUB ${matchSummary().forGoals} – ${matchSummary().againstGoals} OPPOSITION`;
  $('verdict').textContent=a?'SHOT ON TARGET':'ATTACK BROKEN DOWN';
  $('matchevent').textContent=a?'⚽ GOOOOAL!':'✕ NO GOAL';
  $('earned').textContent=`${now>=before?'+':''}${(now-before).toFixed(1)} RATING · ${now.toFixed(1)} / 10.0`;
  $('earned').classList.toggle('negative',!a);
  $('revealanswer').textContent=a?'Correct answer: '+a.name:'No accepted answer this round';
  $('matchnote').textContent=matchInfo?.kind==='autocorrect'?`✓ Autocorrected “${matchInfo.typed}” → “${a.name}”`:matchInfo?.kind==='exact'&&normalize(matchInfo.typed)!==normalize(a.name)?`✓ Matched “${matchInfo.typed}” to ${a.name}`:'';
  $('next').textContent=index===6?'FINAL WHISTLE →':'NEXT ATTACK →';
  $('fullanswers').classList.add('hidden');$('fullanswers').innerHTML=answerListHTML(deck[index]);
  $('showanswers').textContent=`SHOW ACCEPTED ANSWERS (${deck[index].answers.length}) ↓`;
  startShotAnimation(a);
}
function advance(){clearReveals();if(index===6){end();return}index++;load()}
function end(){
  clearReveals();phase='end';if(mode==='daily')saveDaily('complete');show('end');
  const m=matchSummary();
  const best=Goals.bestGoal(results);
  const award=$('goalaward');award.classList.toggle('hidden',!best);
  if(best){
   $('goalawardtitle').textContent=best.shot.name;
   $('goalawardmeta').textContent=`Attack ${best.round} · ${best.answer} · Goal flair is based on provisional rarity, not a measured popularity percentage.`;
   const preview=$('goalreplay');preview.replaceChildren($('shotscene').cloneNode(true));
   const clone=preview.firstElementChild;clone.removeAttribute('id');
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
  $('finalperformance').textContent=`MATCH RATING ${m.rating.toFixed(1)} / 10.0`;

  $('finaltitle').textContent=m.forGoals===7&&m.againstGoals===0?'7-NIL. PERFECT MATCH.':m.outcome==='win'?'FULL-TIME VICTORY!':m.outcome==='loss'?'THE OPPOSITION TAKE IT.':'FULL-TIME DRAW.';
  $('finaldesc').textContent=`You finished the seven-round ${mode==='daily'?'daily match':'friendly'} ${m.forGoals}–${m.againstGoals}. Your match rating is ${m.rating.toFixed(1)}/10.0.`;
  $('resultrows').innerHTML=results.map((r,i)=>'<div class="resultrow"><span class="muted">'+(i+1)+'.</span><div>'+escapeHTML(r.answer)+'<div class="muted">'+escapeHTML(r.question)+'</div></div><b>'+(r.event==='goal'||Number(r.points)>0?'⚽ GOAL':'✕ MISSED')+'</b></div>').join('');
  $('dailyresult').classList.toggle('hidden',mode!=='daily');
  if(mode==='daily'){const st=dailyStats(readDaily().records);$('dailyresult').innerHTML=`<strong>🔥 ${st.current}-DAY STREAK</strong> · BEST ${st.best} DAYS<br>Daily #${dailyKey} · ${m.forGoals}–${m.againstGoals} · ${m.rating.toFixed(1)}/10.0<br>You've completed today's challenge. Come back tomorrow after 00:00 UTC.`}
  $('again').textContent=mode==='daily'?'PLAY PRACTICE →':'RUN IT BACK ↗';
}
function copyToClipboard(value,done){if(navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(done).catch(()=>{prompt('Copy this text:',value)})}else{prompt('Copy this text:',value)}}
function reportMissing(){if(phase!=='play')return;
 const report={game:'FOOTY Deep Cuts',databaseVersion:BANK.meta.version,asOf:BANK.meta.asOf,questionId:deck[index].id,question:deck[index].prompt,proposedAnswer:$('answer').value.trim(),note:'Player-proposed answer: NOT accepted or scored; independent evidence review required.'};
 if(!report.proposedAnswer)return;
 copyToClipboard(JSON.stringify(report,null,2),()=>{$('reportstatus').textContent='Report copied. Paste it into our chat for review; this offline game does not automatically send reports.'});
}
$('brandhome').onclick=home;$('start').onclick=start;$('startdaily').onclick=beginDaily;$('again').onclick=start;$('homebtn').onclick=home;$('next').onclick=advance;$('skip').onclick=()=>finish(null,'ROUND SKIPPED');
$('answerform').addEventListener('submit',e=>{e.preventDefault();submit()});$('submitanswer').addEventListener('click',submit);
$('answer').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();submit()}});
$('answer').addEventListener('input',()=>{$('error').textContent='';$('answer').classList.remove('invalid');$('report').classList.add('hidden');$('reportstatus').textContent='' });
$('report').onclick=reportMissing;$('showanswers').onclick=toggleDatabase;
$('share').onclick=()=>{const m=matchSummary();const text=`⚽ 7-NIL / FOOTY ${mode==='daily'?'DAILY '+dailyKey:'PRACTICE'}\n${m.forGoals}–${m.againstGoals} · ${m.rating.toFixed(1)}/10.0 MATCH RATING\n`+results.map((r,i)=>`${i+1} ${r.event==='goal'||Number(r.points)>0?'⚽':'✕'}`).join(' · ')+(mode==='daily'?`\n🔥 ${dailyStats(readDaily().records).current}-day streak`:'');copyToClipboard(text,()=>{$('share').textContent='COPIED ✓';setTimeout(()=>{$('share').textContent='COPY RESULT'},1300)})};
// Read-only debug/sanity-check handle: useful for automated question-bank QA.
$('dbversion').textContent=`${BANK.questions.length} question templates · ${BANK.facts.length} answer facts · DATABASE V13`;
renderDailyHome();
window.FOOTY_QA=Object.freeze({matchSummary:()=>matchSummary(),dailyDeck:date=>dailyDeck(date).map(q=>q.id),dailyStats:()=>dailyStats(readDaily().records),version:BANK.meta.version,questionCount:questions.length,factCount:BANK.facts.length,entityCount:BANK.entities.length,inspect:()=>questions.map(q=>({id:q.id,kind:q.kind,count:q.answers.length,answers:q.answers.map(a=>({name:a.name,points:a.points}))})),normalize,resolve:(id,value)=>{const q=questions.find(q=>q.id===id);if(!q)return {state:'no-question'};const r=resolveAnswer(q,value);return {state:r.state,answer:r.answer?.name,points:r.answer?.points,kind:r.kind,names:r.names}}});
})();
