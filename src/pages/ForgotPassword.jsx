import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../lib/supabase';
import { Button, Input, Label } from '../components/ui';

export default function ForgotPassword() {
    const { success, error: showAlertError } = useAlert();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${baseUrl}/update-password`,
            });
            if (error) throw error;
            success('Check your email for the password reset link.', 'Email Sent');
        } catch (err) {
            showAlertError(err.message || 'Failed to send reset email');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-ogene-100">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-serif font-bold tracking-tight text-ogene-900">
                        Reset Password
                    </h2>
                    <p className="mt-2 text-sm text-ogene-600">
                        Enter your email to receive a reset link
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
                    </div>

                    <div>
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Send Reset Link
                        </Button>
                    </div>

                    <div className="text-center text-sm">
                        <Link to="/login" className="font-medium text-ogene-900 hover:text-ogene-700 underline underline-offset-4">
                            Back to Sign In
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
