import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import { Menu, X, User } from 'lucide-react';
import { Button } from '../ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../../context/AlertContext';

export default function Navbar() {
    const { user, profile, signOut } = useUserStore();
    const { success, error: showAlertError } = useAlert();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            success('You have been signed out successfully.', 'Logout');
            navigate('/');
        } catch (err) {
            showAlertError('Failed to sign out. Please try again.');
        }
    };

    // Handle scroll to contact if navigated with state
    useEffect(() => {
        if (location.state?.scrollToContact) {
            const contactSection = document.getElementById('contact-us');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
                // Clear state
                window.history.replaceState({}, document.title);
            }
        }
    }, [location]);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'About Us', path: '/about' },
    ];

    const isActive = (path) => location.pathname === path;

    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrolled]);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-ogene-100 shadow-sm' : 'bg-transparent border-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20 relative">
                    {/* Logo - Left */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/logo.svg" alt="OGENE Logo" className="h-10 w-10" />
                            <span className="text-3xl font-serif font-bold text-ogene-900 tracking-tighter">OGENE</span>
                        </Link>
                    </div>

                    {/* Desktop Nav - Centered */}
                    <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-8">
                        <Link to="/" className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-ogene-900 border-b-2 border-ogene-900' : 'text-ogene-500 hover:text-ogene-700'}`}>
                            Home
                        </Link>
                        <Link to="/about" className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-ogene-900 border-b-2 border-ogene-900' : 'text-ogene-500 hover:text-ogene-700'}`}>
                            About Us
                        </Link>
                        <a href="https://africanuniversitybn.edu.bj/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-ogene-500 hover:text-ogene-700 transition-colors">
                            AUB
                        </a>
                        <a href="#contact-us" onClick={(e) => {
                            e.preventDefault();
                            if (location.pathname !== '/') {
                                navigate('/', { state: { scrollToContact: true } });
                            } else {
                                document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' });
                            }
                        }} className="text-sm font-medium text-ogene-500 hover:text-ogene-700 transition-colors">
                            Contact Us
                        </a>
                    </div>

                    {/* Auth Buttons - Right */}
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
                                <Link to="/" className={`block px-4 py-4 rounded-xl text-lg font-bold transition-all ${isActive('/') ? 'text-ogene-900 bg-ogene-50' : 'text-ogene-600 hover:text-ogene-900 hover:bg-ogene-50/50'}`} onClick={() => setIsOpen(false)}>
                                    Home
                                </Link>
                                <Link to="/about" className={`block px-4 py-4 rounded-xl text-lg font-bold transition-all ${isActive('/about') ? 'text-ogene-900 bg-ogene-50' : 'text-ogene-600 hover:text-ogene-900 hover:bg-ogene-50/50'}`} onClick={() => setIsOpen(false)}>
                                    About Us
                                </Link>
                                <a href="https://africanuniversitybn.edu.bj/" target="_blank" rel="noopener noreferrer" className="block px-4 py-4 rounded-xl text-lg font-bold text-ogene-600 hover:text-ogene-900 hover:bg-ogene-50/50 transition-all" onClick={() => setIsOpen(false)}>
                                    AUB
                                </a>
                                <a href="#contact-us" onClick={(e) => {
                                    e.preventDefault();
                                    setIsOpen(false);
                                    if (location.pathname !== '/') {
                                        navigate('/', { state: { scrollToContact: true } });
                                    } else {
                                        document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }} className="block px-4 py-4 rounded-xl text-lg font-bold text-ogene-600 hover:text-ogene-900 hover:bg-ogene-50/50 transition-all">
                                    Contact Us
                                </a>
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
