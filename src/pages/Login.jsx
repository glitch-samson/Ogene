import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { Button, Input, Label } from '../components/ui';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { success, error: showAlertError } = useAlert();
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, user, loading } = useUserStore();
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
            await signIn(email, password);
            success('Welcome back to OGENE!', 'Login Successful');
            navigate('/'); // Redirect to home on success
        } catch (err) {
            showAlertError(err.message || 'Failed to sign in', 'Authentication Failed');
        } finally {
            setIsLoading(false);
        }
    };

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

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        {/* Logo / Brand Icon */}
                        <div className="mb-8">
                            {/* Sun/Spark icon approximation */}
                            <div className="w-10 h-10 text-brand-orange mb-4">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-brand-orange">
                                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-gray-900">Get Started</h2>
                            <p className="text-sm text-gray-500 mt-2">Welcome to OGENE — Let's get started</p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-5">
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
                                        <Label htmlFor="password" className="text-gray-400 font-normal text-xs uppercase tracking-wide">Password</Label>
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
                                    <div className="flex justify-end mt-2">
                                        <Link to="/forgot-password" className="text-xs font-medium text-gray-500 hover:text-brand-orange">
                                            Forgot password?
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-lg shadow-md transition-all duration-200"
                                    isLoading={isLoading}
                                >
                                    Login to account
                                </Button>
                            </div>

                            <div className="text-center text-sm mt-6">
                                <span className="text-gray-500">Don't have an account? </span>
                                <Link to="/signup" className="font-bold text-black hover:underline">
                                    Sign up
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
