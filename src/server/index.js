import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compile,verify} from '../lib/questions.js';
import {dailyPlan} from '../lib/daily.js';
const root=fileURLToPath(new URL('../../',import.meta.url));
const publicDir=path.join(root,'public');
const bank=JSON.parse(await fs.readFile(path.join(root,'data','curated-bank.json'),'utf8'));
const questions=compile(bank),byId=new Map(questions.map(q=>[q.id,q]));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
async function body(req){const chunks=[];let size=0;for await(const c of req){size+=c.length;if(size>4096)throw Error('Too large');chunks.push(c);}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
async function serve(res,filename){const file=path.resolve(publicDir,filename);
 if(!file.startsWith(publicDir+path.sep))return json(res,403,{error:'Forbidden'});
 try{const contents=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(contents);}
 catch{return json(res,404,{error:'Not found'});}}
// The browser's V13 prototype currently needs a full client-side question bank.
// Limit that deliberately insecure compatibility endpoint to a LOCAL development
// server. Production game clients must use server-authoritative verification.
export function createFootyServer({host='127.0.0.1',production=false}={}){
 const allowPrototypeBank=!production&&['127.0.0.1','::1','localhost'].includes(host);
 return http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),p=url.pathname;
 if(req.method==='GET'&&p==='/api/v1/bootstrap'){
  if(!allowPrototypeBank)return json(res,403,{error:'Prototype question bank disabled outside local development'});
  return json(res,200,bank);
 }
 if(req.method==='GET'&&p==='/api/health')return json(res,200,{status:'ok',version:bank.meta.version,source:'local_curated_bank'});
 if(req.method==='GET'&&p==='/api/v1/stats')return json(res,200,{entities:bank.entities.length,facts:bank.facts.length,
 questions:questions.length,sources:Object.keys(bank.sources).length});
 if(req.method==='GET'&&p==='/api/v1/questions')return json(res,200,questions.map(q=>({id:q.id,category:q.category,prompt:q.prompt,kind:q.kind,answerCount:q.answers.length})));
 if(req.method==='GET'&&p==='/api/v1/daily')return json(res,200,dailyPlan(questions,url.searchParams.get('date')||new Date().toISOString().slice(0,10)));
 if(req.method==='POST'&&p==='/api/v1/verify'){const data=await body(req);
 if(typeof data.questionId!=='string'||typeof data.answer!=='string'||data.answer.length>160)return json(res,400,{error:'Invalid payload'});
 if(!byId.has(data.questionId))return json(res,404,{error:'Unknown question'});
 return json(res,200,{questionId:data.questionId,...verify(byId.get(data.questionId),data.answer)});}
 if(req.method==='GET'&&(p==='/'||p==='/play'))return serve(res,'index.html');
 if(req.method==='GET'&&p.startsWith('/assets/'))return serve(res,p.slice(1));
 return json(res,404,{error:'Not found'});
 }catch(err){return json(res,400,{error:'Invalid request'}); }});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const host=process.env.HOST||'127.0.0.1';
 const port=process.env.PORT===undefined?4173:Number(process.env.PORT);
 createFootyServer({host,production:process.env.NODE_ENV==='production'}).listen(port,host,
  ()=>console.log('FOOTY local preview running on '+host+':'+port));
}