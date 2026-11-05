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
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),p=url.pathname;
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
 }catch(err){return json(res,400,{error:'Invalid request'});}}).listen(Number(process.env.PORT)||4173,process.env.HOST||'127.0.0.1',
 ()=>console.log('FOOTY local website running on port '+(process.env.PORT||4173)));
