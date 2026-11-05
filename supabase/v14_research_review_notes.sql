-- Applied 2026-11-04. Review notes are separate from source raw JSON.
alter table footy.research_team_memberships add column if not exists review_note text;
alter table footy.season_player_evidence add column if not exists review_note text;
