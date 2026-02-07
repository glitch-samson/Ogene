import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Bookmark } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useUserStore from '../../store/userStore';
import { useAlert } from '../../context/AlertContext';
import { cn } from './index';

export default function ArticleCard({ article }) {
    const { user } = useUserStore();
    const { success, error: showAlertError } = useAlert();
    const navigate = useNavigate();

    const [isFavourite, setIsFavourite] = useState(false);
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            checkStatus();
        }
    }, [user, article.id]);

    const checkStatus = async () => {
        try {
            // Check Favourite
            const { data: fav } = await supabase
                .from('favourites')
                .select('id')
                .eq('user_id', user.id)
                .eq('article_id', article.id)
                .single();
            if (fav) setIsFavourite(true);

            // Check Library
            const { data: lib } = await supabase
                .from('library')
                .select('id')
                .eq('user_id', user.id)
                .eq('article_id', article.id)
                .single();
            if (lib) setIsInLibrary(true);
        } catch (err) {
            // Silently fail for individual status checks
        }
    };

    const toggleFavourite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            if (isFavourite) {
                await supabase.from('favourites').delete().eq('user_id', user.id).eq('article_id', article.id);
                setIsFavourite(false);
                success('Removed from favourites');
            } else {
                await supabase.from('favourites').insert([{ user_id: user.id, article_id: article.id }]);
                setIsFavourite(true);
                success('Added to favourites');
            }
        } catch (err) {
            showAlertError('Failed to update favourites');
        } finally {
            setLoading(false);
        }
    };

    const toggleLibrary = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            if (isInLibrary) {
                await supabase.from('library').delete().eq('user_id', user.id).eq('article_id', article.id);
                setIsInLibrary(false);
                success('Removed from library');
            } else {
                await supabase.from('library').insert([{ user_id: user.id, article_id: article.id }]);
                setIsInLibrary(true);
                success('Added to library');
            }
        } catch (err) {
            showAlertError('Failed to update library');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Link
            to={`/article/${article.id}`}
            className="bg-white rounded-2xl shadow-sm border border-ogene-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer block h-full flex flex-col relative"
        >
            {/* Action Icons */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={toggleLibrary}
                    disabled={loading}
                    className={cn(
                        "p-2 rounded-full backdrop-blur-md shadow-lg transition-all border",
                        isInLibrary
                            ? "bg-ogene-900 border-ogene-900 text-white"
                            : "bg-white/80 border-white text-ogene-400 hover:text-ogene-900"
                    )}
                    title={isInLibrary ? "Remove from Library" : "Add to Library"}
                >
                    <Bookmark size={18} fill={isInLibrary ? "currentColor" : "none"} />
                </button>
                <button
                    onClick={toggleFavourite}
                    disabled={loading}
                    className={cn(
                        "p-2 rounded-full backdrop-blur-md shadow-lg transition-all border",
                        isFavourite
                            ? "bg-red-500 border-red-500 text-white"
                            : "bg-white/80 border-white text-ogene-400 hover:text-red-500"
                    )}
                    title={isFavourite ? "Remove from Favourites" : "Add to Favourites"}
                >
                    <Heart size={18} fill={isFavourite ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Card Image Area */}
            <div className="h-48 bg-ogene-900 w-full group-hover:bg-ogene-800 transition-colors flex items-center justify-center text-ogene-50/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
                <span className="font-serif italic text-2xl z-10 select-none tracking-widest">OGENE</span>

                {article.is_premium && (
                    <div className="absolute bottom-4 left-4 z-10 px-2 py-1 bg-ogene-900/40 backdrop-blur-md border border-white/10 rounded text-[10px] font-bold text-white uppercase tracking-widest">
                        Premium
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-5 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold text-ogene-500 uppercase tracking-widest bg-ogene-50 px-2 py-1 rounded">
                        {article.category || 'Opinion'}
                    </div>
                    <span className="text-[10px] text-ogene-400 font-medium">
                        {new Date(article.created_at).toLocaleDateString()}
                    </span>
                </div>

                <h3 className="text-lg font-serif font-bold text-ogene-900 mb-2 line-clamp-2 group-hover:text-ogene-700 transition-colors">
                    {article.title}
                </h3>

                <p className="text-xs text-ogene-500 mb-6 line-clamp-3 flex-grow leading-relaxed italic">
                    {article.description}
                </p>

                <div className="pt-4 border-t border-ogene-50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-ogene-100 flex items-center justify-center text-[10px] font-bold text-ogene-600 border border-ogene-200">
                            {(article.author_name?.[0] || article.profiles?.full_name?.[0] || 'U')}
                        </div>
                        <span className="text-[10px] font-bold text-ogene-600 truncate max-w-[100px]">
                            {article.author_name || article.profiles?.full_name || 'Unknown Author'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-ogene-900">READ MORE</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
