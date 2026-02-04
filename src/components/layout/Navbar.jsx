import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import { Menu, X, User } from 'lucide-react';
import { Button } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const { user, profile, signOut } = useUserStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Articles', path: '/articles' },
        { name: 'About Us', path: '/about' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-white border-b border-ogene-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                            <span className="text-3xl font-serif font-bold text-ogene-900 tracking-tighter">OGENE</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:ml-10 md:flex md:space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${isActive(link.path)
                                        ? 'text-ogene-900 border-b-2 border-ogene-900'
                                        : 'text-ogene-500 hover:text-ogene-700 hover:border-b-2 hover:border-ogene-300'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link to="/library">
                                    <Button variant="ghost" className="text-ogene-600">My Library</Button>
                                </Link>
                                <div className="h-8 w-[1px] bg-ogene-200"></div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-ogene-900">{profile?.full_name}</p>
                                        <button onClick={handleSignOut} className="text-xs text-red-500 hover:text-red-700 font-medium text-right w-full">Sign Out</button>
                                    </div>
                                    <Link to="/profile" className="h-10 w-10 bg-ogene-100 rounded-full flex items-center justify-center text-ogene-600 hover:bg-ogene-200 transition-colors">
                                        <User size={20} />
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login">
                                    <Button variant="ghost" className="text-ogene-700 font-medium">Log In</Button>
                                </Link>
                                <Link to="/signup">
                                    <Button className="bg-ogene-900 text-white hover:bg-ogene-800 rounded-full px-6">Get Started</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center md:hidden ml-auto">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-ogene-400 hover:text-ogene-500 hover:bg-ogene-100 focus:outline-none transition-colors"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden fixed inset-0 top-20 z-40 bg-white flex flex-col overflow-hidden"
                    >
                        <div className="px-4 pt-4 pb-10 flex flex-col h-full">
                            <nav className="space-y-2 flex-grow">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={`block px-4 py-4 rounded-xl text-lg font-bold transition-all ${isActive(link.path)
                                            ? 'text-ogene-900 bg-ogene-50'
                                            : 'text-ogene-600 hover:text-ogene-900 hover:bg-ogene-50/50'
                                            }`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </nav>

                            <div className="mt-auto px-2 pt-6 border-t border-ogene-50">
                                {user ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 pt-2 pb-4">
                                            <div className="h-12 w-12 bg-ogene-100 rounded-full flex items-center justify-center text-ogene-600 font-bold">
                                                {profile?.full_name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-ogene-900">{profile?.full_name || 'User'}</p>
                                                <p className="text-xs text-ogene-400 truncate max-w-[200px]">{user.email}</p>
                                            </div>
                                        </div>
                                        <Link to="/library" className="block w-full py-4 text-center rounded-xl bg-ogene-50 text-ogene-700 font-bold" onClick={() => setIsOpen(false)}>
                                            My Library
                                        </Link>
                                        <button onClick={handleSignOut} className="block w-full py-4 text-center text-red-500 font-bold active:scale-[0.98] transition-transform">
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3 pt-4">
                                        <Link to="/signup" className="flex items-center justify-center px-4 py-4 bg-ogene-900 text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-transform" onClick={() => setIsOpen(false)}>
                                            Get Started
                                        </Link>
                                        <Link to="/login" className="flex items-center justify-center px-4 py-4 border border-ogene-200 rounded-xl text-ogene-700 font-bold text-lg" onClick={() => setIsOpen(false)}>
                                            Sign In
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
