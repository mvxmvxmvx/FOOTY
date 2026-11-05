-- Idempotent, as-of 2026-11-04, 2026/27 EPL research snapshot.
-- Factual club membership independently cross-checked; no PL roster dataset imported.
-- Summer transfer examples are only 3 independently reported facts, NOT a full window dataset.
begin;
insert into footy.sources(id,publisher,title,url,license,note) values
('epl_26_27_participants_reference','Premier League / NBC Sports cross-check','2026/27 Premier League club participation',
 'https://www.premierleague.com/en/news/4365156','reference only','Factual club identities cross-checked with independent coverage. No bulk PL site content reused.'),
('fpl_scout_summer_2026','Fantasy Football Scout','2026/27 summer transfer confirmation roundup',
 'https://www.fantasyfootballscout.co.uk/fpl-2026-27-transfer-news-confirmed-summer-signings',
 'factual-reference-only','Three independently cross-checked facts; no transfer table or fee list reproduced.')
on conflict(id) do nothing;
insert into footy.competition_seasons(id,competition_key,season_label,start_year,end_year)
values('epl_2026_27','english_premier_league','2026/27',2026,2027)
on conflict(id) do nothing;
insert into footy.season_snapshots(id,season_id,snapshot_date,phase,status,notes)
values('epl_2026_27_prejan_20261104','epl_2026_27','2026-11-04','pre_january','research',
'Point-in-time checkpoint; cannot claim future Dec 2026 or January 2027 coverage.')
on conflict(id) do nothing;
with clubs(id) as (values
('club_afc_bournemouth'),
('club_arsenal'),
('club_aston_villa'),
('club_brentford'),
('club_brighton_hove_albion'),
('club_chelsea'),
('club_coventry_city'),
('club_crystal_palace'),
('club_everton'),
('club_fulham'),
('club_hull_city'),
('club_ipswich_town'),
('club_leeds_united'),
('club_liverpool'),
('club_manchester_city'),
('club_manchester_united'),
('club_newcastle_united'),
('club_nottingham_forest'),
('club_sunderland'),
('club_tottenham_hotspur')
)
insert into footy.season_club_participants(snapshot_id,club_id,source_id,review_status)
select 'epl_2026_27_prejan_20261104', e.id,'epl_26_27_participants_reference','reviewed'
from clubs c join footy.entities e on e.id=c.id and e.type='club'
on conflict(snapshot_id,club_id) do nothing;
insert into footy.season_game_modes(mode_key,snapshot_id,display_name,question_style,coverage_status,enabled,notes)
values('summer_2026_transfers','epl_2026_27_prejan_20261104','New Transfers — Summer 2026',
'Name a player who joined [club] in summer 2026','incomplete',false,
'Do not enable until reviewed complete transfer window / club coverage.')
on conflict(mode_key) do nothing;
insert into footy.entities(id,type,name) values
('player_bruno_guimaraes','player','Bruno Guimarães'),
('player_ezri_konsa','player','Ezri Konsa'),
('player_james_trafford','player','James Trafford')
on conflict(id) do nothing;
insert into footy.aliases(entity_id,alias) values
('player_bruno_guimaraes','Bruno Guimaraes'),
('player_ezri_konsa','Konsa'),
('player_james_trafford','Trafford')
on conflict do nothing;
insert into footy.season_transfer_events(
 event_key,snapshot_id,player_id,player_label,from_club_id,from_club_label,
 to_club_id,to_club_label,deal_type,announced_on,transfer_window,source_id,source_url,review_status)
values
('epl26summer_bruno_newcastle_arsenal','epl_2026_27_prejan_20261104',
 'player_bruno_guimaraes','Bruno Guimarães','club_newcastle_united','Newcastle United',
 'club_arsenal','Arsenal','permanent','2026-08-08','summer_2026','fpl_scout_summer_2026',
 'https://www.fantasyfootballscout.co.uk/fpl-2026-27-transfer-news-confirmed-summer-signings','pending'),
('epl26summer_konsa_villa_arsenal','epl_2026_27_prejan_20261104',
 'player_ezri_konsa','Ezri Konsa','club_aston_villa','Aston Villa',
 'club_arsenal','Arsenal','permanent','2026-08-21','summer_2026','fpl_scout_summer_2026',
 'https://www.fantasyfootballscout.co.uk/fpl-2026-27-transfer-news-confirmed-summer-signings','pending'),
('epl26summer_trafford_city_leeds','epl_2026_27_prejan_20261104',
 'player_james_trafford','James Trafford','club_manchester_city','Manchester City',
 'club_leeds_united','Leeds United','permanent','2026-08-06','summer_2026','fpl_scout_summer_2026',
 'https://www.fantasyfootballscout.co.uk/fpl-2026-27-transfer-news-confirmed-summer-signings','pending')
on conflict(event_key) do nothing;
commit;
select (select count(*) from footy.season_club_participants where snapshot_id='epl_2026_27_prejan_20261104') as clubs,
 (select count(*) from footy.season_transfer_events where snapshot_id='epl_2026_27_prejan_20261104') as transfer_examples,
 (select count(*) from footy.season_player_evidence where snapshot_id='epl_2026_27_prejan_20261104') as player_candidates,
 (select enabled from footy.season_game_modes where mode_key='summer_2026_transfers') as transfer_mode_enabled;
