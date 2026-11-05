// FOOTY Friends Beta (V14) — server-authoritative guest session prototype.
// Public function: per-session random capability token; no direct database client access.
// Never send accepted-answer lists or Supabase secret credentials to browsers.
import { createClient } from "npm:@supabase/supabase-js@2.57.0";

const PROJECT_URL = Deno.env.get("SUPABASE_URL") ?? "";
function readSecret() {
  const legacy=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const raw=JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    return typeof raw.default==="string" ? raw.default : (raw.default?.key || "");
  } catch { return ""; }
}
const SECRET=readSecret();
const db=PROJECT_URL&&SECRET ? createClient(PROJECT_URL,SECRET,{
  auth:{autoRefreshToken:false,persistSession:false}
}) : null;
const ALLOWED_ORIGINS=new Set([
  "https://mvxmvxmvx.github.io",
  "http://localhost:4173","http://127.0.0.1:4173",
  "http://localhost:5500","http://127.0.0.1:5500"
]);
const ROUND_SECONDS=25, MAX_BODY=2048, ROUND_COUNT=7;
function headers(req){
  const origin=req.headers.get("origin");
  return {"Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
    "Vary":"Origin",
    ...(origin&&ALLOWED_ORIGINS.has(origin)?{
      "Access-Control-Allow-Origin":origin,
      "Access-Control-Allow-Methods":"POST, OPTIONS",
      "Access-Control-Allow-Headers":"content-type, apikey, authorization",
      "Access-Control-Max-Age":"600"
    }:{})};
}
function reply(req,code,data){return new Response(JSON.stringify(data),{status:code,headers:headers(req)});}
function normalize(v){return String(v??"").toLowerCase().replace(/ß/g,"ss").replace(/ø/g,"o")
 .replace(/ł/g,"l").replace(/æ/g,"ae").replace(/œ/g,"oe").replace(/ı/g,"i")
 .normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/&/g,"and")
 .replace(/[^a-z0-9]/g,"").replace(/^the(?=[a-z])/,"");}
const PARTICLES=new Set(["van","von","de","del","der","den","di","da","do","du","la","le","san","st"]);
function surname(name){const w=String(name).trim().split(/\s+/);if(w.length<2)return null;
 let i=w.length-1;while(i>0&&PARTICLES.has(normalize(w[i-1])))i--;
 return i===0?null:w.slice(i).join(" ");}
function resolveGuess(guess,answers){
 const input=normalize(guess);if(!input)return {status:"not_applicable"};
 const hits=[];
 for(const a of answers){
  const set=new Set([a.answer_name,...(Array.isArray(a.aliases)?a.aliases:[])]);
  if(a.answer_type==="player"){const n=surname(a.answer_name);if(n)set.add(n);}
  if([...set].some(x=>normalize(x)===input))hits.push(a);
 }
 if(hits.length>1)return {status:"ambiguous"};
 if(hits.length===1)return {status:"accepted",answer:hits[0]};
 return {status:"not_applicable"};
}
async function hash(s){
 const bytes=new TextEncoder().encode(s);
 const digest=await crypto.subtle.digest("SHA-256",bytes);
 return Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,"0")).join("");
}
function constantEqual(a,b){
 if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;
 let different=0;for(let i=0;i<a.length;i++)different|=a.charCodeAt(i)^b.charCodeAt(i);
 return different===0;
}
async function currentQuestion(questionId){
 const {data,error}=await db.from("footy_beta_questions")
  .select("id,category,kind,prompt").eq("id",questionId).eq("enabled",true).single();
 if(error||!data)throw Error("Question unavailable");
 return data;
}
function publicRound(q,index){
 return {index,number:index+1,total:ROUND_COUNT,seconds:ROUND_SECONDS,
  questionId:q.id,category:q.category,prompt:q.prompt};
}
async function start(req){
 const {data:questions,error}=await db.from("footy_beta_questions")
  .select("id,category,kind,prompt").eq("enabled",true).limit(100);
 if(error||!questions||questions.length<ROUND_COUNT)throw Error("Question bank unavailable");
 const shuffled=[...questions];for(let i=shuffled.length-1;i>0;i--){
  const random=new Uint32Array(1);crypto.getRandomValues(random);
  const j=random[0]%(i+1);[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];
 }
 const selected=shuffled.slice(0,ROUND_COUNT);
 const token=crypto.randomUUID()+"."+crypto.randomUUID();
 const {data:session,error:insertError}=await db.from("footy_beta_sessions")
  .insert({token_sha256:await hash(token),question_ids:selected.map(q=>q.id)})
  .select("id,expires_at").single();
 if(insertError||!session)throw Error("Cannot start session");
 return reply(req,200,{ok:true,sessionId:session.id,token,
  round:publicRound(selected[0],0),score:0,completed:0,
  expiresAt:session.expires_at,beta:true});
}
async function loadSession(data){
 if(typeof data.sessionId!=="string"||
    !/^[0-9a-f-]{36}$/i.test(data.sessionId)||
    typeof data.token!=="string"||data.token.length>130)
  return null;
 const {data:session,error}=await db.from("footy_beta_sessions")
  .select("id,token_sha256,question_ids,started_at,expires_at")
  .eq("id",data.sessionId).maybeSingle();
 if(error||!session||new Date(session.expires_at).getTime()<Date.now()||
    !constantEqual(await hash(data.token),session.token_sha256))return null;
 return session;
}
async function allSubmissions(sessionId){
 const {data,error}=await db.from("footy_beta_submissions")
  .select("round_index,question_id,verdict,points,submitted_at,answer_id")
  .eq("session_id",sessionId).order("round_index");
 if(error||!data)throw Error("Could not read submissions");
 return data;
}
function tally(rows){return rows.reduce((n,row)=>n+row.points,0);}
async function getState(req,session){
 const rows=await allSubmissions(session.id),index=rows.length;
 if(index>=ROUND_COUNT)return reply(req,200,{ok:true,done:true,score:tally(rows),
  completed:ROUND_COUNT,total:ROUND_COUNT});
 const round=await currentQuestion(session.question_ids[index]);
 const opened=index===0?session.started_at:rows[index-1].submitted_at;
 const remaining=Math.max(0,ROUND_SECONDS-Math.floor((Date.now()-new Date(opened).getTime())/1000));
 return reply(req,200,{ok:true,done:false,score:tally(rows),completed:index,
  round:{...publicRound(round,index),secondsRemaining:remaining}});
}
async function answer(req,session,guess){
 if(typeof guess!=="string"||guess.length>160)
  return reply(req,400,{ok:false,error:"Enter one answer up to 160 characters"});
 const rows=await allSubmissions(session.id),index=rows.length;
 if(index>=ROUND_COUNT)return getState(req,session);
 const questionId=session.question_ids[index];
 const opened=index===0?session.started_at:rows[index-1].submitted_at;
 const elapsed=(Date.now()-new Date(opened).getTime())/1000;
 const timedOut=elapsed>ROUND_SECONDS+2;
 let result={status:"not_applicable"};
 if(!timedOut&&guess.trim()){
  const {data:answers,error}=await db.from("footy_beta_answers")
   .select("answer_id,answer_name,answer_type,points,aliases").eq("question_id",questionId);
  if(error||!answers)throw Error("Answers temporarily unavailable");
  result=resolveGuess(guess,answers);
 }
 if(result.status==="ambiguous")
  return reply(req,409,{ok:false,error:"That name matches multiple players. Try the full name.",ambiguous:true});
 const accepted=!timedOut&&result.status==="accepted";
 const verdict=timedOut?"timed_out":accepted?"accepted":"not_applicable";
 const points=accepted?result.answer.points:0;
 const {error:writeError}=await db.from("footy_beta_submissions").insert({
  session_id:session.id,round_index:index,question_id:questionId,
  guessed:guess,answer_id:accepted?result.answer.answer_id:null,verdict,points
 });
 if(writeError){
  if(writeError.code==="23505")return getState(req,session);
  throw Error("Could not submit answer");
 }
 const nextIndex=index+1;
 const next=nextIndex<ROUND_COUNT?publicRound(await currentQuestion(session.question_ids[nextIndex]),nextIndex):null;
 return reply(req,200,{ok:true,verdict,canonical:accepted?result.answer.answer_name:null,
  points,score:tally(rows)+points,completed:nextIndex,done:next===null,next,
  total:ROUND_COUNT});
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS"){
  const origin=req.headers.get("origin");
  return new Response(null,{status:origin&&ALLOWED_ORIGINS.has(origin)?204:403,headers:headers(req)});
 }
 const origin=req.headers.get("origin");
 if(origin&&!ALLOWED_ORIGINS.has(origin))return reply(req,403,{ok:false,error:"Origin not allowed"});
 if(req.method!=="POST")return reply(req,405,{ok:false,error:"POST only"});
 if(!db)return reply(req,503,{ok:false,error:"Beta backend not configured"});
 const length=Number(req.headers.get("content-length")||"0");
 if(length>MAX_BODY)return reply(req,413,{ok:false,error:"Request too large"});
 try{
  const raw=await req.text();if(raw.length>MAX_BODY)return reply(req,413,{ok:false,error:"Request too large"});
  const data=JSON.parse(raw);if(!data||typeof data!=="object"||Array.isArray(data))
    return reply(req,400,{ok:false,error:"Invalid JSON"});
  if(data.action==="start")return await start(req);
  if(data.action!=="submit"&&data.action!=="resume")return reply(req,400,{ok:false,error:"Unknown action"});
  const session=await loadSession(data);
  if(!session)return reply(req,401,{ok:false,error:"Session expired or not found. Start a new round."});
  if(data.action==="resume")return await getState(req,session);
  return await answer(req,session,data.guess);
 }catch(error){
  console.error("FOOTY beta request failed:",error instanceof Error?error.message:"unknown error");
  return reply(req,500,{ok:false,error:"Game service error. Please retry."});
 }
});
