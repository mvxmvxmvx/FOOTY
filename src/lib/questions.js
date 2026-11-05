// FOOTY verified-only answer engine. No LLM validation or invented records.
export const normalize = (text) => String(text ?? '').toLowerCase()
 .replace(/ß/g,'ss').replace(/ø/g,'o').replace(/ł/g,'l').replace(/æ/g,'ae').replace(/œ/g,'oe')
 .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,'and')
 .replace(/[^a-z0-9]/g,'').replace(/^the(?=[a-z])/,'');
const particles = new Set(['van','von','de','del','der','den','di','da','do','du','la','le','san','st']);
const surname = (name) => {const w=name.trim().split(/\s+/);if(w.length<2)return [];let i=w.length-1;
 while(i>0&&particles.has(normalize(w[i-1])))i--;return i===0?[]:[w.slice(i).join(' ')];};
const distance = (a,b,max) => {if(Math.abs(a.length-b.length)>max)return max+1;
 let prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){let row=[i],min=i;for(let j=1;j<=b.length;j++){
 row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));min=Math.min(min,row[j]);}
 if(min>max)return max+1;prev=row;}return prev[b.length];};
export function compile(bank) {
 const entities=new Map(bank.entities.map(e=>[e.id,e]));
 const relations=new Map();
 for(const f of bank.facts){if(!relations.has(f.relation))relations.set(f.relation,new Map());
 relations.get(f.relation).set(f.entityId,f);}
 return bank.questions.map(q=>{
 const lists=q.allOf.map(r=>relations.get(r)||new Map());
 const ids=[...(lists[0]?.keys()||[])].filter(id=>lists.every(rel=>rel.has(id)));
 const answers=ids.map(id=>({id,name:entities.get(id).name,
  points:Math.max(...lists.map(rel=>rel.get(id).points)),type:entities.get(id).type,
  aliases:entities.get(id).aliases||[]}));
 const lookup=new Map();
 for(const a of answers)for(const str of [a.name,...a.aliases,...(a.type==='player'?surname(a.name):[])]){
 const key=normalize(str);if(!key)continue;if(!lookup.has(key))lookup.set(key,new Map());
 lookup.get(key).set(a.id,a);}
 return {...q,answers,lookup};
 });
}
export function verify(q,input){
 if(!q)return {status:'unknown_question'};
 if(typeof input!=='string'||!input.trim())return {status:'empty'};
 const key=normalize(input);const direct=q.lookup.get(key);
 if(direct){const candidates=[...direct.values()];return candidates.length===1
 ?{status:'accepted',canonical:candidates[0].name,points:candidates[0].points,match:'exact'}
 :{status:'ambiguous',candidates:candidates.map(a=>a.name)};}
 const cap=key.length>=13?2:key.length>=5?1:0;if(!cap)return {status:'not_applicable'};
 const found=new Map();
 for(const [alias,matches] of q.lookup){if(Math.abs(alias.length-key.length)>cap)continue;
 const d=distance(key,alias,cap);if(d>cap)continue;
 for(const a of matches.values()){const old=found.get(a.id);
 if(!old||d<old.d)found.set(a.id,{a,d});}}
 if(!found.size)return {status:'not_applicable'};
 const ranked=[...found.values()].sort((a,b)=>a.d-b.d);
 const tied=ranked.filter(x=>x.d===ranked[0].d);
 if(tied.length>1)return {status:'ambiguous',candidates:tied.map(x=>x.a.name)};
 return {status:'accepted',canonical:ranked[0].a.name,points:ranked[0].a.points,match:'autocorrect'};
}
