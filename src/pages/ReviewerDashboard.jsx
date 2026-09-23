import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAlert } from '../context/AlertContext';
import { Button } from '../components/ui';
import { ClipboardCheck, Calendar } from 'lucide-react';

const ASSIGNMENT_STATUS_STYLES = {
    invited: 'bg-ogene-100 text-ogene-700',
    accepted: 'bg-blue-100 text-blue-700',
    declined: 'bg-red-100 text-red-700',
    completed: 'bg-emerald-100 text-emerald-700',
};

export default function ReviewerDashboard() {
    const { success, error: showError } = useAlert();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        try {
            // Reads only ever go through this view — it is scoped to the caller's
            // own assignments and never exposes the submitting author's identity.
            const { data, error } = await supabase
                .from('manuscript_review_queue')
                .select('*')
                .order('assigned_at', { ascending: false });

            if (error) throw error;
            setAssignments(data || []);
        } catch (err) {
            console.error('Error fetching review queue:', err);
        } finally {
            setLoading(false);
        }
    };

    const respond = async (assignmentId, status) => {
        setBusyId(assignmentId);
        try {
            const { error } = await supabase
                .from('manuscript_reviewers')
                .update({ status })
                .eq('id', assignmentId);
            if (error) throw error;
            success(status === 'accepted' ? 'Assignment accepted.' : 'Assignment declined.');
            fetchQueue();
        } catch (err) {
            showError('Failed to update assignment: ' + err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-serif font-bold text-ogene-900 mb-8 flex items-center gap-3">
                <ClipboardCheck size={28} /> Review Assignments
            </h1>

            {loading ? (
                <div className="p-20 text-center text-ogene-500">Loading assignments...</div>
            ) : assignments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-ogene-100 shadow-sm text-ogene-500">
                    You have no review assignments right now.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden">
                    <ul className="divide-y divide-ogene-100">
                        {assignments.map((a) => (
                            <li key={a.assignment_id} className="p-6 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className="text-lg font-medium text-ogene-900 truncate">{a.title}</h3>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-ogene-400">
                                        <span>{a.category || 'Uncategorized'}</span>
                                        <span>Round {a.round}</span>
                                        {a.due_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} /> Due {new Date(a.due_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ASSIGNMENT_STATUS_STYLES[a.assignment_status]}`}>
                                        {a.assignment_status}
                                    </span>
                                    {a.assignment_status === 'invited' && (
                                        <>
                                            <Button size="sm" isLoading={busyId === a.assignment_id} onClick={() => respond(a.assignment_id, 'accepted')}>Accept</Button>
                                            <Button size="sm" variant="secondary" isLoading={busyId === a.assignment_id} onClick={() => respond(a.assignment_id, 'declined')}>Decline</Button>
                                        </>
                                    )}
                                    {a.assignment_status === 'accepted' && (
                                        <Link to={`/reviewer/${a.assignment_id}`}>
                                            <Button size="sm">Review</Button>
                                        </Link>
                                    )}
                                    {a.assignment_status === 'completed' && (
                                        <Link to={`/reviewer/${a.assignment_id}`}>
                                            <Button size="sm" variant="ghost">View</Button>
                                        </Link>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
