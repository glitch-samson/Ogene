import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { Button } from '../components/ui';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Lock, Download, CheckCircle, FileText, Heart } from 'lucide-react';

export default function ArticleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [article, setArticle] = useState(null);
    const [hasPurchased, setHasPurchased] = useState(false);
    const [isFavourite, setIsFavourite] = useState(false);
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
                // 2a. Check Purchase Status
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                if (profile?.role === 'admin') {
                    setHasPurchased(true);
                } else {
                    const { data: purchase } = await supabase
                        .from('purchases')
                        .select('*')
                        .eq('user_id', user.id)
                        .eq('article_id', id)
                        .single();
                    if (purchase) setHasPurchased(true);
                }

                // 2b. Check Favourite Status
                const { data: fav } = await supabase
                    .from('favourites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('article_id', id)
                    .single();
                if (fav) setIsFavourite(true);
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

        if (isFavourite) {
            await supabase.from('favourites').delete().eq('user_id', user.id).eq('article_id', id);
            setIsFavourite(false);
        } else {
            await supabase.from('favourites').insert([{ user_id: user.id, article_id: id }]);
            setIsFavourite(true);
        }
    };

    const handleDownload = async () => {
        if (!article?.file_path) return;

        // Get a signed URL for download
        const { data, error } = await supabase.storage
            .from('articles')
            .createSignedUrl(article.file_path, 60); // 60 seconds validity

        if (error) {
            alert('Error downloading file');
            return;
        }

        window.open(data.signedUrl, '_blank');
    };

    // FLUTTERWAVE CONFIG
    const config = {
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOX-DEMO-KEY-X',
        tx_ref: Date.now(),
        amount: article?.price || 0,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.email || 'guest@ogene.com',
            phone_number: '07000000000',
            name: user?.user_metadata?.full_name || 'Generic User',
        },
        customizations: {
            title: article?.title || 'Article Purchase',
            description: 'Payment for article download',
            logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-log.jpg',
        },
    };

    const handleFlutterwavePayment = useFlutterwave(config);

    const onPayClick = () => {
        if (!user) {
            navigate('/login');
            return;
        }

        handleFlutterwavePayment({
            callback: async (response) => {
                console.log(response);
                closePaymentModal(); // this will close the modal programmatically

                if (response.status === "successful") {
                    // Record Purchase
                    await supabase.from('purchases').insert([
                        {
                            user_id: user.id,
                            article_id: article.id,
                            amount_paid: article.price,
                            transaction_id: response.transaction_id.toString()
                        }
                    ]);
                    setHasPurchased(true);
                    alert("Payment Successful!");
                }
            },
            onClose: () => { },
        });
    };


    if (loading) return <div className="p-20 text-center">Loading article...</div>;
    if (!article) return <div className="p-20 text-center">Article not found.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-sm border border-ogene-100 overflow-hidden">
                <div className="h-64 bg-ogene-900 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                        <div>
                            <div className="flex items-center gap-2 text-ogene-300 text-sm mb-2 font-medium">
                                <span className="bg-white/10 px-2 py-1 rounded backdrop-blur-sm">Premium</span>
                                <span>•</span>
                                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                            </div>
                            <h1 className="text-4xl font-serif font-bold text-white mb-2">{article.title}</h1>
                            <p className="text-ogene-200">By {article.author_name || article.profiles?.full_name || 'Unknown Author'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    <div className="prose prose-lg max-w-none mb-12 text-ogene-700">
                        <h3 className="text-xl font-bold text-ogene-900 mb-4">About this Article</h3>
                        <p>{article.description}</p>
                        <p className="italic text-ogene-500 mt-4">
                            (Preview of the content would go here. Since this is a file-based platform, this description serves as the teaser.)
                        </p>
                    </div>

                    <div className="bg-ogene-50 rounded-xl p-8 border border-ogene-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-ogene-900">
                                {hasPurchased ? <CheckCircle size={24} className="text-green-500" /> : <Lock size={24} />}
                            </div>
                            <div>
                                <p className="text-lg font-bold text-ogene-900">
                                    {hasPurchased ? 'Unlocked' : `Buy Full Article`}
                                </p>
                                <p className="text-sm text-ogene-500">
                                    {hasPurchased ? 'You have full access to this article.' : `Unlock to download and read offline.`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleFavourite}
                                className={`p-3 rounded-full border transition-colors ${isFavourite ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-ogene-200 text-ogene-400 hover:text-red-500'}`}
                            >
                                <Heart size={24} fill={isFavourite ? "currentColor" : "none"} />
                            </button>

                            <div className="flex gap-2">
                                <Button size="lg" onClick={() => navigate(`/read/${id}`)} variant="outline" className="gap-2">
                                    <FileText size={20} />
                                    Read Now
                                </Button>

                                {hasPurchased ? (
                                    <Button size="lg" onClick={handleDownload} className="gap-2">
                                        <Download size={20} />
                                        Download PDF
                                    </Button>
                                ) : (
                                    <Button size="lg" onClick={onPayClick}>
                                        Download (₦{article.price})
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
