import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '../components/ui';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center max-w-lg w-full"
            >
                <div className="relative mb-8">
                    <motion.h1
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        className="text-[12rem] md:text-[18rem] font-serif font-black text-ogene-50 leading-none select-none"
                    >
                        404
                    </motion.h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-xl border border-ogene-100 flex items-center justify-center">
                            <Search size={48} className="text-ogene-900" />
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl md:text-4xl font-serif font-bold text-ogene-900 mb-4">
                    Page Not Found
                </h2>
                <p className="text-ogene-500 mb-10 text-lg max-w-md mx-auto leading-relaxed">
                    The path you followed might be broken, or the page may have been moved. Let's get you back to the sanctuary of knowledge.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:px-8 bg-ogene-900 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2">
                            <Home size={18} />
                            Go Home
                        </Button>
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl text-ogene-600 font-bold flex items-center justify-center gap-2 hover:bg-ogene-50 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Go Back
                    </button>
                </div>
            </motion.div>

            {/* Subtle decorative elements */}
            <div className="fixed top-20 left-10 w-64 h-64 bg-ogene-50 rounded-full blur-3xl opacity-50 -z-10 animate-pulse"></div>
            <div className="fixed bottom-20 right-10 w-96 h-96 bg-ogene-100/50 rounded-full blur-3xl opacity-50 -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
    );
}
