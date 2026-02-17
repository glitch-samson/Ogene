import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import useUserStore from '../store/userStore';
import { Button, OgeneIcon } from '../components/ui';
import { useAlert } from '../context/AlertContext';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { Lock, Download, CheckCircle, FileText, ArrowLeft, Bookmark } from 'lucide-react';

export default function ArticleDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useUserStore();
    const { success, error: showAlertError, info, warn } = useAlert();
    const [article, setArticle] = useState(null);
    const [isPremiumMember, setIsPremiumMember] = useState(false);
    const [isFavourite, setIsFavourite] = useState(false);
    const [isInLibrary, setIsInLibrary] = useState(false);
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
                // 2a. Check Premium Membership Status using centralized helper
                const isPremium = useUserStore.getState().isPremiumMember(profile);
                setIsPremiumMember(isPremium);

                // 2b. Check Favourite Status
                const { data: fav } = await supabase
                    .from('favourites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('article_id', id)
                    .single();
                if (fav) setIsFavourite(true);

                // 2c. Check Library Status
                const { data: lib } = await supabase
                    .from('library')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('article_id', id)
                    .single();
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

        // Final security check: Ensure user can download
        if (article.is_premium && !isPremiumMember) {
            warn("Please subscribe to OGENE Premium to download this article.", "Premium Required");
            return;
        }

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
            logo: '/logo.svg',
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

                        success("Welcome to Premium! Your subscription is active for the next 30 days.", "Payment Successful");
                    } catch (err) {
                        console.error('Error recording subscription:', err);
                        showAlertError("Payment was successful, but we had trouble updating your account. Please contact support with your transaction ID: " + response.transaction_id, "Activation Error");
                    } finally {
                        setLoading(false);
                    }
                } else {
                    showAlertError("Payment was not successful. Please try again.", "Payment Failed");
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
                                <span className={`px-2 py-0.5 rounded-full ${article.is_premium ? 'bg-ogene-600 text-white' : 'bg-white/10 text-ogene-100'}`}>
                                    {article.is_premium ? 'Premium' : 'Free'}
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
                    {showGate ? (
                        <div className="py-8 md:py-12 text-center">
                            <div className="max-w-md mx-auto">
                                <div className="h-16 w-16 md:h-20 md:w-20 bg-ogene-50 rounded-full flex items-center justify-center mx-auto mb-6 text-ogene-900 border border-ogene-100 shadow-sm">
                                    <Lock size={28} />
                                </div>
                                <h2 className="text-xl md:text-2xl font-serif font-bold text-ogene-900 mb-3">Premium Required</h2>
                                <p className="text-ogene-500 text-sm md:text-base mb-8 leading-relaxed px-4">
                                    This article is exclusive to OGENE Premium members. Unlock full access to all premium articles for just ₦1,500/month.
                                </p>

                                <div className="space-y-4 px-4">
                                    <Button
                                        size="lg"
                                        className="w-full h-14 text-lg rounded-2xl bg-ogene-900 text-white hover:bg-ogene-800 shadow-xl active:scale-[0.98] transition-all"
                                        onClick={onPayClick}
                                    >
                                        Go Premium — ₦1,500
                                    </Button>
                                    {!user && (
                                        <p className="text-xs md:text-sm text-ogene-400">
                                            Already a member? <button onClick={() => navigate('/login')} className="text-ogene-900 font-bold hover:underline">Sign in</button>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="prose prose-ogene max-w-none mb-10 md:mb-12">
                                <h3 className="text-lg md:text-xl font-bold text-ogene-900 mb-4 border-l-4 border-ogene-600 pl-4">About this Article</h3>
                                <p className="text-ogene-700 leading-relaxed text-sm md:text-base opacity-90">{article.description}</p>
                                {!article.is_premium && (
                                    <div className="mt-6 p-4 bg-ogene-50/50 rounded-xl border border-ogene-100/50 text-xs md:text-sm italic text-ogene-600">
                                        This is a free article. You have full access to view, read, and download.
                                    </div>
                                )}
                            </div>

                            <div className="bg-ogene-50 rounded-2xl p-5 md:p-8 border border-ogene-100 space-y-6 md:space-y-0 md:flex md:items-center md:justify-between md:gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 md:h-12 md:w-12 bg-white rounded-full flex items-center justify-center shadow-sm text-ogene-900 shrink-0">
                                        {!article.is_premium || isPremiumMember ? <CheckCircle size={20} className="text-green-600" /> : <Lock size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-base md:text-lg font-bold text-ogene-900">
                                            {!article.is_premium || isPremiumMember ? 'Full Access Unlocked' : `Premium Content`}
                                        </p>
                                        <p className="text-xs md:text-sm text-ogene-500">
                                            {!article.is_premium || isPremiumMember ? 'Enjoy reading and downloading.' : `Subscribe to OGENE Premium to unlock.`}
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

                                        <Button
                                            size="lg"
                                            onClick={handleDownload}
                                            className="flex items-center justify-center gap-2 h-12 md:h-12 rounded-xl text-xs font-bold uppercase tracking-widest bg-ogene-900 text-white hover:bg-ogene-800"
                                        >
                                            <Download size={18} />
                                            PDF
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
