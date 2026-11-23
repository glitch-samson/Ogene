import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, MailCheck, Send, History, IdCard } from 'lucide-react';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import AuthShell, { PortalInput } from '../components/layout/AuthShell';

const TILES = [
    { icon: Send, title: 'Submit a manuscript', text: 'Send your research for double-blind peer review' },
    { icon: History, title: 'Track progress', text: 'Follow your submission from screening to publication' },
    { icon: IdCard, title: 'Build your author card', text: 'Show your affiliation, ORCID and LinkedIn on your articles' },
];

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { error: showAlertError } = useAlert();
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
            <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" aria-label="Loading" />
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signUp(email, password, fullName);
            setSignupSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            showAlertError(err.message || 'Failed to sign up', 'Sign Up Failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthShell title="Submission Portal" subtitle="Create an account to submit and track your work" tiles={TILES}>
            {signupSuccess ? (
                <div className="text-center">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-50 text-navy-700">
                        <MailCheck size={28} />
                    </span>
                    <h2 className="mt-5 text-2xl text-ogene-900">Verify your email</h2>
                    <p className="mt-3 leading-relaxed text-ogene-600">
                        We've sent a confirmation link to <span className="font-semibold text-ogene-900">{email}</span>.
                        Click the link in that email to activate your account.
                    </p>
                    <Link
                        to="/login"
                        className="mt-8 flex h-12 w-full items-center justify-center rounded-md bg-navy-800 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-navy-900"
                    >
                        Return to login
                    </Link>
                </div>
            ) : (
                <>
                    <h2 className="text-center text-2xl text-ogene-900">Create your account</h2>

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                        <PortalInput
                            id="fullname"
                            label="Full name"
                            name="fullname"
                            type="text"
                            autoComplete="name"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Ekene Dilichukwu"
                        />

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
                                    autoComplete="new-password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
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
                            <p className="mt-1.5 text-xs text-ogene-500">Must be at least 6 characters long.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex h-12 w-full items-center justify-center rounded-md bg-navy-800 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-navy-900 disabled:opacity-70"
                        >
                            {isLoading ? 'Creating account…' : 'Create account'}
                        </button>

                        <p className="pt-2 text-center text-ogene-600">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-navy-700 hover:underline underline-offset-4">Login</Link>
                        </p>
                    </form>
                </>
            )}
        </AuthShell>
    );
}
