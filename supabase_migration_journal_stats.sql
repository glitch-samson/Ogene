-- ONE-TIME MIGRATION — paste this whole file into the Supabase SQL editor and
-- run it. This is the journal_stats() function the new homepage calls for
-- its stats strip (published count, acceptance rate, avg. decision time) —
-- it's already merged into supabase_setup.sql, this is just a clean copy to
-- paste without scrolling. Delete this file once it's run successfully.
--
-- Look for "OGENE: journal_stats() ready." in the output when you run it.

-- ═══════════════════════════════════════════════════════════════════════════
-- PUBLIC JOURNAL STATS (homepage)
--
-- Real, computed numbers for the homepage stats strip — never a fabricated
-- "impact factor" or similar. Acceptance rate and decision time are derived
-- from actual manuscript history; anything that can't be honestly computed
-- (e.g. a citation-based impact factor) belongs in site_settings as a
-- manually-set, clearly-labeled figure instead, not invented here.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.journal_stats()
returns table(published_count bigint, acceptance_rate numeric, avg_decision_days numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.articles where is_public = true) as published_count,
    (
      select round(
        100.0 * count(*) filter (where status in ('in_production', 'ready_for_final_approval', 'published'))
        / nullif(count(*) filter (where status in ('desk_rejected', 'rejected', 'in_production', 'ready_for_final_approval', 'published')), 0)
      , 1)
      from public.manuscripts
    ) as acceptance_rate,
    (
      -- Time from submission to the first post-review status (accept-track or
      -- rejected), not to eventual publish — production time isn't review time.
      select round(avg(extract(epoch from (decided_at - submitted_at)) / 86400)::numeric, 1)
      from (
        select
          manuscript_id,
          min(created_at) filter (where event_type = 'submitted') as submitted_at,
          min(created_at) filter (where to_status in ('desk_rejected', 'rejected', 'in_production', 'ready_for_final_approval', 'published')) as decided_at
        from public.manuscript_events
        group by manuscript_id
      ) decision_times
      where decided_at is not null
    ) as avg_decision_days;
$$;

grant execute on function public.journal_stats() to anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_proc where proname = 'journal_stats') then
    raise exception 'FAIL: journal_stats() function is missing.';
  end if;
  raise notice 'OGENE: journal_stats() ready.';
end $$;
