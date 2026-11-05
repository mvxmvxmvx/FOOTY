-- Manually inspected Wikidata item P54 statements (2026-11-04).
-- 13 claims, four players, seven clubs. NO P54 GUIDs invented.
-- These are RESEARCH CANDIDATES; not scored facts or complete careers.
-- Wikidata structured item data: CC0. Sources: https://www.wikidata.org/wiki/Q45901
-- Q133556, Q43913, Q1255625. See docs/V14-wikidata-import.md.
insert into footy.sources(id,publisher,title,url,license,note)
values('wikidata_cc0','Wikidata','Wikidata structured statements','https://www.wikidata.org/','CC0','Community-edited; subject to independent completeness review')
on conflict(id) do nothing;

with external_ids(qid,footy_id,kind) as (values
 ('Q45901','player_thierry_henry','player'),
 ('Q133556','player_ashley_cole','player'),
 ('Q43913','player_arjen_robben','player'),
 ('Q1255625','player_samuel_eto_o','player'),
 ('Q9617','club_arsenal','club'),
 ('Q9616','club_chelsea','club'),
 ('Q7156','club_barcelona','club'),
 ('Q1422','club_juventus','club'),
 ('Q15789','club_bayern_munich','club'),
 ('Q8682','club_real_madrid','club'),
 ('Q631','club_inter_milan','club')
)
insert into footy.external_entity_links(provider,external_id,entity_id,kind,evidence_url,match_method,review_status,reviewed_at)
select 'wikidata',qid,footy_id,kind,'https://www.wikidata.org/wiki/'||qid,'manual_verified','confirmed',now()
from external_ids
on conflict(provider,external_id) do nothing;

with reviewed(key,player_qid,club_qid,from_value,to_value,from_precision,to_precision,loan_flag) as (values
 ('wikidata:page:Q45901:Q9617:1999-08-03','Q45901','Q9617','1999-08-03','2007','day','year',NULL),
 ('wikidata:page:Q45901:Q9617:2012-01-06','Q45901','Q9617','2012-01-06','2012-02-15','day','day',true),
 ('wikidata:page:Q45901:Q7156:2007','Q45901','Q7156','2007','2010','year','year',NULL),
 ('wikidata:page:Q45901:Q1422:1999','Q45901','Q1422','1999','1999','year','year',NULL),
 ('wikidata:page:Q133556:Q9617:1998','Q133556','Q9617','1998','2006','year','year',NULL),
 ('wikidata:page:Q133556:Q9616:2006','Q133556','Q9616','2006','2014','year','year',NULL),
 ('wikidata:page:Q43913:Q9616:2004','Q43913','Q9616','2004','2007','year','year',NULL),
 ('wikidata:page:Q43913:Q15789:2009','Q43913','Q15789','2009','2019','year','year',NULL),
 ('wikidata:page:Q43913:Q8682:2007','Q43913','Q8682','2007','2009','year','year',NULL),
 ('wikidata:page:Q1255625:Q7156:2004','Q1255625','Q7156','2004','2009','year','year',NULL),
 ('wikidata:page:Q1255625:Q631:2009','Q1255625','Q631','2009','2011','year','year',NULL),
 ('wikidata:page:Q1255625:Q9616:2013','Q1255625','Q9616','2013','2014','year','year',NULL),
 ('wikidata:page:Q1255625:Q8682:1997','Q1255625','Q8682','1997','2000','year','year',NULL)
)
insert into footy.external_career_claims(claim_key,provider,player_external_id,club_external_id,
 player_id,club_id,source_url,observed_from,observed_to,from_precision,to_precision,loan_flag,
 team_classification,provenance,review_status)
select r.key,'wikidata',r.player_qid,r.club_qid,p.entity_id,c.entity_id,
'https://www.wikidata.org/wiki/'||r.player_qid||'#P54',r.from_value,r.to_value,r.from_precision,
r.to_precision,r.loan_flag,'senior_candidate','wikidata_page_review','pending'
from reviewed r
join footy.external_entity_links p on p.external_id=r.player_qid and p.provider='wikidata' and p.kind='player'
join footy.external_entity_links c on c.external_id=r.club_qid and c.provider='wikidata' and c.kind='club'
on conflict(claim_key) do nothing;

select count(*) as total_review_staging from footy.external_career_claims;
