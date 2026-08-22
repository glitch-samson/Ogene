import React, { useState } from 'react';
import useUserStore from '../store/userStore';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../lib/supabase';
import { Button, Input, Label } from '../components/ui';
import { User, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

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
                        </div>
                    </div>
                </div>

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
