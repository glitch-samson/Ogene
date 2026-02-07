import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { Link } from 'react-router-dom';
import { Heart, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAlert } from '../context/AlertContext';

export default function Favourites() {
    const { user } = useUserStore();
    const { success, error: showAlertError, confirm } = useAlert();
    const [favourites, setFavourites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchFavourites();
    }, [user]);

    const fetchFavourites = async () => {
        try {
            const { data, error } = await supabase
                .from('favourites')
                .select(`
                    id,
                    articles (
                        *,
                        profiles (full_name)
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            setFavourites(data || []);
        } catch (error) {
            console.error('Error fetching favourites:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFavourite = async (favId) => {
        confirm("Remove this article from your favourites?", async () => {
            try {
                const { error } = await supabase.from('favourites').delete().eq('id', favId);
                if (error) throw error;
                setFavourites(prev => prev.filter(f => f.id !== favId));
                success("Removed from favourites");
            } catch (err) {
                showAlertError("Failed to remove favourite");
            }
        }, "Remove Favourite");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-serif font-bold text-ogene-900 mb-8">My Favourites</h1>

            {loading ? (
                <div className="p-20 text-center text-ogene-500">Loading favourites...</div>
            ) : favourites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-ogene-100 shadow-sm">
                    <Heart size={48} className="mx-auto text-ogene-300 mb-4" />
                    <h3 className="text-xl font-medium text-ogene-900 mb-2">No favourites yet</h3>
                    <p className="text-ogene-500 mb-6">Save articles you love to read later.</p>
                    <Link to="/" className="text-ogene-900 font-bold underline">Browse Articles</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favourites.map((fav) => {
                        const article = fav.articles;
                        // Handle case where article might be deleted
                        if (!article) return null;

                        return (
                            <motion.div
                                layout
                                key={fav.id}
                                className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative"
                            >
                                <button
                                    onClick={() => removeFavourite(fav.id)}
                                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                    title="Remove from Favourites"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="h-40 bg-ogene-900 relative group-hover:bg-ogene-800 transition-colors flex items-center justify-center">
                                    <span className="text-white/20 font-serif italic text-2xl">OGENE</span>
                                </div>

                                <div className="p-6 flex-grow">
                                    <h3 className="text-xl font-serif font-bold text-ogene-900 mb-2 line-clamp-2">
                                        <Link to={`/article/${article.id}`} className="hover:text-blue-600 transition-colors">
                                            {article.title}
                                        </Link>
                                    </h3>
                                    <p className="text-sm text-ogene-500 line-clamp-3 mb-4">{article.description}</p>
                                    <p className="text-xs font-medium text-ogene-400">By {article.profiles?.full_name}</p>
                                </div>
                                <div className="bg-ogene-50 px-6 py-4 border-t border-ogene-100 flex justify-between items-center mt-auto">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${article.is_premium ? 'bg-ogene-900 text-white' : 'bg-ogene-100 text-ogene-700'}`}>
                                        {article.is_premium ? 'Premium' : 'Free'}
                                    </span>
                                    <Link to={`/article/${article.id}`}>
                                        <span className="text-sm font-bold text-ogene-900 hover:underline">View Article</span>
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
