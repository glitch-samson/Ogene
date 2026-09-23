import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Table2, GanttChartSquare } from 'lucide-react';

// Fixed categorical order, validated for CVD-safe adjacency (dataviz skill,
// references/palette.md) — never reassign or cycle these per stage.
const STAGE_COLORS = {
    submitted: '#2a78d6',
    under_review: '#eb6834',
    revisions_cycle: '#1baf7a',
    in_production: '#eda100',
    ready_for_final_approval: '#e87ba4',
    published: '#008300',
    rejected: '#4a3aa7',
};

const STAGE_LABELS = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    revisions_cycle: 'Revisions Cycle',
    in_production: 'In Production',
    ready_for_final_approval: 'Ready for Final Approval',
    published: 'Published',
    rejected: 'Rejected',
};

const STAGE_ORDER = ['submitted', 'under_review', 'revisions_cycle', 'in_production', 'ready_for_final_approval', 'published', 'rejected'];

function bucketFor(status) {
    if (status === 'submitted') return 'submitted';
    if (status === 'under_review' || status === 'accepted') return 'under_review';
    if (status === 'revisions_requested' || status === 'resubmitted') return 'revisions_cycle';
    if (status === 'in_production') return 'in_production';
    if (status === 'ready_for_final_approval') return 'ready_for_final_approval';
    if (status === 'published') return 'published';
    if (status === 'desk_rejected' || status === 'rejected') return 'rejected';
    return 'submitted';
}

function buildSegments(manuscript, events, now) {
    const statusEvents = events
        .filter(e => e.manuscript_id === manuscript.id && e.to_status)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (statusEvents.length === 0) {
        return [{ bucket: bucketFor(manuscript.status), start: manuscript.created_at, end: now }];
    }

    const segments = [];
    for (let i = 0; i < statusEvents.length; i++) {
        const start = statusEvents[i].created_at;
        const end = i + 1 < statusEvents.length ? statusEvents[i + 1].created_at : now;
        segments.push({ bucket: bucketFor(statusEvents[i].to_status), start, end });
    }
    return segments;
}

function currentHolder(manuscript, reviewers, productionTasks) {
    const status = manuscript.status;

    if (status === 'under_review') {
        const active = reviewers
            .filter(r => r.manuscript_id === manuscript.id && r.round === manuscript.current_round && r.status !== 'completed' && r.status !== 'declined')
            .sort((a, b) => a.sequence - b.sequence)[0];
        if (active) return { holder: active.reviewer?.full_name || 'Reviewer', reason: `Peer review — Reviewer ${active.sequence}, Round ${manuscript.current_round}` };
        return { holder: 'Chief Editor', reason: 'Awaiting review decision' };
    }
    if (status === 'in_production') {
        const openTask = productionTasks.find(t => t.manuscript_id === manuscript.id && t.status === 'open');
        if (openTask) return { holder: openTask.holder?.full_name || 'Editor', reason: openTask.parent_task_id ? 'Redirected for input' : 'Production editing' };
        return { holder: '—', reason: 'Production' };
    }
    if (status === 'revisions_requested') return { holder: 'Author', reason: 'Awaiting revised manuscript' };
    if (status === 'submitted') return { holder: 'Chief Editor', reason: 'Awaiting screening' };
    if (status === 'resubmitted') return { holder: 'Chief Editor', reason: 'Awaiting re-review assignment' };
    if (status === 'ready_for_final_approval') return { holder: 'Chief Editor', reason: 'Awaiting final approval' };
    if (status === 'published') return { holder: '—', reason: 'Published' };
    if (status === 'desk_rejected' || status === 'rejected') return { holder: '—', reason: 'Closed' };
    return { holder: '—', reason: '' };
}

function formatDuration(ms) {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days >= 1) return `${days}d`;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${Math.max(hours, 1)}h`;
}

export default function PipelineOverview() {
    const [manuscripts, setManuscripts] = useState([]);
    const [events, setEvents] = useState([]);
    const [reviewers, setReviewers] = useState([]);
    const [productionTasks, setProductionTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('gantt');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [
                { data: m, error: mErr },
                { data: ev, error: evErr },
                { data: rv, error: rvErr },
                { data: tasks, error: tasksErr },
            ] = await Promise.all([
                supabase.from('manuscripts').select('*, author:profiles(full_name)').order('created_at', { ascending: false }),
                supabase.from('manuscript_events').select('*').order('created_at', { ascending: true }),
                supabase.from('manuscript_reviewers').select('*, reviewer:profiles!reviewer_id(full_name)'),
                supabase.from('manuscript_production_tasks').select('*, holder:profiles!assigned_to(full_name)'),
            ]);

            if (mErr) throw mErr;
            setManuscripts(m || []);
            if (!evErr) setEvents(ev || []);
            if (!rvErr) setReviewers(rv || []);
            if (!tasksErr) setProductionTasks(tasks || []);
        } catch (err) {
            console.error('Error loading pipeline overview:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-20 text-center text-ogene-500">Loading pipeline overview...</div>;

    const now = new Date().toISOString();
    const earliest = manuscripts.length > 0
        ? manuscripts.reduce((min, m) => m.created_at < min ? m.created_at : min, manuscripts[0].created_at)
        : now;
    const rangeMs = Math.max(new Date(now) - new Date(earliest), 1);

    const rows = manuscripts.map(m => {
        const segments = buildSegments(m, events, now);
        const lastSegment = segments[segments.length - 1];
        const { holder, reason } = currentHolder(m, reviewers, productionTasks);
        const timeInStage = new Date(now) - new Date(lastSegment.start);
        const totalElapsed = new Date(now) - new Date(m.created_at);
        return { manuscript: m, segments, holder, reason, timeInStage, totalElapsed };
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link to="/editor" className="inline-flex items-center gap-2 text-sm text-ogene-500 hover:text-ogene-900 mb-6">
                <ArrowLeft size={16} /> Back to Editorial Queue
            </Link>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-serif font-bold text-ogene-900">Pipeline Overview</h1>
                <div className="flex gap-2 bg-white rounded-lg border border-ogene-200 p-1">
                    <button
                        onClick={() => setView('gantt')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${view === 'gantt' ? 'bg-ogene-900 text-white' : 'text-ogene-500'}`}
                    >
                        <GanttChartSquare size={16} /> Timeline
                    </button>
                    <button
                        onClick={() => setView('table')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${view === 'table' ? 'bg-ogene-900 text-white' : 'text-ogene-500'}`}
                    >
                        <Table2 size={16} /> Table
                    </button>
                </div>
            </div>

            {manuscripts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-ogene-100 shadow-sm text-ogene-500">
                    No manuscripts in the pipeline yet.
                </div>
            ) : view === 'gantt' ? (
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 p-6">
                    {/* Legend — identity is never color-alone */}
                    <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-ogene-100">
                        {STAGE_ORDER.map(stage => (
                            <div key={stage} className="flex items-center gap-2 text-xs font-medium text-ogene-600">
                                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                                {STAGE_LABELS[stage]}
                            </div>
                        ))}
                    </div>

                    {/* Date axis */}
                    <div className="flex justify-between text-xs text-ogene-400 mb-2 pl-64">
                        <span>{new Date(earliest).toLocaleDateString()}</span>
                        <span>Today</span>
                    </div>

                    <div className="space-y-5">
                        {rows.map(({ manuscript: m, segments, holder, reason, timeInStage }) => (
                            <div key={m.id} className="flex items-center gap-4">
                                <div className="w-60 flex-shrink-0 min-w-0">
                                    <Link to={`/editor/${m.id}`} className="text-sm font-semibold text-ogene-900 hover:underline truncate block">{m.title}</Link>
                                    <p className="text-xs text-ogene-400 truncate">{m.author?.full_name || 'Unknown'}</p>
                                </div>
                                <div className="flex-1 relative h-6 bg-ogene-50 rounded-full overflow-hidden">
                                    {segments.map((seg, i) => {
                                        const leftPct = Math.max(((new Date(seg.start) - new Date(earliest)) / rangeMs) * 100, 0);
                                        const widthPct = Math.max(((new Date(seg.end) - new Date(seg.start)) / rangeMs) * 100, 0.4);
                                        return (
                                            <div
                                                key={i}
                                                title={`${STAGE_LABELS[seg.bucket]} — ${new Date(seg.start).toLocaleDateString()} to ${seg.end === now ? 'now' : new Date(seg.end).toLocaleDateString()}`}
                                                className="absolute top-0 h-full"
                                                style={{
                                                    left: `${leftPct}%`,
                                                    width: `${widthPct}%`,
                                                    backgroundColor: STAGE_COLORS[seg.bucket],
                                                    marginLeft: i > 0 ? '2px' : 0,
                                                    borderRadius: i === 0 ? '9999px 0 0 9999px' : i === segments.length - 1 ? '0 9999px 9999px 0' : 0,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="w-56 flex-shrink-0 text-xs text-ogene-600">
                                    <span className="font-semibold text-ogene-900">{holder}</span> — {reason}
                                    <div className="text-ogene-400">{formatDuration(timeInStage)} in this stage</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-ogene-50 text-ogene-500 text-xs uppercase">
                            <tr>
                                <th className="text-left px-4 py-3">Manuscript</th>
                                <th className="text-left px-4 py-3">Stage</th>
                                <th className="text-left px-4 py-3">With</th>
                                <th className="text-left px-4 py-3">Why</th>
                                <th className="text-left px-4 py-3">Time in Stage</th>
                                <th className="text-left px-4 py-3">Total Elapsed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ogene-100">
                            {rows.map(({ manuscript: m, holder, reason, timeInStage, totalElapsed }) => (
                                <tr key={m.id} className="hover:bg-ogene-50">
                                    <td className="px-4 py-3">
                                        <Link to={`/editor/${m.id}`} className="font-semibold text-ogene-900 hover:underline">{m.title}</Link>
                                        <p className="text-xs text-ogene-400">{m.author?.full_name || 'Unknown'}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS[bucketFor(m.status)] }} />
                                            {STAGE_LABELS[bucketFor(m.status)]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-ogene-900">{holder}</td>
                                    <td className="px-4 py-3 text-ogene-600">{reason}</td>
                                    <td className="px-4 py-3 text-ogene-600">{formatDuration(timeInStage)}</td>
                                    <td className="px-4 py-3 text-ogene-600">{formatDuration(totalElapsed)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
