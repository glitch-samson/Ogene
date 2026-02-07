import React from 'react';
import { Outlet } from 'react-router-dom';

export default function ReaderLayout() {
    return (
        <div className="min-h-screen bg-ogene-50 font-sans">
            <main className="min-h-screen flex flex-col">
                <Outlet />
            </main>
        </div>
    );
}
