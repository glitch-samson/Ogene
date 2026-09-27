import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { Button } from '../components/ui';
import { FileText, Plus } from 'lucide-react';

export const STATUS_LABELS = {
    submitted: 'Submitted',
    desk_rejected: 'Desk Rejected',
    under_review: 'Under Review',
    revisions_requested: 'Revisions Requested',
    resubmitted: 'Resubmitted',
    accepted: 'Accepted',
    rejected: 'Rejected',
    published: 'Published',
};

const STATUS_STYLES = {
    submitted: 'bg-ogene-100 text-ogene-700',
    desk_rejected: 'bg-red-100 text-red-700',
    under_review: 'bg-amber-100 text-amber-700',
    revisions_requested: 'bg-orange-100 text-orange-700',
    resubmitted: 'bg-blue-100 text-blue-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    published: 'bg-emerald-100 text-emerald-700',
};

export function StatusBadge({ status }) {
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[status] || 'bg-ogene-100 text-ogene-700'}`}>
            {STATUS_LABELS[status] || status}
        </span>
    );
}

export default function MyManuscripts() {
    const { user } = useUserStore();
    const [manuscripts, setManuscripts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchManuscripts();
    }, [user]);

    const fetchManuscripts = async () => {
        try {
            const { data, error } = await supabase
                .from('manuscripts')
                .select('*')
                .eq('submitting_author_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setManuscripts(data || []);
        } catch (err) {
            console.error('Error fetching manuscripts:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-serif font-bold text-ogene-900">My Manuscripts</h1>
                <Link to="/submit">
                    <Button size="sm"><Plus size={16} className="mr-2" />Submit New</Button>
                </Link>
            </div>

            {loading ? (
                <div className="p-20 text-center text-ogene-500">Loading manuscripts...</div>
            ) : manuscripts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-ogene-100 shadow-sm">
                    <FileText size={48} className="mx-auto text-ogene-300 mb-4" />
                    <h3 className="text-xl font-medium text-ogene-900 mb-2">No manuscripts yet</h3>
                    <p className="text-ogene-500 mb-6">Ready to share your research? Submit your first manuscript.</p>
                    <Link to="/submit">
                        <Button>Submit a Manuscript</Button>
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden">
                    <ul className="divide-y divide-ogene-100">
                        {manuscripts.map((m) => (
                            <li key={m.id}>
                                <Link
                                    to={`/manuscripts/${m.id}`}
                                    className="p-6 flex items-center justify-between gap-4 hover:bg-ogene-50 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-medium text-ogene-900 truncate">{m.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-ogene-400">
                                            <span>{m.category || 'Uncategorized'}</span>
                                            <span>Round {m.current_round}</span>
                                            <span>Submitted {new Date(m.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <StatusBadge status={m.status} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
