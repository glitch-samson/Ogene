import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Moon, Globe, Shield } from 'lucide-react';
import { Button } from '../components/ui';

export default function Settings() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto px-4 py-12"
        >
            <h1 className="text-3xl font-serif font-bold text-ogene-900 mb-8">Settings</h1>

            <div className="space-y-6">
                {/* Section 1 */}
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden">
                    <div className="p-4 border-b border-ogene-100 bg-ogene-50">
                        <h3 className="font-bold text-ogene-900">Preferences</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Moon size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-ogene-900">Dark Mode</p>
                                    <p className="text-sm text-ogene-500">Switch between light and dark themes</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" value="" className="sr-only peer" />
                                <div className="w-11 h-6 bg-ogene-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ogene-900"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-ogene-900">Notifications</p>
                                    <p className="text-sm text-ogene-500">Receive updates about new articles</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-ogene-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ogene-900"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div className="bg-white rounded-xl shadow-sm border border-ogene-100 overflow-hidden">
                    <div className="p-4 border-b border-ogene-100 bg-ogene-50">
                        <h3 className="font-bold text-ogene-900">Account</h3>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-ogene-900">Language</p>
                                    <p className="text-sm text-ogene-500">English (default)</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Change</Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-ogene-900">Security</p>
                                    <p className="text-sm text-ogene-500">Password and authentication</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Manage</Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
