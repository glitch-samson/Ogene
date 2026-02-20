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
        <nav
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 w-[calc(100%-2rem)] max-w-7xl 
            ${scrolled
                    ? 'bg-white/70 backdrop-blur-lg border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl py-1'
                    : 'bg-transparent border-transparent py-4'}`}
        >
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 md:h-16 relative">
                    {/* Logo - Left */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="relative">
                                <img src="/logo.svg" alt="OGENE Logo" className="h-8 w-8 md:h-10 md:w-10 transition-transform duration-500 group-hover:rotate-[360deg]" />
                                <div className="absolute inset-0 bg-ogene-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            </div>
                            <span className="text-2xl md:text-3xl font-serif font-black text-ogene-900 tracking-tighter">OGENE</span>
                        </Link>
                    </div>

                    {/* Desktop Nav - Centered */}
                    <div className={`hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center gap-1 p-1 rounded-full border backdrop-blur-sm transition-all duration-500 ${scrolled ? 'bg-ogene-100/50 border-ogene-200/50' : 'bg-white/10 border-white/10'}`}>
                        <Link to="/" className={`px-5 py-2 text-sm font-bold rounded-full transition-all ${isActive('/') ? 'bg-white text-ogene-900 shadow-sm' : (scrolled ? 'text-ogene-500 hover:text-ogene-900' : 'text-white/70 hover:text-white')}`}>
                            Home
                        </Link>
                        <Link to="/about" className={`px-5 py-2 text-sm font-bold rounded-full transition-all ${isActive('/about') ? 'bg-white text-ogene-900 shadow-sm' : (scrolled ? 'text-ogene-500 hover:text-ogene-900' : 'text-white/70 hover:text-white')}`}>
                            About Us
                        </Link>
                        <a
                            href="https://africanuniversitybn.edu.bj/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-5 py-2 text-sm font-bold transition-all ${scrolled ? 'text-ogene-500 hover:text-ogene-900' : 'text-white/70 hover:text-white'}`}
                        >
                            AUB
                        </a>
                        <a
                            href="#contact-us"
                            onClick={(e) => {
                                e.preventDefault();
                                if (location.pathname !== '/') {
                                    navigate('/', { state: { scrollToContact: true } });
                                } else {
                                    document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className={`px-5 py-2 text-sm font-bold transition-all ${scrolled ? 'text-ogene-500 hover:text-ogene-900' : 'text-white/70 hover:text-white'}`}
                        >
                            Contact
                        </a>
                    </div>

                    {/* Auth Buttons - Right */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <div className={`flex items-center gap-2 p-1 rounded-full border pr-4 transition-all duration-500 ${scrolled ? 'bg-white/50 border-ogene-100' : 'bg-white/10 border-white/10'}`}>
                                <Link to="/profile" className="h-9 w-9 bg-ogene-900 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-md overflow-hidden">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={18} />
                                    )}
                                </Link>
                                <div className="flex flex-col">
                                    <span className={`text-[10px] font-bold uppercase tracking-tighter leading-none mb-0.5 ${scrolled ? 'text-ogene-400' : 'text-white/60'}`}>Welcome</span>
                                    <span className={`text-xs font-black truncate max-w-[80px] leading-tight ${scrolled ? 'text-ogene-900' : 'text-white'}`}>{profile?.full_name?.split(' ')[0]}</span>
                                </div>
                                <div className={`h-4 w-[1px] mx-1 ${scrolled ? 'bg-ogene-200' : 'bg-white/20'}`}></div>
                                <button onClick={handleSignOut} className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider">Exit</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link to="/login">
                                    <Button
                                        variant="ghost"
                                        className={`font-bold text-xs uppercase tracking-widest px-4 transition-all duration-500 ${scrolled ? 'text-ogene-700 hover:bg-ogene-50' : 'text-white hover:bg-white/10'}`}
                                    >
                                        Log In
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button className="bg-ogene-900 text-white hover:bg-black rounded-full px-6 h-10 text-xs font-bold uppercase tracking-widest shadow-lg shadow-ogene-900/20 active:scale-95 transition-all">Join Now</Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center md:hidden ml-auto">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className={`inline-flex items-center justify-center p-2 rounded-xl transition-all ${isOpen ? 'bg-ogene-900 text-white' : (scrolled ? 'text-ogene-900 hover:bg-ogene-100' : 'text-white hover:bg-white/10')}`}
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="md:hidden overflow-hidden bg-white/95 backdrop-blur-xl rounded-b-[2rem] border-t border-ogene-50 shadow-2xl"
                    >
                        <div className="px-6 py-8 space-y-1">
                            {/* Mobile Links */}
                            {[
                                { name: 'Home', path: '/', icon: '🏠' },
                                { name: 'About Us', path: '/about', icon: '📖' },
                                { name: 'African University', path: 'https://africanuniversitybn.edu.bj/', isExternal: true, icon: '🏛️' },
                                { name: 'Contact Us', path: '#contact-us', isAnchor: true, icon: '✉️' }
                            ].map((link, i) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    {link.isExternal ? (
                                        <a
                                            href={link.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-black text-ogene-600 hover:bg-ogene-50 transition-all"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className="text-2xl">{link.icon}</span>
                                            {link.name}
                                        </a>
                                    ) : link.isAnchor ? (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsOpen(false);
                                                if (location.pathname !== '/') {
                                                    navigate('/', { state: { scrollToContact: true } });
                                                } else {
                                                    document.getElementById('contact-us')?.scrollIntoView({ behavior: 'smooth' });
                                                }
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-black text-ogene-600 hover:bg-ogene-50 transition-all text-left"
                                        >
                                            <span className="text-2xl">{link.icon}</span>
                                            {link.name}
                                        </button>
                                    ) : (
                                        <Link
                                            to={link.path}
                                            className={`flex items-center gap-4 px-4 py-4 rounded-2xl text-lg font-black transition-all ${isActive(link.path) ? 'text-ogene-900 bg-ogene-50' : 'text-ogene-600 hover:bg-ogene-50'}`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className="text-2xl">{link.icon}</span>
                                            {link.name}
                                        </Link>
                                    )}
                                </motion.div>
                            ))}

                            <div className="pt-6 mt-4 border-t border-ogene-100">
                                {user ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-ogene-50">
                                            <div className="h-12 w-12 bg-ogene-900 rounded-full flex items-center justify-center text-white font-black shadow-md">
                                                {profile?.full_name?.[0] || user.email[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-ogene-900 leading-none mb-1">{profile?.full_name || 'Member'}</p>
                                                <p className="text-xs text-ogene-400 font-medium truncate max-w-[180px]">{user.email}</p>
                                            </div>
                                            <button onClick={handleSignOut} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <Link to="/library" className="block w-full py-4 text-center rounded-2xl bg-ogene-100 text-ogene-900 font-black" onClick={() => setIsOpen(false)}>
                                            Explore My Library
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Link to="/signup" className="flex items-center justify-center py-4 bg-ogene-900 text-white rounded-2xl font-black shadow-lg shadow-ogene-900/20" onClick={() => setIsOpen(false)}>
                                            Join Now
                                        </Link>
                                        <Link to="/login" className="flex items-center justify-center py-4 border-2 border-ogene-200 rounded-2xl text-ogene-700 font-black" onClick={() => setIsOpen(false)}>
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
