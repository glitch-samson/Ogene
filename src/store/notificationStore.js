import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { fetchAuthorTimeline } from '../lib/authorTimeline';

// Notifications are derived from activity the database already records —
// manuscript status changes (manuscript_events), review invitations
// (manuscript_reviewers) and the editorial queue — not a separate table.
// "Read" is a per-browser timestamp: anything newer than it counts as unread.

const STATUS_COPY = {
    submitted: ['Submission received', 'was received and is waiting for editorial screening.'],
    under_review: ['Under peer review', 'has been sent out for peer review.'],
    revisions_requested: ['Revisions requested', 'needs revisions — the editors have asked for changes.'],
    resubmitted: ['Revision received', 'was resubmitted and is back with the editors.'],
    accepted: ['Manuscript accepted', 'has been accepted for publication.'],
    in_production: ['In production', 'is being prepared for publication.'],
    ready_for_final_approval: ['Final approval', 'is awaiting final approval before publication.'],
    published: ['Article published', 'has been published and is now open access.'],
    rejected: ['Editorial decision', 'was not accepted for publication.'],
    desk_rejected: ['Editorial decision', 'was not sent to peer review.'],
};

const STAFF_ROLES = ['editor', 'chief_editor', 'admin'];
const quote = (title) => `“${title}”`;

async function authorNotifications(userId) {
    const { data: mine, error } = await supabase
        .from('manuscripts')
        .select('id, title, published_article_id')
        .eq('submitting_author_id', userId);
    if (error) throw error;
    if (!mine?.length) return [];

    const byId = new Map(mine.map((m) => [m.id, m]));
    // Double-blind-safe timeline (no actor ids or review notes).
    const { data: events, error: evError } = await fetchAuthorTimeline();
    if (evError) throw evError;

    return (events || [])
        .filter((e) => byId.has(e.manuscript_id) && e.to_status && STATUS_COPY[e.to_status])
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50)
        .map((e) => {
            const m = byId.get(e.manuscript_id);
            const [title, sentence] = STATUS_COPY[e.to_status];
            return {
                id: `event-${e.id}`,
                kind: e.to_status === 'published' ? 'published' : 'manuscript',
                title,
                body: `Your manuscript ${quote(m?.title || 'Untitled')} ${sentence}`,
                date: e.created_at,
                link: e.to_status === 'published' && m?.published_article_id
                    ? `/article/${m.published_article_id}`
                    : `/manuscripts/${e.manuscript_id}`,
            };
        });
}

async function reviewerNotifications(userId) {
    const [queue, assignments] = await Promise.all([
        supabase
            .from('manuscript_review_queue')
            .select('assignment_id, title, due_date, assignment_status')
            .eq('assignment_status', 'invited'),
        supabase
            .from('manuscript_reviewers')
            .select('id, assigned_at')
            .eq('reviewer_id', userId)
            .eq('status', 'invited'),
    ]);
    if (queue.error) throw queue.error;
    const assignedAt = new Map((assignments.data || []).map((a) => [a.id, a.assigned_at]));

    return (queue.data || []).map((r) => ({
        id: `review-${r.assignment_id}`,
        kind: 'review',
        title: 'Review invitation',
        body: `You've been invited to review ${quote(r.title)}${r.due_date ? `, due ${new Date(r.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}.`,
        date: assignedAt.get(r.assignment_id) || r.due_date || new Date(0).toISOString(),
        link: `/reviewer/${r.assignment_id}`,
    }));
}

async function editorNotifications(role) {
    const statuses = ['submitted', 'resubmitted'];
    if (role === 'chief_editor' || role === 'admin') statuses.push('ready_for_final_approval');

    const { data, error } = await supabase
        .from('manuscripts')
        .select('id, title, status, updated_at, created_at')
        .in('status', statuses)
        .order('updated_at', { ascending: false })
        .limit(30);
    if (error) throw error;

    return (data || []).map((m) => ({
        id: `queue-${m.id}-${m.status}`,
        kind: 'editorial',
        title: m.status === 'ready_for_final_approval' ? 'Awaiting final approval' : 'Awaiting screening',
        body: m.status === 'ready_for_final_approval'
            ? `${quote(m.title)} is ready for your final approval.`
            : `${quote(m.title)} is waiting for editorial screening.`,
        date: m.updated_at || m.created_at,
        link: `/editor/${m.id}`,
    }));
}

async function fetchNotifications(user, profile) {
    const role = profile?.role;
    const sources = [authorNotifications(user.id)];
    if (role === 'reviewer' || role === 'admin') sources.push(reviewerNotifications(user.id));
    if (STAFF_ROLES.includes(role)) sources.push(editorNotifications(role));

    // One failing source (e.g. a role without access) shouldn't hide the rest.
    const results = await Promise.allSettled(sources);
    results.filter((r) => r.status === 'rejected').forEach((r) => console.error('Notifications:', r.reason));

    const seen = new Set();
    return results
        .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
        .filter((n) => (seen.has(n.id) ? false : seen.add(n.id)))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 60);
}

const seenKey = (userId) => `ogene:notifications-seen:${userId}`;

export function readLastSeen(userId) {
    try {
        return localStorage.getItem(seenKey(userId));
    } catch {
        return null;
    }
}

export const isUnread = (item, lastSeen) => !lastSeen || new Date(item.date) > new Date(lastSeen);

const useNotificationStore = create((set, get) => ({
    items: [],
    status: 'idle', // idle | loading | ready | error
    userId: null,
    lastSeen: null,

    load: async (user, profile, { force = false } = {}) => {
        if (!user) {
            set({ items: [], status: 'idle', userId: null, lastSeen: null });
            return;
        }
        const state = get();
        if (state.userId === user.id && (state.status === 'loading' || (state.status === 'ready' && !force))) return;

        set({ status: 'loading', userId: user.id, lastSeen: readLastSeen(user.id) });
        try {
            const items = await fetchNotifications(user, profile);
            if (get().userId === user.id) set({ items, status: 'ready' });
        } catch (err) {
            console.error('Error loading notifications:', err);
            if (get().userId === user.id) set({ status: 'error' });
        }
    },

    markAllRead: () => {
        const { userId } = get();
        if (!userId) return;
        const now = new Date().toISOString();
        try {
            localStorage.setItem(seenKey(userId), now);
        } catch {
            // storage unavailable — unread state just won't persist
        }
        set({ lastSeen: now });
    },
}));

/** Number of notifications newer than the last time the list was opened. */
export function useUnreadCount() {
    return useNotificationStore((s) => s.items.filter((i) => isUnread(i, s.lastSeen)).length);
}

export default useNotificationStore;
