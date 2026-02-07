import React, { useState } from 'react';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../lib/supabase';
import { Button, Input, Label } from '../components/ui';
import { User, Mail, Crown, Star, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

export default function Profile() {
    const { user, profile } = useUserStore();
    const { success, error: showAlertError } = useAlert();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (error) throw error;
            success('Your profile has been updated successfully.');
        } catch (err) {
            showAlertError(err.message || 'Error updating profile');
        } finally {
            setLoading(false);
        }
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
            name: fullName || profile?.full_name || user?.user_metadata?.full_name || 'Generic User',
        },
        customizations: {
            title: 'OGENE Premium Subscription',
            description: 'Monthly access to all premium articles',
            logo: '/logo.svg',
        },
    };

    const handleFlutterwavePayment = useFlutterwave(config);

    const onPayClick = () => {
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
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto px-4 py-12"
        >
            <h1 className="text-3xl font-serif font-bold text-ogene-900 mb-8">My Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden p-8">
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-24 w-24 rounded-full bg-ogene-200 flex items-center justify-center text-3xl font-bold text-ogene-600">
                        {(fullName || user?.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-ogene-900">{fullName || 'User'}</h2>
                        <p className="text-ogene-500 flex items-center gap-2 mt-1">
                            <Mail size={14} />
                            {user?.email}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="px-2 py-1 bg-ogene-100 text-ogene-700 text-xs rounded-full font-medium capitalize">
                                {profile?.role || 'User'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full font-bold flex items-center gap-1 ${profile?.is_premium ? 'bg-ogene-900 text-white shadow-sm' : 'bg-ogene-50 text-ogene-400 border border-ogene-100'}`}>
                                {profile?.is_premium ? (
                                    <>
                                        <Star size={12} fill="currentColor" />
                                        Premium Member
                                    </>
                                ) : (
                                    'Free Account'
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {profile?.is_premium && profile?.premium_until && (
                    <div className="mb-8 p-4 bg-ogene-50 rounded-xl border border-ogene-100 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-ogene-600 shadow-sm">
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-ogene-500 font-medium uppercase tracking-wider">Subscription Renews On</p>
                            <p className="text-ogene-900 font-bold">{new Date(profile.premium_until).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                        </div>
                    </div>
                )}

                {!profile?.is_premium && profile?.role !== 'admin' && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-ogene-900 to-ogene-800 rounded-xl text-white shadow-lg overflow-hidden relative group">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Crown className="text-ogene-300" size={24} />
                                <h3 className="text-xl font-serif font-bold">Try OGENE Premium</h3>
                            </div>
                            <p className="text-ogene-100 mb-6 max-w-sm">
                                Unlock all premium articles and support authors for just ₦1,500/month.
                            </p>
                            <Button
                                onClick={onPayClick}
                                className="bg-white text-ogene-900 hover:bg-ogene-50 border-none font-bold"
                                isLoading={loading}
                            >
                                Get Started
                            </Button>
                        </div>
                    </div>
                )}
                <form onSubmit={handleUpdate} className="space-y-6 max-w-md">
                    <div>
                        <Label htmlFor="fullname">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-ogene-400" size={18} />
                            <Input
                                id="fullname"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="pl-10"
                                placeholder="Your full name"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-ogene-400" size={18} />
                            <Input
                                id="email"
                                value={user?.email}
                                disabled
                                className="pl-10 bg-ogene-50 cursor-not-allowed"
                            />
                        </div>
                        <p className="text-xs text-ogene-400 mt-1">Email cannot be changed.</p>
                    </div>

                    <Button type="submit" isLoading={loading}>
                        Save Changes
                    </Button>
                </form>
            </div>
        </motion.div>
    );
}
