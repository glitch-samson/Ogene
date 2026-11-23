import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ClipboardList, History, PenLine } from 'lucide-react';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import AuthShell, { PortalInput } from '../components/layout/AuthShell';

const TILES = [
    { icon: ClipboardList, title: 'Continue a submission', text: 'Complete or manage an existing submission' },
    { icon: History, title: 'Track progress', text: 'Find out where your submission is in the review process' },
    { icon: PenLine, title: 'Respond to revisions', text: 'Upload a revised manuscript when the editors ask for changes' },
];

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
            <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" aria-label="Loading" />
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signIn(email, password);
            success('Welcome back to OGENE!', 'Login Successful');
            // No navigate() here — the useEffect above already redirects once
            // `user` populates. Calling navigate('/') here too raced against
            // it, so the page briefly flashed home before landing on /library.
        } catch (err) {
            showAlertError(err.message || 'Failed to sign in', 'Authentication Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell title="Submission Portal" subtitle="Submit, track and manage your work" tiles={TILES}>
            <h2 className="text-center text-2xl text-ogene-900">Login to continue</h2>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <PortalInput
                    id="email"
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                />

                <div>
                    <div className="relative">
                        <PortalInput
                            id="password"
                            label="Password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute bottom-3 right-3 text-navy-500 transition-colors hover:text-navy-800"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <div className="mt-2 flex justify-end">
                        <Link to="/forgot-password" className="text-sm font-semibold text-navy-700 hover:underline underline-offset-4">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-12 w-full items-center justify-center rounded-md bg-navy-800 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-navy-900 disabled:opacity-70"
                >
                    {isLoading ? 'Logging in…' : 'Login'}
                </button>

                <p className="pt-2 text-center text-ogene-600">
                    Don't have an account yet?{' '}
                    <Link to="/signup" className="font-semibold text-navy-700 hover:underline underline-offset-4">Register</Link>
                </p>
            </form>
        </AuthShell>
    );
}
