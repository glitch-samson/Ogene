import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { Button, OgeneIcon } from '../components/ui';
import { useAlert } from '../context/AlertContext';
import { Download, CheckCircle, FileText, ArrowLeft, Bookmark } from 'lucide-react';

export default function ArticleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { success, error: showAlertError } = useAlert();
    const [article, setArticle] = useState(null);
    const [isFavourite, setIsFavourite] = useState(false);
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticleAndStatus();
    }, [id, user]);

    const fetchArticleAndStatus = async () => {
        try {
            setLoading(true);
            // 1. Fetch Article
            const { data: art, error: artError } = await supabase
                .from('articles')
                .select('*, profiles(full_name)')
                .eq('id', id)
                .single();

            if (artError) throw artError;
            setArticle(art);

            if (user) {
                // 2a. Check Favourite Status
                const { data: fav } = await supabase
                    .from('favourites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('article_id', id)
                    .maybeSingle();
                if (fav) setIsFavourite(true);

                // 2b. Check Library Status
                const { data: lib } = await supabase
                    .from('library')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('article_id', id)
                    .maybeSingle();
                if (lib) setIsInLibrary(true);
            }
        } catch (error) {
            console.error('Error loading article:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavourite = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            if (isFavourite) {
                await supabase.from('favourites').delete().eq('user_id', user.id).eq('article_id', id);
                setIsFavourite(false);
                success('Removed from favourites', 'Favourites');
            } else {
                await supabase.from('favourites').insert([{ user_id: user.id, article_id: id }]);
                setIsFavourite(true);
                success('Added to favourites', 'Favourites');
            }
        } catch (err) {
            showAlertError('Failed to update favourites');
        }
    };

    const toggleLibrary = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            if (isInLibrary) {
                await supabase.from('library').delete().eq('user_id', user.id).eq('article_id', id);
                setIsInLibrary(false);
                success('Removed from your library', 'Library');
            } else {
                await supabase.from('library').insert([{ user_id: user.id, article_id: id }]);
                setIsInLibrary(true);
                success('Added to your library', 'Library');
            }
        } catch (err) {
            showAlertError('Failed to update library');
        }
    };

    const handleDownload = async () => {
        if (!article?.file_path) return;

        // Get a signed URL for download
        const { data, error } = await supabase.storage
            .from('articles')
            .createSignedUrl(article.file_path, 60); // 60 seconds validity

        if (error) {
            showAlertError('Error generating secure download link');
            return;
        }

        window.open(data.signedUrl, '_blank');
    };


    if (loading) return <div className="p-20 text-center">Loading article...</div>;
    if (!article) return <div className="p-20 text-center">Article not found.</div>;


    return (
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 relative">
            {/* Back Button */}
            <div className="mb-4 md:mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-ogene-600 hover:text-ogene-900 transition-colors p-0 md:px-4"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Catalog</span>
                </Button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-ogene-100 overflow-hidden">
                <div className="h-48 md:h-64 bg-ogene-900 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-6 md:p-10">
                        <div className="w-full">
                            <div className="flex items-center gap-2 text-ogene-300 text-[10px] md:text-xs mb-2 md:mb-3 font-bold uppercase tracking-widest">
                                <span className="px-2 py-0.5 rounded-full bg-white/10 text-ogene-100">
                                    {article.category || 'Article'}
                                </span>
                                <span className="opacity-40">•</span>
                                <span>{new Date(article.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-serif font-bold text-white mb-2 leading-tight">{article.title}</h1>
                            <p className="text-ogene-200/80 text-sm md:text-base font-medium italic">By {article.author_name || article.profiles?.full_name || 'Unknown Author'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 md:p-12">
                    <div className="prose prose-ogene max-w-none mb-10 md:mb-12">
                        <h3 className="text-lg md:text-xl font-bold text-ogene-900 mb-4 border-l-4 border-ogene-600 pl-4">About this Article</h3>
                        <p className="text-ogene-700 leading-relaxed text-sm md:text-base opacity-90">{article.description}</p>
                        <div className="mt-6 p-4 bg-ogene-50/50 rounded-xl border border-ogene-100/50 text-xs md:text-sm italic text-ogene-600">
                            {article.manuscript_id
                                ? 'This article is open access. It is watermarked and available to read on-page only.'
                                : 'This article is open access. You are free to read, download and share it.'}
                        </div>
                    </div>

                    <div className="bg-ogene-50 rounded-2xl p-5 md:p-8 border border-ogene-100 space-y-6 md:space-y-0 md:flex md:items-center md:justify-between md:gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-ogene-900 shrink-0">
                                <CheckCircle size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-base md:text-lg font-bold text-ogene-900">
                                    Open Access
                                </p>
                                <p className="text-xs md:text-sm text-ogene-500">
                                    {article.manuscript_id ? 'Free to read on-page. Watermarked, view-only.' : 'Free to read and download.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={toggleLibrary}
                                    className={`flex-1 md:flex-none p-3.5 md:p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${isInLibrary ? 'bg-ogene-900 border-ogene-900 text-white shadow-md' : 'bg-white border-ogene-200 text-ogene-400 hover:text-ogene-900'}`}
                                    title={isInLibrary ? "Remove from Library" : "Add to Library"}
                                >
                                    <Bookmark size={20} fill={isInLibrary ? "currentColor" : "none"} />
                                    <span className="md:hidden text-xs font-bold uppercase tracking-wider">Library</span>
                                </button>

                                <button
                                    onClick={toggleFavourite}
                                    className={`flex-1 md:flex-none p-3.5 md:p-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${isFavourite ? 'bg-[#78350f] border-[#78350f] text-white shadow-md' : 'bg-white border-ogene-200 text-ogene-400 hover:text-[#78350f]'}`}
                                    title={isFavourite ? "Remove from Favourites" : "Add to Favourites"}
                                >
                                    <OgeneIcon size={20} fill={isFavourite ? "currentColor" : "none"} />
                                    <span className="md:hidden text-xs font-bold uppercase tracking-wider">Favourite</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full md:flex md:w-auto">
                                <Button
                                    size="lg"
                                    onClick={() => navigate(`/read/${id}`)}
                                    variant="outline"
                                    className="flex items-center justify-center gap-2 h-12 md:h-12 rounded-xl text-xs font-bold uppercase tracking-widest"
                                >
                                    <FileText size={18} />
                                    Read
                                </Button>

                                {!article.manuscript_id && (
                                    <Button
                                        size="lg"
                                        onClick={handleDownload}
                                        className="flex items-center justify-center gap-2 h-12 md:h-12 rounded-xl text-xs font-bold uppercase tracking-widest bg-ogene-900 text-white hover:bg-ogene-800"
                                    >
                                        <Download size={18} />
                                        PDF
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
