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
        <>
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

                        {/* Mobile Toggle */}
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
            </nav>

            {/* Mobile Menu Overlay - Move here to escape fixed/transformed nav container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="md:hidden fixed inset-0 z-[100] bg-white flex flex-col h-screen overflow-y-auto"
                    >
                        {/* Mobile Header: Logo & Close Button */}
                        <div className="flex justify-between items-center pt-8 pb-10 px-10">
                            <Link to="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                                <img src="/logo.svg" alt="OGENE Logo" className="h-10 w-10" />
                                <span className="text-3xl font-serif font-black text-ogene-900 tracking-tighter">OGENE</span>
                            </Link>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-3 bg-ogene-50 rounded-full text-ogene-900 shadow-sm transition-transform active:scale-90"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <div className="flex flex-col items-start gap-4 flex-1 px-10">
                            {/* Mobile Links */}
                            {[
                                { name: 'Home', path: '/' },
                                { name: 'About Us', path: '/about' },
                                { name: 'African University', path: 'https://africanuniversitybn.edu.bj/', isExternal: true },
                                { name: 'Contact Us', path: '#contact-us', isAnchor: true }
                            ].map((link, i) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 + i * 0.1 }}
                                    className="w-full"
                                >
                                    {link.isExternal ? (
                                        <a
                                            href={link.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block py-2 text-xl font-serif font-black text-ogene-400 hover:text-ogene-900 transition-all text-left"
                                            onClick={() => setIsOpen(false)}
                                        >
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
                                            className="w-full py-2 text-xl font-serif font-black text-ogene-400 hover:text-ogene-900 transition-all text-left"
                                        >
                                            {link.name}
                                        </button>
                                    ) : (
                                        <Link
                                            to={link.path}
                                            className={`block py-2 text-xl font-serif font-black transition-all text-left ${isActive(link.path) ? 'text-ogene-900' : 'text-ogene-400 hover:text-ogene-900'}`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {link.name}
                                        </Link>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Bottom Auth Buttons */}
                        <div className="w-full pb-20 pt-10 mt-auto px-10">
                            {user ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="h-14 w-14 bg-ogene-900 rounded-full flex items-center justify-center text-white text-xl font-black shadow-lg">
                                            {profile?.full_name?.[0] || user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xl font-black text-ogene-900 leading-none mb-1">{profile?.full_name || 'Member'}</p>
                                            <p className="text-sm text-ogene-400 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 w-full">
                                        <Link to="/library" className="w-full py-4 text-center rounded-2xl bg-ogene-900 text-white font-black text-lg shadow-xl shadow-ogene-900/20" onClick={() => setIsOpen(false)}>
                                            My Library
                                        </Link>
                                        <button onClick={handleSignOut} className="w-full py-4 text-center rounded-2xl bg-red-50 text-red-500 font-black text-lg">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 w-full">
                                    <Link to="/signup" className="flex items-center justify-center py-4 bg-ogene-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-ogene-900/20" onClick={() => setIsOpen(false)}>
                                        Join Now
                                    </Link>
                                    <Link to="/login" className="flex items-center justify-center py-4 border-2 border-ogene-200 rounded-2xl text-ogene-900 font-black text-lg" onClick={() => setIsOpen(false)}>
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
