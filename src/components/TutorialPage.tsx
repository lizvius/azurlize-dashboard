import React, { useState, useEffect } from 'react';
import { TutorialService, TutorialStep, DEFAULT_TUTORIAL_STEPS } from '../services/TutorialService';

interface TutorialPageProps {
    onBack: () => void;
    isDark: boolean;
}

export const TutorialPage: React.FC<TutorialPageProps> = ({ onBack, isDark }) => {
    const [steps, setSteps] = useState<TutorialStep[]>(DEFAULT_TUTORIAL_STEPS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
    const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
    const [lightboxData, setLightboxData] = useState<{images: string[], index: number} | null>(null);

    useEffect(() => {
        setActiveImageIndex(0);
    }, [activeStepIndex]);

    useEffect(() => {
        let isMounted = true;
        const loadSteps = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const stepsData = await TutorialService.getTutorialSteps();
                if (isMounted) {
                    setSteps(stepsData);
                    setIsLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || 'Gagal memuat langkah');
                    setIsLoading(false);
                }
            }
        };
        loadSteps();
        return () => { isMounted = false; };
    }, []);

    const activeStepData = steps[activeStepIndex] || steps[0];

    const handleNext = () => {
        if (activeStepIndex < steps.length - 1) {
            setActiveStepIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (activeStepIndex > 0) {
            setActiveStepIndex(prev => prev - 1);
        }
    };

    return (
        <div className={`min-h-screen ${isDark ? 'dark bg-[#0B0F19]' : 'bg-[#F8FAFC]'}`}>
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-[#0B0F19]/70 border-b border-gray-200/80 dark:border-gray-800/80 pt-[env(safe-area-inset-top)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <i className="ph-bold ph-arrow-left text-lg"></i>
                        <span className="font-bold text-sm hidden sm:inline">Kembali</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <i className="ph-bold ph-graduation-cap text-indigo-500 text-xl"></i>
                        <span className="font-black text-gray-900 dark:text-white text-sm sm:text-base">Panduan Langkah</span>
                    </div>
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        {activeStepIndex + 1} / {steps.length}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 shadow-xl relative overflow-hidden">
                        {/* Diagonal glow behind */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>

                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider rounded-xl border border-indigo-100/50">
                                Langkah {activeStepData?.step}
                            </span>
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-indigo-500/20">
                                <i className={`ph-bold ${activeStepData?.icon}`}></i>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{activeStepData?.title}</h3>
                            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-300 leading-relaxed font-medium">
                                {activeStepData?.description}
                            </p>
                        </div>

                        {/* Image gallery slide */}
                        {activeStepData?.images && activeStepData.images.length > 0 && (
                            <div className="space-y-3 pt-6">
                                <span className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Materi & Panduan Visual ({activeStepData.images.length} Gambar)</span>
                                
                                <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#131926] group">
                                    <img 
                                        src={activeStepData.images[activeImageIndex]} 
                                        alt={`Panduan langkah ${activeImageIndex + 1}`}
                                        className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 hover:scale-[1.015]"
                                        onClick={() => setLightboxData({ images: activeStepData.images || [], index: activeImageIndex })}
                                        referrerPolicy="no-referrer"
                                    />
                                    {/* Back button */}
                                    {activeStepData.images.length > 1 && (
                                        <button 
                                            type="button"
                                            onClick={() => setActiveImageIndex(prev => prev === 0 ? activeStepData.images!.length - 1 : prev - 1)}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center text-sm sm:text-base opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:scale-95"
                                        >
                                            <i className="ph-bold ph-caret-left"></i>
                                        </button>
                                    )}
                                    {/* Next button */}
                                    {activeStepData.images.length > 1 && (
                                        <button 
                                            type="button"
                                            onClick={() => setActiveImageIndex(prev => prev === activeStepData.images!.length - 1 ? 0 : prev + 1)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center text-sm sm:text-base opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity active:scale-95"
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
                                                className={`relative w-16 sm:w-20 aspect-video rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
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

                        <div className="mt-10 flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700/60">
                            <button
                                onClick={handlePrev}
                                disabled={activeStepIndex === 0}
                                className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                                    activeStepIndex === 0 
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95'
                                }`}
                            >
                                <i className="ph-bold ph-arrow-left"></i> <span className="hidden sm:inline">Sebelumnya</span>
                            </button>

                            {activeStepIndex < steps.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-sm uppercase tracking-wider shadow-md shadow-indigo-600/10 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    Selanjutnya <i className="ph-bold ph-arrow-right"></i>
                                </button>
                            ) : (
                                <button
                                    onClick={onBack}
                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm uppercase tracking-wider shadow-md shadow-emerald-600/10 transition-all flex items-center gap-2 active:scale-95"
                                >
                                    Selesai <i className="ph-bold ph-check"></i>
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </main>

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
