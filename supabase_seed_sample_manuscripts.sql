-- SAMPLE DATA — for previewing the Pipeline Overview Gantt chart only.
--
-- Inserts 7 fake manuscripts, one per pipeline stage, with backdated history
-- so the timeline bars actually have visible length and varied duration.
-- Every title is prefixed [SAMPLE] so it's unmistakable and easy to remove —
-- see the DELETE statement at the bottom once you're done looking.
--
-- Requires at least one chief_editor profile to already exist. Run in the
-- Supabase SQL editor.

do $$
declare
  chief_id uuid;
  author_id uuid;
  m1 uuid := uuid_generate_v4(); -- Published (full lifecycle)
  m2 uuid := uuid_generate_v4(); -- In Production (ongoing)
  m3 uuid := uuid_generate_v4(); -- Ready for Final Approval
  m4 uuid := uuid_generate_v4(); -- Under Review (ongoing)
  m5 uuid := uuid_generate_v4(); -- Revisions Requested
  m6 uuid := uuid_generate_v4(); -- Submitted (fresh)
  m7 uuid := uuid_generate_v4(); -- Rejected
  now_ts timestamptz := now();
begin
  select id into chief_id from public.profiles where role = 'chief_editor' limit 1;
  if chief_id is null then
    raise exception 'No chief_editor profile exists yet — promote one before running this.';
  end if;

  -- Any other profile stands in as "the author" for every sample. If none
  -- exists besides the chief editor, the chief editor plays both parts —
  -- harmless for a visual demo.
  select id into author_id from public.profiles where id <> chief_id order by created_at limit 1;
  if author_id is null then author_id := chief_id; end if;

  -- Suppress the auto-event-logging triggers for this block only, so we can
  -- write our own backdated manuscript_events history instead of everything
  -- timestamping as "right now".
  alter table public.manuscripts disable trigger log_manuscript_status_event;
  alter table public.manuscript_production_tasks disable trigger log_production_task_event;
  alter table public.manuscript_production_tasks disable trigger reopen_parent_production_task;

  -- 1. Published — full lifecycle, one revision cycle included
  insert into public.manuscripts (id, submitting_author_id, title, abstract, category, status, current_round, created_at, updated_at)
  values (m1, author_id, '[SAMPLE] Climate Adaptation Strategies in West Africa', 'Sample abstract for demo purposes.', 'Environmental Science', 'published', 1, now_ts - interval '45 days', now_ts - interval '2 days');

  insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status, created_at) values
    (m1, author_id, 'submitted', null, 'submitted', now_ts - interval '45 days'),
    (m1, chief_id, 'under_review', 'submitted', 'under_review', now_ts - interval '43 days'),
    (m1, chief_id, 'revisions_requested', 'under_review', 'revisions_requested', now_ts - interval '30 days'),
    (m1, author_id, 'resubmitted', 'revisions_requested', 'resubmitted', now_ts - interval '25 days'),
    (m1, chief_id, 'under_review', 'resubmitted', 'under_review', now_ts - interval '24 days'),
    (m1, chief_id, 'in_production', 'under_review', 'in_production', now_ts - interval '15 days'),
    (m1, chief_id, 'ready_for_final_approval', 'in_production', 'ready_for_final_approval', now_ts - interval '5 days'),
    (m1, chief_id, 'published', 'ready_for_final_approval', 'published', now_ts - interval '2 days');

  -- 2. In Production — ongoing, has an open production task
  insert into public.manuscripts (id, submitting_author_id, title, abstract, category, status, current_round, created_at, updated_at)
  values (m2, author_id, '[SAMPLE] Machine Learning for Crop Yield Prediction', 'Sample abstract for demo purposes.', 'Engineering & Applied Sciences', 'in_production', 1, now_ts - interval '20 days', now_ts - interval '8 days');

  insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status, created_at) values
    (m2, author_id, 'submitted', null, 'submitted', now_ts - interval '20 days'),
    (m2, chief_id, 'under_review', 'submitted', 'under_review', now_ts - interval '18 days'),
    (m2, chief_id, 'in_production', 'under_review', 'in_production', now_ts - interval '8 days');

  insert into public.manuscript_production_tasks (manuscript_id, assigned_to, assigned_by, status, created_at)
  values (m2, chief_id, chief_id, 'open', now_ts - interval '8 days');

  -- 3. Ready for Final Approval — production finished, awaiting the stamp
  insert into public.manuscripts (id, submitting_author_id, title, abstract, category, status, current_round, created_at, updated_at)
  values (m3, author_id, '[SAMPLE] Renewable Microgrids for Rural Electrification', 'Sample abstract for demo purposes.', 'Engineering & Applied Sciences', 'ready_for_final_approval', 1, now_ts - interval '25 days', now_ts - interval '1 days');

  insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status, created_at) values
    (m3, author_id, 'submitted', null, 'submitted', now_ts - interval '25 days'),
    (m3, chief_id, 'under_review', 'submitted', 'under_review', now_ts - interval '23 days'),
    (m3, chief_id, 'in_production', 'under_review', 'in_production', now_ts - interval '12 days'),
    (m3, chief_id, 'ready_for_final_approval', 'in_production', 'ready_for_final_approval', now_ts - interval '1 days');

  -- 4. Under Review — ongoing, one reviewer already completed
  insert into public.manuscripts (id, submitting_author_id, title, abstract, category, status, current_round, created_at, updated_at)
  values (m4, author_id, '[SAMPLE] Urban Housing Policy Reform in Lagos', 'Sample abstract for demo purposes.', 'Social Sciences', 'under_review', 1, now_ts - interval '10 days', now_ts - interval '8 days');

  insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status, created_at) values
    (m4, author_id, 'submitted', null, 'submitted', now_ts - interval '10 days'),
    (m4, chief_id, 'under_review', 'submitted', 'under_review', now_ts - interval '8 days');

  insert into public.manuscript_reviewers (manuscript_id, reviewer_id, round, sequence, assigned_by, status, recommendation, comments_to_author, submitted_at)
  values (m4, chief_id, 1, 1, chief_id, 'completed', 'minor_revisions', 'Sample reviewer comment.', now_ts - interval '3 days');

  -- 5. Revisions Requested — waiting on the author
  insert into public.manuscripts (id, submitting_author_id, title, abstract, category, status, current_round, created_at, updated_at)
  values (m5, author_id, '[SAMPLE] Post-Colonial Literature and Identity', 'Sample abstract for demo purposes.', 'Humanities', 'revisions_requested', 1, now_ts - interval '15 days', now_ts - interval '4 days');

  insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status, created_at) values
    (m5, author_id, 'submitted', null, 'submitted', now_ts - interval '15 days'),
    (m5, chief_id, 'under_review', 'submitted', 'under_review', now_ts - interval '13 days'),
    (m5, chief_id, 'revisions_requested', 'under_review', 'revisions_requested', now_ts - interval '4 days');

  -- 6. Submitted — fresh, awaiting screening
  insert into public.manuscripts (id, submitting_author_id, title, abstract, category, status, current_round, created_at, updated_at)
  values (m6, author_id, '[SAMPLE] Solar-Powered Water Purification Systems', 'Sample abstract for demo purposes.', 'Engineering & Applied Sciences', 'submitted', 1, now_ts - interval '2 days', now_ts - interval '2 days');

  insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status, created_at) values
    (m6, author_id, 'submitted', null, 'submitted', now_ts - interval '2 days');

  -- 7. Rejected — terminal, negative outcome
  insert into public.manuscripts (id, submitting_author_id, title, abstract, category, status, current_round, created_at, updated_at)
  values (m7, author_id, '[SAMPLE] Blockchain Applications in Supply Chain', 'Sample abstract for demo purposes.', 'Engineering & Applied Sciences', 'rejected', 1, now_ts - interval '30 days', now_ts - interval '20 days');

  insert into public.manuscript_events (manuscript_id, actor_id, event_type, from_status, to_status, created_at) values
    (m7, author_id, 'submitted', null, 'submitted', now_ts - interval '30 days'),
    (m7, chief_id, 'under_review', 'submitted', 'under_review', now_ts - interval '28 days'),
    (m7, chief_id, 'rejected', 'under_review', 'rejected', now_ts - interval '20 days');

  alter table public.manuscripts enable trigger log_manuscript_status_event;
  alter table public.manuscript_production_tasks enable trigger log_production_task_event;
  alter table public.manuscript_production_tasks enable trigger reopen_parent_production_task;

  raise notice 'Sample manuscripts inserted — open Pipeline Overview to see them.';
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- SAMPLE PUBLISHED ARTICLES — for previewing the homepage's "Recently
-- Published" section, which only renders when public.articles actually has
-- is_public = true rows. These are separate from the sample manuscripts
-- above: the pipeline manuscripts test the editorial workflow, these test
-- what the public homepage looks like once real work has been published.
--
-- One is linked back to sample manuscript #1 (manuscript_id set) so it also
-- previews the pipeline-published, watermarked/view-only reader path; the
-- rest simulate admin-uploaded articles (manuscript_id null). None of them
-- have a real file attached (file_path is left null) — clicking through to
-- read one will show "Document not found," which is expected for preview
-- data with no actual PDF in storage.
-- ═══════════════════════════════════════════════════════════════════════════
do $$
declare
  author_id uuid;
  sample_manuscript_id uuid;
begin
  select id into author_id from public.profiles order by created_at limit 1;
  select id into sample_manuscript_id from public.manuscripts where title = '[SAMPLE] Climate Adaptation Strategies in West Africa' limit 1;

  insert into public.articles (title, description, author_id, author_name, category, is_public, manuscript_id, created_at) values
    ('[SAMPLE] Climate Adaptation Strategies in West Africa', 'A study of community-led adaptation practices across coastal West African communities facing rising sea levels.', author_id, 'Dr. Amara Nwosu', 'Environmental Science', true, sample_manuscript_id, now() - interval '2 days'),
    ('[SAMPLE] Oral Tradition and Digital Preservation in Yoruba Communities', 'Examining frameworks for digitizing oral history archives while preserving cultural context and authenticity.', author_id, 'Prof. Kwame Asante', 'Humanities', true, null, now() - interval '9 days'),
    ('[SAMPLE] Microfinance Access and Women-Led Enterprises in Rural Benin', 'A quantitative analysis of microfinance program outcomes for women entrepreneurs across five rural communes.', author_id, 'Dr. Fatou Diallo', 'Social Sciences', true, null, now() - interval '16 days'),
    ('[SAMPLE] Low-Cost Water Filtration Using Locally Sourced Materials', 'Design and performance evaluation of a ceramic water filter built from regionally available clay and sawdust.', author_id, 'Eng. Chidi Okafor', 'Engineering & Applied Sciences', true, null, now() - interval '23 days'),
    ('[SAMPLE] Malaria Prevalence Trends in Sub-Saharan Border Regions', 'A five-year retrospective study of malaria incidence and intervention effectiveness in border health districts.', author_id, 'Dr. Ngozi Eze', 'Medicine & Health Sciences', true, null, now() - interval '31 days'),
    ('[SAMPLE] Post-Independence Constitutional Reform in Francophone Africa', 'A comparative legal analysis of constitutional amendments across four Francophone African nations since 1990.', author_id, 'Prof. Jean-Baptiste Kone', 'Social Sciences', true, null, now() - interval '38 days');

  raise notice 'Sample published articles inserted — check the homepage.';
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PLACEHOLDER IMPACT FACTOR
--
-- Everything else on the homepage stats strip (published count, acceptance
-- rate, avg. decision time) is computed for real from the sample data above
-- once journal_stats() is installed (see supabase_migration_journal_stats.sql).
-- Impact factor is different: it isn't something this app can compute at all
-- — real impact factors come from external citation-tracking services
-- (Clarivate, Scopus) this app has no access to. It's read from this table
-- as a manually-set figure instead. This is a clearly-labeled placeholder —
-- replace the value below with a real one whenever the journal has one, by
-- re-running just this UPDATE with a different number.
-- ═══════════════════════════════════════════════════════════════════════════
insert into public.site_settings (key, value)
values ('impact_factor', '2.4')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ═══════════════════════════════════════════════════════════════════════════
-- CLEANUP — run this whenever you're done previewing. Cascades to every
-- related row (files, reviewers, events, production tasks) automatically.
--
--   delete from public.manuscripts where title like '[SAMPLE]%';
--   delete from public.articles where title like '[SAMPLE]%';
--   delete from public.site_settings where key = 'impact_factor';
-- ═══════════════════════════════════════════════════════════════════════════
