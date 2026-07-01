import React, { useState, useEffect } from 'react';
import { Card } from './UI';
import { TutorialService, TutorialStep, DEFAULT_TUTORIAL_STEPS, LandingConfig, DEFAULT_LANDING_CONFIG } from '../services/TutorialService';

export const LandingPage = ({ onEnterLogin, onEnterTutorial, isDark, onToggleDark }: { onEnterLogin: () => void, onEnterTutorial: () => void, isDark: boolean, onToggleDark: () => void }) => {
    // Dynamic tutorial steps loaded from Google Sheets via TutorialService
    const [steps, setSteps] = useState<TutorialStep[]>(DEFAULT_TUTORIAL_STEPS);
    const [landingConfig, setLandingConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Mobile expand state
    const [expandedMobileStep, setExpandedMobileStep] = useState<number | null>(1);
    
    // Laptop tab active state
    const [activeLaptopStep, setActiveLaptopStep] = useState<number>(1);

    // Image slider state for desktop steps
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
    const [lightboxData, setLightboxData] = useState<{images: string[], index: number} | null>(null);

    // Tutorial visibility state
    const [showTutorial, setShowTutorial] = useState<boolean>(false);

    // Sync active image index when active step changes
    useEffect(() => {
        setActiveImageIndex(0);
    }, [activeLaptopStep]);

    // Load tutorial steps dynamically
    useEffect(() => {
        let isMounted = true;
        const loadStepsAndConfig = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [stepsData, configData] = await Promise.all([
                    TutorialService.getTutorialSteps(),
                    TutorialService.getLandingConfig()
                ]);
                if (isMounted) {
                    setSteps(stepsData);
                    setLandingConfig(configData);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err?.message || 'Gagal mengambil data tutorial');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadStepsAndConfig();

        // Listen for updates from System Settings to reload on-the-fly
        const handleSync = () => {
            loadStepsAndConfig();
        };
        window.addEventListener('systemSettingsUpdated', handleSync);

        return () => {
            isMounted = false;
            window.removeEventListener('systemSettingsUpdated', handleSync);
        };
    }, []);

    const activeStepData = steps.find(s => s.step === activeLaptopStep) || steps[0] || DEFAULT_TUTORIAL_STEPS[0];

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100 transition-colors duration-300 pb-16 relative overflow-hidden">
            {/* Background glowing shapes */}
            <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute top-[40%] right-[-200px] w-[600px] h-[600px] bg-purple-600/10 dark:bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-100px] left-[10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* HEADER NAVIGATION BAR */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-[#0B0F19]/70 border-b border-gray-200/80 dark:border-gray-800/80 transition-colors pt-[env(safe-area-inset-top)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 21H7.5L12 11L16.5 21H21L12 2Z" fill="currentColor"/>
                                <path d="M9.5 15H14.5L12 9.5L9.5 15Z" fill="currentColor" fillOpacity="0.4"/>
                            </svg>
                        </div>
                        <div>
                            <span className="font-black text-lg tracking-tight block">Team<span className="text-indigo-600 dark:text-indigo-400">AzurLize</span></span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block -mt-1">Perekrut Platform</span>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Theme Toggle */}
                        <button 
                            onClick={onToggleDark}
                            className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full shadow-sm transition-transform active:scale-95 flex items-center justify-center shrink-0"
                            aria-label="Toggle Theme"
                        >
                            <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-base`}></i>
                        </button>

                        {/* CTA Portal Button */}
                        <button 
                            onClick={onEnterLogin}
                            className="px-3 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[10px] sm:text-xs uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                        >
                            <i className="ph-bold ph-sign-in text-sm"></i> <span className="hidden sm:inline">Portal Perekrut</span><span className="sm:hidden">Portal</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center md:text-left grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
                <div className="md:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {landingConfig.hero_badge}
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                        {landingConfig.hero_title}
                    </h1>

                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto md:mx-0 leading-relaxed">
                        {landingConfig.hero_desc}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-2">
                        <button 
                            onClick={onEnterLogin}
                            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <i className="ph-bold ph-rocket-launch text-lg animate-bounce"></i> {landingConfig.hero_btn_text}
                        </button>
                        
                        <a 
                            href="#tutorial-section"
                            onClick={(e) => { e.preventDefault(); onEnterTutorial(); }}
                            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <i className="ph-bold ph-graduation-cap text-lg"></i> Panduan Langkah
                        </a>
                    </div>
                </div>

                {/* HERO STATS OVERVIEW - Grid Cards on Laptop/Tablet */}
                <div className="md:col-span-5 grid grid-cols-2 gap-4 w-full">
                    {[
                        { title: 'Tunjangan Penuh', desc: 'SLA Kehadiran 7 Hari', value: 'Rp 50K', icon: 'ph-coins', bg: 'from-amber-500/10 to-orange-500/10', text: 'text-amber-500' },
                        { title: 'Database Lancar', desc: 'Pencatatan Real-time', value: '100%', icon: 'ph-arrows-clockwise', bg: 'from-blue-500/10 to-indigo-500/10', text: 'text-blue-500' },
                        { title: 'Jalur Grup Kerja', desc: 'T0 Sandi & V0 Elite', value: '2 Pilihan', icon: 'ph-users-three', bg: 'from-purple-500/10 to-pink-500/10', text: 'text-purple-500' },
                        { title: 'Sistem Terbuka', desc: 'Bebas Salah Hitung', value: 'Transparan', icon: 'ph-shield-check', bg: 'from-emerald-500/10 to-teal-500/10', text: 'text-emerald-500' }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.bg} ${stat.text} flex items-center justify-center text-xl shrink-0`}>
                                <i className={`ph-bold ${stat.icon}`}></i>
                            </div>
                            <div className="mt-4">
                                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">{stat.title}</span>
                                <span className="block text-xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</span>
                                <span className="block text-[10px] text-gray-500 mt-1">{stat.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* PLATFORM BENEFITS SECTION */}
            <section className="bg-gray-100/50 dark:bg-gray-900/30 border-y border-gray-200/60 dark:border-gray-800/60 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full">Keunggulan Platform</span>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-3">{landingConfig.benefits_title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{landingConfig.benefits_desc}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: landingConfig.benefit1_title, desc: landingConfig.benefit1_desc, icon: landingConfig.benefit1_icon },
                            { title: landingConfig.benefit2_title, desc: landingConfig.benefit2_desc, icon: landingConfig.benefit2_icon },
                            { title: landingConfig.benefit3_title, desc: landingConfig.benefit3_desc, icon: landingConfig.benefit3_icon }
                        ].map((b, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-2xl mb-6">
                                    <i className={`ph-bold ${b.icon}`}></i>
                                </div>
                                <h3 className="font-black text-lg text-gray-900 dark:text-white leading-tight mb-2">{b.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CALL TO ACTION BANNER */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
                <div className="bg-gradient-to-br from-indigo-900 to-purple-950 rounded-3xl border border-indigo-800 p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl shadow-indigo-950/20">
                    <div className="absolute top-[-50px] right-[-50px] w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">{landingConfig.cta_title}</h2>
                        <p className="text-sm text-indigo-200 leading-relaxed">
                            {landingConfig.cta_desc}
                        </p>
                        
                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button 
                                onClick={onEnterLogin}
                                className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-900 font-black rounded-2xl text-xs uppercase tracking-wider hover:bg-gray-100 transition-all shadow-lg active:scale-95"
                            >
                                Buka Portal Login
                            </button>
                            <span className="text-indigo-300 font-bold text-xs">atau hubungi admin jika belum terdaftar.</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* LIGHTBOX MODAL */}
            {lightboxData && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setLightboxData(null)}
                >
                    <button 
                        type="button"
                        onClick={() => setLightboxData(null)}
                        className="absolute top-4 right-4 z-50 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xl transition-all shadow-md active:scale-95"
                    >
                        <i className="ph-bold ph-x"></i>
                    </button>
                    
                    <div 
                        className="max-w-5xl w-full max-h-[90vh] relative flex items-center justify-center"
                        onClick={e => e.stopPropagation()}
                    >
                        {lightboxData.images.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxData(prev => prev ? { ...prev, index: prev.index === 0 ? prev.images.length - 1 : prev.index - 1 } : null);
                                }}
                                className="absolute left-0 sm:-left-12 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl backdrop-blur-md transition-all active:scale-95"
                            >
                                <i className="ph-bold ph-caret-left"></i>
                            </button>
                        )}

                        <div className="relative rounded-2xl overflow-hidden border border-white/10 max-h-[85vh] w-full flex items-center justify-center bg-black/50">
                            <img 
                                src={lightboxData.images[lightboxData.index]} 
                                alt={`Lightbox Preview ${lightboxData.index + 1}`} 
                                className="max-w-full max-h-[85vh] object-contain cursor-zoom-out" 
                                referrerPolicy="no-referrer"
                                onClick={() => setLightboxData(null)}
                            />
                        </div>

                        {lightboxData.images.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxData(prev => prev ? { ...prev, index: prev.index === prev.images.length - 1 ? 0 : prev.index + 1 } : null);
                                }}
                                className="absolute right-0 sm:-right-12 z-50 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl backdrop-blur-md transition-all active:scale-95"
                            >
                                <i className="ph-bold ph-caret-right"></i>
                            </button>
                        )}
                        
                        {lightboxData.images.length > 1 && (
                            <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
                                {lightboxData.images.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-2 h-2 rounded-full transition-all ${idx === lightboxData.index ? 'bg-white scale-125' : 'bg-white/30'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
