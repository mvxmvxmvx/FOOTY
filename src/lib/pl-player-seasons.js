// Premier League club/season player appearance importer.
// Fail closed: only a reviewed complete league-appearance roster becomes playable.
// Do not confuse squad registrations or Transfermarkt squads with PL appearances.
export const MIN_ACCEPTED_ANSWERS=11;
const slug=name=>String(name).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
const numeric=(v)=>Number.isInteger(v)&&v>=0;
export function importClubSeason(base,input){
 const bank=structuredClone(base),m=input;
 if(m?.schemaVersion!==1||m.competition!=='Premier League'||!Number.isInteger(m.seasonStartYear)||m.seasonStartYear<1992||m.seasonStartYear>2026)throw Error('Invalid season manifest');
 const year=m.seasonStartYear,season=String(year)+'-'+String(year+1);
 if(m.season!==season||!/^club_[a-z0-9_]+$/.test(m.clubId))throw Error('Manifest season/club mismatch');
 const club=bank.entities.find(e=>e.id===m.clubId&&e.type==='club');
 if(!club||club.name!==m.clubName)throw Error('Unknown Premier League club identity: '+m.clubId);
 const membership='pl_season_'+year+'_'+String(year+1);
 if(!bank.facts.some(f=>f.entityId===m.clubId&&f.relation===membership))throw Error('Club did not participate in this Premier League season');
 if(!m.coverage||m.coverage.status!=='reviewed_complete')throw Error('Unreviewed or incomplete rosters may not enter scoring');
 if(!Array.isArray(m.players)||m.players.length<MIN_ACCEPTED_ANSWERS||m.players.length!==m.coverage.expectedPlayers)throw Error('Incomplete player list or mismatched published total');
 if(!Array.isArray(m.sources)||m.sources.length<1||m.sources.some(s=>!s.id||!/^https:\/\//.test(s.url)))throw Error('Missing source provenance');
 const sourceIds=m.sources.map(s=>s.id);
 const relation='pl_appear_'+year+'_'+String(year+1)+'_'+m.clubId.replace(/^club_/,'');
 const questionId='q_'+relation;
 const existingQuestion=bank.questions.find(q=>q.id===questionId);
 if(existingQuestion||bank.facts.some(f=>f.relation===relation))throw Error('Club-season already imported: '+relation);
 const seenIds=new Set(),seenNames=new Set(),entities=new Map(bank.entities.map(e=>[e.id,e]));
 const records=[];
 let starts=0,subs=0;
 for(const p of m.players){
  if(!p||!/^player_[a-z0-9_]+$/.test(p.entityId)||!p.name||!numeric(p.appearances)||p.appearances<1||!numeric(p.starts)||!numeric(p.substituteAppearances)||p.starts+p.substituteAppearances!==p.appearances||!numeric(p.goals)||p.goals>p.appearances*8)throw Error('Invalid appearance record '+(p?.name||'?'));
  if(seenIds.has(p.entityId)||seenNames.has(slug(p.name)))throw Error('Duplicate player within club-season '+p.name);
  seenIds.add(p.entityId);seenNames.add(slug(p.name));starts+=p.starts;subs+=p.substituteAppearances;
  const current=entities.get(p.entityId);
  if(current&&current.type!=='player')throw Error('Player ID collides with non-player '+p.entityId);
  if(current&&slug(current.name)!==slug(p.name)&&!(current.aliases||[]).some(a=>slug(a)===slug(p.name)))throw Error('Player identity mismatch '+p.name+' vs '+current.name);
  // Do not silently merge a name into a different identity.
  const nameCollision=bank.entities.filter(e=>e.type==='player'&&e.id!==p.entityId&&[e.name,...(e.aliases||[])].some(n=>slug(n)===slug(p.name)));
  if(nameCollision.length)throw Error('Ambiguous identity: '+p.name);
  if(!current){
   const player={id:p.entityId,type:'player',name:p.name,aliases:[]};
   bank.entities.push(player);entities.set(p.entityId,player);
  }
  // Editorial rarity uses the number of this player's league appearances as a
  // provisional difficulty proxy. It is NOT measured player-answer frequency.
  const points=p.appearances<=2?85:p.appearances<=6?60:p.appearances<=14?30:p.appearances<=28?15:10;
  records.push({entityId:p.entityId,relation,points,sources:sourceIds});
 }
 const seasonMatches=year<1995?42:38;
 // Exact 11 starters per completed fixture is a strong audit invariant.
 if(starts!==seasonMatches*11)throw Error('Starts do not reconcile to 11 × '+seasonMatches+' league matches: '+starts);
 for(const src of m.sources){
  if(bank.sources[src.id]&&bank.sources[src.id].url!==src.url)throw Error('Source ID reused for another URL: '+src.id);
  bank.sources[src.id]=bank.sources[src.id]||{publisher:src.publisher,title:season+' '+m.clubName+' Premier League appearances',url:src.url};
 }
 bank.facts.push(...records);
 bank.questions.push({id:questionId,category:'PREMIER LEAGUE PLAYERS · '+season.replace('-', '/'),prompt:'Name '+(/^[AEIOU]/i.test(m.clubName)?'an ':'a ')+m.clubName+' player who made a Premier League appearance in '+season.replace('-', '/')+'.',hint:'Premier League appearances only (including substitutes). An unused squad member does not count. '+m.players.length+' verified answers.',kind:'squad',confidence:'reviewed',allOf:[relation],sources:sourceIds});
 return {bank,summary:{season,club:m.clubName,newPlayers:bank.entities.length-base.entities.length,verifiedPlayerSeasons:records.length,totalStarts:starts,totalSubstituteAppearances:subs,questionId}};
}
