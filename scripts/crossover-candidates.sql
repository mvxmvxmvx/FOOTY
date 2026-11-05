-- V14 club crossover question CANDIDATES: for editorial review only.
-- These are lower-bound answers derived from historical *partial* club membership
-- observations. They are NOT comprehensive answer keys for public gameplay.
with club_players as (
 select distinct player_id,club_id from footy.player_club_spells
),
pair_matches as (
 select a.club_id club_a,b.club_id club_b,a.player_id
 from club_players a join club_players b on a.player_id=b.player_id
 where a.club_id < b.club_id
)
select a.name as first_club,b.name as second_club,
 count(*) as observed_matching_players,
 string_agg(p.name,', ' order by p.name) as observed_examples
from pair_matches m
join footy.entities a on a.id=m.club_a
join footy.entities b on b.id=m.club_b
join footy.entities p on p.id=m.player_id
group by a.name,b.name
order by observed_matching_players desc,a.name,b.name;
