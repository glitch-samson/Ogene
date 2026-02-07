import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useUserStore from '../../store/userStore';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, profile, loading } = useUserStore();

    if (loading) {
        return <div className="flex justify-center items-center py-20">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
        if (user && !profile) {
            return <div className="flex justify-center items-center py-20 text-ogene-500">Setting up your profile...</div>;
        }
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
