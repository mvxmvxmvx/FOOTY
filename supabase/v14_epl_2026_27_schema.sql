-- FOOTY database schema snapshot: 2026/27 Premier League season and transfers.
-- Already applied to connected Supabase via migration v14_epl_2026_27_season_snapshots.
-- This file documents the live schema; it is NOT a separate pending CLI migration.
create table if not exists footy.competition_seasons (
 id text primary key,
 competition_key text not null,
 season_label text not null,
 start_year integer not null,
 end_year integer not null,
 unique(competition_key,season_label),
 check(end_year=start_year+1)
);
create table if not exists footy.season_snapshots (
 id text primary key,
 season_id text not null references footy.competition_seasons(id),
 snapshot_date date not null,
 phase text not null check(phase in ('pre_january','post_january','final')),
 status text not null default 'research' check(status in ('research','reviewed','published')),
 notes text,
 unique(season_id,snapshot_date,phase)
);
create table if not exists footy.season_club_participants (
 snapshot_id text not null references footy.season_snapshots(id),
 club_id text not null references footy.entities(id),
 source_id text not null references footy.sources(id),
 review_status text not null default 'pending' check(review_status in ('pending','reviewed','rejected')),
 primary key(snapshot_id,club_id)
);
create table if not exists footy.season_player_evidence (
 claim_key text primary key,
 snapshot_id text not null references footy.season_snapshots(id),
 club_id text not null references footy.entities(id),
 player_id text references footy.entities(id),
 external_player_id text,
 player_label text not null,
 evidence_type text not null check(evidence_type in ('wikidata_membership','registration','u21_eligibility','competitive_appearance','transfer_announcement')),
 evidence_date date,
 appearances integer check(appearances >= 0),
 source_id text not null references footy.sources(id),
 source_url text not null,
 raw_evidence jsonb,
 rights_basis text not null check(rights_basis in ('cc0','licensed','independently_researched')),
 review_status text not null default 'pending' check(review_status in ('pending','reviewed','rejected')),
 created_at timestamptz not null default now()
);
create index if not exists ix_footy_season_evidence_snapshot on footy.season_player_evidence(snapshot_id,club_id,evidence_type);
create table if not exists footy.season_transfer_events (
 event_key text primary key,
 snapshot_id text not null references footy.season_snapshots(id),
 player_id text references footy.entities(id),
 player_label text not null,
 from_club_id text references footy.entities(id),
 from_club_label text,
 to_club_id text references footy.entities(id),
 to_club_label text not null,
 deal_type text not null check(deal_type in ('permanent','loan','loan_return','free','unknown')),
 announced_on date,
 transfer_window text not null check(transfer_window in ('summer_2026','winter_2027','other')),
 source_id text not null references footy.sources(id),
 source_url text not null,
 review_status text not null default 'pending' check(review_status in ('pending','reviewed','rejected')),
 created_at timestamptz not null default now(),
 check(from_club_id is null or to_club_id is null or from_club_id<>to_club_id)
);
create index if not exists ix_footy_transfer_window on footy.season_transfer_events(snapshot_id,transfer_window,review_status);
create table if not exists footy.season_game_modes (
 mode_key text primary key,
 snapshot_id text not null references footy.season_snapshots(id),
 display_name text not null,
 question_style text not null,
 coverage_status text not null default 'incomplete' check(coverage_status in ('incomplete','reviewed_complete')),
 enabled boolean not null default false,
 notes text,
 check(not enabled or coverage_status='reviewed_complete')
);
alter table footy.competition_seasons enable row level security;
revoke all on footy.competition_seasons from anon,authenticated;
alter table footy.season_snapshots enable row level security;
revoke all on footy.season_snapshots from anon,authenticated;
alter table footy.season_club_participants enable row level security;
revoke all on footy.season_club_participants from anon,authenticated;
alter table footy.season_player_evidence enable row level security;
revoke all on footy.season_player_evidence from anon,authenticated;
alter table footy.season_transfer_events enable row level security;
revoke all on footy.season_transfer_events from anon,authenticated;
alter table footy.season_game_modes enable row level security;
revoke all on footy.season_game_modes from anon,authenticated;
revoke all on schema footy from anon,authenticated;
