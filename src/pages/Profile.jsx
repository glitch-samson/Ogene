import React, { useState } from 'react';
import useUserStore from '../store/userStore';
import { supabase } from '../lib/supabase';
import { Button, Input, Label } from '../components/ui';
import { User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
    const { user, profile } = useUserStore();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (error) throw error;
            setMessage('Profile updated successfully!');
        } catch (error) {
            setMessage('Error updating profile: ' + error.message);
        } finally {
            setLoading(false);
        }
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
                        <span className="inline-block mt-2 px-2 py-1 bg-ogene-100 text-ogene-700 text-xs rounded-full font-medium capitalize">
                            {profile?.role || 'User'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6 max-w-md">
                    {message && (
                        <div className={`p-3 rounded text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            {message}
                        </div>
                    )}

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
