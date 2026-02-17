import React, { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, ShieldCheck, Zap } from 'lucide-react';
import { Button, ArticleCard, HeroSlider } from '../components/ui';

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-ogene-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
            <button
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-lg font-bold text-ogene-900">{question}</span>
                <span className={`transform transition-transform duration-300 text-ogene-400 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="px-6 pb-6 text-ogene-600 leading-relaxed text-base border-t border-ogene-50 pt-4">
                    {answer}
                </div>
            </div>
        </div>
    );
}

function VideoTestimonialSlider() {
    const [activeIndex, setActiveIndex] = useState(1);
    const testimonials = [
        { id: 1, name: "Chidi Okonkwo", role: "Researcher, AUB", thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600" },
        { id: 2, name: "Dr. Amina S.", role: "Climate Scientist", thumbnail: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600" },
        { id: 3, name: "Kwame Mensah", role: "Tech Entrepreneur", thumbnail: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600" },
        { id: 4, name: "Sarah Doe", role: "Student", thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600" },
        { id: 5, name: "John Smith", role: "Alumni", thumbnail: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=600" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    const getPosition = (index) => {
        const diff = (index - activeIndex + testimonials.length) % testimonials.length;
        if (diff === 0) return 'center';
        if (diff === 1 || diff === -4) return 'right';
        if (diff === testimonials.length - 1 || diff === -1) return 'left';
        return 'hidden';
    };

    return (
        <div className="relative h-[500px] flex items-center justify-center perspective-1000">
            {testimonials.map((item, index) => {
                const position = getPosition(index);
                if (position === 'hidden') return null;

                let x = 0;
                let scale = 0.8;
                let zIndex = 0;
                let opacity = 0.5;
                let rotateY = 0;

                if (position === 'center') {
                    scale = 1.1;
                    zIndex = 10;
                    opacity = 1;
                    rotateY = 0;
                } else if (position === 'left') {
                    x = -250;
                    rotateY = 25;
                    zIndex = 5;
                } else if (position === 'right') {
                    x = 250;
                    rotateY = -25;
                    zIndex = 5;
                }

                return (
                    <motion.div
                        key={item.id}
                        initial={false}
                        animate={{ x, scale, opacity, rotateY, zIndex }}
                        transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
                        className="absolute w-64 md:w-80 h-96 rounded-3xl overflow-hidden shadow-2xl cursor-pointer bg-gray-900 border-4 border-white/10"
                        onClick={() => setActiveIndex(index)}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-1"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent pt-12">
                            <h3 className="text-xl font-bold text-white mb-1">{item.name}</h3>
                            <p className="text-blue-300 text-sm font-medium uppercase tracking-wider">{item.role}</p>
                        </div>
                    </motion.div>
                );
            })}

            <div className="absolute bottom-4 flex gap-2 justify-center w-full z-20">
                {testimonials.map((_, idx) => (
                    <button
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 ${idx === activeIndex ? 'w-8 bg-blue-500' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                        onClick={() => setActiveIndex(idx)}
                    />
                ))}
            </div>
        </div>
    );
}

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
            {/* NEW HERO SECTION */}
            <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden min-h-[90vh] flex flex-col justify-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-ogene-50 to-transparent opacity-60"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">

                    {/* 1. HEADLINE */}
                    <div className="text-center max-w-4xl mx-auto mb-8">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-ogene-900 leading-tight tracking-tight"
                        >
                            Africa's Top Journal <br />
                            <span className="text-ogene-600 text-2xl sm:text-3xl md:text-5xl font-medium mt-4 block">Share your research and deep thoughts to the world</span>
                        </motion.h1>
                    </div>

                    {/* 2. USER TAGS & 3. IMAGES (Combined for visual flow) */}
                    <div className="relative w-full max-w-3xl mx-auto h-[220px] sm:h-[280px] md:h-[350px] mb-8 perspective-1000 flex items-center justify-center">

                        {/* User Tags - Positioned around the cards */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 }}
                            className="absolute top-0 left-4 sm:left-10 z-40 bg-white/90 backdrop-blur-sm border border-ogene-100 text-ogene-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg transform -rotate-12 flex items-center gap-2"
                        >
                            <div className="w-6 h-6 bg-ogene-200 rounded-full overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Dr+Adebayo&background=random" alt="Dr Adebayo" />
                            </div>
                            @Dr.Adebayo
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.9 }}
                            className="absolute bottom-4 right-4 sm:right-10 z-40 bg-white/90 backdrop-blur-sm border border-ogene-100 text-ogene-900 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-lg transform rotate-12 flex items-center gap-2"
                        >
                            <div className="w-6 h-6 bg-ogene-200 rounded-full overflow-hidden">
                                <img src="https://ui-avatars.com/api/?name=Nneka+Writes&background=random" alt="Nneka Writes" />
                            </div>
                            @Nneka_Writes
                        </motion.div>

                        {/* Card Stack/Fan Effect - Scaled down for mobile */}
                        <div className="relative flex items-center justify-center scale-75 sm:scale-90 md:scale-100 w-full h-full">
                            <motion.div
                                initial={{ opacity: 0, rotate: -15, y: 50 }}
                                animate={{ opacity: 1, rotate: -12, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="absolute z-10 transform -translate-x-24 sm:-translate-x-48 w-40 sm:w-56 aspect-[3/4] rounded-2xl shadow-lg overflow-hidden border-2 border-white bg-blue-100"
                            >
                                <img src="https://images.unsplash.com/photo-1544928147-79a2dbc1f389?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Article 1" className="w-full h-full object-cover" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, rotate: -8, y: 50 }}
                                animate={{ opacity: 1, rotate: -6, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="absolute z-20 transform -translate-x-12 sm:-translate-x-24 w-40 sm:w-56 aspect-[3/4] rounded-2xl shadow-lg overflow-hidden border-2 border-white bg-purple-100 top-2"
                            >
                                <img src="https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Article 2" className="w-full h-full object-cover" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                                className="absolute z-30 transform w-48 sm:w-64 aspect-[3/4] rounded-2xl shadow-xl overflow-hidden border-4 border-white bg-yellow-100 -top-4"
                            >
                                <img src="https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Featured Article" className="w-full h-full object-cover" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, rotate: 8, y: 50 }}
                                animate={{ opacity: 1, rotate: 6, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="absolute z-20 transform translate-x-12 sm:translate-x-24 w-40 sm:w-56 aspect-[3/4] rounded-2xl shadow-lg overflow-hidden border-2 border-white bg-red-100 top-2"
                            >
                                <img src="https://images.unsplash.com/photo-1524338198850-8a2ff63aaceb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Article 3" className="w-full h-full object-cover" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, rotate: 15, y: 50 }}
                                animate={{ opacity: 1, rotate: 12, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="absolute z-10 transform translate-x-24 sm:translate-x-48 w-40 sm:w-56 aspect-[3/4] rounded-2xl shadow-lg overflow-hidden border-2 border-white bg-green-100"
                            >
                                <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Article 4" className="w-full h-full object-cover" />
                            </motion.div>
                        </div>
                    </div>

                    {/* 4. SUB HEADER */}
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.6 }}
                        className="text-center text-ogene-600 max-w-2xl mx-auto mb-8 text-sm sm:text-base md:text-lg font-medium"
                    >
                        This journal is a property of the <a href="https://africanuniversitybn.edu.bj/" target="_blank" rel="noopener noreferrer" className="underline hover:text-ogene-800 transition-colors">African University of Benin</a> and is open to publication for anyone in Africa.
                    </motion.p>

                    {/* 5. BUTTONS */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.1, duration: 0.6 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
                    >
                        <Link to="/login" className="w-full sm:w-auto">
                            <Button size="lg" className="h-12 sm:h-14 px-8 text-base sm:text-lg rounded-full bg-ogene-900 text-white hover:bg-ogene-800 font-medium shadow-lg hover:shadow-xl transition-all w-full">
                                Sign In
                            </Button>
                        </Link>
                        <a href="#scholarly-foundations" className="w-full sm:w-auto" onClick={(e) => {
                            e.preventDefault();
                            document.getElementById('scholarly-foundations')?.scrollIntoView({ behavior: 'smooth' });
                        }}>
                            <Button variant="outline" size="lg" className="h-12 sm:h-14 px-8 text-base sm:text-lg rounded-full border-ogene-200 text-ogene-700 hover:bg-ogene-50 hover:text-ogene-900 font-medium w-full">
                                Learn More
                            </Button>
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* SCHOLARLY FOUNDATIONS SECTION */}
            <section id="scholarly-foundations" className="py-16 md:py-24 bg-ogene-50/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-ogene-200 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-ogene-900 mb-6 sm:mb-8 leading-tight">
                                Preserving the <span className="text-ogene-600">Ancestral Echo</span> through Modern Research
                            </h2>
                            <p className="text-lg sm:text-xl text-ogene-700 mb-4 sm:mb-6 leading-relaxed">
                                OGENE is more than just a platform; it's a digital library dedicated to the profound exploration of history, culture, and social thought.
                            </p>
                            <p className="text-sm sm:text-lg text-ogene-500 mb-8 sm:mb-10 leading-relaxed">
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
                                    className="w-full h-[300px] sm:h-[400px] md:h-[500px] object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-ogene-900 rounded-2xl flex items-center justify-center text-white shadow-xl transform rotate-3">
                                <span className="text-4xl font-serif font-bold">OGN</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS SECTION */}
            <section className="py-20 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Masonry Image Grid - Visual "Trust" Proof */}
                    <div className="mb-20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[500px] md:h-[600px] overflow-hidden rounded-3xl relative">
                            {/* Overlay Gradient */}
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent z-10"></div>
                            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white to-transparent z-10"></div>

                            {/* Column 1 */}
                            <div className="flex flex-col gap-4 animate-scroll-y">
                                <img src="https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-64 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-48 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-72 w-full" alt="User work" />
                                {/* Duplicate for Loop */}
                                <img src="https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-64 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-48 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-72 w-full" alt="User work" />
                            </div>

                            {/* Column 2 */}
                            <div className="flex flex-col gap-4 animate-scroll-y-reverse -mt-20">
                                <img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-56 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-80 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-64 w-full" alt="User work" />
                                {/* Duplicate for Loop */}
                                <img src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-56 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-80 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-64 w-full" alt="User work" />
                            </div>

                            {/* Column 3 */}
                            <div className="flex flex-col gap-4 animate-scroll-y hidden md:flex">
                                <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-72 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-48 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-64 w-full" alt="User work" />
                                {/* Duplicate for Loop */}
                                <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-72 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-48 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-64 w-full" alt="User work" />
                            </div>

                            {/* Column 4 */}
                            <div className="flex flex-col gap-4 animate-scroll-y-reverse -mt-10 hidden md:flex">
                                <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-64 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-60 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-72 w-full" alt="User work" />
                                {/* Duplicate for Loop */}
                                <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-64 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-60 w-full" alt="User work" />
                                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60" className="rounded-2xl object-cover h-72 w-full" alt="User work" />
                            </div>
                        </div>
                    </div>

                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <span className="inline-block py-1 px-3 rounded-full bg-ogene-100 text-ogene-800 text-sm font-medium mb-6">Testimonials</span>
                        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-ogene-900 mb-6">
                            Trusted by creatives and leaders from various industries
                        </h2>
                        <p className="text-lg text-ogene-600">
                            See what our community has to say about their journey with OGENE.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Sarah Johnson",
                                role: "Historical Researcher",
                                quote: "OGENE has completely transformed how I access primary sources. The depth of the archives is unmatched.",
                                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "David Okonjo",
                                role: "Cultural Anthropologist",
                                quote: "A masterpiece of a platform. It feels like walking through a digital museum of African heritage.",
                                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "Amara Nwachukwu",
                                role: "Literature Professor",
                                quote: "Finally, a journal that gives African narratives the premium presentation they deserve.",
                                image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "Michael Chen",
                                role: "Digital Archivist",
                                quote: "The interface is intuitive and the reading experience is seamless across all my devices.",
                                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "Zainab Ahmed",
                                role: "Sociology Student",
                                quote: "I used OGENE for my thesis research. The quality of articles here is simply outstanding.",
                                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 4
                            },
                            {
                                name: "Kwame Mensah",
                                role: "Art Historian",
                                quote: "The visual storytelling on OGENE is what sets it apart. It accepts and showcases art beautifully.",
                                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "Elena Rodriguez",
                                role: "Global Studies Major",
                                quote: "Connecting with researchers from across the continent has never been easier.",
                                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "Tunde Bakare",
                                role: "Writer & Poet",
                                quote: "Publication here feels prestigious. The editorial team is professional and supportive.",
                                image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "Lisa Wong",
                                role: "Librarian",
                                quote: "Our university recommends OGENE as a top resource for African studies.",
                                image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "Ibrahim Diallo",
                                role: "Political Scientist",
                                quote: "Insightful commentary and rigorous peer review. OGENE is setting a new standard.",
                                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 4
                            },
                            {
                                name: "Grace Osei",
                                role: "Musicologist",
                                quote: "Documentation of oral traditions here is preserved with such care and authenticity.",
                                image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            },
                            {
                                name: "Samuel Kalu",
                                role: "Tech Entrepreneur",
                                quote: "Love the clean UI. It makes reading long-form content a pleasure, not a chore.",
                                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
                                stars: 5
                            }
                        ].map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.05 }}
                                viewport={{ once: true }}
                                className="bg-ogene-50 p-8 rounded-2xl hover:shadow-md transition-shadow"
                            >
                                <div className="flex gap-1 text-yellow-400 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={i < testimonial.stars ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={i >= testimonial.stars ? "text-ogene-300" : ""}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                    ))}
                                </div>
                                <p className="text-ogene-700 italic mb-6">"{testimonial.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                                    <div>
                                        <h4 className="font-bold text-ogene-900 text-sm">{testimonial.name}</h4>
                                        <p className="text-xs text-ogene-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
            {/* TEAM SECTION */}
            <section className="py-20 md:py-32 bg-white border-t border-ogene-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-16 md:mb-24 gap-8">
                        <div className="md:w-1/3">
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-ogene-900 uppercase tracking-tight relative pb-4">
                                Our Team
                                <span className="absolute bottom-0 left-0 w-16 h-1 bg-blue-500"></span>
                            </h2>
                        </div>
                        <div className="md:w-1/2">
                            <p className="text-lg text-ogene-600 leading-relaxed">
                                Behind OGENE is a diverse group of editors, researchers, and technical experts dedicated to amplifying African voices. We collaborate with lecturers from the African University of Benin and top scholars across the continent.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {[
                            { name: "Richard G.", role: "Editor-in-Chief", desc: "15+ years in academic publishing", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&grayscale" },
                            { name: "Sarah M.", role: "Senior Editor", desc: "PhD in African History", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&grayscale" },
                            { name: "David O.", role: "Technical Lead", desc: "Digital systems architect", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&grayscale" },
                            { name: "Nneka A.", role: "Editorial Director", desc: "Specialist in cultural studies", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&grayscale" },

                            { name: "Dr. Hassan B.", role: "AUB Liaison", desc: "Professor of Literature", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&grayscale" },
                            { name: "Elena R.", role: "Review Coordinator", desc: "Ensures peer review quality", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&grayscale" },
                            { name: "Kwame J.", role: "Art Director", desc: "Curates visual narratives", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&grayscale" },
                            { name: "Zainab F.", role: "Community Manager", desc: "Connects with our readers", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&grayscale" },

                            { name: "Samuel T.", role: "Systems Admin", desc: "Keeps the platform running", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&grayscale" }, // Reusing image for placeholder
                            { name: "Grace L.", role: "Content Strategist", desc: "Plans our editorial calendar", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&grayscale" },
                            { name: "Ibrahim K.", role: "Researcher", desc: "Fact-checking and analysis", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&grayscale" }, // Reusing
                            { name: "Tiffany W.", role: "Associate Editor", desc: "Supporting new submissions", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&grayscale" }
                        ].map((member, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center group">
                                <div className="relative mb-6">
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-ogene-50 shadow-inner">
                                        <img
                                            src={member.img}
                                            alt={member.name}
                                            className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                                        />
                                    </div>
                                    {/* Optional small icon badge similar to design */}
                                    <div className="absolute top-0 right-0 bg-blue-50 p-2 rounded-full text-blue-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-ogene-900 mb-1">{member.name}</h3>
                                <p className="text-sm font-bold text-ogene-600 mb-2">{member.role}</p>
                                <p className="text-xs text-ogene-400 max-w-[150px]">{member.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            {/* CONTACT US SECTION */}
            <section id="contact-us" className="py-20 md:py-32 bg-ogene-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        {/* LEFT: Text & Contact Info */}
                        <div className="flex-1 text-center lg:text-left">
                            <h4 className="text-sm font-bold tracking-widest text-ogene-500 uppercase mb-4">We're here to help you</h4>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-ogene-900 mb-6 leading-tight">
                                Have any questions on uploading your journal, working with us or joining AUB?
                            </h2>
                            <p className="text-lg text-ogene-600 mb-10 leading-relaxed">
                                Are you looking for a platform to share your research and deep thoughts with the world? Reach out to us.
                            </p>

                            <div className="flex flex-col gap-6 items-center lg:items-start">
                                <a href="mailto:info@ogene.com" className="flex items-center gap-4 group">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-ogene-500 font-medium">Email</p>
                                        <p className="text-lg font-bold text-ogene-900">info@ogene.com</p>
                                    </div>
                                </a>

                                <a href="tel:+22948785690" className="flex items-center gap-4 group">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-ogene-500 font-medium">Phone number</p>
                                        <p className="text-lg font-bold text-ogene-900">+229 48 78 56 90</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* RIGHT: Form Card */}
                        <div className="flex-1 w-full max-w-lg">
                            <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-ogene-100">
                                <form className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-ogene-700 mb-2">Name</label>
                                        <input type="text" id="name" className="w-full px-4 py-3 rounded-xl bg-ogene-50 border-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-ogene-400" placeholder="Jane Smith" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-ogene-700 mb-2">Email</label>
                                        <input type="email" id="email" className="w-full px-4 py-3 rounded-xl bg-ogene-50 border-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-ogene-400" placeholder="jane@frames.com" />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-ogene-700 mb-2">Message</label>
                                        <textarea id="message" rows={4} className="w-full px-4 py-3 rounded-xl bg-ogene-50 border-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-ogene-400 resize-none" placeholder="Type your message"></textarea>
                                    </div>
                                    <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 rounded-full py-4 text-lg font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group">
                                        Send Message
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LATEST JOURNALS & ARTICLES SECTION */}
            <section className="py-20 md:py-32 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-ogene-900 mb-4 inline-block relative">
                            Our Insightful Articles
                            <span className="absolute bottom-1 right-0 w-20 h-1 bg-ogene-900"></span>
                        </h2>
                        <p className="text-ogene-600 max-w-2xl mx-auto mt-4">
                            Discover the latest research, thought-provoking essays, and updates from the OGENE community.
                        </p>
                    </div>

                    {/* Featured Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
                        {/* Main Featured Article */}
                        <div className="group cursor-pointer relative overflow-hidden rounded-3xl shadow-lg border border-ogene-100 h-full min-h-[400px]">
                            <img
                                src="https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=800"
                                alt="Featured Article"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-8 text-white">
                                <span className="bg-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Featured</span>
                                <h3 className="text-2xl md:text-3xl font-serif font-bold mb-3 leading-tight group-hover:text-blue-200 transition-colors">
                                    Exploring Future Renewable Energy Innovations in West Africa
                                </h3>
                                <div className="flex items-center text-ogene-200 text-sm mb-4 gap-4">
                                    <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> December 11, 2025</span>
                                </div>
                                <p className="text-ogene-100 line-clamp-2 md:line-clamp-3 mb-4 hidden sm:block">
                                    Embark on a journey with us as we delve into the realms of innovation, share insights, and explore the transformative power of technology in the energy sector.
                                </p>
                            </div>
                        </div>

                        {/* Side Articles */}
                        <div className="flex flex-col gap-6 justify-between">
                            {[
                                { title: "From Ideas to Impact in a Startup's Journey", date: "Nov 20, 2025", img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400" },
                                { title: "Navigating the Tech Landscape with Insights", date: "Nov 18, 2025", img: "https://images.unsplash.com/photo-1504384308090-c54be3855833?auto=format&fit=crop&q=80&w=400" },
                                { title: "Behind the Scenes of Crafting Our Startup", date: "Nov 15, 2025", img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 group cursor-pointer bg-ogene-50 p-4 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-ogene-100">
                                    <div className="w-24 h-24 sm:w-32 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden">
                                        <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h4 className="font-serif font-bold text-ogene-900 text-lg leading-tight group-hover:text-blue-600 transition-colors mb-2">
                                            {item.title}
                                        </h4>
                                        <div className="flex items-center text-ogene-500 text-xs gap-4">
                                            <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> {item.date}</span>
                                            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-blue-500 font-medium">Read More <ArrowRight className="w-3 h-3" /></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Latest Articles Subheader */}
                    <div className="mb-10 border-b border-ogene-200 pb-4">
                        <h3 className="text-2xl font-serif font-bold text-ogene-900 flex items-center gap-2">
                            Explore Our Latest Articles
                            <span className="h-1 w-20 bg-ogene-200 rounded-full ml-4"></span>
                        </h3>
                    </div>

                    {/* Articles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {[
                            { title: "Empowering Entrepreneurs Success Unveiled", date: "Nov 21, 2025", img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=400" },
                            { title: "Thriving in a Dynamic Startup Landscape", date: "Dec 08, 2025", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400" },
                            { title: "Strategies Propelling Tech Startups to Success", date: "Dec 08, 2025", img: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400" },
                            { title: "Pioneering the Future in Our Startup Showcase", date: "Dec 08, 2025", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400" },
                            { title: "Artificial Intelligence Impact on Modern Industries", date: "Dec 11, 2025", img: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=400" },
                            { title: "Healthy Eating Habits for a Busy Lifestyle", date: "Dec 11, 2025", img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400" }
                        ].map((article, idx) => (
                            <div key={idx} className="bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow border border-ogene-100 group cursor-pointer flex flex-col h-full">
                                <div className="h-48 overflow-hidden relative">
                                    <img src={article.img} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                </div>
                                <div className="p-6 flex flex-col flex-1">
                                    <h4 className="text-xl font-serif font-bold text-ogene-900 mb-3 group-hover:text-blue-600 transition-colors">
                                        {article.title}
                                    </h4>
                                    <div className="mt-auto pt-4 flex items-center justify-between text-xs text-ogene-500 border-t border-ogene-50">
                                        <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg> {article.date}</span>
                                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform font-bold text-ogene-700 group-hover:text-blue-600 cursor-pointer">Read More <ArrowRight className="w-3 h-3" /></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link to="/login">
                            <Button variant="outline" size="lg" className="rounded-full px-8 py-6 border-ogene-900 text-ogene-900 hover:bg-ogene-900 hover:text-white transition-colors text-lg font-bold">
                                View all articles
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>



            {/* FAQ SECTION */}
            <section className="py-20 md:py-32 bg-ogene-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6 uppercase tracking-wider">Spotless - Knowledge Solution</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-ogene-900">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {[
                            {
                                question: "How do I submit an article?",
                                answer: (
                                    <>
                                        Submitting an article is simple. We have a dedicated submission verification process.
                                        Please scroll down to our <a href="#submit-article" onClick={(e) => {
                                            e.preventDefault();
                                            document.getElementById('submit-article')?.scrollIntoView({ behavior: 'smooth' });
                                        }} className="text-blue-600 font-bold hover:underline">Submission Section</a> below to get started with your manuscript upload.
                                    </>
                                )
                            },
                            {
                                question: "Who is the university behind this blog?",
                                answer: "OGENE is proudly powered by the African University of Benin (AUB). We aim to bridge the gap between academic research and public knowledge across the continent."
                            },
                            {
                                question: "Is it a general journal?",
                                answer: "Yes, OGENE is a multidisciplinary platform. We welcome submissions from various fields including Humanities, Social Sciences, Technology, and Arts, provided they offer deep insights relevant to the African context."
                            },
                            {
                                question: "What is the review process like?",
                                answer: "All submissions undergo a rigorous peer-review process by our editorial team and subject matter experts from AUB to ensure accuracy, relevance, and quality."
                            },
                            {
                                question: "Do I need to pay to publish?",
                                answer: "We offer various publishing models. Please contact our support team or check the submission guidelines for detailed information on processing fees and open-access options."
                            }
                        ].map((faq, idx) => (
                            <FAQItem key={idx} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </section>

            {/* VIDEO TESTIMONIALS SECTION */}
            <section className="py-20 md:py-32 bg-ogene-900 text-white overflow-hidden relative">
                {/* Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <span className="inline-block py-1 px-3 rounded-full bg-ogene-800 text-blue-400 text-sm font-medium mb-6 uppercase tracking-wider border border-ogene-700">Real Stories</span>
                        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">
                            See How OGENE Impacts Lives
                        </h2>
                        <p className="text-lg text-ogene-300 max-w-2xl mx-auto">
                            Watch interviews with researchers, students, and startup founders who are shaping the future of Africa.
                        </p>
                    </div>

                    <VideoTestimonialSlider />

                </div>
            </section>

            {/* SUBMIT ARTICLE SECTION */}
            <section id="submit-article" className="py-20 md:py-32 bg-white border-t border-ogene-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-ogene-900 mb-6">
                        Ready to Contribute?
                    </h2>
                    <p className="text-xl text-ogene-600 mb-10 max-w-2xl mx-auto">
                        Share your research with a global audience. Our submission process is streamlined to help you get published faster.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 text-left">
                        <div className="p-6 bg-ogene-50 rounded-2xl border border-ogene-100">
                            <span className="text-4xl font-bold text-ogene-200 mb-4 block">01</span>
                            <h4 className="font-bold text-ogene-900 mb-2">Prepare Manuscript</h4>
                            <p className="text-sm text-ogene-500">Ensure your work follows our formatting guidelines and citation style.</p>
                        </div>
                        <div className="p-6 bg-ogene-50 rounded-2xl border border-ogene-100">
                            <span className="text-4xl font-bold text-ogene-200 mb-4 block">02</span>
                            <h4 className="font-bold text-ogene-900 mb-2">Submit & Review</h4>
                            <p className="text-sm text-ogene-500">Upload your file for peer review. Track your status in real-time.</p>
                        </div>
                        <div className="p-6 bg-ogene-50 rounded-2xl border border-ogene-100">
                            <span className="text-4xl font-bold text-ogene-200 mb-4 block">03</span>
                            <h4 className="font-bold text-ogene-900 mb-2">Get Published</h4>
                            <p className="text-sm text-ogene-500">Once approved, your article goes live and joins our digital library.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup">
                            <Button size="lg" className="px-10 py-6 text-lg rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200">
                                Start Submission
                            </Button>
                        </Link>
                        <a href="/guidelines" className="text-ogene-600 font-medium hover:text-ogene-900 flex items-center justify-center px-6">
                            Read Guidelines
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="py-24 bg-ogene-900 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-ogene-800 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-ogene-800 rounded-full blur-3xl opacity-50"></div>

                <div className="relative max-w-4xl mx-auto px-4 text-center z-10">
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4 sm:mb-6">Ready to start reading?</h2>
                    <p className="text-lg sm:text-xl text-ogene-200 mb-8 sm:mb-10">
                        Join thousands of readers and support independent voices today.
                    </p>
                    <Link to="/signup">
                        <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-10 text-base sm:text-lg rounded-full bg-white text-ogene-900 hover:bg-ogene-100 font-bold shadow-lg">
                            Create Free Account
                        </Button>
                    </Link>
                </div>
            </section>
        </div >
    );
}
