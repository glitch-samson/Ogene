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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-serif font-bold text-ogene-900 mb-2">Browse Articles</h1>
                    <p className="text-ogene-500">Explore our collection of writings.</p>
                </div>
                <div className="w-full md:w-96 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ogene-400" size={20} />
                    <Input
                        placeholder="Search articles..."
                        className="pl-10 h-12 rounded-xl border-ogene-200 focus:border-ogene-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-ogene-500">Loading articles...</div>
            ) : filteredArticles.length === 0 ? (
                <div className="text-center py-20 text-ogene-500 bg-white rounded-xl shadow-sm border border-ogene-100">
                    <p className="text-lg">No articles found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            )}
        </div>
    );
}
