import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { Button, Input, Label, Alert } from '../components/ui';
import { Eye, EyeOff, MailCheck } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { success, error: showAlertError } = useAlert();
    const [isLoading, setIsLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const { signUp, user, loading } = useUserStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/library');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-orange"></div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signUp(email, password, fullName);
            setSignupSuccess(true);
            // Optionally still scroll to top if needed
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            showAlertError(err.message || 'Failed to sign up', 'Sign Up Failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (signupSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-dark p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-2xl text-center"
                >
                    <div className="mx-auto w-16 h-16 bg-orange-100 text-brand-orange rounded-full flex items-center justify-center mb-6">
                        <MailCheck size={32} />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-gray-900">Verify your email</h2>
                    <p className="text-gray-600 leading-relaxed mt-2">
                        We've sent a confirmation link to <span className="font-bold text-gray-900">{email}</span>.
                        Please check your inbox and click the link to confirm your account.
                    </p>
                    <div className="pt-6">
                        <Link to="/login">
                            <Button className="w-full h-12 rounded-lg bg-black hover:bg-gray-800 text-white">
                                Return to Login
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: "anticipate" }}
            className="min-h-screen flex items-center justify-center bg-ogene-50 p-4 font-sans"
        >
            {/* Back to Home Button */}
            <Link
                to="/"
                className="fixed top-8 left-8 z-20 flex items-center gap-2 text-white md:text-ogene-900 font-black text-xs uppercase tracking-widest bg-black/20 md:bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 hover:scale-105 transition-all shadow-lg shadow-black/5"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                Home
            </Link>

            <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden flex flex-col md:flex-row min-h-[700px] border border-white">
                {/* Left Side - Premium Visual Storytelling */}
                <div className="w-full md:w-5/12 bg-ogene-900 text-white p-10 md:p-16 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-ogene-800 via-transparent to-ogene-950 opacity-90"></div>

                    {/* Abstract Orbs */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-ogene-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-pulse"></div>
                    <div className="absolute bottom-40 -right-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <img src="/logo.svg" alt="" className="h-8 w-8 brightness-0 invert" />
                            <span className="text-2xl font-serif font-black tracking-tighter">OGENE</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black leading-[1.1] tracking-tight mb-8">
                            Begin your <span className="text-ogene-300 italic">legacy</span> with us.
                        </h1>
                        <p className="text-ogene-200/70 text-lg md:text-xl font-medium max-w-sm leading-relaxed">
                            Access the continent's most profound archives and contribute your own masterpieces.
                        </p>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/10 mt-auto">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {[4, 5, 6].map(i => (
                                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-ogene-900 bg-ogene-800 flex items-center justify-center overflow-hidden`}>
                                        <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="" className="w-full h-full object-cover grayscale opacity-50" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-ogene-300 uppercase tracking-widest">Join 2,000+ Visionaries</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Signup Form */}
                <div className="w-full md:w-7/12 bg-white p-8 md:p-20 flex flex-col justify-center relative">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-10 text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-serif font-black text-ogene-900 mb-3 tracking-tight">Create Account</h2>
                            <p className="text-ogene-500 font-medium">Start your journey as a member of OGENE</p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullname" className="text-ogene-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1">Full Name</Label>
                                    <Input
                                        id="fullname"
                                        name="fullname"
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Ekene Dilichukwu"
                                        className="h-14 bg-ogene-50 border-ogene-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-ogene-900/5 transition-all px-6 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-ogene-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1">Email Address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="scholar@ogene.com"
                                        className="h-14 bg-ogene-50 border-ogene-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-ogene-900/5 transition-all px-6 font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-ogene-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1">Secure Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            minLength={6}
                                            className="h-14 bg-ogene-50 border-ogene-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-ogene-900/5 transition-all px-6 pr-14 font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-ogene-300 hover:text-ogene-900 transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-ogene-400 font-medium ml-1">Must be at least 6 characters long.</p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-ogene-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-ogene-900/20 active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
                                    isLoading={isLoading}
                                >
                                    Create new account
                                </Button>
                            </div>

                            <div className="relative py-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-ogene-100"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-4 text-xs font-bold text-ogene-300 uppercase tracking-widest">Already a member?</span>
                                </div>
                            </div>

                            <div className="text-center">
                                <Link to="/login" className="inline-flex items-center gap-2 group">
                                    <span className="text-sm font-bold text-ogene-500">Welcome back</span>
                                    <span className="h-8 px-4 flex items-center bg-ogene-50 text-ogene-900 text-xs font-black uppercase tracking-widest rounded-full group-hover:bg-ogene-900 group-hover:text-white transition-all">Sign In</span>
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Footer text */}
                    <p className="absolute bottom-8 left-0 right-0 text-center text-[10px] font-bold text-ogene-300 uppercase tracking-[0.3em] px-8">
                        © 2026 OGENE Digital Archives. All Rights Reserved.
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
