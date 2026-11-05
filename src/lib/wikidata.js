// Wikidata P54 parser. Stage-only: never award points from these claims.
const QID_RE = /^Q[1-9][0-9]*$/;
function qidFromSnak(snak) {
  if (snak?.snaktype !== "value") return null;
  const id = snak.datavalue?.value?.id;
  return typeof id === "string" && QID_RE.test(id) ? id : null;
}
function timeQualifier(qualifiers, prop) {
  const values = qualifiers?.[prop] ?? [];
  const v = values.find(x => x.snaktype === "value")?.datavalue?.value;
  if (!v || typeof v.time !== "string") return {value:null, precision:"unknown"};
  const match = /^([+-])(\d{4})-(\d{2})-(\d{2})T/.exec(v.time);
  if (!match || match[1] !== "+") return {value:null, precision:"unknown"};
  const [ , , year,month,day] = match;
  if (v.precision === 9) return {value:year,precision:"year"};
  if (v.precision === 10 && +month>=1 && +month<=12) return {value:year+"-"+month,precision:"month"};
  if (v.precision === 11 && +month>=1 && +month<=12 && +day>=1 && +day<=31) return {value:year+"-"+month+"-"+day,precision:"day"};
  return {value:null,precision:"unknown"};
}
function extractClaimRows(response,mappings) {
  if (!response || typeof response.entities !== "object" || !response.entities) throw Error("Invalid Wikidata API payload");
  const out = [];
  const mappedPlayers = mappings?.players ?? {};
  const mappedClubs = mappings?.clubs ?? {};
  for (const [personQid,entity] of Object.entries(response.entities)) {
    if (!QID_RE.test(personQid) || !mappedPlayers[personQid]) continue;
    for (const statement of entity?.claims?.P54 ?? []) {
      if (statement.rank === "deprecated") continue;
      const teamQid = qidFromSnak(statement.mainsnak);
      const id = statement.id;
      if (!teamQid || typeof id !== "string" || !id.startsWith(personQid+"$")) continue;
      const start = timeQualifier(statement.qualifiers,"P580");
      const end = timeQualifier(statement.qualifiers,"P582");
      const loan = (statement.qualifiers?.P1642 ?? []).some(x=>qidFromSnak(x)==="Q2914547") ? true : null;
      // P2094 is "competition class", not a generic youth-team property.
      // Only its explicit youth-sports value (Q599867) is enough to flag youth.
      const competitionClass = (statement.qualifiers?.P2094 ?? []).map(qidFromSnak);
      const youth = competitionClass.includes('Q599867');
      const hasOtherCompetitionClass = competitionClass.some(q=>q&&q!=='Q599867');
      const national = Boolean(mappings?.nationalTeams?.[teamQid]);
      const clubId = !national && !youth ? (mappedClubs[teamQid] ?? null) : null;
      const classification = national ? 'national_team'
        : youth ? 'youth' : hasOtherCompetitionClass ? 'unknown'
        : clubId ? 'senior_candidate' : 'unknown';
      out.push({
        claim_key:"wikidata:statement:"+id,
        provider:"wikidata",player_external_id:personQid,club_external_id:teamQid,
        statement_external_id:id,
        player_id:mappedPlayers[personQid],club_id:clubId,
        source_url:"https://www.wikidata.org/wiki/"+personQid+"#P54",
        observed_from:start.value,observed_to:end.value,
        from_precision:start.precision,to_precision:end.precision,
        team_classification:classification,
        loan_flag:loan,provenance:"wikidata_api",review_status:"pending",
        raw_claim:statement
      });
    }
  }
  return out;
}
function stagingSql(claims) {
  if(!Array.isArray(claims)||claims.length>5000)throw Error("Invalid claim batch size");
  const clean=claims.map(c=>{
    if(!QID_RE.test(c.player_external_id)||!QID_RE.test(c.club_external_id)||
      typeof c.claim_key!=="string"||!c.claim_key.startsWith("wikidata:statement:"))throw Error("Invalid claim");
    return {
      claim_key:c.claim_key,provider:"wikidata",player_external_id:c.player_external_id,
      club_external_id:c.club_external_id,statement_external_id:c.statement_external_id,
      source_url:c.source_url,observed_from:c.observed_from,observed_to:c.observed_to,
      from_precision:c.from_precision,to_precision:c.to_precision,
      team_classification:c.team_classification,loan_flag:c.loan_flag,
      provenance:"wikidata_api",review_status:"pending",raw_claim:c.raw_claim
    };
  });
  const encoded=JSON.stringify(clean).replaceAll("'","''");
  return `-- Stage only. Does not create player careers or publish questions.
with incoming as (
 select * from jsonb_to_recordset('${encoded}'::jsonb) as x(
 claim_key text,provider text,player_external_id text,club_external_id text,
 statement_external_id text,source_url text,observed_from text,observed_to text,
 from_precision text,to_precision text,team_classification text,loan_flag boolean,
 provenance text,review_status text,raw_claim jsonb
 )
)
insert into footy.external_career_claims(
 claim_key,provider,player_external_id,club_external_id,statement_external_id,
 player_id,club_id,source_url,observed_from,observed_to,from_precision,to_precision,
 team_classification,loan_flag,provenance,review_status,raw_claim)
select i.claim_key,i.provider,i.player_external_id,i.club_external_id,i.statement_external_id,
 p.entity_id,c.entity_id,i.source_url,i.observed_from,i.observed_to,i.from_precision,i.to_precision,
 case when c.entity_id is null then 'unknown' else i.team_classification end,
 i.loan_flag,i.provenance,'pending',i.raw_claim
from incoming i
join footy.external_entity_links p on p.provider='wikidata'
 and p.external_id=i.player_external_id and p.kind='player' and p.review_status='confirmed'
left join footy.external_entity_links c on c.provider='wikidata'
 and c.external_id=i.club_external_id and c.kind='club' and c.review_status='confirmed'
on conflict(claim_key) do nothing;
`;
}
export {qidFromSnak,timeQualifier,extractClaimRows,stagingSql};
