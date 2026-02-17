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
        <div className="min-h-screen flex items-center justify-center bg-brand-dark p-4">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                {/* Left Side - Dark with Text */}
                <div className="w-full md:w-1/2 bg-black text-white p-12 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-900/40 via-transparent to-transparent opacity-80 pointer-events-none" />

                    {/* Abstract Light Effect (Simulated) */}
                    <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-orange-600/20 to-transparent blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-orange rounded-full mix-blend-screen filter blur-[100px] opacity-30" />

                    <div className="relative z-10 mt-10">
                        <h1 className="text-4xl md:text-5xl font-sans font-medium leading-tight">
                            Get your research<br />
                            and write-ups in front<br />
                            of Millions of people<br />
                            across the world.
                        </h1>
                    </div>

                    {/* Decorative abstract bars similar to image */}
                    <div className="relative z-10 flex gap-4 mt-auto opacity-80">
                        <div className="w-12 h-64 bg-gradient-to-t from-orange-500/80 to-transparent rounded-t-lg blur-sm transform translate-y-10"></div>
                        <div className="w-16 h-48 bg-gradient-to-t from-orange-400/60 to-transparent rounded-t-lg blur-md transform translate-y-20"></div>
                        <div className="w-8 h-32 bg-gradient-to-t from-orange-300/40 to-transparent rounded-t-lg blur-xl transform translate-y-32"></div>
                    </div>
                </div>

                {/* Right Side - Signup Form */}
                <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        {/* Logo / Brand Icon */}
                        <div className="mb-6">
                            {/* Sun/Spark icon approximation */}
                            <div className="w-10 h-10 text-brand-orange mb-4">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-brand-orange">
                                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-gray-900">Get Started</h2>
                            <p className="text-sm text-gray-500 mt-2">Create your OGENE account now</p>
                        </div>

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="fullname" className="text-gray-400 font-normal text-xs uppercase tracking-wide">Full Name</Label>
                                    <Input
                                        id="fullname"
                                        name="fullname"
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-brand-orange focus:ring focus:ring-brand-orange focus:ring-opacity-20 py-3"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email" className="text-gray-400 font-normal text-xs uppercase tracking-wide">Your email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="hi@ogene.com"
                                        className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-brand-orange focus:ring focus:ring-brand-orange focus:ring-opacity-20 py-3"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <Label htmlFor="password" className="text-gray-400 font-normal text-xs uppercase tracking-wide">Create new password</Label>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••••"
                                            minLength={6}
                                            className="mt-1 block w-full rounded-md border-gray-200 shadow-sm focus:border-brand-orange focus:ring focus:ring-brand-orange focus:ring-opacity-20 py-3 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 pt-1 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-lg shadow-md transition-all duration-200"
                                    isLoading={isLoading}
                                >
                                    Create new account
                                </Button>
                            </div>

                            <div className="text-center text-sm mt-4">
                                <span className="text-gray-500">Already have an account? </span>
                                <Link to="/login" className="font-bold text-black hover:underline">
                                    Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
