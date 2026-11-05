// EPL season staging: Wikidata membership claims are NOT accepted appearances.
// No data from the Premier League website is copied or harvested.
import {createHash} from 'node:crypto';
const QID=/^Q[1-9][0-9]*$/;
const uriId=(uri)=>{if(typeof uri!=='string')return null;const match=/^https?:\/\/www\.wikidata\.org\/entity\/(Q[1-9][0-9]*)$/.exec(uri);return match?.[1]??null;};
export function validateSnapshot(config){
 if(config?.id!=='epl_2026_27_prejan_20261104'||config?.asOf!=='2026-11-04'||config?.phase!=='pre_january')throw Error('Wrong snapshot');
 if(!Array.isArray(config.clubs)||config.clubs.length!==20)throw Error('Expected exactly 20 clubs');
 if(new Set(config.clubs.map(c=>c.id)).size!==20)throw Error('Duplicate club IDs');
 for(const club of config.clubs){
  if(!/^club_[a-z0-9_]+$/.test(club.id)||typeof club.name!=='string'||club.name.length<3)throw Error('Bad club');
  if(club.wikidataQid!==null&&(!QID.test(club.wikidataQid)||club.qidStatus!=='verified'))throw Error('Unverified QID cannot be queried');
  if(club.wikidataQid===null&&club.qidStatus!=='unmapped')throw Error('Unmapped QID status mismatch');
 }
 return config;
}
export function teamQidProposal(searchResult,club){
 const matches=(searchResult?.search??[]).filter(r=>QID.test(r.id??'')).slice(0,5);
 return {club_id:club.id,club_name:club.name,query:club.name,candidates:matches.map(r=>({qid:r.id,label:r.label??'',description:r.description??'',url:'https://www.wikidata.org/wiki/'+r.id})),status:'needs_manual_review'};
}
export function wdqsQuery(teamQid,seasonStart,asOf,limit=300){
 if(!QID.test(teamQid))throw Error('Unverified club QID');
 if(!/^\d{4}-\d\d-\d\d$/.test(seasonStart)||!/^\d{4}-\d\d-\d\d$/.test(asOf))throw Error('Bad date');
 if(!Number.isInteger(limit)||limit<1||limit>500)throw Error('Query limit out of bounds');
 return `SELECT ?person ?statement ?start ?end ?personLabel WHERE {
 ?person p:P54 ?statement.
 ?statement ps:P54 wd:${teamQid}.
 OPTIONAL { ?statement pq:P580 ?start. }
 OPTIONAL { ?statement pq:P582 ?end. }
 FILTER (!BOUND(?start) || ?start <= "${asOf}T23:59:59Z"^^xsd:dateTime)
 FILTER (!BOUND(?end) || ?end >= "${seasonStart}T00:00:00Z"^^xsd:dateTime)
 SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT ${limit}`;
}
export function parseWdqsBatch(response,club,config,limit=300){
 validateSnapshot(config);
 if(!club||club.qidStatus!=='verified'||!QID.test(club.wikidataQid??''))throw Error('Unknown or unverified team');
 const rows=response?.results?.bindings;
 if(!Array.isArray(rows))throw Error('Bad Wikidata SPARQL JSON');
 const result=[],seen=new Set(),skipped=[];
 for(const binding of rows){
  const playerQid=uriId(binding.person?.value),statement=binding.statement?.value;
  if(!playerQid||typeof statement!=='string'||!/^https?:\/\/www\.wikidata\.org\/entity\/statement\//.test(statement)){skipped.push('malformed_id');continue;}
  const stableId='epl2627:'+config.id+':'+club.id+':'+createHash('sha256').update(statement).digest('hex').slice(0,20);
  if(seen.has(stableId))continue;seen.add(stableId);
  const label=String(binding.personLabel?.value||playerQid).slice(0,180).trim();
  result.push({
   claim_key:stableId,snapshot_id:config.id,club_id:club.id,
   player_id:null,external_player_id:playerQid,player_label:label,
   evidence_type:'wikidata_membership',evidence_date:null,appearances:null,
   source_id:'wikidata_cc0',source_url:'https://www.wikidata.org/wiki/'+playerQid+'#P54',
   raw_evidence:{statement_uri:statement,from_literal:binding.start?.value??null,to_literal:binding.end?.value??null,
    team_qid:club.wikidataQid,source:'Wikidata Query Service',timestamp_precision:'unknown_not_inferred'},
   rights_basis:'cc0',review_status:'pending'
  });
 }
 return {manifest:{snapshot_id:config.id,club_id:club.id,club_name:club.name,team_qid:club.wikidataQid,
  candidate_rows:result.length,result_rows:rows.length,possibly_truncated:rows.length>=limit,
  skipped:skipped.length,not_verified_senior_appearances:true,scoring_enabled:false},claims:result};
}
// The SPARQL search is intentionally recall-heavy: missing dates can refer to
// retired, women's, youth, or even incorrectly attributed player identities.
// These buckets are research triage ONLY, never proof of 2026/27 eligibility.
export function partitionSeasonCandidates(batch){
 if(!batch?.manifest?.snapshot_id || !Array.isArray(batch?.claims))throw Error('Bad season research batch');
 const dated=[],undated=[];
 for(const c of batch.claims){
  if(c?.evidence_type!=='wikidata_membership' || c?.review_status!=='pending')
   throw Error('Only unreviewed club memberships can be partitioned');
  const from=c.raw_evidence?.from_literal;
  if(typeof from==='string' && /^\d{4}-\d{2}-\d{2}T/.test(from))dated.push(c);
  else undated.push(c);
 }
 const olderStarts=dated.filter(c=>c.raw_evidence.from_literal.slice(0,4)<'2018').length;
 const endedBeforeSnapshot=dated.filter(c=>typeof c.raw_evidence?.to_literal==='string'
  && c.raw_evidence.to_literal.slice(0,10)<batch.manifest.snapshot_id.slice(-8,-4)+'-'+batch.manifest.snapshot_id.slice(-4,-2)+'-'+batch.manifest.snapshot_id.slice(-2)).length;
 return {
  dated,undated,
  audit:{total:batch.claims.length,date_qualified:dated.length,undated_quarantine:undated.length,
   pre_2018_start_candidates:olderStarts,ended_before_snapshot:endedBeforeSnapshot,
   current_season_appearances_verified:0,review_status:'pending',
   warning:"P54 membership with dates is NOT proof of a current men's first-team appearance; dates may be imprecise, stale, or incorrect."}
 };
}
export function seasonStageSql(batch) {
 if(!batch||!Array.isArray(batch.claims)||batch.claims.length>500)throw Error('Bad batch');
 for(const c of batch.claims){
  if(!/^epl2627:[a-z0-9_:]+:[0-9a-f]{20}$/.test(c.claim_key)||c.evidence_type!=='wikidata_membership'||
    c.rights_basis!=='cc0'||c.review_status!=='pending'||c.appearances!==null||c.player_id!==null||
    typeof c.raw_evidence?.from_literal!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(c.raw_evidence.from_literal))
   throw Error('Only unreviewed Wikidata membership claims can be imported');
 }
 const clean=batch.claims.map(c=>({
  claim_key:c.claim_key,snapshot_id:c.snapshot_id,club_id:c.club_id,player_label:c.player_label,
  external_player_id:c.external_player_id,evidence_type:c.evidence_type,source_id:c.source_id,source_url:c.source_url,
  raw_evidence:c.raw_evidence,rights_basis:'cc0'
 }));
 const escaped=JSON.stringify(clean).replaceAll("'","''");
 return `-- Review only: no senior appearances asserted, no new scored trivia.
with incoming as (
 select * from jsonb_to_recordset('${escaped}'::jsonb) as i(
 claim_key text,snapshot_id text,club_id text,player_label text,external_player_id text,
 evidence_type text,source_id text,source_url text,raw_evidence jsonb,rights_basis text
 ))
insert into footy.season_player_evidence(
 claim_key,snapshot_id,club_id,player_id,external_player_id,player_label,evidence_type,
 evidence_date,appearances,source_id,source_url,raw_evidence,rights_basis,review_status)
select i.claim_key,i.snapshot_id,i.club_id,null,i.external_player_id,i.player_label,i.evidence_type,
 null,null,i.source_id,i.source_url,i.raw_evidence,i.rights_basis,'pending'
from incoming i
join footy.season_club_participants sc on sc.snapshot_id=i.snapshot_id and sc.club_id=i.club_id
on conflict(claim_key) do update set
 raw_evidence = coalesce(footy.season_player_evidence.raw_evidence,excluded.raw_evidence);
`;
}
