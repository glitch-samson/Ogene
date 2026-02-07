import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { Button } from '../components/ui';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Lock, Download, CheckCircle, FileText, Heart, ArrowLeft } from 'lucide-react';

export default function ArticleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useUserStore();
    const [article, setArticle] = useState(null);
    const [isPremiumMember, setIsPremiumMember] = useState(false);
    const [isFavourite, setIsFavourite] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticleAndStatus();
    }, [id, user, profile]);

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

            if (user && profile) {
                // 2a. Check Premium Membership Status
                const isPremium = profile.role === 'admin' || (profile.is_premium && profile.premium_until && new Date(profile.premium_until) > new Date());
                setIsPremiumMember(isPremium);

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

        // Final security check: Ensure user can download
        if (article.is_premium && !isPremiumMember) {
            alert("Please subscribe to OGENE Premium to download this article.");
            return;
        }

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

    // FLUTTERWAVE CONFIG FOR SUBSCRIPTION
    const config = {
        public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-SANDBOX-DEMO-KEY-X',
        tx_ref: `OGENE-SUB-${user?.id}-${Date.now()}`,
        amount: 1500,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd',
        customer: {
            email: user?.email || 'guest@ogene.com',
            phone_number: '07000000000',
            name: profile?.full_name || user?.user_metadata?.full_name || 'Generic User',
        },
        customizations: {
            title: 'OGENE Premium Subscription',
            description: 'Monthly access to all premium articles',
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
                console.log('Payment Response:', response);
                closePaymentModal();

                if (response.status === "successful") {
                    setLoading(true);
                    try {
                        const premium_until = new Date();
                        premium_until.setDate(premium_until.getDate() + 30);

                        // 1. Log Subscription
                        const { error: subError } = await supabase.from('subscriptions').insert([
                            {
                                user_id: user.id,
                                amount: 1500,
                                start_date: new Date().toISOString(),
                                end_date: premium_until.toISOString(),
                                transaction_id: response.transaction_id.toString()
                            }
                        ]);

                        if (subError) throw subError;

                        // 2. Update Profile
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .update({
                                is_premium: true,
                                premium_until: premium_until.toISOString()
                            })
                            .eq('id', user.id);

                        if (profileError) throw profileError;

                        setIsPremiumMember(true);
                        // Refresh store to reflect new profile state
                        useUserStore.getState().initialize();

                        alert("Welcome to Premium! Your subscription is active for the next 30 days.");
                    } catch (err) {
                        console.error('Error recording subscription:', err);
                        alert("Payment was successful, but we had trouble updating your account. Please contact support with your transaction ID: " + response.transaction_id);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    alert("Payment was not successful. Please try again.");
                }
            },
            onClose: () => {
                console.log('Payment modal closed');
            },
        });
    };


    if (loading) return <div className="p-20 text-center">Loading article...</div>;
    if (!article) return <div className="p-20 text-center">Article not found.</div>;

    const showGate = article.is_premium && !isPremiumMember;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 relative">
            {/* Back Button */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-ogene-600 hover:text-ogene-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Catalog
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-ogene-100 overflow-hidden">
                <div className="h-64 bg-ogene-900 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-8">
                        <div>
                            <div className="flex items-center gap-2 text-ogene-300 text-sm mb-2 font-medium">
                                <span className={`px-2 py-1 rounded backdrop-blur-sm ${article.is_premium ? 'bg-ogene-600 text-white' : 'bg-white/10 text-ogene-200'}`}>
                                    {article.is_premium ? 'Premium' : 'Free'}
                                </span>
                                <span>•</span>
                                <span>{new Date(article.created_at).toLocaleDateString()}</span>
                            </div>
                            <h1 className="text-4xl font-serif font-bold text-white mb-2">{article.title}</h1>
                            <p className="text-ogene-200">By {article.author_name || article.profiles?.full_name || 'Unknown Author'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    {showGate ? (
                        <div className="py-12 text-center">
                            <div className="max-w-md mx-auto">
                                <div className="h-20 w-20 bg-ogene-50 rounded-full flex items-center justify-center mx-auto mb-6 text-ogene-900 border border-ogene-100 shadow-sm">
                                    <Lock size={32} />
                                </div>
                                <h2 className="text-2xl font-serif font-bold text-ogene-900 mb-4">Premium Membership Required</h2>
                                <p className="text-ogene-500 mb-8 leading-relaxed">
                                    This article is exclusive to OGENE Premium members. Unlock full access to all premium articles for just ₦1,500/month.
                                </p>

                                <div className="space-y-4">
                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg rounded-xl bg-ogene-900 text-white hover:bg-ogene-800 shadow-lg active:scale-[0.98] transition-all"
                                        onClick={onPayClick}
                                    >
                                        Go Premium — ₦1,500/mo
                                    </Button>
                                    {!user && (
                                        <p className="text-sm text-ogene-400">
                                            Already a member? <button onClick={() => navigate('/login')} className="text-ogene-900 font-bold hover:underline">Sign in</button>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="prose prose-lg max-w-none mb-12 text-ogene-700">
                                <h3 className="text-xl font-bold text-ogene-900 mb-4">About this Article</h3>
                                <p>{article.description}</p>
                                {!article.is_premium && (
                                    <p className="italic text-ogene-500 mt-4">
                                        (This is a free article. You have full access to view, read, and download.)
                                    </p>
                                )}
                            </div>

                            <div className="bg-ogene-50 rounded-xl p-8 border border-ogene-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-ogene-900">
                                        {!article.is_premium || isPremiumMember ? <CheckCircle size={24} className="text-green-500" /> : <Lock size={24} />}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-ogene-900">
                                            {!article.is_premium || isPremiumMember ? 'Unlocked' : `Premium Content`}
                                        </p>
                                        <p className="text-sm text-ogene-500">
                                            {!article.is_premium || isPremiumMember ? 'You have full access to this article.' : `Subscribe to OGENE Premium to unlock.`}
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

                                        <Button size="lg" onClick={handleDownload} className="gap-2">
                                            <Download size={20} />
                                            Download PDF
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
