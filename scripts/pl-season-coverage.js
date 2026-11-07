// Audit coverage of ALL Premier League club-seasons against reviewed player appearances.
// Club membership coverage is not player appearance coverage.
import fs from 'node:fs/promises';
const bank=JSON.parse(await fs.readFile(new URL('../data/curated-bank.json',import.meta.url),'utf8'));
const clubs=new Map(bank.entities.filter(e=>e.type==='club').map(e=>[e.id,e.name]));
const participants=new Map(),reviewed=new Map();
for(const f of bank.facts){
 const season=/^pl_season_(\d{4})_(\d{4})$/.exec(f.relation);
 if(season){const year=Number(season[1]);if(!participants.has(year))participants.set(year,new Set());participants.get(year).add(f.entityId);}
 const roster=/^pl_appear_(\d{4})_(\d{4})_(.+)$/.exec(f.relation);
 if(roster){const year=Number(roster[1]),key=year+'|'+roster[3];if(!reviewed.has(key))reviewed.set(key,new Set());reviewed.get(key).add(f.entityId);}
}
const rows=[];
for(let year=1992;year<=2026;year++){
 const list=[...(participants.get(year)||[])].sort((a,b)=>(clubs.get(a)||'').localeCompare(clubs.get(b)||''));
 for(const clubId of list){
  const key=year+'|'+clubId.replace(/^club_/,'');
  const players=reviewed.get(key)||new Set();
  const qid='q_pl_appear_'+year+'_'+(year+1)+'_'+clubId.replace(/^club_/,'');
  const active=bank.questions.some(q=>q.id===qid);
  if(active&&players.size<11)throw Error('Incomplete active question: '+qid);
  if(!active&&players.size)throw Error('Orphaned unreviewed scoreable player records: '+key);
  rows.push({season:year+'/'+String(year+1).slice(-2),club:clubs.get(clubId),status:active?'reviewed_complete':'pending',verifiedPlayers:players.size});
 }
}
const complete=rows.filter(x=>x.status==='reviewed_complete').length;
console.log(JSON.stringify({clubSeasons:rows.length,reviewedComplete:complete,pending:rows.length-complete,seasonProgress:Array.from({length:35},(_,i)=>{const season=(1992+i)+'/'+String(1993+i).slice(-2),members=rows.filter(x=>x.season===season);return {season,clubs:members.length,reviewed:members.filter(x=>x.status==='reviewed_complete').length}}),reviewedClubs:rows.filter(x=>x.status==='reviewed_complete')},null,2));
