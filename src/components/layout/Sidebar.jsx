import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useUserStore from '../../store/userStore';
import {
    Home,
    BookOpen,
    Settings,
    User,
    LogOut,
    LayoutDashboard,
    Heart,
    ChevronRight,
    ChevronLeft,
    UploadCloud,
    FileText,
    ClipboardList,
    ClipboardCheck,
    Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui';
import useNotificationStore, { useUnreadCount } from '../../store/notificationStore';

export default function Sidebar() {
    const { user, profile, signOut } = useUserStore();
    const location = useLocation();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const loadNotifications = useNotificationStore((s) => s.load);
    const unread = useUnreadCount();

    // Dashboard pages don't render the public navbar, so load from here too
    // (the store skips repeat loads).
    useEffect(() => {
        if (user && profile) loadNotifications(user, profile);
    }, [user, profile, loadNotifications]);

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Sign out error", error);
        } finally {
            navigate('/');
        }
    };

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: LayoutDashboard, label: 'Articles', path: '/browse', protected: true },
        { icon: BookOpen, label: 'My Library', path: '/library', protected: true }, // Reusing LayoutDashboard or finding a better icon like Search/Grid
        { icon: Bell, label: 'Notifications', path: '/notifications', protected: true, showUnread: true },
        { icon: Heart, label: 'Favourites', path: '/favourites', protected: true },
        { icon: UploadCloud, label: 'Submit Manuscript', path: '/submit', protected: true },
        { icon: FileText, label: 'My Manuscripts', path: '/manuscripts', protected: true },
        { icon: ClipboardList, label: 'Editorial Queue', path: '/editor', roles: ['editor', 'chief_editor', 'admin'] },
        { icon: ClipboardCheck, label: 'Review Assignments', path: '/reviewer', roles: ['reviewer', 'admin'] },
        { icon: LayoutDashboard, label: 'Admin', path: '/admin', admin: true },
        { icon: User, label: 'Profile', path: '/profile', protected: true },
        { icon: Settings, label: 'Settings', path: '/settings', protected: true },
    ];

    const toggleCollapse = () => setIsCollapsed(!isCollapsed);

    // Get display name: Profile Full Name > User Meta Full Name > Email > 'User'
    const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

    return (
        <motion.aside
            initial={{ width: 250 }}
            animate={{ width: isCollapsed ? 80 : 250 }}
            transition={{ duration: 0.3 }}
            className="hidden md:flex flex-col h-screen bg-white border-r border-ogene-200 sticky top-0 z-50 pt-8 pb-4"
        >
            <div className="px-6 mb-8 flex items-center justify-between">
                {!isCollapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-2xl font-serif font-bold text-ogene-900 tracking-tighter"
                    >
                        OGENE
                    </motion.span>
                )}
                <button
                    onClick={toggleCollapse}
                    className="p-1 rounded-full hover:bg-ogene-100 text-ogene-400"
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-3 space-y-2">
                {navItems.map((item) => {
                    if (item.protected && !user) return null;
                    if (item.admin && profile?.role !== 'admin') return null;
                    if (item.roles && !item.roles.includes(profile?.role)) return null;

                    const isActive = location.pathname === item.path;
                    const badge = item.showUnread && unread > 0 ? (unread > 99 ? '99+' : unread) : null;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-ogene-900 text-white shadow-md"
                                    : "text-ogene-600 hover:bg-ogene-50 hover:text-ogene-900"
                            )}
                        >
                            <span className="relative">
                                <item.icon size={22} className={cn(isActive ? "text-white" : "text-ogene-500 group-hover:text-ogene-900")} />
                                {badge && isCollapsed && (
                                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                                )}
                            </span>

                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex flex-1 items-center justify-between font-medium"
                                >
                                    {item.label}
                                    {badge && (
                                        <span className="ml-2 rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white">{badge}</span>
                                    )}
                                </motion.span>
                            )}

                            {/* Tooltip for collapsed mode */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-2 py-1 bg-ogene-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="px-3 mt-auto">
                {user ? (
                    <div className={cn("p-3 rounded-xl bg-ogene-50 border border-ogene-100 flex items-center gap-3", isCollapsed && "justify-center p-2")}>
                        <div className="h-10 w-10 rounded-full bg-ogene-200 flex items-center justify-center text-ogene-600 font-bold flex-shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-ogene-900 truncate">
                                    {displayName}
                                </p>
                                <button
                                    onClick={handleSignOut}
                                    className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    !isCollapsed && (
                        <div className="space-y-3">
                            <Link to="/login" className="block w-full py-2 text-center text-sm font-bold text-ogene-700 hover:bg-ogene-50 rounded-lg">Sign In</Link>
                            <Link to="/signup" className="block w-full py-2 text-center text-sm font-bold text-white bg-ogene-900 hover:bg-ogene-800 rounded-lg shadow-sm">Get Started</Link>
                        </div>
                    )
                )}
            </div>
        </motion.aside>
    );
}
