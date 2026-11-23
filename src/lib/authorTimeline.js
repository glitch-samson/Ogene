import { supabase } from './supabase';

/**
 * An author's manuscript timeline, via author_manuscript_events(): it never
 * returns who performed an event (for a submitted review that would be the
 * reviewer) or review notes, so double-blind review holds.
 *
 * Pass a manuscript id for one manuscript, or nothing for all of the signed-in
 * author's manuscripts.
 *
 * Until supabase_migration_blind_events.sql has been run the function doesn't
 * exist; then this falls back to the old direct read, asking only for the same
 * safe columns.
 */
export async function fetchAuthorTimeline(manuscriptId = null) {
    const result = await supabase.rpc('author_manuscript_events', { p_manuscript_id: manuscriptId });
    if (!result.error || result.error.code !== 'PGRST202') return result;

    let query = supabase
        .from('manuscript_events')
        .select('id, manuscript_id, event_type, from_status, to_status, created_at')
        .order('created_at', { ascending: true });
    if (manuscriptId) query = query.eq('manuscript_id', manuscriptId);
    return query;
}
