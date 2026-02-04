import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { FileText, Download, Calendar } from 'lucide-react';
import { Button } from '../components/ui';

export default function Library() {
    const { user } = useUserStore();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchPurchases();
    }, [user]);

    const fetchPurchases = async () => {
        try {
            // Fetch purchases with article details
            const { data, error } = await supabase
                .from('purchases')
                .select('*, articles(*, profiles(full_name))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPurchases(data);
        } catch (error) {
            console.error('Error fetching library:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-serif font-bold text-ogene-900">My Library</h1>
                <Link to="/">
                    <Button variant="secondary" size="sm">Browse More</Button>
                </Link>
            </div>

            {loading ? (
                <div className="p-20 text-center text-ogene-500">Loading library...</div>
            ) : purchases.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-ogene-100 shadow-sm">
                    <FileText size={48} className="mx-auto text-ogene-300 mb-4" />
                    <h3 className="text-xl font-medium text-ogene-900 mb-2">No articles found</h3>
                    <p className="text-ogene-500 mb-6">You haven't purchased any articles yet.</p>
                    <Link to="/">
                        <Button>Browse Articles</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {purchases.map((purchase) => {
                        const article = purchase.articles;
                        return (
                            <div key={purchase.id} className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="p-6 flex-grow">
                                    <div className="flex items-center gap-2 text-xs text-ogene-400 mb-3">
                                        <Calendar size={14} />
                                        <span>Purchased on {new Date(purchase.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-ogene-900 mb-2 line-clamp-2">
                                        <Link to={`/article/${article.id}`} className="hover:text-blue-600 transition-colors">
                                            {article.title}
                                        </Link>
                                    </h3>
                                    <p className="text-sm text-ogene-500 line-clamp-3 mb-4">{article.description}</p>
                                    <p className="text-xs font-medium text-ogene-400">By {article.profiles?.full_name}</p>
                                </div>
                                <div className="bg-ogene-50 px-6 py-4 border-t border-ogene-100 flex justify-between items-center">
                                    <Link to={`/article/${article.id}`}>
                                        <span className="text-sm font-medium text-ogene-700 hover:text-ogene-900">Read Online</span>
                                    </Link>
                                    <Button size="sm" variant="ghost" onClick={() => window.location.href = `/article/${article.id}`}>
                                        <Download size={16} className="mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
