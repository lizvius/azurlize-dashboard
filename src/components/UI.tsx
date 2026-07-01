import React from 'react';

export const Card = ({ children, className = '' }: any) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors ${className}`}>{children}</div>
);

export const Badge = ({ children, variant = 'default', className = '' }: any) => {
    const variants: Record<string, string> = {
        default: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
        success: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
        warning: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
        danger: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50',
    };
    
    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm transition-all ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

export const ProgressBar = ({ progress, label, color = 'bg-indigo-600' }: any) => (
    <div className="w-full">
        <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                {label}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                {progress}%
            </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700/50 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
                className={`h-full rounded-full ${color} transition-all duration-1000 ease-out relative overflow-hidden`} 
                style={{ width: `${progress}%` }}
            >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
            </div>
        </div>
    </div>
);

export const CustomDialog = ({ 
    isOpen, 
    title, 
    message, 
    type = 'confirm', 
    confirmText = 'Ya', 
    cancelText = 'Batal', 
    onConfirm, 
    onCancel 
}: {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'alert' | 'confirm' | 'success' | 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
}) => {
    if (!isOpen) return null;
    
    const iconMap = {
        alert: { icon: 'ph-info', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900', btn: 'bg-indigo-600 hover:bg-indigo-700' },
        confirm: { icon: 'ph-question', color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900', btn: 'bg-purple-600 hover:bg-purple-700' },
        success: { icon: 'ph-check-circle', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900', btn: 'bg-emerald-600 hover:bg-emerald-700' },
        warning: { icon: 'ph-warning', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900', btn: 'bg-amber-600 hover:bg-amber-700' },
        danger: { icon: 'ph-trash-simple', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900', btn: 'bg-rose-600 hover:bg-rose-700' },
    };

    const style = iconMap[type] || iconMap.confirm;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
            
            {/* Modal Body */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border mb-5 shadow-sm ${style.color}`}>
                        <i className={`ph-bold ${style.icon}`}></i>
                    </div>
                    
                    {/* Title & Msg */}
                    <h3 className="font-black text-lg sm:text-xl text-gray-900 dark:text-white mb-2 leading-tight tracking-tight">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 font-medium">
                        {message}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex gap-3 w-full">
                        {type !== 'alert' && type !== 'success' && onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs sm:text-sm transition-colors active:scale-95"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onConfirm}
                            className={`flex-1 py-3 text-white font-black rounded-2xl text-xs sm:text-sm transition-all shadow-md active:scale-95 ${style.btn}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
