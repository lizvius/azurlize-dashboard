import React, { useState, useEffect } from 'react';
import { Card } from './UI';
import { TutorialService, TutorialStep, DEFAULT_TUTORIAL_STEPS, LandingConfig, DEFAULT_LANDING_CONFIG } from '../services/TutorialService';

export const LandingPage = ({ onEnterLogin, isDark, onToggleDark }: { onEnterLogin: () => void, isDark: boolean, onToggleDark: () => void }) => {
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
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 text-center lg:text-left grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 rounded-full text-indigo-600 dark:text-indigo-400 text-xs font-bold shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {landingConfig.hero_badge}
                    </div>

                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
                        {landingConfig.hero_title}
                    </h1>

                    <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        {landingConfig.hero_desc}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                        <button 
                            onClick={onEnterLogin}
                            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <i className="ph-bold ph-rocket-launch text-lg animate-bounce"></i> {landingConfig.hero_btn_text}
                        </button>
                        
                        <a 
                            href="#tutorial-section"
                            className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <i className="ph-bold ph-graduation-cap text-lg"></i> Panduan Langkah
                        </a>
                    </div>
                </div>

                {/* HERO STATS OVERVIEW - Grid Cards on Laptop/Tablet */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-4 w-full">
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

            {/* INTERACTIVE RECIPROCATER TUTORIAL SECTION */}
            <section id="tutorial-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <span className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-full">Cara Kerja Perekrut</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mt-3">Langkah Mudah Menjadi Perekrut Hebat</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Disediakan sistem berjenjang terstruktur dari registrasi hingga penarikan gaji yang adil.</p>
                </div>

                {error && (
                    <div className="max-w-md mx-auto mb-6 px-4 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-2xl flex items-center gap-2.5">
                        <i className="ph-bold ph-warning text-base animate-pulse"></i>
                        <span className="flex-1">Gagal terhubung dengan Sheets ({error}). Menggunakan panduan luring default.</span>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#131926]/40 rounded-3xl border border-gray-150 dark:border-gray-800/80 max-w-4xl mx-auto">
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 animate-spin flex items-center justify-center mb-4"></div>
                        <p className="text-sm font-black text-gray-800 dark:text-gray-200">Memuat Langkah Panduan...</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Mengambil materi terbaru dari Google Sheets.</p>
                    </div>
                ) : (
                    <>
                        {/* 1. LAYOUT FOR ANDROID (MOBILE) SCREEN - COLLAPSIBLE ACCORDION */}
                        <div className="block sm:hidden space-y-3 max-w-md mx-auto">
                    {steps.map((step) => {
                        const isExpanded = expandedMobileStep === step.step;
                        return (
                            <div 
                                key={step.step}
                                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                                    isExpanded 
                                        ? 'bg-white dark:bg-gray-800 border-indigo-400 dark:border-indigo-700 shadow-md' 
                                        : 'bg-white/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700/60 hover:border-gray-300'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setExpandedMobileStep(isExpanded ? null : step.step)}
                                    className="w-full px-5 py-4 flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center border border-indigo-100/50">
                                            {step.step}
                                        </span>
                                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                            <i className={`ph-bold ${step.icon} text-indigo-500 text-base`}></i>
                                            {step.title}
                                        </span>
                                    </div>
                                    <i className={`ph-bold ${isExpanded ? 'ph-caret-up' : 'ph-caret-down'} text-gray-400`}></i>
                                </button>
                                
                                {isExpanded && (
                                    <div className="px-5 pb-5 pt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700/30">
                                        <p className="mb-3">{step.description}</p>
                                        
                                        {/* Mobile horizontal scrolling images gallery */}
                                        {step.images && step.images.length > 0 && (
                                            <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 snap-x scrollbar-none">
                                                {step.images.map((img, i) => (
                                                    <div 
                                                        key={i} 
                                                        onClick={(e) => { e.stopPropagation(); setLightboxImage(img); }}
                                                        className="w-40 aspect-video rounded-xl overflow-hidden border border-gray-200/60 dark:border-gray-700/60 shrink-0 snap-start cursor-pointer active:scale-95 transition-transform"
                                                    >
                                                        <img src={img} alt={`Langkah ${step.step} img ${i+1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex justify-end mt-2">
                                            <button 
                                                onClick={onEnterLogin}
                                                className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                                            >
                                                Lanjutkan Tindakan <i className="ph-bold ph-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 2. LAYOUT FOR TAB (TABLET) SCREEN - GRID VIEW */}
                <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4 max-w-3xl mx-auto">
                    {steps.map((step) => (
                        <div 
                            key={step.step} 
                            className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between group hover:border-indigo-400 dark:hover:border-indigo-800 transition-all"
                        >
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center border border-indigo-100">
                                        {step.step}
                                    </span>
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                                        <i className={`ph-bold ${step.icon}`}></i>
                                    </div>
                                </div>
                                <h3 className="font-black text-base text-gray-900 dark:text-white mt-4 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{step.title}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{step.description}</p>
                                
                                {/* Tablet Grid mini preview */}
                                {step.images && step.images.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 mt-4">
                                        {step.images.slice(0, 4).map((img, i) => {
                                            const isLastAndMore = i === 3 && step.images!.length > 4;
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={(e) => { e.stopPropagation(); setLightboxImage(img); }}
                                                    className="relative aspect-video rounded-xl overflow-hidden border border-gray-150 dark:border-gray-700/80 cursor-pointer hover:opacity-85 transition-opacity bg-gray-50 dark:bg-gray-900"
                                                >
                                                    <img src={img} alt={`img ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    {isLastAndMore && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-black text-white">
                                                            +{step.images!.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. LAYOUT FOR LAPTOP/DESKTOP - INTERACTIVE TIMELINE / TABS BENTO VIEW */}
                <div className="hidden lg:grid grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
                    {/* Left tabs/step selectors (5 columns) */}
                    <div className="col-span-5 space-y-3">
                        {steps.map((step) => {
                            const isActive = activeLaptopStep === step.step;
                            return (
                                <button
                                    key={step.step}
                                    type="button"
                                    onClick={() => setActiveLaptopStep(step.step)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 ${
                                        isActive 
                                            ? 'bg-white dark:bg-gray-800 border-indigo-500 dark:border-indigo-600 shadow-md translate-x-2' 
                                            : 'bg-white/50 dark:bg-gray-800/30 border-gray-200/60 dark:border-gray-800/40 hover:bg-white dark:hover:bg-gray-800/60'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center transition-colors shrink-0 ${
                                        isActive 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    }`}>
                                        {step.step}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className={`font-bold text-sm truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-300'}`}>
                                            {step.title}
                                        </h3>
                                    </div>

                                    <i className={`ph-bold ${step.icon} text-lg shrink-0 ${isActive ? 'text-indigo-500' : 'text-gray-400'}`}></i>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right massive preview panel (7 columns) */}
                    <div className="col-span-7 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
                        {/* Diagonal glow behind */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider rounded-xl border border-indigo-100/50">
                                    Langkah {activeStepData?.step} Detail
                                </span>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">
                                    <i className={`ph-bold ${activeStepData?.icon}`}></i>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{activeStepData?.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-300 leading-relaxed font-medium">
                                    {activeStepData?.description}
                                </p>
                            </div>

                            {/* Desktop custom image gallery slide */}
                            {activeStepData?.images && activeStepData.images.length > 0 && (
                                <div className="space-y-3 pt-2">
                                    <span className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Materi & Panduan Visual ({activeStepData.images.length} Gambar)</span>
                                    
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#131926] group">
                                        <img 
                                            src={activeStepData.images[activeImageIndex]} 
                                            alt={`Panduan langkah ${activeImageIndex + 1}`}
                                            className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 hover:scale-[1.015]"
                                            onClick={() => setLightboxImage(activeStepData.images![activeImageIndex])}
                                            referrerPolicy="no-referrer"
                                        />

                                        {/* Back button */}
                                        {activeStepData.images.length > 1 && (
                                            <button 
                                                type="button"
                                                onClick={() => setActiveImageIndex(prev => prev === 0 ? activeStepData.images!.length - 1 : prev - 1)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                                            >
                                                <i className="ph-bold ph-caret-left"></i>
                                            </button>
                                        )}

                                        {/* Next button */}
                                        {activeStepData.images.length > 1 && (
                                            <button 
                                                type="button"
                                                onClick={() => setActiveImageIndex(prev => prev === activeStepData.images!.length - 1 ? 0 : prev + 1)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity active:scale-95"
                                            >
                                                <i className="ph-bold ph-caret-right"></i>
                                            </button>
                                        )}

                                        {/* Counter overlay */}
                                        <div className="absolute bottom-3 right-3 bg-black/75 text-[10px] font-mono font-bold text-white px-2 py-1 rounded-lg">
                                            {activeImageIndex + 1} / {activeStepData.images.length}
                                        </div>
                                    </div>

                                    {/* Thumbnail strip */}
                                    {activeStepData.images.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
                                            {activeStepData.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    className={`relative w-16 aspect-video rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                                                        idx === activeImageIndex 
                                                            ? 'border-indigo-600 scale-95 shadow-sm' 
                                                            : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Additional supportive explanation/mock graphics for laptop */}
                            <div className="bg-gray-50 dark:bg-gray-900/60 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/60 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 text-lg shrink-0">
                                    <i className="ph-bold ph-shield-check-fill"></i>
                                </div>
                                <div className="text-xs">
                                    <span className="block font-bold text-gray-800 dark:text-gray-200">Panduan Resmi Terverifikasi</span>
                                    <span className="block text-gray-400 dark:text-gray-500 mt-0.5">Sesuai SOP perusahaan yang diubah langsung oleh Superadmin.</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700/60">
                            <span className="text-xs text-gray-400 font-bold font-mono">Perekrut Onboarding • SOP v2.0</span>
                            <button 
                                onClick={onEnterLogin}
                                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-all flex items-center gap-1.5 active:scale-95"
                            >
                                Mulai Tindakan Ini <i className="ph-bold ph-arrow-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                </>
                )}
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
            {lightboxImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setLightboxImage(null)}
                >
                    <button 
                        type="button"
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xl transition-all shadow-md active:scale-95"
                    >
                        <i className="ph-bold ph-x"></i>
                    </button>
                    <div 
                        className="max-w-4xl max-h-[85vh] relative rounded-2xl overflow-hidden border border-white/10"
                        onClick={e => e.stopPropagation()}
                    >
                        <img 
                            src={lightboxImage} 
                            alt="Lightbox Preview" 
                            className="w-full h-auto max-h-[80vh] object-contain" 
                            referrerPolicy="no-referrer"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
