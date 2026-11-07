// Derive longitudinal player histories from independently reviewed PL club-seasons.
// Same player identity may appear at two clubs in one season after a real transfer.
// This is NOT an exhaustive PL career until all relevant club-seasons are reviewed.
export function buildPlayerHistories(manifests){
 const index=new Map(),audited=new Set();
 for(const m of manifests){
  if(m.coverage?.status!=='reviewed_complete')continue;
  const key=m.season+'|'+m.clubId;
  if(audited.has(key))throw Error('Duplicate reviewed club-season '+key);
  audited.add(key);
  for(const p of m.players){
   if(!p.entityId||p.appearances<1)throw Error('Invalid player history record '+m.season);
   if(!index.has(p.entityId))index.set(p.entityId,{entityId:p.entityId,name:p.name,seasons:[]});
   const history=index.get(p.entityId);
   if(history.name!==p.name)throw Error('Identity display name mismatch for '+p.entityId);
   history.seasons.push({season:m.season,clubId:m.clubId,club:m.clubName,appearances:p.appearances,starts:p.starts,substituteAppearances:p.substituteAppearances,goals:p.goals,position:p.position,sourceIds:m.sources.map(s=>s.id)});
  }
 }
 for(const h of index.values()){
  h.seasons.sort((a,b)=>a.season.localeCompare(b.season)||a.club.localeCompare(b.club));
  h.clubs=[...new Set(h.seasons.map(x=>x.clubId))];
  h.totalRecordedAppearances=h.seasons.reduce((a,s)=>a+s.appearances,0);
  h.totalRecordedGoals=h.seasons.reduce((a,s)=>a+s.goals,0);
  h.coverageNote='Reviewed Premier League club-seasons only. This is not necessarily the full career.';
 }
 return {byPlayer:index,reviewedClubSeasons:audited};
}
// NEVER score "played for A and B at any point" while historical coverage
// is incomplete: the closed-world bank would reject valid omitted players.
export function fullCareerQuestionEligible(memberships,reviewedClubSeasons,clubs){
 if(!Array.isArray(clubs)||clubs.length<2)return false;
 for(const clubId of clubs){
  const expected=memberships.filter(x=>x.clubId===clubId);
  if(!expected.length)return false;
  if(expected.some(x=>!reviewedClubSeasons.has(x.season+'|'+clubId)))return false;
 }
 return true;
}
