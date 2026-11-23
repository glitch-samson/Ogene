import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import { Menu, X, User, ChevronDown, LayoutDashboard, Bell, UserCircle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../../context/AlertContext';
import useNotificationStore, { useUnreadCount } from '../../store/notificationStore';

const NAV_LINKS = [
    { name: 'Home', path: '/', end: true },
    { name: 'Articles', path: '/articles' },
    { name: 'Submit Manuscript', path: '/submit' },
    { name: 'About Us', path: '/about' },
    { name: 'Blog', path: '/blog' },
];

const ACCOUNT_LINKS = [
    { name: 'Dashboard', path: '/library', icon: LayoutDashboard },
    { name: 'Notifications', path: '/notifications', icon: Bell, showUnread: true },
    { name: 'Profile', path: '/profile', icon: UserCircle },
];

function UnreadBadge({ count, className = '' }) {
    if (!count) return null;
    return (
        <span className={`inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white ${className}`}>
            {count > 99 ? '99+' : count}
        </span>
    );
}

function Wordmark({ onClick }) {
    return (
        <Link to="/" onClick={onClick} className="flex items-center gap-3 shrink-0">
            <img src="/ogene-logo.png" alt="Ogene logo" className="h-11 md:h-13 w-auto" />
            <span className="flex flex-col gap-0.5 leading-none text-navy-600">
                <span className="text-xl md:text-[22px] font-bold tracking-wide">OGENE</span>
                <span className="text-xs md:text-[13px] font-semibold tracking-[0.22em] text-navy-500">JOURNAL</span>
            </span>
        </Link>
    );
}

function Avatar({ profile, size = 'h-8 w-8' }) {
    return (
        <span className={`${size} shrink-0 rounded-full bg-navy-700 text-white flex items-center justify-center overflow-hidden`}>
            {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
                <User size={16} />
            )}
        </span>
    );
}

export default function Navbar() {
    const { user, profile, signOut } = useUserStore();
    const { success, error: showAlertError } = useAlert();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const accountRef = useRef(null);
    const loadNotifications = useNotificationStore((s) => s.load);
    const unread = useUnreadCount();

    const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

    // Fetch notifications once signed in (the store skips repeat loads), and
    // clear them on sign-out.
    useEffect(() => {
        if (!user) loadNotifications(null);
        else if (profile) loadNotifications(user, profile);
    }, [user, profile, loadNotifications]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 4);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close the account menu on outside click or Escape.
    useEffect(() => {
        if (!accountOpen) return;
        const onPointer = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false);
        };
        const onKey = (e) => e.key === 'Escape' && setAccountOpen(false);
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [accountOpen]);

    const closeMenus = () => {
        setIsOpen(false);
        setAccountOpen(false);
    };

    const handleSignOut = async () => {
        try {
            closeMenus();
            await signOut();
            success('You have been signed out successfully.', 'Logout');
            navigate('/');
        } catch {
            showAlertError('Failed to sign out. Please try again.');
        }
    };

    return (
        <>
            <nav className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-[0_4px_20px_rgba(10,21,48,0.06)]' : ''}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-18 md:h-20 border-b border-navy-200">
                        <Wordmark />

                        {/* Desktop links */}
                        <div className="hidden lg:flex items-stretch self-stretch gap-1 xl:gap-2">
                            {NAV_LINKS.map((link) => (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    end={link.end}
                                    className={({ isActive }) =>
                                        `group relative flex items-center px-4 text-base transition-colors duration-200 ${isActive ? 'font-semibold text-navy-800' : 'font-medium text-ogene-600 hover:text-navy-800'}`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {/* Reserve the semibold width so links don't shift when the active one changes. */}
                                            <span className="relative inline-flex flex-col items-center">
                                                <span>{link.name}</span>
                                                <span aria-hidden="true" className="invisible h-0 overflow-hidden font-semibold">{link.name}</span>

                                                {/* Hover preview for inactive links */}
                                                {!isActive && (
                                                    <span className="absolute inset-x-0 -bottom-1 h-0.5 origin-center scale-x-0 rounded-full bg-navy-200 transition-transform duration-200 group-hover:scale-x-100" />
                                                )}

                                                {/* Active indicator: directly under the text, AUB gold */}
                                                {isActive && (
                                                    <motion.span
                                                        layoutId="nav-underline"
                                                        className="absolute inset-x-0 -bottom-1 h-0.75 rounded-full bg-gold-500"
                                                        transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                                                    />
                                                )}
                                            </span>
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>

                        {/* Desktop account: "Hi, name" + avatar, or a Login button */}
                        <div className="hidden lg:flex items-center">
                            {user ? (
                                <div ref={accountRef} className="relative">
                                    <button
                                        onClick={() => setAccountOpen((o) => !o)}
                                        aria-haspopup="menu"
                                        aria-expanded={accountOpen}
                                        className="flex items-center gap-2.5 rounded-full py-1 pl-3.5 pr-2 text-[15px] text-ogene-800 hover:bg-navy-50 transition-colors"
                                    >
                                        <span>Hi, <span className="font-semibold">{firstName}</span></span>
                                        <span className="relative">
                                            <Avatar profile={profile} size="h-10 w-10" />
                                            {unread > 0 && (
                                                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" aria-label={`${unread} unread notifications`} />
                                            )}
                                        </span>
                                        <ChevronDown size={14} className={`text-ogene-500 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {accountOpen && (
                                            <motion.div
                                                role="menu"
                                                initial={{ opacity: 0, y: -6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 mt-2 w-56 rounded-xl border border-navy-100 bg-white p-1.5 shadow-[0_12px_32px_rgba(10,21,48,0.12)]"
                                            >
                                                {ACCOUNT_LINKS.map((item) => {
                                                    const Icon = item.icon;
                                                    return (
                                                        <Link
                                                            key={item.path}
                                                            to={item.path}
                                                            role="menuitem"
                                                            onClick={closeMenus}
                                                            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ogene-700 hover:bg-navy-50 hover:text-navy-700"
                                                        >
                                                            <Icon size={16} />
                                                            <span className="flex-1">{item.name}</span>
                                                            {item.showUnread && <UnreadBadge count={unread} />}
                                                        </Link>
                                                    );
                                                })}
                                                <div className="my-1 h-px bg-navy-100" />
                                                <button
                                                    role="menuitem"
                                                    onClick={handleSignOut}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut size={16} /> Sign out
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="rounded-lg border-2 border-navy-600 px-6 py-2 text-[15px] font-semibold text-navy-600 hover:bg-navy-600 hover:text-white transition-colors"
                                >
                                    Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile toggle */}
                        <button
                            onClick={() => setIsOpen(true)}
                            aria-label="Open menu"
                            className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-navy-700 hover:bg-navy-50 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="lg:hidden fixed inset-0 z-100 bg-white flex flex-col h-screen overflow-y-auto"
                    >
                        <div className="flex justify-between items-center h-18 mx-4 sm:mx-6 border-b border-navy-200">
                            <Wordmark onClick={closeMenus} />
                            <button
                                onClick={closeMenus}
                                aria-label="Close menu"
                                className="p-2 rounded-xl text-navy-700 hover:bg-navy-50 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col gap-1 flex-1 px-8 pt-8">
                            {NAV_LINKS.map((link, i) => (
                                <motion.div
                                    key={link.path}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.05 + i * 0.06 }}
                                >
                                    <NavLink
                                        to={link.path}
                                        end={link.end}
                                        onClick={closeMenus}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 py-3 text-xl transition-colors ${isActive ? 'font-semibold text-navy-800' : 'font-medium text-ogene-600 hover:text-navy-800'}`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <span className={`h-6 w-0.75 rounded-full ${isActive ? 'bg-gold-500' : 'bg-transparent'}`} />
                                                {link.name}
                                            </>
                                        )}
                                    </NavLink>
                                </motion.div>
                            ))}
                        </div>

                        <div className="w-full pb-16 pt-10 mt-auto px-8">
                            {user ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar profile={profile} size="h-14 w-14" />
                                        <div className="min-w-0">
                                            <p className="text-lg font-bold text-ogene-900 leading-tight truncate">Hi, {firstName}</p>
                                            <p className="text-sm text-ogene-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <Link to="/library" onClick={closeMenus} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-navy-700 text-white font-bold text-lg">
                                            <LayoutDashboard size={20} /> Dashboard
                                        </Link>
                                        <Link to="/notifications" onClick={closeMenus} className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-navy-200 text-navy-700 font-bold text-lg">
                                            <Bell size={20} /> Notifications <UnreadBadge count={unread} />
                                        </Link>
                                        <button onClick={handleSignOut} className="w-full py-4 text-center rounded-2xl bg-red-50 text-red-600 font-bold text-lg">
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    <Link to="/login" onClick={closeMenus} className="flex items-center justify-center py-4 bg-navy-700 text-white rounded-2xl font-bold text-lg">
                                        Login
                                    </Link>
                                    <Link to="/signup" onClick={closeMenus} className="flex items-center justify-center py-4 border-2 border-navy-200 rounded-2xl text-navy-700 font-bold text-lg">
                                        Create an account
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
