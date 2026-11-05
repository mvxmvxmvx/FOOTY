"use strict";
// Static GitHub Pages client — no Supabase secrets, answer bank, or scoring logic.
const API="https://emcgyjlzxfpedxwlspfo.supabase.co/functions/v1/footy-beta";
const $=(id)=>document.getElementById(id);
const pages=["home","game","finish"];
let current=null,sessionId=null,token=null,score=0,interval=null,deadline=0,busy=false,transitioning=false;
const storageKey="footy-beta-v14-session";
function show(page){for(const id of pages)$(id).classList.toggle("hidden",id!==page);}
function notice(message){$("notice").textContent=message;$("notice").classList.remove("hidden");}
function clearNotice(){$("notice").classList.add("hidden");}
async function request(payload){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await fetch(API,{method:"POST",mode:"cors",cache:"no-store",
   headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:controller.signal});
  const result=await response.json();
  if(!response.ok)throw Object.assign(new Error(result.error||"Request failed"),{status:response.status,ambiguous:result.ambiguous});
  return result;
 }finally{clearTimeout(timeout);}
}
function timerStop(){if(interval!==null){clearInterval(interval);interval=null;}}
function paintTimer(){
 const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
 $("timer").innerHTML=String(seconds)+'<span>s</span>';
 $("timer").classList.toggle("urgent",seconds<=6);
 if(seconds===0&&!busy&&!transitioning){timerStop();sendGuess("");}
}
function paintProgress(index){
 const container=$("progress");container.replaceChildren();
 for(let i=0;i<7;i++){const bar=document.createElement("span");
  if(i<index)bar.className="past";else if(i===index)bar.className="current";
  container.appendChild(bar);}
}
function renderRound(round){
 current=round;busy=false;transitioning=false;clearNotice();
 $("round-number").textContent="ROUND "+round.number+" / "+round.total;
 $("category").textContent=round.category.toUpperCase();
 $("prompt").textContent=round.prompt;
 $("score").textContent=String(score);
 $("guess").value="";
 $("guess").disabled=false;$("submit").disabled=false;
 $("feedback").classList.add("hidden");paintProgress(round.index);
 show("game");
 deadline=Date.now()+1000*(round.secondsRemaining??round.seconds);
 timerStop();paintTimer();interval=setInterval(paintTimer,180);
 $("guess").focus({preventScroll:true});
}
function endGame(total){
 timerStop();sessionStorage.removeItem(storageKey);current=null;busy=false;
 $("final-score").textContent=String(total);
 $("finish-note").textContent=total>=400?"THAT'S SOME SERIOUS BALL KNOWLEDGE.":total>=220?"SOLID SHOUT. RESPECT.":"THERE'S ALWAYS ANOTHER ROUND.";
 show("finish");
}
async function begin(){
 if(busy)return;busy=true;clearNotice();$("start").disabled=true;$("again").disabled=true;
 try{
  const result=await request({action:"start"});
  sessionId=result.sessionId;token=result.token;score=result.score||0;
  sessionStorage.setItem(storageKey,JSON.stringify({sessionId,token}));
  renderRound(result.round);
 }catch(e){notice("Could not connect to the game server: "+e.message);}
 finally{busy=false;$("start").disabled=false;$("again").disabled=false;}
}
async function sendGuess(guess){
 if(busy||transitioning||!current)return;
 busy=true;timerStop();$("guess").disabled=true;$("submit").disabled=true;
 try{
  const result=await request({action:"submit",sessionId,token,guess});
  score=result.score;$("score").textContent=String(score);
  const feedback=$("feedback");
  feedback.classList.remove("hidden","good","bad");
  if(result.verdict==="accepted"){
   feedback.classList.add("good");
   feedback.textContent="✓ "+result.canonical+"  +"+result.points+" POINTS";
  }else{
   feedback.classList.add("bad");
   feedback.textContent=result.verdict==="timed_out"?"TIME'S UP · 0 POINTS":"NOT IN OUR VERIFIED ANSWERS · 0 POINTS";
  }
  transitioning=true;
  await new Promise(resolve=>setTimeout(resolve,1250));
  if(result.done){endGame(score);}
  else{renderRound(result.next);}
 }catch(e){
  if(e.ambiguous){
   notice("Multiple footballers match that name. Use the full name.");
   $("guess").disabled=false;$("submit").disabled=false;
   if(deadline>Date.now())interval=setInterval(paintTimer,180);
   else await resume();
  }else{
   notice(e.message+" — checking the game session.");
   await resume();
  }
 }finally{busy=false;}
}
async function resume(){
 const saved=sessionStorage.getItem(storageKey);if(!saved)return;
 try{
  const state=JSON.parse(saved);
  sessionId=state.sessionId;token=state.token;
  if(!sessionId||!token)return;
  const result=await request({action:"resume",sessionId,token});
  score=result.score;
  if(result.done)endGame(score);else renderRound(result.round);
 }catch{
  sessionStorage.removeItem(storageKey);sessionId=null;token=null;
  show("home");
 }
}
$("start").addEventListener("click",begin);
$("again").addEventListener("click",begin);
$("guess-form").addEventListener("submit",e=>{
 e.preventDefault();const guess=$("guess").value.trim();if(guess)sendGuess(guess);
});
window.addEventListener("visibilitychange",()=>{
 if(document.visibilityState==="visible"&&current&&!busy&&!transitioning)paintTimer();
});
resume();
