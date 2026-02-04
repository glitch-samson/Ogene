import React from 'react';
import Navbar from './Navbar';
import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
    return (
        <div className="min-h-screen bg-ogene-50 flex flex-col font-sans">
            <Navbar />
            <main className="flex-grow">
                <Outlet />
            </main>
            <footer className="bg-white border-t border-ogene-200 mt-auto">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <span className="text-2xl font-serif font-bold text-ogene-900">OGENE</span>
                            <p className="mt-4 text-ogene-500 max-w-xs">
                                Empowering independent voices and connecting them with a global audience.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-ogene-900 mb-4">Platform</h3>
                            <ul className="space-y-2 text-ogene-600">
                                <li><a href="/articles" className="hover:text-ogene-900">Articles</a></li>
                                <li><a href="/about" className="hover:text-ogene-900">About Us</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-ogene-900 mb-4">Legal</h3>
                            <ul className="space-y-2 text-ogene-600">
                                <li><a href="#" className="hover:text-ogene-900">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-ogene-900">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-ogene-100 mt-12 pt-8 text-center text-sm text-ogene-400">
                        &copy; {new Date().getFullYear()} OGENE Platform. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
