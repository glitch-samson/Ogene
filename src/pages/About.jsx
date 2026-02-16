import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Shield, Newspaper, Sparkles, Award } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const values = [
    {
        icon: Target,
        title: "Intellectual Rigor",
        description: "We believe in deeply researched, well-reasoned articles that challenge and inspire."
    },
    {
        icon: Shield,
        title: "Platform Integrity",
        description: "A secure environment where creators own their work and readers find truth."
    },
    {
        icon: Users,
        title: "Vibrant Community",
        description: "Connecting original thinkers and fostering dialogue across cultures and generations."
    },
    {
        icon: Sparkles,
        title: "Cultural Preservation",
        description: "Using modern technology to protect and propagate ancestral wisdom and history."
    }
];

const pioneers = [
    {
        name: "Dr. Amara Okoro",
        role: "Founder & Chief Editor",
        bio: "Scholar of African History with over 15 years of research in pre-colonial social structures.",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop"
    },
    {
        name: "Kelechi Nnamdi",
        role: "Head of Technology",
        bio: "Systems architect focused on creating decentralized platforms for knowledge distribution.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop"
    },
    {
        name: "Sarah Abiola",
        role: "Community Director",
        bio: "Expert in digital engagement strategies for non-profit and educational initiatives.",
        image: "https://images.unsplash.com/photo-1598550874175-4d0fe4a2c9fa?q=80&w=600&auto=format&fit=crop"
    },
    {
        name: "Afolabi Tunde",
        role: "Lead Researcher",
        bio: "Investigative journalist dedicated to uncovering forgotten narratives of cultural heritage.",
        image: "https://images.unsplash.com/photo-1540560083278-d078895c3931?q=80&w=600&auto=format&fit=crop"
    },
    {
        name: "Chioma Onah",
        role: "Arts & Culture Specialist",
        bio: "Curator of digital archives for contemporary African arts and traditional craftsmanship.",
        image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=600&auto=format&fit=crop"
    },
    {
        name: "Bamidele Ayo",
        role: "Historical Archivist",
        bio: "Specialist in digitizing pre-colonial manuscripts and preserving oral traditions.",
        image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=600&auto=format&fit=crop"
    },
    {
        name: "Zainab Idris",
        role: "Educational Outreach",
        bio: "Developing curriculums that bridge traditional knowledge with modern academic standards.",
        image: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=600&auto=format&fit=crop"
    },
    {
        name: "Emeka Eze",
        role: "UX Researcher",
        bio: "Designing interfaces that respect and reflect diverse cultural modes of interaction.",
        image: "https://images.unsplash.com/photo-1519085115850-39fb509426f7?q=80&w=600&auto=format&fit=crop"
    }
];

export default function About() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* HERO SECTION */}
            <section className="relative py-24 bg-ogene-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-ogene-900 via-ogene-900/80 to-ogene-50/50"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-ogene-300 uppercase bg-ogene-800/50 rounded-full border border-ogene-700/50">
                            Our Journey
                        </span>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">About OGENE</h1>
                        <p className="text-xl text-ogene-100 max-w-3xl mx-auto leading-relaxed">
                            OGENE is more than a platform; it's a digital library and a movement dedicated to reclaiming the depth and integrity of intellectual discourse in the modern age.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* OUR STORY SECTION */}
            <section className="py-20 bg-ogene-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-ogene-900 mb-8">Our Story</h2>
                            <div className="space-y-6 text-ogene-700 text-lg leading-relaxed">
                                <p>
                                    Born from a collective desire to see authentic perspectives preserved, Ogene started as a small circle of researchers and writers who believed that the digital world was moving too fast to notice the things that matter most.
                                </p>
                                <p>
                                    The name <span className="font-bold text-ogene-900 font-serif italic">"Ogene"</span> refers to the traditional metal bell used to signal important announcements and summon the community. We see ourselves as that signal—calling for a return to rigorous research and thoughtful reading.
                                </p>
                                <p>
                                    Today, we provide a sustainable ecosystem where knowledge is valued, authors are supported directly, and the echoes of our shared heritage are documented for future generations.
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="rounded-2xl overflow-hidden shadow-2xl border-8 border-white">
                                <img
                                    src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2574&auto=format&fit=crop"
                                    alt="Ogene Research"
                                    className="w-full h-[450px] object-cover"
                                />
                            </div>
                            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg border border-ogene-100 hidden md:block">
                                <div className="flex items-center gap-4">
                                    <div className="bg-ogene-900 p-3 rounded-lg text-white">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-ogene-900">Founding Mission</p>
                                        <p className="text-sm text-ogene-500">Established in 2024</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CORE VALUES */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-ogene-900 mb-4">Our Core Values</h2>
                        <p className="text-ogene-500 max-w-2xl mx-auto">The principles that guide every decision we make and every article we publish.</p>
                        <div className="h-1 w-20 bg-ogene-500 mx-auto mt-6 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.5 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-2xl bg-ogene-50 hover:bg-ogene-100 transition-all group border border-transparent hover:border-ogene-200"
                            >
                                <div className="p-3 bg-white rounded-xl w-fit shadow-sm text-ogene-600 mb-6 group-hover:scale-110 transition-transform">
                                    <value.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-ogene-900 mb-3">{value.title}</h3>
                                <p className="text-ogene-600 leading-relaxed text-sm">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* THE PIONEERS SECTION (SLIDER) */}
            <section className="py-24 bg-ogene-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-ogene-700 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">The Pioneers of OGENE</h2>
                        <p className="text-xl text-ogene-300 max-w-2xl mx-auto">Meet the visionary minds leading the reclamation of intellectual depth.</p>
                    </div>

                    <div className="relative group">
                        <Swiper
                            modules={[Autoplay, Pagination, Navigation]}
                            spaceBetween={30}
                            slidesPerView={1}
                            autoplay={{
                                delay: 3500,
                                disableOnInteraction: false,
                            }}
                            pagination={{
                                clickable: true,
                                dynamicBullets: true,
                            }}
                            navigation={true}
                            breakpoints={{
                                640: { slidesPerView: 2 },
                                1024: { slidesPerView: 3 },
                                1280: { slidesPerView: 4 },
                            }}
                            className="pb-16"
                        >
                            {pioneers.map((pioneer, idx) => (
                                <SwiperSlide key={idx}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.6 }}
                                        viewport={{ once: true }}
                                        className="h-full flex flex-col"
                                    >
                                        <div className="relative mb-6 rounded-2xl overflow-hidden aspect-[4/5] bg-ogene-800">
                                            <div className="absolute inset-0 bg-gradient-to-t from-ogene-950 via-transparent to-transparent opacity-60"></div>
                                            <img
                                                src={pioneer.image}
                                                alt={pioneer.name}
                                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                            />
                                        </div>
                                        <h3 className="text-xl font-bold mb-1">{pioneer.name}</h3>
                                        <p className="text-ogene-400 font-medium mb-4">{pioneer.role}</p>
                                        <p className="text-ogene-300 text-sm leading-relaxed mb-4">{pioneer.bio}</p>
                                    </motion.div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .swiper-button-next, .swiper-button-prev {
                        color: white !important;
                        background: rgba(255, 255, 255, 0.1);
                        width: 44px !important;
                        height: 44px !important;
                        border-radius: 50%;
                        backdrop-filter: blur(4px);
                        transition: all 0.3s ease;
                    }
                    .swiper-button-next:after, .swiper-button-prev:after {
                        font-size: 18px !important;
                    }
                    .swiper-button-next:hover, .swiper-button-prev:hover {
                        background: rgba(255, 255, 255, 0.2);
                        color: #d4af37 !important;
                    }
                    .swiper-pagination-bullet {
                        background: white !important;
                    }
                    .swiper-pagination-bullet-active {
                        background: #d4af37 !important;
                    }
                `}} />
            </section>

            {/* FINAL CTA */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-ogene-900 rounded-3xl p-12 lg:p-20 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-ogene-800 rounded-full blur-3xl opacity-30 -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-ogene-800 rounded-full blur-3xl opacity-30 -ml-32 -mb-32"></div>

                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-6">Be Part of the Resonance</h2>
                            <p className="text-xl text-ogene-200 max-w-2xl mx-auto mb-10">
                                Whether you are a reader seeking truth or a writer seeking a meaningful audience, there is a place for you in our digital library.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="h-14 px-10 text-lg rounded-full bg-white text-ogene-900 hover:bg-ogene-100 font-bold transition-all transform hover:scale-105">
                                    Start Reading
                                </button>
                                <button className="h-14 px-10 text-lg rounded-full bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold transition-all">
                                    Become Author
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
