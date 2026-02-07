import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet, Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import useUserStore from '../../store/userStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { profile, user } = useUserStore();

    return (
        <div className="min-h-screen bg-ogene-50 flex flex-col md:flex-row font-sans">
            {/* Sidebar for Desktop */}
            <Sidebar />

            {/* Mobile Header */}
            <div className="md:hidden bg-white/80 backdrop-blur-md h-16 border-b border-ogene-100 flex items-center justify-between px-4 sticky top-0 z-50">
                <Link to="/" className="text-xl font-serif font-bold text-ogene-900 tracking-tighter">OGENE</Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-ogene-500 hover:bg-ogene-50 rounded-lg transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="md:hidden fixed inset-0 z-40 bg-white pt-20 px-4 flex flex-col pb-10"
                    >
                        <nav className="space-y-2 flex-1 overflow-y-auto">
                            {[
                                { label: 'My Library', path: '/library' },
                                { label: 'Articles', path: '/browse' },
                                { label: 'Favourites', path: '/favourites' },
                                { label: 'Profile', path: '/profile' },
                                { label: 'Settings', path: '/settings' },
                                ...(profile?.role === 'admin' ? [{ label: 'Admin Dashboard', path: '/admin' }] : [])
                            ].map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="block text-lg font-bold text-ogene-700 py-4 px-4 rounded-xl hover:bg-ogene-50 active:bg-ogene-100 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-auto pt-6 border-t border-ogene-50 px-4">
                            <button
                                onClick={() => {
                                    useUserStore.getState().signOut();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full py-4 rounded-xl bg-red-50 text-red-500 font-bold text-center active:scale-[0.98] transition-transform"
                            >
                                Sign Out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-grow">
                    <Outlet />
                </main>

                <footer className="bg-white border-t border-ogene-200">
                    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-serif font-bold text-ogene-900">OGENE</span>
                            </div>
                            <p className="text-sm text-ogene-500">&copy; {new Date().getFullYear()} Ogene Platform. All rights reserved.</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
