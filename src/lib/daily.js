import {createHash} from 'node:crypto';
const themes=[
 ['DOMESTIC MATCHDAY',{squad:3,classic:2,europe:1,world:1}],
 ['FOOTBALL MIX',{classic:2,europe:2,squad:2,world:1}],
 ['EUROPEAN NIGHTS',{europe:3,classic:2,squad:1,world:1}],
 ['EUROPEAN NIGHTS',{europe:3,classic:2,squad:1,world:1}],
 ['CONTINENTAL THURSDAY',{europe:3,squad:2,classic:1,world:1}],
 ['DOMESTIC MATCHDAY',{squad:3,classic:2,europe:1,world:1}],
 ['DOMESTIC MATCHDAY',{squad:3,classic:2,europe:1,world:1}]
];
function rng(seed){let n=parseInt(createHash('sha256').update(seed).digest('hex').slice(0,8),16)>>>0;
 return ()=>{n+=0x6D2B79F5;let v=n;v=Math.imul(v^(v>>>15),v|1);v^=v+Math.imul(v^(v>>>7),v|61);
 return ((v^(v>>>14))>>>0)/4294967296;};}
function shuffle(items,random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function dailyPlan(questions,date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z')))throw Error('Invalid date');
 const [theme,weight]=themes[new Date(date+'T00:00:00Z').getUTCDay()];
 const random=rng('FOOTY-V13|'+date),choices=[],chosen=new Set();
 for(const [kind,count] of Object.entries(weight)){
 const pool=shuffle(questions.filter(q=>q.kind===kind),random);
 for(const item of pool){if(choices.filter(q=>q.kind===kind).length>=count)break;
 if(chosen.has(item.id))continue;choices.push(item);chosen.add(item.id);}}
 if(choices.length<7)for(const item of shuffle(questions,random)){if(choices.length===7)break;
 if(!chosen.has(item.id)){choices.push(item);chosen.add(item.id);}}
 if(choices.length!==7)throw Error('Need seven questions');
 const draw=shuffle(choices,random);
 return {date,theme,questionIds:draw.map(q=>q.id),categories:draw.map(q=>q.category),
 note:'Calendar-inspired, not live-fixture based.'};
}
