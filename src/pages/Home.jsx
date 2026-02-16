import React, { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import { Button, ArticleCard, HeroSlider } from '../components/ui';

export default function Home() {
    const { user, profile } = useUserStore();
    const navigate = useNavigate();
    useEffect(() => {
        if (user && profile) {
            navigate('/library');
        }
    }, [user, profile, navigate]);

    const features = [
        {
            icon: BookOpen,
            title: "Curated Content",
            description: "Access high-quality articles from verified experts in various fields."
        },
        {
            icon: ShieldCheck,
            title: "Secure Payments",
            description: "Support authors directly with our secure Flutterwave integration."
        },
        {
            icon: Zap,
            title: "Instant Access",
            description: "Read immediately in-app or download PDF for offline viewing."
        }
    ];

    return (
        <div className="flex flex-col min-h-screen">
            {/* HERO SLIDER SECTION */}
            <HeroSlider />

            {/* FEATURES SECTION */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-serif font-bold text-ogene-900 mb-4">Why Choose OGENE?</h2>
                        <div className="h-1 w-20 bg-ogene-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                viewport={{ once: true }}
                                className="text-center p-6 rounded-2xl hover:bg-ogene-50 transition-colors"
                            >
                                <div className="h-16 w-16 bg-ogene-100 text-ogene-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">
                                    <feature.icon size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-ogene-900 mb-3">{feature.title}</h3>
                                <p className="text-ogene-500 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SCHOLARLY FOUNDATIONS SECTION */}
            <section id="scholarly-foundations" className="py-24 bg-ogene-50/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ogene-200 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ogene-900 mb-8 leading-tight">
                                Preserving the <span className="text-ogene-600">Ancestral Echo</span> through Modern Research
                            </h2>
                            <p className="text-xl text-ogene-700 mb-6 leading-relaxed">
                                OGENE is more than just a platform; it's a digital library dedicated to the profound exploration of history, culture, and social thought.
                            </p>
                            <p className="text-lg text-ogene-500 mb-10 leading-relaxed">
                                We believe that true progress is rooted in understanding our past. Our contributors dive deep into the archives of tradition to bring forth insights that resonate with the challenges of today.
                            </p>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 border-l-4 border-ogene-900 bg-white shadow-sm">
                                    <h4 className="font-bold text-ogene-900 mb-1">Authentic Voices</h4>
                                    <p className="text-sm text-ogene-500">Unfiltered perspectives from original thinkers.</p>
                                </div>
                                <div className="p-4 border-l-4 border-ogene-700 bg-white shadow-sm">
                                    <h4 className="font-bold text-ogene-900 mb-1">Cultural Depth</h4>
                                    <p className="text-sm text-ogene-500">Exploring the nuances of our shared heritage.</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="rounded-3xl overflow-hidden shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=2574&auto=format&fit=crop"
                                    alt="African Heritage and Research"
                                    className="w-full h-[500px] object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-ogene-900 rounded-2xl flex items-center justify-center text-white shadow-xl transform rotate-3">
                                <span className="text-4xl font-serif font-bold">OGN</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 bg-ogene-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-ogene-800 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-ogene-800 rounded-full blur-3xl opacity-50"></div>

                <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
                    <h2 className="text-4xl font-serif font-bold mb-6">Ready to start reading?</h2>
                    <p className="text-xl text-ogene-200 mb-10">
                        Join thousands of readers and support independent voices today.
                    </p>
                    <Link to="/signup">
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-white text-ogene-900 hover:bg-ogene-100 font-bold">
                            Create Free Account
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
