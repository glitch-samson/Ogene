import React from 'react';
import { motion } from 'framer-motion';

export default function About() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl mx-auto text-center"
            >
                <h1 className="text-4xl font-serif font-bold text-ogene-900 mb-6">About OGENE</h1>
                <p className="text-xl text-ogene-600 leading-relaxed mb-12">
                    OGENE is more than a platform; it's a movement to reclaim the depth and integrity of digital publishing.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center my-16">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-ogene-900 mb-6">Our Mission</h2>
                    <p className="text-ogene-600 mb-6 leading-relaxed">
                        In an age of clickbait and fast news, we stand for thoughtfulness. We empower independent writers, researchers, and journalists to publish high-quality work and get paid directly by their readers.
                    </p>
                    <p className="text-ogene-600 leading-relaxed">
                        We believe that knowledge should be accessible but also valued. By connecting readers directly with authors, we create a sustainable ecosystem for intellectual work.
                    </p>
                </div>
                <div className="bg-ogene-100 rounded-2xl h-80 flex items-center justify-center">
                    <span className="font-serif italic text-ogene-300 text-6xl">OGENE</span>
                </div>
            </div>

            <div className="bg-ogene-900 text-white rounded-3xl p-12 text-center my-20">
                <h2 className="text-3xl font-serif font-bold mb-6">Join the Conversation</h2>
                <p className="text-ogene-200 max-w-2xl mx-auto mb-8">
                    Whether you are a reader seeking truth or a writer seeking an audience, OGENE is your home.
                </p>
            </div>
        </div>
    );
}
