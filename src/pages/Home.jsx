import React, { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import { Button, ArticleCard } from '../components/ui';

export default function Home() {
    const { user, profile } = useUserStore();
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && profile) {
            navigate('/library');
        }
    }, [user, profile, navigate]);

    useEffect(() => {
        const fetchArticles = async () => {
            try {
                const { data, error } = await supabase
                    .from('articles')
                    .select('*, profiles(full_name)')
                    .eq('is_public', true)
                    .order('created_at', { ascending: false })
                    .limit(6); // Limit to 6 for the landing page

                if (error) throw error;
                setArticles(data);
            } catch (err) {
                console.error('Error fetching articles:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, []);

    const features = [
        {
            icon: BookOpen,
            title: "Curated Content",
            description: "Access high-quality articles from verified experts in various fields."
        },
        {
            icon: ShieldCheck,
            title: "Secure Payments",
            description: "Support authors directly with our secure Flutterwave integration."
        },
        {
            icon: Zap,
            title: "Instant Access",
            description: "Read immediately in-app or download PDF for offline viewing."
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* HER SECTION */}
            <section className="relative bg-ogene-900 text-white overflow-hidden py-16 lg:py-32">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-ogene-900 via-ogene-900/80 to-transparent"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold mb-6 tracking-tight leading-tight">
                            Voice of the <span className="text-ogene-300">Intellect</span>
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-ogene-200 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
                            Discover deeply researched articles, support independent journalism, and expand your horizons with OGENE.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
                            <Link to="/signup">
                                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full bg-white text-ogene-900 hover:bg-ogene-100 border-none shadow-lg hover:shadow-xl transition-all">
                                    Get Started
                                </Button>
                            </Link>
                            <Link to="#featured">
                                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full border-ogene-700 text-white hover:bg-ogene-800 hover:text-white backdrop-blur-sm">
                                    Browse Articles
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-serif font-bold text-ogene-900 mb-4">Why Choose OGENE?</h2>
                        <div className="h-1 w-20 bg-ogene-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                viewport={{ once: true }}
                                className="text-center p-6 rounded-2xl hover:bg-ogene-50 transition-colors"
                            >
                                <div className="h-16 w-16 bg-ogene-100 text-ogene-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                                    <feature.icon size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-ogene-900 mb-3">{feature.title}</h3>
                                <p className="text-ogene-500 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FEATURED ARTICLES SECTION */}
            <section id="featured" className="py-24 bg-ogene-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h2 className="text-3xl font-serif font-bold text-ogene-900 mb-2">Featured Stories</h2>
                            <p className="text-ogene-500">Latest publications from our top authors.</p>
                        </div>
                        <Link to="/library" className="hidden sm:flex items-center gap-2 text-ogene-700 font-medium hover:text-ogene-900 transition-colors">
                            View All <ArrowRight size={18} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-ogene-500">Loading articles...</div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-20 text-ogene-500 bg-white rounded-xl shadow-sm border border-ogene-100">
                            <p className="text-lg">No articles published yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {articles.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    )}

                    <div className="mt-12 text-center sm:hidden">
                        <Link to="/library">
                            <Button variant="outline" className="w-full">View All Articles</Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 bg-ogene-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-ogene-800 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-ogene-800 rounded-full blur-3xl opacity-50"></div>

                <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
                    <h2 className="text-4xl font-serif font-bold mb-6">Ready to start reading?</h2>
                    <p className="text-xl text-ogene-200 mb-10">
                        Join thousands of readers and support independent voices today.
                    </p>
                    <Link to="/signup">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-ogene-900 hover:bg-ogene-100 font-bold">
                            Create Free Account
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
