import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { FileText, Download, Calendar, Trash2 } from 'lucide-react';
import { Button } from '../components/ui';
import { useAlert } from '../context/AlertContext';

export default function Library() {
    const { user } = useUserStore();
    const { success, error: showAlertError, confirm } = useAlert();
    const [libraryItems, setLibraryItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchLibrary();
    }, [user]);

    const fetchLibrary = async () => {
        try {
            const { data, error } = await supabase
                .from('library')
                .select('*, articles(*, profiles(full_name))')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLibraryItems(data || []);
        } catch (error) {
            console.error('Error fetching library:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromLibrary = async (id) => {
        confirm("Are you sure you want to remove this article from your library?", async () => {
            try {
                const { error } = await supabase.from('library').delete().eq('id', id);
                if (error) throw error;
                setLibraryItems(prev => prev.filter(item => item.id !== id));
                success("Removed from library");
            } catch (err) {
                showAlertError("Failed to remove article");
            }
        }, "Remove Article");
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
            ) : libraryItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-ogene-100 shadow-sm">
                    <FileText size={48} className="mx-auto text-ogene-300 mb-4" />
                    <h3 className="text-xl font-medium text-ogene-900 mb-2">Your library is empty</h3>
                    <p className="text-ogene-500 mb-6">Explore articles and bookmark them to build your personal library.</p>
                    <Link to="/articles">
                        <Button>Browse Articles</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {libraryItems.map((item) => {
                        const article = item.articles;
                        if (!article) return null;
                        return (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col group relative">
                                <button
                                    onClick={() => removeFromLibrary(item.id)}
                                    className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm text-ogene-400 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                    title="Remove from Library"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <div className="p-6 flex-grow">
                                    <div className="flex items-center gap-2 text-xs text-ogene-400 mb-3">
                                        <Calendar size={14} />
                                        <span>Saved on {new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-ogene-900 mb-2 line-clamp-2">
                                        <Link to={`/article/${article.id}`} className="hover:text-ogene-600 transition-colors">
                                            {article.title}
                                        </Link>
                                    </h3>
                                    <p className="text-sm text-ogene-500 line-clamp-3 mb-4">{article.description}</p>
                                    <p className="text-xs font-medium text-ogene-400">By {article.profiles?.full_name || 'Unknown'}</p>
                                </div>
                                <div className="bg-ogene-50 px-6 py-4 border-t border-ogene-100 flex justify-between items-center mt-auto">
                                    <Link to={`/article/${article.id}`}>
                                        <span className="text-sm font-bold text-ogene-900 hover:underline">Read Now</span>
                                    </Link>
                                    <Link to={`/article/${article.id}#download`}>
                                        <Button size="sm" variant="ghost" className="text-ogene-600">
                                            <Download size={16} className="mr-2" />
                                            Get PDF
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
