import React from 'react';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
    return (
        <div className="min-h-screen bg-ogene-50 flex flex-col font-sans">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <SiteFooter />
        </div>
    );
}
