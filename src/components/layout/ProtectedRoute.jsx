import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useUserStore from '../../store/userStore';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, profile, loading, signingOut } = useUserStore();
    const location = useLocation();

    if (loading) {
        return <div className="flex justify-center items-center py-20">Loading...</div>;
    }

    if (!user) {
        // Just signed out from this page: go home, and don't remember it as a
        // place to return to after the next login.
        if (signingOut) return <Navigate to="/" replace />;
        // A logged-out visitor trying to reach this page: remember it so login
        // can send them back here.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
        if (user && !profile) {
            return <div className="flex justify-center items-center py-20 text-ogene-500">Setting up your profile...</div>;
        }
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
