import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LibraryBig, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useUserStore from '../../store/userStore';
import { useAlert } from '../../context/AlertContext';
import { cn } from './index';
import { getAuthors, formatAuthorsShort, initials } from '../../lib/authors';

export default function ArticleCard({ article }) {
    const { user } = useUserStore();
    const { success, error: showAlertError } = useAlert();
    const navigate = useNavigate();

    const [isFavourite, setIsFavourite] = useState(false);
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [loading, setLoading] = useState(false);
    const authors = getAuthors(article);

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
            className="bg-white rounded-2xl shadow-sm border border-ogene-100/60 overflow-hidden hover:shadow-xl hover:shadow-ogene-900/5 hover:-translate-y-0.5 transition-all duration-500 group cursor-pointer block h-full flex flex-col relative"
        >
            {/* Action Icons - Compact for smaller cards */}
            <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300">
                <button
                    onClick={toggleLibrary}
                    disabled={loading}
                    className={cn(
                        "p-1.5 rounded-full backdrop-blur-md shadow-md transition-all border",
                        isInLibrary
                            ? "bg-ogene-900 border-ogene-900 text-white"
                            : "bg-white/90 border-white text-ogene-400 hover:text-ogene-900 active:scale-95"
                    )}
                    title={isInLibrary ? "Remove from Library" : "Add to Library"}
                >
                    <LibraryBig size={14} />
                </button>
                <button
                    onClick={toggleFavourite}
                    disabled={loading}
                    className={cn(
                        "p-1.5 rounded-full backdrop-blur-md shadow-md transition-all border",
                        isFavourite
                            ? "bg-rose-500 border-rose-500 text-white"
                            : "bg-white/90 border-white text-ogene-400 hover:text-rose-500 active:scale-95"
                    )}
                    title={isFavourite ? "Remove from Favourites" : "Add to Favourites"}
                >
                    <Heart size={14} fill={isFavourite ? "currentColor" : "none"} />
                </button>
            </div>

            {/* Compact Card Image Area */}
            <div className="h-28 sm:h-36 w-full relative overflow-hidden">
                {article.cover_image ? (
                    <img
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                ) : (
                    <div className="h-full w-full bg-ogene-900 group-hover:bg-ogene-950 transition-colors duration-700 flex items-center justify-center text-ogene-50/10 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-ogene-100/20 via-transparent to-transparent"></div>
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        <span className="font-serif italic text-xl z-10 select-none tracking-[0.2em] transform group-hover:scale-110 transition-transform duration-1000">OGENE</span>
                    </div>
                )}
            </div>

            {/* Compact Content Area */}
            <div className="p-3.5 sm:p-4 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-[8px] font-bold text-ogene-600 uppercase tracking-wider bg-ogene-50/80 px-1.5 py-0.5 rounded border border-ogene-100/50">
                        {article.category || 'Thought'}
                    </div>
                    <span className="text-[9px] text-ogene-400 font-semibold">
                        {new Date(article.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <h3 className="text-sm sm:text-base font-serif font-bold text-ogene-900 mb-1.5 line-clamp-2 leading-tight group-hover:text-ogene-700 transition-colors">
                    {article.title}
                </h3>

                <p className="text-[11px] sm:text-xs text-ogene-500/80 mb-4 line-clamp-2 flex-grow leading-relaxed font-light">
                    {article.description}
                </p>

                <div className="pt-3 border-t border-ogene-50/80 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                        {authors[0]?.avatar_url ? (
                            <img src={authors[0].avatar_url} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover border border-ogene-100" />
                        ) : (
                            <div className="h-6 w-6 shrink-0 rounded-full bg-ogene-50 flex items-center justify-center text-[8px] font-bold text-ogene-700 border border-ogene-100">
                                {initials(authors[0]?.full_name || 'U')}
                            </div>
                        )}
                        <span className="text-[10px] font-bold text-ogene-800 truncate max-w-[120px]" title={formatAuthorsShort(authors, 'Anonymous')}>
                            {formatAuthorsShort(authors, 'Anonymous')}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-ogene-900 group/btn">
                        <span className="text-[8px] font-black tracking-widest transition-all">READ</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
