import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { Button, Input, Label } from '../components/ui';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { error: showAlertError } = useAlert();
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useUserStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signIn(email, password);
            navigate('/'); // Redirect to home on success
        } catch (err) {
            showAlertError(err.message || 'Failed to sign in', 'Authentication Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-ogene-100">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-serif font-bold tracking-tight text-ogene-900">
                        Welcome back
                    </h2>
                    <p className="mt-2 text-sm text-ogene-600">
                        Sign in to your OGENE account
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
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
                            <div className="flex items-center justify-between mb-1">
                                <Label htmlFor="password">Password</Label>
                                <Link to="/forgot-password" className="text-xs font-medium text-ogene-600 hover:text-ogene-900">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
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
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Sign in
                        </Button>
                    </div>

                    <div className="text-center text-sm">
                        <span className="text-ogene-500">Don't have an account? </span>
                        <Link to="/signup" className="font-medium text-ogene-900 hover:text-ogene-700 underline underline-offset-4">
                            Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
