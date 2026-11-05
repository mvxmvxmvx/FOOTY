-- FOOTY V14: Wikidata identity links and raw career-claim quarantine.
-- This mirrors the migration already applied to Supabase.
-- Never expose this schema to anon or authenticated browser clients.
create table if not exists footy.external_entity_links (
 provider text not null check (provider in ('wikidata')),
 external_id text not null check (external_id ~ '^Q[1-9][0-9]*$'),
 entity_id text not null references footy.entities(id),
 kind text not null check (kind in ('player','club')),
 evidence_url text not null,
 match_method text not null default 'manual_verified',
 review_status text not null default 'confirmed' check (review_status in ('candidate','confirmed','rejected')),
 reviewed_at timestamptz,
 primary key (provider,external_id),
 unique(provider,entity_id)
);
create index if not exists ix_footy_external_entities on footy.external_entity_links(entity_id);
alter table footy.external_entity_links enable row level security;
create table if not exists footy.external_career_claims (
 claim_key text primary key,
 provider text not null check (provider in ('wikidata')),
 player_external_id text not null check (player_external_id ~ '^Q[1-9][0-9]*$'),
 club_external_id text not null check (club_external_id ~ '^Q[1-9][0-9]*$'),
 statement_external_id text,
 player_id text references footy.entities(id),
 club_id text references footy.entities(id),
 source_url text not null,
 observed_from text,
 observed_to text,
 from_precision text not null default 'unknown' check(from_precision in ('unknown','year','month','day')),
 to_precision text not null default 'unknown' check(to_precision in ('unknown','year','month','day')),
 team_classification text not null default 'senior_candidate' check(team_classification in ('senior_candidate','youth','reserve','national_team','unknown')),
 loan_flag boolean,
 provenance text not null check(provenance in ('wikidata_api','wikidata_page_review')),
 raw_claim jsonb,
 review_status text not null default 'pending' check(review_status in ('pending','reviewed','rejected')),
 retrieved_at timestamptz not null default now(),
 constraint external_player_link_check check(player_id is null or player_id like 'player_%'),
 constraint external_club_link_check check(club_id is null or club_id like 'club_%')
);
create index if not exists ix_footy_claim_player on footy.external_career_claims(player_external_id);
create index if not exists ix_footy_claim_club on footy.external_career_claims(club_external_id);
create index if not exists ix_footy_claim_review on footy.external_career_claims(review_status,team_classification);
alter table footy.external_career_claims enable row level security;
revoke all on table footy.external_entity_links,footy.external_career_claims from public,anon,authenticated;
