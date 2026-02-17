import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from './index';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

const slides = [
    {
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=2574&auto=format&fit=crop',
        title: 'Voice of the <span class="text-ogene-300">Intellect</span>',
        description: 'Discover deeply researched articles, support independent journalism, and expand your horizons with OGENE.',
        btn1Text: 'Get Started',
        btn1Link: '/signup',
        btn2Text: 'Our Mission',
        btn2Link: '#scholarly-foundations'
    },
    {
        image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=2574&auto=format&fit=crop',
        title: 'Preserving <span class="text-ogene-300">Heritage</span>',
        description: 'Exploring the profound nuances of history, culture, and social thought through modern research.',
        btn1Text: 'Browse Library',
        btn1Link: '/articles',
        btn2Text: 'Learn More',
        btn2Link: '/about'
    },
    {
        image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2574&auto=format&fit=crop',
        title: 'Knowledge is <span class="text-ogene-300">Power</span>',
        description: 'Join a community of original thinkers and access high-quality content from verified experts.',
        btn1Text: 'Join Now',
        btn1Link: '/signup',
        btn2Text: 'View Articles',
        btn2Link: '/articles'
    }
];

export default function HeroSlider() {
    return (
        <section className="relative w-full h-[500px] sm:h-[600px] lg:h-[800px] bg-ogene-900 overflow-hidden">
            <Swiper
                spaceBetween={0}
                centeredSlides={true}
                effect={'fade'}
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                    dynamicBullets: true,
                }}
                navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                }}
                modules={[Autoplay, Pagination, Navigation, EffectFade]}
                className="w-full h-full"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide key={index}>
                        <div className="relative w-full h-full">
                            {/* Background Image with Overlay */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] scale-110 group-hover:scale-100"
                                style={{ backgroundImage: `url(${slide.image})` }}
                            >
                                <div className="absolute inset-0 bg-ogene-900/60 transition-opacity duration-700"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-ogene-900 via-ogene-900/40 to-transparent"></div>
                            </div>

                            {/* Content */}
                            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center z-10">
                                <motion.div
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.2 }}
                                    className="w-full"
                                >
                                    <h1
                                        className="text-3xl sm:text-5xl md:text-7xl font-serif font-bold mb-4 sm:mb-6 tracking-tight leading-tight text-white"
                                        dangerouslySetInnerHTML={{ __html: slide.title }}
                                    ></h1>
                                    <p className="text-base sm:text-xl md:text-2xl text-ogene-100 mb-6 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4 sm:px-2">
                                        {slide.description}
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 max-w-sm mx-auto sm:max-w-none">
                                        <Link to={slide.btn1Link} className="w-full sm:w-auto">
                                            <Button size="lg" className="w-full h-12 sm:h-14 px-8 text-base sm:text-lg rounded-full bg-white text-ogene-900 hover:bg-ogene-100 border-none shadow-lg hover:shadow-xl transition-all">
                                                {slide.btn1Text}
                                            </Button>
                                        </Link>
                                        <Link to={slide.btn2Link} className="w-full sm:w-auto">
                                            <Button size="lg" variant="outline" className="w-full h-12 sm:h-14 px-8 text-base sm:text-lg rounded-full border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all">
                                                {slide.btn2Text}
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}

                {/* Navigation Buttons - Hidden on mobile */}
                <div className="swiper-button-prev !hidden md:!flex"></div>
                <div className="swiper-button-next !hidden md:!flex"></div>
            </Swiper>

            <style dangerouslySetInnerHTML={{
                __html: `
                .swiper-button-next, .swiper-button-prev {
                    color: white !important;
                    background: rgba(255, 255, 255, 0.1);
                    width: 50px !important;
                    height: 50px !important;
                    border-radius: 50%;
                    backdrop-filter: blur(4px);
                    transition: all 0.3s ease;
                    display: none !important;
                }
                @media (min-width: 768px) {
                    .swiper-button-next, .swiper-button-prev {
                        display: flex !important;
                    }
                }
                .swiper-button-next:after, .swiper-button-prev:after {
                    font-size: 20px !important;
                }
                .swiper-button-next:hover, .swiper-button-prev:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                .swiper-pagination-bullet {
                    background: white !important;
                    opacity: 0.5;
                }
                .swiper-pagination-bullet-active {
                    background: #d4af37 !important;
                    opacity: 1;
                    width: 24px;
                    border-radius: 4px;
                }
                
                /* Ensure pagination is always visible but doesn't overlap content on small height screens */
                .swiper-pagination {
                    bottom: 20px !important;
                }
            `}} />
        </section>
    );
}
