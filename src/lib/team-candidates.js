// Wikidata follow-up resolution suggestions — editor review ONLY.
const QID_RE = /^Q[1-9][0-9]*$/;
const youthCompetition = (claim) => (claim.raw_claim?.qualifiers?.P2094 ?? [])
  .some(s=>s.snaktype==='value' && s.datavalue?.value?.id==='Q599867');

export function unresolvedTeamQids(claims){
  if(!Array.isArray(claims)) throw Error('Expected claim array');
  return [...new Set(claims.filter(c=>c.club_id===null && QID_RE.test(c.club_external_id))
    .map(c=>c.club_external_id))].sort((a,b)=>Number(a.slice(1))-Number(b.slice(1)));
}
export function buildTeamReviewCandidates(claims, wikidataResponse, mappings={}){
  if(!wikidataResponse?.entities || typeof wikidataResponse.entities!=='object')
    throw Error('Wikidata labels response missing entities');
  const candidates=[];
  for(const id of unresolvedTeamQids(claims)){
    const refs=claims.filter(c=>c.club_id===null && c.club_external_id===id);
    const info=wikidataResponse.entities[id]||{};
    const national=Boolean(mappings.nationalTeams?.[id]);
    const youth=refs.some(c=>c.team_classification==='youth'||youthCompetition(c));
    const category=national?'national_team':youth?'youth':'needs_review';
    candidates.push({
      team_qid:id,
      label:info.labels?.en?.value ?? null,
      description:info.descriptions?.en?.value ?? null,
      wikidata_url:'https://www.wikidata.org/wiki/'+id,
      observed_statements:refs.length,
      players:[...new Set(refs.map(c=>c.player_external_id))].sort(),
      source_reference_statements:refs.filter(c=>(c.raw_claim?.references||[]).length>0).length,
      classification_hint:category,
      suggested_footy_club_id:null,
      review_status:'pending',
      note:'Candidate labels/descriptions are not proof of senior club identity; manual reconciliation required.'
    });
  }
  return candidates;
}
