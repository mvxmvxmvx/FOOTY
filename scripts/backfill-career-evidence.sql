-- FOOTY V14 — reproducible, idempotent curated career evidence backfill
-- Purpose: convert verified, specific club-season squad and European final
-- participation into minimum club membership observations.
-- Not a complete career history. Does NOT imply continuous contracts,
-- signed start dates, fees, loan status, or full-season appearances.
-- Every imported row remains 'pending' for independent coverage review.
-- Apply only to FOOTY's private Supabase "footy" schema.
begin;
with cohorts(relation_id,club_id,season) as (
 values
  ('arsenal_league_0304','club_arsenal','2003-04'),
  ('iconic_leicester_1516','club_leicester_city','2015-16'),
  ('iconic_chelsea_0405','club_chelsea','2004-05'),
  ('iconic_man_city_1112','club_manchester_city','2011-12'),
  ('iconic_liverpool_1920','club_liverpool','2019-20'),
  ('iconic_ajax_1995','club_ajax','1994-95'),
  ('iconic_united_1999','club_manchester_united','1998-99'),
  ('iconic_porto_2004','club_porto','2003-04'),
  ('iconic_liverpool_2005','club_liverpool','2004-05'),
  ('iconic_milan_2005','club_ac_milan','2004-05'),
  ('iconic_barca_2009','club_barcelona','2008-09'),
  ('iconic_inter_2010','club_inter_milan','2009-10'),
  ('iconic_barca_2011','club_barcelona','2010-11'),
  ('iconic_chelsea_2012','club_chelsea','2011-12'),
  ('iconic_bayern_2013','club_bayern_munich','2012-13'),
  ('iconic_dortmund_2013','club_borussia_dortmund','2012-13'),
  ('iconic_real_2017','club_real_madrid','2016-17'),
  ('iconic_liverpool_2019','club_liverpool','2018-19'),
  ('iconic_bayern_2020','club_bayern_munich','2019-20'),
  ('iconic_city_2023','club_manchester_city','2022-23')
),
eligible as (
 select f.entity_id as player_id,c.club_id,c.season,
  (select fs.source_id from footy.fact_sources fs where fs.fact_id=f.id order by fs.source_id limit 1) as source_id
 from cohorts c
 join footy.facts f on f.relation_id=c.relation_id
 join footy.entities e on e.id=f.entity_id and e.type='player'
 join footy.question_conditions qc on qc.relation_id=f.relation_id
 join footy.question_templates qt on qt.id=qc.question_id and qt.confidence='reviewed'
)
insert into footy.player_club_spells(player_id,club_id,season,source_id,review_status)
select distinct e.player_id,e.club_id,e.season,e.source_id,'pending'
from eligible e where e.source_id is not null
 and not exists (
  select 1 from footy.player_club_spells p
  where p.player_id=e.player_id and p.club_id=e.club_id and p.season=e.season
 );
insert into footy.import_batches(source_id,status,record_count,notes)
select null,'partial',287,
'V14 curated squad/final club-season membership evidence, 20 verified source-backed cohorts; no transfer dates inferred, not complete player career spans; scoring disabled.'
where not exists (
 select 1 from footy.import_batches where notes like 'V14 curated squad/final club-season membership evidence%'
);
insert into footy.coverage_reviews(relation_id,scope,status,note)
select null,'V14 football career evidence: 20 source-backed historical squad and UCL-final cohorts','partial',
'Partial membership observations only. Do not generate scored club crossover questions until career coverage and qualifying answer completeness are independently reviewed.'
where not exists (
 select 1 from footy.coverage_reviews
 where scope='V14 football career evidence: 20 source-backed historical squad and UCL-final cohorts'
);
commit;
-- Check counts (as initially observed: 287 membership records, 248 players, 14 clubs)
select count(*) memberships,count(distinct player_id) players,count(distinct club_id) clubs
from footy.player_club_spells;
