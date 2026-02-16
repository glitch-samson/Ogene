import React, { useState } from 'react';
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
    const { signUp } = useUserStore();
    const navigate = useNavigate();

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
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-ogene-100 text-center"
                >
                    <div className="mx-auto w-16 h-16 bg-ogene-100 text-ogene-600 rounded-full flex items-center justify-center mb-6">
                        <MailCheck size={32} />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-ogene-900">Verify your email</h2>
                    <p className="text-ogene-600 leading-relaxed">
                        We've sent a confirmation link to <span className="font-bold text-ogene-900">{email}</span>.
                        Please check your inbox and click the link to confirm your account.
                    </p>
                    <div className="pt-6">
                        <Link to="/login">
                            <Button className="w-full h-12 rounded-full">
                                Return to Login
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-ogene-100">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-serif font-bold tracking-tight text-ogene-900">
                        Create an account
                    </h2>
                    <p className="mt-2 text-sm text-ogene-600">
                        Join OGENE to read and publish articles
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="fullname">Full Name</Label>
                            <Input
                                id="fullname"
                                name="fullname"
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    minLength={6}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ogene-400 hover:text-ogene-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Button type="submit" className="w-full h-12 rounded-full" isLoading={isLoading}>
                            Sign Up
                        </Button>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-ogene-500">Already have an account? </span>
                        <Link to="/login" className="font-medium text-ogene-900 hover:text-ogene-700 underline underline-offset-4">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
