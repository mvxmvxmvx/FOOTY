-- V14 global club-membership research archive. Applied via Supabase migration
-- v14_global_research_team_memberships on 2026-11-04.
-- Import snapshot != player appearance season. No records publish to scored trivia.
create table if not exists footy.research_team_memberships (
 observation_key text primary key,
 provider text not null check(provider in ('wikidata')),
 statement_uri text not null,
 player_external_id text not null check(player_external_id ~ '^Q[1-9][0-9]*$'),
 team_external_id text not null check(team_external_id ~ '^Q[1-9][0-9]*$'),
 player_label text not null,
 local_team_id text references footy.entities(id),
 source_id text not null references footy.sources(id),
 source_url text not null,
 claimed_from_raw text,
 claimed_to_raw text,
 raw_evidence jsonb not null,
 collection_snapshot_id text references footy.season_snapshots(id),
 review_status text not null default 'pending' check(review_status in ('pending','reviewed','rejected')),
 collected_at timestamptz not null default now(),
 reviewed_at timestamptz,
 review_note text,
 unique(provider,statement_uri),
 check(raw_evidence->>'team_qid'=team_external_id)
);
create index if not exists ix_footy_research_team_player on footy.research_team_memberships(provider,player_external_id);
create index if not exists ix_footy_research_team_team on footy.research_team_memberships(provider,team_external_id,review_status);
alter table footy.research_team_memberships enable row level security;
revoke all on footy.research_team_memberships from anon,authenticated;
revoke all on schema footy from anon,authenticated;
