import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input, ArticleCard } from '../components/ui';

export default function Articles() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchArticles();
    }, []);

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('articles')
                .select('*, profiles(full_name)')
                .eq('is_public', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setArticles(data);
        } catch (err) {
            console.error('Error fetching articles:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-ogene-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 md:mb-16 gap-8 text-center md:text-left">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-ogene-900 mb-3 tracking-tight">
                            Browse <span className="text-ogene-600">Articles</span>
                        </h1>
                        <p className="text-ogene-500 text-lg font-light tracking-wide">Explore our curated collection of scholarly writings and cultural insights.</p>
                        <div className="h-1 w-20 bg-ogene-600 mt-4 mx-auto md:mx-0 rounded-full opacity-30"></div>
                    </div>

                    <div className="w-full md:w-[450px] relative group">
                        <div className="absolute inset-0 bg-ogene-900/5 rounded-2xl blur-xl group-hover:bg-ogene-900/10 transition-all duration-500"></div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ogene-400 group-focus-within:text-ogene-600 transition-colors" size={22} />
                            <Input
                                placeholder="Search by title, topic or author..."
                                className="pl-12 h-14 rounded-2xl border-white bg-white shadow-sm focus:shadow-xl focus:border-ogene-500/30 transition-all duration-300 text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-ogene-200 border-t-ogene-600 rounded-full animate-spin"></div>
                        <p className="text-ogene-400 font-serif italic animate-pulse">Consulting the archives...</p>
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-24 px-6 bg-white rounded-3xl shadow-sm border border-ogene-100/60 max-w-2xl mx-auto">
                        <div className="bg-ogene-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="text-ogene-200" size={40} />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-ogene-900 mb-2">No matches found</h3>
                        <p className="text-ogene-500 font-light">We couldn't find any articles matching your search. Try different keywords or browse our categories.</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-8 text-ogene-600 font-bold text-sm tracking-widest hover:text-ogene-950 transition-colors"
                        >
                            CLEAR SEARCH
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
                        {filteredArticles.map((article) => (
                            <ArticleCard key={article.id} article={article} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
