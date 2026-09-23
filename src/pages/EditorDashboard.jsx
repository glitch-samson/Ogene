import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { StatusBadge } from './MyManuscripts';
import { ClipboardList, GanttChartSquare } from 'lucide-react';

export default function EditorDashboard() {
    const { profile } = useUserStore();
    const isChief = profile?.role === 'chief_editor' || profile?.role === 'admin';
    const [manuscripts, setManuscripts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchManuscripts();
    }, []);

    const fetchManuscripts = async () => {
        try {
            const { data, error } = await supabase
                .from('manuscripts')
                .select('*, author:profiles(full_name)')
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-serif font-bold text-ogene-900 flex items-center gap-3">
                    <ClipboardList size={28} /> Editorial Queue
                </h1>
                {isChief && (
                    <Link to="/editor-overview" className="inline-flex items-center gap-2 text-sm font-semibold text-ogene-900 hover:underline">
                        <GanttChartSquare size={18} /> Pipeline Overview
                    </Link>
                )}
            </div>

            {loading ? (
                <div className="p-20 text-center text-ogene-500">Loading queue...</div>
            ) : manuscripts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-ogene-100 shadow-sm text-ogene-500">
                    No manuscripts have been submitted yet.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden">
                    <ul className="divide-y divide-ogene-100">
                        {manuscripts.map((m) => (
                            <li key={m.id}>
                                <Link
                                    to={`/editor/${m.id}`}
                                    className="p-6 flex items-center justify-between gap-4 hover:bg-ogene-50 transition-colors"
                                >
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-medium text-ogene-900 truncate">{m.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-ogene-400">
                                            <span>By {m.author?.full_name || 'Unknown'}</span>
                                            <span>{m.category || 'Uncategorized'}</span>
                                            <span>Round {m.current_round}</span>
                                            <span>{new Date(m.created_at).toLocaleDateString()}</span>
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
