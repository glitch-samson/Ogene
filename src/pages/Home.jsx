import React, { useState, useEffect } from 'react';
import useUserStore from '../store/userStore';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Send, ClipboardCheck, Users2, PenTool, Stamp, BookOpenCheck, Mail, Phone, Calendar } from 'lucide-react';
import { Button, ArticleCard } from '../components/ui';
import FeaturedCarousel from '../components/ui/FeaturedCarousel';
import ArticleSearchBand from '../components/ui/ArticleSearchBand';
import { withAuthors } from '../lib/authors';

// How many of the newest articles rotate through the featured carousel; the
// next GRID_COUNT fill the "Recently Published" grid underneath.
const FEATURED_COUNT = 5;
const GRID_COUNT = 6;

function FAQItem({ question, answer }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-ogene-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
            <button
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-lg font-bold text-ogene-900">{question}</span>
                <span className={`transform transition-transform duration-300 text-ogene-400 ${isOpen ? 'rotate-180 text-navy-700' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </button>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-6 text-ogene-600 leading-relaxed text-base border-t border-ogene-50 pt-4">
                    {answer}
                </div>
            </div>
        </div>
    );
}

const PIPELINE_STAGES = [
    { icon: Send, label: 'Submission' },
    { icon: ClipboardCheck, label: 'Editorial Screening' },
    { icon: Users2, label: 'Peer Review' },
    { icon: PenTool, label: 'Production Editing' },
    { icon: Stamp, label: 'Final Approval' },
    { icon: BookOpenCheck, label: 'Published' },
];

export default function Home() {
    const { user, profile } = useUserStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [impactFactor, setImpactFactor] = useState(null);
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        if (user && profile) {
            navigate('/library');
        }
    }, [user, profile, navigate]);

    useEffect(() => {
        fetchHomeData();
    }, []);

    const fetchHomeData = async () => {
        try {
            const [{ data: statsData }, { data: settingsData }, { data: articlesData }] = await Promise.all([
                supabase.rpc('journal_stats'),
                supabase.from('site_settings').select('*').eq('key', 'impact_factor').maybeSingle(),
                withAuthors((sel) => supabase.from('articles').select(sel).eq('is_public', true).order('created_at', { ascending: false }).limit(FEATURED_COUNT + GRID_COUNT)),
            ]);
            if (statsData && statsData[0]) setStats(statsData[0]);
            if (settingsData?.value) setImpactFactor(settingsData.value);
            setArticles(articlesData || []);
        } catch (err) {
            console.error('Error loading homepage data:', err);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* HERO */}
            <section className="relative bg-navy-900 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 md:pb-28">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="flex flex-col items-center text-center max-w-3xl mx-auto"
                    >
                        <img src="/aub-seal.png" alt="African University of Benin seal" className="w-20 h-20 mb-6" />
                        <span className="inline-block py-1 px-4 rounded-full bg-white/10 border border-white/20 text-gold-300 text-xs font-bold uppercase tracking-widest mb-6">
                            A Publication of the African University of Benin
                        </span>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-6 leading-tight">
                            OGENE <span className="text-gold-400">Journal</span>
                        </h1>
                        <p className="text-lg md:text-xl text-navy-100 mb-10 leading-relaxed">
                            A multidisciplinary, open-access, peer-reviewed journal sharing rigorous African scholarship with the world.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/submit">
                                <Button size="lg" className="h-14 px-8 text-base rounded-full bg-gold-400 hover:bg-gold-500 text-navy-900 font-bold shadow-xl">
                                    Submit Your Manuscript
                                </Button>
                            </Link>
                            <Link to="/articles">
                                <Button size="lg" variant="outline" className="h-14 px-8 text-base rounded-full border-white/30 text-white hover:bg-white/10">
                                    Browse Published Research
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Stats strip — real numbers, computed server-side */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 pt-12 border-t border-white/10">
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-white">{stats?.published_count ?? '—'}</p>
                            <p className="text-xs md:text-sm text-navy-300 uppercase tracking-wider mt-1">Published Articles</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-white">{stats?.acceptance_rate != null ? `${stats.acceptance_rate}%` : '—'}</p>
                            <p className="text-xs md:text-sm text-navy-300 uppercase tracking-wider mt-1">Acceptance Rate</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-white">{stats?.avg_decision_days != null ? `${stats.avg_decision_days}d` : '—'}</p>
                            <p className="text-xs md:text-sm text-navy-300 uppercase tracking-wider mt-1">Avg. Decision Time</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl md:text-4xl font-bold text-white">{impactFactor ?? 'N/A'}</p>
                            <p className="text-xs md:text-sm text-navy-300 uppercase tracking-wider mt-1">Impact Factor</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEARCH — straight after the hero */}
            <ArticleSearchBand articleCount={stats?.published_count ?? null} />

            {/* FEATURED + RECENTLY PUBLISHED — real data throughout; hidden
                only when there's genuinely nothing published yet. The newest
                few rotate through the featured carousel; the rest fill the
                grid below it. */}
            {articles.length > 0 && (() => {
                const featured = articles.slice(0, FEATURED_COUNT);
                const rest = articles.slice(FEATURED_COUNT);
                return (
                    <section className="py-16 md:py-24 bg-white">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy-900">Featured Research</h2>
                                <Link to="/articles" className="text-navy-800 font-semibold hover:underline flex items-center gap-1 whitespace-nowrap">
                                    View all <ArrowRight size={16} />
                                </Link>
                            </div>

                            <FeaturedCarousel items={featured} />

                            {rest.length > 0 && (
                                <>
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy-900">Recently Published</h2>
                                            <p className="text-ogene-500 mt-2">More peer-reviewed research from Oghene Journal.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {rest.map(a => <ArticleCard key={a.id} article={a} />)}
                                    </div>
                                </>
                            )}
                        </div>
                    </section>
                );
            })()}

            {/* HOW PUBLICATION WORKS */}
            <section className="py-16 md:py-24 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy-900 mb-4">How Publication Works</h2>
                        <p className="text-ogene-600">From submission to publication, every manuscript passes through rigorous editorial and peer review.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-0">
                        {PIPELINE_STAGES.map((stage, i) => (
                            <React.Fragment key={stage.label}>
                                <div className="flex flex-col items-center text-center md:flex-1">
                                    <div className="w-14 h-14 rounded-full bg-navy-50 text-navy-800 flex items-center justify-center mb-3 border-2 border-navy-100">
                                        <stage.icon size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-ogene-900">{stage.label}</p>
                                </div>
                                {i < PIPELINE_STAGES.length - 1 && (
                                    <div className="hidden md:block flex-1 h-0.5 bg-gold-200 mt-7 -mx-2"></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24 bg-ogene-50/60">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-serif font-bold text-navy-900">Frequently Asked Questions</h2>
                    </div>
                    <div className="space-y-4">
                        {[
                            {
                                question: "How do I submit a manuscript?",
                                answer: <>Create an account, then visit your <Link to="/submit" className="text-navy-700 font-bold hover:underline">Submit Manuscript</Link> page. You'll need a PDF or DOCX file with all identifying information removed for double-blind review.</>
                            },
                            {
                                question: "Who is the university behind this journal?",
                                answer: "Oghene Journal is published under the African University of Benin (AUB), bridging rigorous academic research with public knowledge across the continent."
                            },
                            {
                                question: "Is it a general journal?",
                                answer: "Yes — Oghene Journal is multidisciplinary. We welcome submissions from the Humanities, Social Sciences, Natural Sciences, Engineering, and Medicine, provided they meet our standards for original research."
                            },
                            {
                                question: "What is the review process like?",
                                answer: "Every submission passes through editorial screening, then double-blind peer review by two independent reviewers, then production editing and a final editorial sign-off before publication."
                            },
                            {
                                question: "Is it open access?",
                                answer: "Yes. Every published article is free to read — no subscription or paywall."
                            },
                        ].map((faq, idx) => <FAQItem key={idx} question={faq.question} answer={faq.answer} />)}
                    </div>
                </div>
            </section>

            {/* CONTACT */}
            <section id="contact-us" className="py-16 md:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
                        <div className="flex-1 text-center lg:text-left">
                            <h4 className="text-sm font-bold tracking-widest text-ogene-500 uppercase mb-4">Get in Touch</h4>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-navy-900 mb-6 leading-tight">
                                Questions about submitting, reviewing, or partnering with us?
                            </h2>
                            <p className="text-lg text-ogene-600 mb-10 leading-relaxed">
                                Reach out to the editorial team — we're happy to help.
                            </p>

                            <div className="flex flex-col gap-6 items-center lg:items-start">
                                <a href="mailto:info@ogene.com" className="flex items-center gap-4 group">
                                    <div className="h-12 w-12 bg-navy-50 rounded-full flex items-center justify-center text-navy-800 group-hover:bg-navy-800 group-hover:text-white transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-ogene-500 font-medium">Email</p>
                                        <p className="text-lg font-bold text-ogene-900">info@ogene.com</p>
                                    </div>
                                </a>

                                <a href="tel:+22948785690" className="flex items-center gap-4 group">
                                    <div className="h-12 w-12 bg-navy-50 rounded-full flex items-center justify-center text-navy-800 group-hover:bg-navy-800 group-hover:text-white transition-colors">
                                        <Phone size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm text-ogene-500 font-medium">Phone number</p>
                                        <p className="text-lg font-bold text-ogene-900">+229 48 78 56 90</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <div className="flex-1 w-full max-w-lg">
                            <div className="bg-ogene-50 rounded-3xl shadow-xl p-8 sm:p-10 border border-ogene-100">
                                <form className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-ogene-700 mb-2">Name</label>
                                        <input type="text" id="name" className="w-full px-4 py-3 rounded-xl bg-white border border-ogene-200 focus:ring-2 focus:ring-navy-400 transition-all placeholder:text-ogene-400" placeholder="Jane Smith" />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-ogene-700 mb-2">Email</label>
                                        <input type="email" id="email" className="w-full px-4 py-3 rounded-xl bg-white border border-ogene-200 focus:ring-2 focus:ring-navy-400 transition-all placeholder:text-ogene-400" placeholder="jane@example.com" />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-ogene-700 mb-2">Message</label>
                                        <textarea id="message" rows={4} className="w-full px-4 py-3 rounded-xl bg-white border border-ogene-200 focus:ring-2 focus:ring-navy-400 transition-all placeholder:text-ogene-400 resize-none" placeholder="Type your message"></textarea>
                                    </div>
                                    <Button className="w-full bg-navy-800 text-white hover:bg-navy-900 rounded-full py-4 text-lg font-bold shadow-lg flex items-center justify-center gap-2 group">
                                        Send Message
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
