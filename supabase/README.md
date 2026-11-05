# FOOTY — Supabase setup

**Connected project:** FOOTY (US West / Oregon), PostgreSQL 17.

The production-oriented football knowledge graph lives in the **private `footy` schema**. Initial seed: 501 entities, 617 answer facts, 39 question templates, 381 aliases, and 37 sources.

## Security
- The `footy` schema has no `anon` or `authenticated` usage grants.
- Row-level security is enabled on all 17 domain tables.
- There are intentionally no public RLS policies. Supabase's security advisor may show informational `rls_enabled_no_policy` notices; this is expected for these private tables.
- Do not put service-role keys or connection passwords in browser JavaScript.
- Expose scoring only through authenticated server endpoints / narrowly scoped RPCs when we build online player accounts.

## Migration and data
`schema.sql` is an idempotent documentation snapshot of the live schema. The source-backed curated seed has been imported already using batched SQL and verified for record counts. It is **not yet the live source of gameplay**; the version-controlled site uses its local `data/curated-bank.json` snapshot until the API integration is complete.

Future player-career, manager, transfer, stadium, kit, and awards records must be checked for source reuse rights, marked pending, and only published to trivia when coverage is reviewed. Do not mistake a partial list for an exhaustive answer key.

## Teaching exercise
In Supabase SQL editor, try:

```sql
select type, count(*) as records
from footy.entities
group by type
order by records desc;

select q.category, count(*) as accepted_answers
from footy.question_templates q
join footy.question_conditions qc on qc.question_id=q.id
join footy.facts f on f.relation_id=qc.relation_id
where q.enabled
group by q.id, q.category
order by accepted_answers desc
limit 10;
```

**Note:** The second query counts fact matches. For intersection questions with multiple conditions, use intersection-aware queries to determine the exact valid-answer count.
