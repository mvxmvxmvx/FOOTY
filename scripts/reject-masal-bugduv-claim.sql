-- A deliberate source-integrity test: fictional "player" Masal Bugduv.
-- The original P54 claim remains preserved; it must NEVER qualify for scoring.
-- Research references:
-- https://www.irishtimes.com/sport/soccer/football-transfer-speculation-the-original-fake-news-1.3156950
-- https://www.independent.ie/sport/soccer/silly-season-how-a-figment-of-an-irish-journalists-imagination-made-it-on-to-the-times-top-50-most-wanted-young-players/35999638.html
begin;
update footy.research_team_memberships
 set review_status='rejected',
 review_note='Known fictional footballer Masal Bugduv (Q6782491); 2008 media hoax, no actual Arsenal playing record. Sources: The Irish Times (2017), Irish Independent (2017).',
 reviewed_at=coalesce(reviewed_at,now())
where provider='wikidata' and player_external_id='Q6782491' and review_status='pending';
update footy.season_player_evidence
 set review_status='rejected',
 review_note='Known fictional footballer Masal Bugduv (Q6782491); 2008 media hoax. Sources: The Irish Times (2017), Irish Independent (2017).'
where external_player_id='Q6782491'
 and evidence_type='wikidata_membership'
 and review_status='pending';
commit;
select review_status,count(*) from footy.research_team_memberships group by review_status;
