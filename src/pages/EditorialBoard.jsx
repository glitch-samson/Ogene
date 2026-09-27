import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users } from 'lucide-react';

export default function EditorialBoard() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBoard();
    }, []);

    const fetchBoard = async () => {
        try {
            const { data, error } = await supabase
                .from('editorial_board')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error('Error fetching editorial board:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-4">Editorial Board</h1>
                <p className="text-lg text-ogene-600">
                    The scholars and editors overseeing Oghene Journal's peer review and publication standards.
                </p>
            </div>

            {loading ? (
                <div className="text-center text-ogene-500 py-20">Loading...</div>
            ) : members.length === 0 ? (
                <div className="text-center py-20 bg-ogene-50 rounded-2xl border border-ogene-100">
                    <Users size={40} className="mx-auto text-ogene-300 mb-4" />
                    <p className="text-ogene-500">Our editorial board listing is being finalized. Check back soon.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {members.map((m) => (
                        <div key={m.id} className="text-center">
                            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-navy-100 border-4 border-white shadow-md mb-4">
                                {m.photo_url ? (
                                    <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-navy-700">
                                        {m.full_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-ogene-900">{m.full_name}</h3>
                            {m.title && <p className="text-sm font-semibold text-gold-600 mb-2">{m.title}</p>}
                            {m.bio && <p className="text-sm text-ogene-500">{m.bio}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
