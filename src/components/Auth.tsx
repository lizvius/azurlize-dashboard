import React, { useState } from 'react';
import { Card } from './UI';
import { SCRIPT_URL } from '../utils';

export const Login = ({ onLogin, onBack, isDark, onToggleDark }: any) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({ username: '', uid: '' });

    const handleSubmit = async (e: any) => {
        e.preventDefault(); 
        setIsLoading(true); 
        setErrorMsg('');
        try {
            const response = await fetch(SCRIPT_URL, { 
                method: 'POST', 
                body: JSON.stringify({ action: 'getUsers' }) 
            });
            const result = await response.json();
            
            if (result.status === 'success' && Array.isArray(result.data)) {
                const cleanInputUsername = formData.username.trim().toLowerCase();
                const cleanInputUid = formData.uid.trim();
                
                const inputWithAt = cleanInputUsername.startsWith('@') ? cleanInputUsername : '@' + cleanInputUsername;
                const inputWithoutAt = cleanInputUsername.startsWith('@') ? cleanInputUsername.slice(1) : cleanInputUsername;

                const matchedUser = result.data.find((u: any) => {
                    const dbUsername = String(u.username || '').trim().toLowerCase();
                    const dbUid = String(u.uid || '').trim();
                    const dbUsernameWithAt = dbUsername.startsWith('@') ? dbUsername : '@' + dbUsername;
                    const dbUsernameWithoutAt = dbUsername.startsWith('@') ? dbUsername.slice(1) : dbUsername;
                    
                    const usernameMatches = (dbUsername === cleanInputUsername) || 
                                             (dbUsernameWithAt === inputWithAt) || 
                                             (dbUsernameWithoutAt === inputWithoutAt);
                    const uidMatches = dbUid === cleanInputUid;
                                             
                    return usernameMatches && uidMatches;
                });

                if (matchedUser) {
                    if (matchedUser.status && matchedUser.status.toLowerCase() !== 'aktif') {
                        setErrorMsg('Akun Anda ditangguhkan atau tidak aktif. Silakan hubungi Superadmin.');
                    } else {
                        onLogin(matchedUser);
                    }
                    return;
                }
            }
            
            // Fallback direct endpoint login if client-side check didn't match or getUsers failed
            let cleanUsername = formData.username.trim();
            if (cleanUsername && !cleanUsername.startsWith('@')) {
                cleanUsername = '@' + cleanUsername;
            }
            const fallbackResponse = await fetch(SCRIPT_URL, { 
                method: 'POST', 
                body: JSON.stringify({ 
                    action: 'login', 
                    username: cleanUsername,
                    uid: formData.uid.trim()
                }) 
            });
            const fallbackResult = await fallbackResponse.json();
            if (fallbackResult.status === 'success') {
                const userObj = fallbackResult.user || fallbackResult.data;
                onLogin(userObj);
            } else {
                setErrorMsg('Username atau UID tidak terdaftar atau salah.');
            }
        } catch (error) { 
            setErrorMsg('Terjadi kesalahan koneksi.'); 
        } finally { 
            setIsLoading(false); 
        }
    };
    
    const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium transition-all";

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F19] p-4 sm:p-6 transition-colors duration-300 relative overflow-y-auto">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Header Control Bar */}
            <div className="w-full max-w-md flex items-center justify-between mb-6 z-10">
                {onBack ? (
                    <button 
                        onClick={onBack} 
                        className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                        <i className="ph-bold ph-arrow-left"></i> Kembali ke Beranda
                    </button>
                ) : <div />}
                
                <button 
                    onClick={onToggleDark} 
                    className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl shadow-sm transition-transform active:scale-95"
                    title="Ganti Mode Tema"
                >
                    <i className={`ph-bold ${isDark ? 'ph-sun' : 'ph-moon'} text-base`}></i>
                </button>
            </div>

            {/* THE LOGIN FORM */}
            <div className="w-full max-w-md z-10 mb-8">
                <Card className="w-full p-6 sm:p-8 shadow-2xl border-t-4 border-t-indigo-600 bg-white dark:bg-gray-800 rounded-3xl">
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)] border-t border-indigo-400/50 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <svg className="w-8 h-8 text-white relative z-10 drop-shadow-lg group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 21H7.5L12 11L16.5 21H21L12 2Z" fill="currentColor"/>
                                <path d="M9.5 15H14.5L12 9.5L9.5 15Z" fill="currentColor" fillOpacity="0.4"/>
                            </svg>
                        </div>
                    </div>
                    <div className="text-center mb-6 sm:mb-8">
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">Team<span className="text-indigo-600 dark:text-indigo-400 font-bold">AzurLize</span></h1>
                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Portal Perekrut</p>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs flex items-center font-bold">
                            <i className="ph-bold ph-warning-circle mr-2 text-sm shrink-0"></i>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <i className="ph-bold ph-user absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400"></i>
                            <input 
                                type="text" 
                                placeholder="Username Telegram (contoh: @username)" 
                                value={formData.username} 
                                onChange={e => setFormData({ ...formData, username: e.target.value })} 
                                className={inputClass} 
                                disabled={isLoading} 
                                required 
                            />
                        </div>
                        <div className="relative">
                            <i className="ph-bold ph-identification-card absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400"></i>
                            <input 
                                type="text" 
                                placeholder="UID Karyawan" 
                                value={formData.uid} 
                                onChange={e => setFormData({ ...formData, uid: e.target.value })} 
                                className={inputClass} 
                                disabled={isLoading} 
                                required 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading} 
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            {isLoading ? (
                                <>
                                    <i className="ph-bold ph-spinner ph-spin text-xl mr-2"></i> 
                                    Memverifikasi...
                                </>
                            ) : "Masuk ke Dashboard"}
                        </button>
                    </form>
                </Card>
            </div>

            {/* FOOTER */}
            <div className="w-full max-w-md text-center py-4 text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-wider z-10">
                &copy; {new Date().getFullYear()} Team AzurLize &bull; Rekrutmen & Manajemen Operasional
            </div>
        </div>
    );
};
