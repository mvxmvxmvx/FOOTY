-- Idempotent archive backfill for existing 2026/27-Arsenal-context P54 research.
-- Snapshot context does NOT imply 2026/27 senior play.
begin;
insert into footy.research_team_memberships(
 observation_key,provider,statement_uri,player_external_id,team_external_id,
 player_label,local_team_id,source_id,source_url,claimed_from_raw,claimed_to_raw,
 raw_evidence,collection_snapshot_id,review_status,collected_at)
select e.claim_key,'wikidata',e.raw_evidence->>'statement_uri',e.external_player_id,
 e.raw_evidence->>'team_qid',e.player_label,e.club_id,e.source_id,e.source_url,
 e.raw_evidence->>'from_literal',e.raw_evidence->>'to_literal',e.raw_evidence,
 e.snapshot_id,e.review_status,e.created_at
from footy.season_player_evidence e
where e.evidence_type='wikidata_membership' and e.rights_basis='cc0'
 and e.snapshot_id='epl_2026_27_prejan_20261104'
 and e.external_player_id ~ '^Q[1-9][0-9]*$'
 and e.raw_evidence->>'statement_uri' like 'http%wikidata.org/entity/statement/%'
 and e.raw_evidence->>'team_qid' ~ '^Q[1-9][0-9]*$'
on conflict do nothing;
commit;
select count(*) as global_research_statements,
 count(*) filter(where review_status='pending') as pending_review
from footy.research_team_memberships;
