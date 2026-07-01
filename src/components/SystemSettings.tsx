import React, { useState, useEffect } from 'react';
import { Card, Badge, CustomDialog } from './UI';
import { TutorialService, TutorialStep, DEFAULT_TUTORIAL_STEPS, LandingConfig, DEFAULT_LANDING_CONFIG } from '../services/TutorialService';
import { SCRIPT_URL } from '../utils';

const DEFAULT_STEPS = DEFAULT_TUTORIAL_STEPS;

const PRESET_ICONS = [
    { class: 'ph-user-plus', label: 'Registrasi' },
    { class: 'ph-copy', label: 'Salin Bahan' },
    { class: 'ph-megaphone', label: 'Promosi' },
    { class: 'ph-chats', label: 'Skrining' },
    { class: 'ph-file-text', label: 'Laporan' },
    { class: 'ph-coins', label: 'Gaji' },
    { class: 'ph-star', label: 'Bintang' },
    { class: 'ph-check-square', label: 'Verifikasi' },
    { class: 'ph-graduation-cap', label: 'Edukasi' },
    { class: 'ph-trophy', label: 'Pencapaian' },
    { class: 'ph-gear', label: 'Sistem' },
    { class: 'ph-globe', label: 'Sosmed' }
];

export const SystemSettings = ({ authUser }: { authUser?: any }) => {
    // General settings states
    const [target, setTarget] = useState(() => {
        return localStorage.getItem('recruitOps_settings_target') || '100';
    });
    const [currency, setCurrency] = useState(() => {
        return localStorage.getItem('recruitOps_settings_currency') || 'IDR';
    });
    const [notifStates, setNotifStates] = useState<boolean[]>(() => {
        try {
            const saved = localStorage.getItem('recruitOps_settings_notifications');
            return saved ? JSON.parse(saved) : [true, true, false];
        } catch {
            return [true, true, false];
        }
    });

    // Tutorial steps state
    const [steps, setSteps] = useState<TutorialStep[]>(DEFAULT_STEPS);
    const [isTutorialLoading, setIsTutorialLoading] = useState(true);
    const [tutorialError, setTutorialError] = useState<string | null>(null);
    const [isSavingTutorial, setIsSavingTutorial] = useState(false);

    // Landing Page customization state
    const [landingConfig, setLandingConfig] = useState<LandingConfig>(DEFAULT_LANDING_CONFIG);
    const [isConfigLoading, setIsConfigLoading] = useState(true);
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    // Custom dialog modal states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');
    const [dialogType, setDialogType] = useState<'alert' | 'confirm' | 'success' | 'warning' | 'danger'>('confirm');
    const [dialogOnConfirm, setDialogOnConfirm] = useState<() => void>(() => {});

    const triggerConfirm = (title: string, message: string, onConfirm: () => void, type: 'confirm' | 'danger' | 'warning' = 'confirm') => {
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogType(type);
        setDialogOnConfirm(() => () => {
            onConfirm();
            setDialogOpen(false);
        });
        setDialogOpen(true);
    };

    const triggerAlert = (title: string, message: string, type: 'alert' | 'success' | 'warning' = 'alert') => {
        setDialogTitle(title);
        setDialogMessage(message);
        setDialogType(type);
        setDialogOnConfirm(() => () => setDialogOpen(false));
        setDialogOpen(true);
    };

    // HTML5 Drag and Drop index trackers
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Page Permissions & Layout States
    const [perms, setPerms] = useState<any>({});
    const [isPermsLoading, setIsPermsLoading] = useState(true);
    const [isSavingPerms, setIsSavingPerms] = useState(false);
    const [activeTab, setActiveTab] = useState<'permissions' | 'landing' | 'tutorial'>('permissions');

    // Load page permissions on mount
    useEffect(() => {
        if (authUser?.role !== 'Superadmin') {
            setActiveTab('landing');
        }
        let isMounted = true;
        const fetchPerms = async () => {
            setIsPermsLoading(true);
            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'getPermissions' })
                });
                const result = await response.json();
                if (result.status === 'success' && result.data && isMounted) {
                    setPerms(result.data);
                }
            } catch (error) {
                console.error("Gagal memuat permissions:", error);
            } finally {
                if (isMounted) setIsPermsLoading(false);
            }
        };
        fetchPerms();
        return () => {
            isMounted = false;
        };
    }, []);

    // Load tutorial steps and landing config from Sheets on mount
    useEffect(() => {
        let isMounted = true;
        const loadAllData = async () => {
            setIsTutorialLoading(true);
            setTutorialError(null);
            setIsConfigLoading(true);
            try {
                const [tutorialData, configData] = await Promise.all([
                    TutorialService.getTutorialSteps(),
                    TutorialService.getLandingConfig()
                ]);
                if (isMounted) {
                    setSteps(tutorialData);
                    setLandingConfig(configData);
                }
            } catch (err: any) {
                if (isMounted) {
                    setTutorialError(err?.message || 'Gagal memuat data dari Sheets');
                }
            } finally {
                if (isMounted) {
                    setIsTutorialLoading(false);
                    setIsConfigLoading(false);
                }
            }
        };
        loadAllData();
        return () => {
            isMounted = false;
        };
    }, []);

    // Form states for adding/editing a tutorial step
    const [isEditingStep, setIsEditingStep] = useState<number | null>(null); // Step number being edited, null for "Add" mode
    const [formStepTitle, setFormStepTitle] = useState('');
    const [formStepDesc, setFormStepDesc] = useState('');
    const [formStepIcon, setFormStepIcon] = useState('ph-user-plus');
    const [formStepImages, setFormStepImages] = useState<string[]>([]);
    const [tempImageUrl, setTempImageUrl] = useState('');
    const [isCompressing, setIsCompressing] = useState(false);

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 650; // Keep quality and memory balanced
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
                    resolve(dataUrl);
                };
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (formStepImages.length + files.length > 10) {
            triggerAlert('Batas Gambar Terpenuhi', 'Maksimal 10 gambar yang diperbolehkan untuk setiap langkah tutorial!', 'warning');
            return;
        }

        setIsCompressing(true);
        const newImages: string[] = [...formStepImages];

        for (let i = 0; i < files.length; i++) {
            try {
                const base64 = await compressImage(files[i]);
                newImages.push(base64);
            } catch (err) {
                console.error('Error compressing image:', err);
                triggerToast('❌ Gagal membaca atau mengompresi gambar');
            }
        }

        setFormStepImages(newImages.slice(0, 10));
        setIsCompressing(false);
        e.target.value = '';
    };

    const handleAddImageUrl = () => {
        const url = tempImageUrl.trim();
        if (!url) return;
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:image')) {
            triggerAlert('Format URL Salah', 'Silakan masukkan format URL gambar yang valid (dimulai dengan http://, https:// atau format data uri).', 'warning');
            return;
        }
        if (formStepImages.length >= 10) {
            triggerAlert('Batas Gambar Terpenuhi', 'Maksimal 10 gambar yang diperbolehkan untuk setiap langkah tutorial!', 'warning');
            return;
        }
        setFormStepImages([...formStepImages, url]);
        setTempImageUrl('');
    };

    const handleRemoveImage = (index: number) => {
        setFormStepImages(formStepImages.filter((_, idx) => idx !== index));
    };

    const handleMoveImage = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return;
        if (direction === 'right' && index === formStepImages.length - 1) return;
        const copy = [...formStepImages];
        const targetIdx = direction === 'left' ? index - 1 : index + 1;
        const temp = copy[index];
        copy[index] = copy[targetIdx];
        copy[targetIdx] = temp;
        setFormStepImages(copy);
    };

    // Feedback state
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const isSuperadmin = authUser?.role === 'Superadmin';

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Save general settings
    const handleSaveGeneral = () => {
        localStorage.setItem('recruitOps_settings_target', target);
        localStorage.setItem('recruitOps_settings_currency', currency);
        localStorage.setItem('recruitOps_settings_notifications', JSON.stringify(notifStates));
        
        // Notify other components if needed
        window.dispatchEvent(new Event('systemSettingsUpdated'));
        triggerToast('✅ Pengaturan sistem berhasil disimpan!');
    };

    // Handle Tutorial Step Operations
    const handleSaveStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formStepTitle.trim() || !formStepDesc.trim()) {
            triggerAlert('Form Belum Lengkap', 'Judul dan deskripsi langkah tidak boleh kosong.', 'warning');
            return;
        }

        if (isEditingStep !== null) {
            // Update existing step
            const updated = steps.map(s => {
                if (s.step === isEditingStep) {
                    return { ...s, title: formStepTitle, description: formStepDesc, icon: formStepIcon, images: formStepImages };
                }
                return s;
            });
            setSteps(updated);
            setIsEditingStep(null);
            triggerToast('✏️ Langkah tutorial diperbarui!');
        } else {
            // Add new step
            const newStepNum = steps.length > 0 ? Math.max(...steps.map(s => s.step)) + 1 : 1;
            const newStep: TutorialStep = {
                step: newStepNum,
                title: formStepTitle,
                description: formStepDesc,
                icon: formStepIcon,
                images: formStepImages
            };
            const updated = [...steps, newStep];
            setSteps(updated);
            triggerToast('➕ Langkah tutorial baru ditambahkan!');
        }

        // Reset form
        setFormStepTitle('');
        setFormStepDesc('');
        setFormStepIcon('ph-user-plus');
        setFormStepImages([]);
        setTempImageUrl('');
    };

    const handleEditClick = (step: TutorialStep) => {
        setIsEditingStep(step.step);
        setFormStepTitle(step.title);
        setFormStepDesc(step.description);
        setFormStepIcon(step.icon);
        setFormStepImages(step.images || []);
    };

    const handleDeleteStep = (stepNum: number) => {
        triggerConfirm(
            'Hapus Langkah Tutorial',
            'Apakah Anda yakin ingin menghapus langkah tutorial ini? Data yang dihapus tidak bisa dikembalikan di draf sebelum Anda menyimpan draf ini.',
            () => {
                const filtered = steps.filter(s => s.step !== stepNum);
                // Re-index steps
                const reindexed = filtered.map((s, idx) => ({ ...s, step: idx + 1 }));
                setSteps(reindexed);
                if (isEditingStep === stepNum) {
                    setIsEditingStep(null);
                    setFormStepTitle('');
                    setFormStepDesc('');
                    setFormStepIcon('ph-user-plus');
                    setFormStepImages([]);
                }
                triggerToast('🗑️ Langkah tutorial dihapus!');
            },
            'danger'
        );
    };

    const handleMoveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === steps.length - 1) return;

        const updated = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        
        // Swap
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;

        // Reassign step numbers based on new order
        const reordered = updated.map((s, idx) => ({ ...s, step: idx + 1 }));
        setSteps(reordered);
    };

    const handleResetToDefault = () => {
        triggerConfirm(
            'Reset Langkah',
            'Kembalikan semua langkah tutorial ke default bawaan sistem? Perubahan kustom Anda akan hilang.',
            () => {
                setSteps(DEFAULT_STEPS);
                setIsEditingStep(null);
                setFormStepTitle('');
                setFormStepDesc('');
                setFormStepIcon('ph-user-plus');
                setFormStepImages([]);
                triggerToast('🔄 Tutorial dikembalikan ke default!');
            },
            'warning'
        );
    };

    // HTML5 Drag and Drop Handlers for Step Reordering
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const updated = [...steps];
        const dragItem = updated[draggedIndex];
        
        // Move item
        updated.splice(draggedIndex, 1);
        updated.splice(index, 0, dragItem);

        // Reassign step numbers
        const reordered = updated.map((s, idx) => ({ ...s, step: idx + 1 }));
        setSteps(reordered);
        setDraggedIndex(null);
        triggerToast('↔️ Urutan langkah tutorial diperbarui!');
    };

    // Save tutorial steps to Sheets backend
    const handleSaveTutorialToSheets = async () => {
        setIsSavingTutorial(true);
        try {
            await TutorialService.saveTutorialSteps(steps);
            triggerToast('💾 Tutorial berhasil disimpan ke Google Sheets!');
            
            // Dispatch event to sync on landing page
            window.dispatchEvent(new Event('systemSettingsUpdated'));
        } catch (err: any) {
            console.error('Save tutorial error:', err);
            triggerAlert('Gagal Menyimpan', `Gagal menyimpan tutorial ke Google Sheets: ${err?.message || err}`, 'warning');
        } finally {
            setIsSavingTutorial(false);
        }
    };

    const handleSaveLandingConfig = async () => {
        setIsSavingConfig(true);
        try {
            await TutorialService.saveLandingConfig(landingConfig);
            triggerToast('💾 Konten Landing Page berhasil disimpan!');
            
            // Dispatch event to sync on landing page
            window.dispatchEvent(new Event('systemSettingsUpdated'));
        } catch (err: any) {
            console.error('Save config error:', err);
            triggerAlert('Gagal Menyimpan', `Gagal menyimpan konten ke Google Sheets: ${err?.message || err}`, 'warning');
        } finally {
            setIsSavingConfig(false);
        }
    };

    // Page Layout & Permissions Handlers
    const handleSavePerms = async (customPerms = perms) => {
        setIsSavingPerms(true);
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'savePermissions', permissions: customPerms })
            });
            const result = await response.json();
            if (result.status === 'success') {
                triggerToast('💾 Hak akses & tataletak halaman berhasil disimpan ke Google Sheets!');
                localStorage.setItem('recruitOps_permissions_v2', JSON.stringify(customPerms));
                window.dispatchEvent(new Event('permissionsUpdated'));
            } else {
                triggerAlert('Gagal Menyimpan', result.message || 'Error tidak diketahui', 'warning');
            }
        } catch (error: any) {
            triggerAlert('Gagal Menyimpan', error.message || 'Error koneksi', 'warning');
        } finally {
            setIsSavingPerms(false);
        }
    };

    const handleToggleRoleAccess = (pageId: string, role: string, type: 'view' | 'edit') => {
        if (role === 'Superadmin') return; // Superadmin is absolute

        const pageData = perms[pageId];
        if (!pageData) return;

        const currentRoles = [...(pageData[type] || [])];
        let updatedRoles;
        if (currentRoles.map((r: string) => r.toLowerCase()).includes(role.toLowerCase())) {
            updatedRoles = currentRoles.filter(r => r.toLowerCase() !== role.toLowerCase());
        } else {
            // Find properly capitalized role
            const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
            updatedRoles = [...currentRoles, formattedRole];
        }

        const updatedPerms = {
            ...perms,
            [pageId]: {
                ...pageData,
                [type]: updatedRoles
            }
        };
        setPerms(updatedPerms);
    };

    const handleUpdatePageField = (pageId: string, field: string, value: any) => {
        const pageData = perms[pageId];
        if (!pageData) return;

        const updatedPerms = {
            ...perms,
            [pageId]: {
                ...pageData,
                [field]: value
            }
        };
        setPerms(updatedPerms);
    };

    const handleMovePageOrder = (pageId: string, direction: 'up' | 'down') => {
        const items = Object.entries(perms).map(([id, data]: [string, any]) => ({
            id,
            ...data,
            orderIndex: data.orderIndex !== undefined ? Number(data.orderIndex) : 99
        })).sort((a, b) => a.orderIndex - b.orderIndex);

        const index = items.findIndex(item => item.id === pageId);
        if (index === -1) return;

        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        const temp = items[index];
        items[index] = items[targetIndex];
        items[targetIndex] = temp;

        const updatedPerms = { ...perms };
        items.forEach((item, idx) => {
            if (updatedPerms[item.id]) {
                updatedPerms[item.id].orderIndex = idx + 1;
            }
        });
        setPerms(updatedPerms);
    };

    const toggleNotif = (idx: number) => {
        const copy = [...notifStates];
        copy[idx] = !copy[idx];
        setNotifStates(copy);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-16 px-2 sm:px-4">
            {/* Toast feedback */}
            {toastMessage && (
                <div className="fixed top-6 right-6 z-[100] px-5 py-4 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 font-bold text-sm border border-gray-800">
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
                            <i className="ph-bold ph-gear text-2xl"></i>
                        </div>
                        <div>
                            Pengaturan Sistem
                            <span className="block text-xs font-bold text-indigo-500 dark:text-indigo-400 mt-1">Superadmin Portal</span>
                        </div>
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
                        Konfigurasi parameter operasional perusahaan, notifikasi, dan panduan/tutorial onboarding menjadi perekrut.
                    </p>
                </div>
                {isSuperadmin && (
                    <button 
                        onClick={handleSaveGeneral}
                        className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 flex items-center justify-center transition-all transform active:scale-95 text-xs uppercase tracking-wider gap-2 shrink-0"
                    >
                        <i className="ph-bold ph-floppy-disk text-base"></i> Simpan Pengaturan
                    </button>
                )}
            </div>

            {/* Custom Tabs Navigation */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-4 border-b border-gray-200 dark:border-gray-700 pb-px">
                {isSuperadmin && (
                    <button
                        onClick={() => setActiveTab('permissions')}
                        className={`px-4 py-3 text-sm font-black whitespace-nowrap border-b-2 transition-colors ${
                            activeTab === 'permissions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                    >
                        <i className="ph-bold ph-shield-check mr-2"></i> Hak Akses & Tata Letak
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('landing')}
                    className={`px-4 py-3 text-sm font-black whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === 'landing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <i className="ph-bold ph-paint-brush-broad mr-2"></i> Landing Page
                </button>
                <button
                    onClick={() => setActiveTab('tutorial')}
                    className={`px-4 py-3 text-sm font-black whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === 'tutorial' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <i className="ph-bold ph-book-open mr-2"></i> Tutorial Perekrut
                </button>
            </div>

            {activeTab === 'permissions' && isSuperadmin && (
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 gap-4">
                        <div>
                            <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center">
                                <i className="ph-bold ph-shield-check mr-3 text-purple-600 text-2xl"></i> Tata Letak & Hak Akses Halaman
                            </h3>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Konfigurasi Hak Akses & Urutan Menu (09_PERMISSIONS)</span>
                        </div>
                        
                        <button
                            type="button"
                            onClick={() => handleSavePerms()}
                            disabled={isSavingPerms || isPermsLoading}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/15 active:scale-95 flex items-center gap-2 disabled:opacity-50 shrink-0"
                        >
                            {isSavingPerms ? (
                                <>
                                    <i className="ph-bold ph-spinner ph-spin text-sm"></i> Menyimpan...
                                </>
                            ) : (
                                <>
                                    <i className="ph-bold ph-floppy-disk text-sm"></i> Simpan Akses & Tata Letak
                                </>
                            )}
                        </button>
                    </div>

                    {isPermsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <i className="ph-bold ph-spinner ph-spin text-3xl text-purple-500 mb-2"></i>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Memuat konfigurasi hak akses...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/10 custom-scrollbar">
                            <table className="w-full text-left border-collapse text-xs min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/40">
                                        <th className="py-3 px-4 text-center w-24">Urutan</th>
                                        <th className="py-3 px-4">ID Halaman</th>
                                        <th className="py-3 px-4">Nama Menu</th>
                                        <th className="py-3 px-4">Kategori Menu</th>
                                        <th className="py-3 px-4">Ikon</th>
                                        <th className="py-3 px-4 text-center">Akses Lihat (View)</th>
                                        <th className="py-3 px-4 text-center">Akses Edit (Edit)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(perms)
                                        .map(([id, val]: [string, any]) => ({
                                            id,
                                            ...val,
                                            orderIndex: val.orderIndex !== undefined ? Number(val.orderIndex) : 99
                                        }))
                                        .sort((a, b) => a.orderIndex - b.orderIndex)
                                        .map((item, index, arr) => {
                                            const viewRoles = item.view || [];
                                            const editRoles = item.edit || [];
                                            
                                            return (
                                                <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors">
                                                    {/* Navigation Order / Arrow buttons */}
                                                    <td className="py-3.5 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={index === 0}
                                                                onClick={() => handleMovePageOrder(item.id, 'up')}
                                                                className="w-7 h-7 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-500 disabled:opacity-30 shadow-sm"
                                                                title="Naikkan Menu"
                                                            >
                                                                <i className="ph-bold ph-caret-up text-xs"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={index === arr.length - 1}
                                                                onClick={() => handleMovePageOrder(item.id, 'down')}
                                                                className="w-7 h-7 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-500 disabled:opacity-30 shadow-sm"
                                                                title="Turunkan Menu"
                                                            >
                                                                <i className="ph-bold ph-caret-down text-xs"></i>
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Page ID / Unique handle */}
                                                    <td className="py-3.5 px-4 font-mono text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                                                        {item.id}
                                                    </td>

                                                    {/* Menu Label (Editable) */}
                                                    <td className="py-3.5 px-4">
                                                        <input
                                                            type="text"
                                                            value={item.name}
                                                            onChange={(e) => handleUpdatePageField(item.id, 'name', e.target.value)}
                                                            className="w-full max-w-[140px] px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-sm"
                                                        />
                                                    </td>

                                                    {/* Menu Category (Dropdown selection) */}
                                                    <td className="py-3.5 px-4">
                                                        <select
                                                            value={item.category || 'Overview'}
                                                            onChange={(e) => handleUpdatePageField(item.id, 'category', e.target.value)}
                                                            className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-sm cursor-pointer"
                                                        >
                                                            <option value="Overview">Overview</option>
                                                            <option value="Performance">Performance</option>
                                                            <option value="Management">Management</option>
                                                            <option value="System">System</option>
                                                        </select>
                                                    </td>

                                                    {/* Icon picker */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-750 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner shrink-0">
                                                                <i className={`ph-bold ${item.icon || 'ph-question'}`}></i>
                                                            </span>
                                                            <select
                                                                value={item.icon || 'ph-squares-four'}
                                                                onChange={(e) => handleUpdatePageField(item.id, 'icon', e.target.value)}
                                                                className="px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-sm cursor-pointer"
                                                            >
                                                                <option value="ph-squares-four">ph-squares-four (Home)</option>
                                                                <option value="ph-medal">ph-medal (Crown)</option>
                                                                <option value="ph-address-book">ph-address-book (Book)</option>
                                                                <option value="ph-chart-bar">ph-chart-bar (Graph)</option>
                                                                <option value="ph-currency-circle-dollar">ph-currency-circle-dollar (Dollar)</option>
                                                                <option value="ph-user-gear">ph-user-gear (Users)</option>
                                                                <option value="ph-gear">ph-gear (Settings)</option>
                                                                <option value="ph-bell">ph-bell (Notification)</option>
                                                                <option value="ph-shield-check">ph-shield-check (Shield)</option>
                                                                <option value="ph-folder">ph-folder (Folder)</option>
                                                            </select>
                                                        </div>
                                                    </td>

                                                    {/* View Permissions checkmarks */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center justify-center gap-4">
                                                            {/* Superadmin */}
                                                            <label className="flex items-center gap-1.5 select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={true}
                                                                    disabled={true}
                                                                    className="w-4 h-4 text-purple-600 rounded-lg border-gray-300 focus:ring-purple-500 focus:ring-1 disabled:opacity-60"
                                                                />
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Superadmin</span>
                                                            </label>

                                                            {/* Admin toggle */}
                                                            <label className="flex items-center gap-1.5 select-none cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={viewRoles.map((r: string) => r.toLowerCase()).includes('admin')}
                                                                    onChange={() => handleToggleRoleAccess(item.id, 'Admin', 'view')}
                                                                    className="w-4 h-4 text-purple-600 rounded-lg border-gray-300 focus:ring-purple-500 focus:ring-1 cursor-pointer"
                                                                />
                                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</span>
                                                            </label>

                                                            {/* Staff toggle */}
                                                            <label className="flex items-center gap-1.5 select-none cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={viewRoles.map((r: string) => r.toLowerCase()).includes('staff')}
                                                                    onChange={() => handleToggleRoleAccess(item.id, 'Staff', 'view')}
                                                                    className="w-4 h-4 text-purple-600 rounded-lg border-gray-300 focus:ring-purple-500 focus:ring-1 cursor-pointer"
                                                                />
                                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</span>
                                                            </label>
                                                        </div>
                                                    </td>

                                                    {/* Edit Permissions checkmarks */}
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center justify-center gap-4">
                                                            {/* Superadmin */}
                                                            <label className="flex items-center gap-1.5 select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={true}
                                                                    disabled={true}
                                                                    className="w-4 h-4 text-purple-600 rounded-lg border-gray-300 focus:ring-purple-500 focus:ring-1 disabled:opacity-60"
                                                                />
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Superadmin</span>
                                                            </label>

                                                            {/* Admin toggle */}
                                                            <label className="flex items-center gap-1.5 select-none cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editRoles.map((r: string) => r.toLowerCase()).includes('admin')}
                                                                    onChange={() => handleToggleRoleAccess(item.id, 'Admin', 'edit')}
                                                                    className="w-4 h-4 text-purple-600 rounded-lg border-gray-300 focus:ring-purple-500 focus:ring-1 cursor-pointer"
                                                                />
                                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</span>
                                                            </label>

                                                            {/* Staff toggle */}
                                                            <label className="flex items-center gap-1.5 select-none cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editRoles.map((r: string) => r.toLowerCase()).includes('staff')}
                                                                    onChange={() => handleToggleRoleAccess(item.id, 'Staff', 'edit')}
                                                                    className="w-4 h-4 text-purple-600 rounded-lg border-gray-300 focus:ring-purple-500 focus:ring-1 cursor-pointer"
                                                                />
                                                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Staff</span>
                                                            </label>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: LANDING PAGE */}
            {activeTab === 'landing' && (
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 gap-2">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center">
                                    <i className="ph-bold ph-paint-brush-broad mr-3 text-indigo-500 text-2xl"></i> Kustomisasi Konten Landing Page
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleSaveLandingConfig}
                                    disabled={isSavingConfig}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                                >
                                    {isSavingConfig ? 'Menyimpan...' : 'Simpan Konten'}
                                </button>
                            </div>

                            {isConfigLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                                    <i className="ph-bold ph-spinner ph-spin text-2xl text-indigo-500 mb-2"></i>
                                    <p className="text-xs font-bold text-gray-400">Memuat konfigurasi landing page...</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* SECTION 1: HERO */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Bagian Hero Atas</h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Badge Promo / Karir</label>
                                            <input 
                                                type="text"
                                                value={landingConfig.hero_badge}
                                                onChange={e => setLandingConfig({ ...landingConfig, hero_badge: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Teks Tombol Portal</label>
                                            <input 
                                                type="text"
                                                value={landingConfig.hero_btn_text}
                                                onChange={e => setLandingConfig({ ...landingConfig, hero_btn_text: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Judul Utama Hero (Title)</label>
                                        <input 
                                            type="text"
                                            value={landingConfig.hero_title}
                                            onChange={e => setLandingConfig({ ...landingConfig, hero_title: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Deskripsi Hero Sub-teks</label>
                                        <textarea 
                                            rows={2}
                                            value={landingConfig.hero_desc}
                                            onChange={e => setLandingConfig({ ...landingConfig, hero_desc: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                                        ></textarea>
                                    </div>
                                </div>

                                {/* SECTION 2: BENEFITS ACCORDION */}
                                <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                                    <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Section Keunggulan & Benefit</h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Judul Besar Keunggulan</label>
                                            <input 
                                                type="text"
                                                value={landingConfig.benefits_title}
                                                onChange={e => setLandingConfig({ ...landingConfig, benefits_title: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Deskripsi Singkat Keunggulan</label>
                                            <input 
                                                type="text"
                                                value={landingConfig.benefits_desc}
                                                onChange={e => setLandingConfig({ ...landingConfig, benefits_desc: e.target.value })}
                                                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* 3 Detail Benefits */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                        {/* Benefit 1 */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Benefit 1</span>
                                            <input 
                                                type="text"
                                                placeholder="Judul Benefit 1"
                                                value={landingConfig.benefit1_title}
                                                onChange={e => setLandingConfig({ ...landingConfig, benefit1_title: e.target.value })}
                                                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <textarea 
                                                rows={3}
                                                placeholder="Deskripsi Benefit 1"
                                                value={landingConfig.benefit1_desc}
                                                onChange={e => setLandingConfig({ ...landingConfig, benefit1_desc: e.target.value })}
                                                className="w-full px-2.5 py-1.5 text-[10px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-1 focus:ring-indigo-500 leading-normal"
                                            ></textarea>
                                        </div>

                                        {/* Benefit 2 */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Benefit 2</span>
                                            <input 
                                                type="text"
                                                placeholder="Judul Benefit 2"
                                                value={landingConfig.benefit2_title}
                                                onChange={e => setLandingConfig({ ...landingConfig, benefit2_title: e.target.value })}
                                                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <textarea 
                                                rows={3}
                                                placeholder="Deskripsi Benefit 2"
                                                value={landingConfig.benefit2_desc}
                                                onChange={e => setLandingConfig({ ...landingConfig, benefit2_desc: e.target.value })}
                                                className="w-full px-2.5 py-1.5 text-[10px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-1 focus:ring-indigo-500 leading-normal"
                                            ></textarea>
                                        </div>

                                        {/* Benefit 3 */}
                                        <div className="space-y-2">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Benefit 3</span>
                                            <input 
                                                type="text"
                                                placeholder="Judul Benefit 3"
                                                value={landingConfig.benefit3_title}
                                                onChange={e => setLandingConfig({ ...landingConfig, benefit3_title: e.target.value })}
                                                className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                            <textarea 
                                                rows={3}
                                                placeholder="Deskripsi Benefit 3"
                                                value={landingConfig.benefit3_desc}
                                                onChange={e => setLandingConfig({ ...landingConfig, benefit3_desc: e.target.value })}
                                                className="w-full px-2.5 py-1.5 text-[10px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium outline-none focus:ring-1 focus:ring-indigo-500 leading-normal"
                                            ></textarea>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION 3: CTA */}
                                <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-700/60">
                                    <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-2">Bagian Bawah (Call to Action)</h4>
                                    
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Judul Banner CTA</label>
                                        <input 
                                            type="text"
                                            value={landingConfig.cta_title}
                                            onChange={e => setLandingConfig({ ...landingConfig, cta_title: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Sub-deskripsi Banner CTA</label>
                                        <textarea 
                                            rows={2}
                                            value={landingConfig.cta_desc}
                                            onChange={e => setLandingConfig({ ...landingConfig, cta_desc: e.target.value })}
                                            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                                    <span className="text-[10px] text-gray-400 font-bold">Semua kustomisasi di atas disimpan langsung ke tabel 08_LANDING_CONFIG</span>
                                    <button
                                        type="button"
                                        onClick={handleSaveLandingConfig}
                                        disabled={isSavingConfig}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-600/15 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <i className="ph-bold ph-floppy-disk text-sm"></i> {isSavingConfig ? 'Menyimpan...' : 'Simpan Perubahan Landing'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                    {/* CARD 3: EDIT TUTORIAL STEPS FORM */}
            {activeTab === 'tutorial' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* LEFT SIDE: Tutorial Form (7 cols) */}
                    <div className="lg:col-span-7 space-y-6 sm:space-y-8">
                        {isSuperadmin && (
                            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 gap-2">
                                <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center">
                                    <i className="ph-bold ph-pencil-simple mr-3 text-emerald-500 text-2xl"></i> 
                                    {isEditingStep !== null ? `Edit Langkah #${isEditingStep}` : 'Tambah Langkah Tutorial'}
                                </h3>
                                {isEditingStep !== null && (
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setIsEditingStep(null);
                                            setFormStepTitle('');
                                            setFormStepDesc('');
                                            setFormStepIcon('ph-user-plus');
                                        }}
                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:text-rose-500 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Batal Edit / Reset
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSaveStep} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Judul Langkah</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Contoh: Sebarkan Materi Promosi"
                                        value={formStepTitle}
                                        onChange={e => setFormStepTitle(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Deskripsi & Instruksi Detil</label>
                                    <textarea 
                                        rows={3}
                                        required
                                        placeholder="Tulis panduan ringkas dan jelas bagi calon perekrut agar mudah dipahami..."
                                        value={formStepDesc}
                                        onChange={e => setFormStepDesc(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all text-sm leading-relaxed"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Pilih Icon Penjelas</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                        {PRESET_ICONS.map((ico, idx) => {
                                            const isSelected = formStepIcon === ico.class;
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => setFormStepIcon(ico.class)}
                                                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all group ${
                                                        isSelected 
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50/20 text-gray-500 dark:text-gray-400'
                                                    }`}
                                                    title={ico.label}
                                                >
                                                    <i className={`ph-bold ${ico.class} text-lg ${isSelected ? 'scale-110' : 'group-hover:scale-110'} transition-transform`}></i>
                                                    <span className="text-[9px] font-bold tracking-tight opacity-85 truncate w-full text-center">{ico.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                                            Materi Gambar Pendukung ({formStepImages.length}/10)
                                        </label>
                                        <span className="text-[10px] text-gray-400 font-bold">Maksimal 10 gambar</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* File Upload Button */}
                                        <div>
                                            <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/10 rounded-xl cursor-pointer transition-colors text-xs font-bold text-gray-600 dark:text-gray-300 h-full">
                                                <i className="ph-bold ph-upload-simple text-base"></i>
                                                {isCompressing ? 'Mengompresi...' : 'Upload dari Perangkat'}
                                                <input 
                                                    type="file" 
                                                    multiple 
                                                    accept="image/*" 
                                                    disabled={isCompressing || formStepImages.length >= 10}
                                                    onChange={handleImageUpload}
                                                    className="hidden" 
                                                />
                                            </label>
                                        </div>

                                        {/* URL Input */}
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Atau tempel URL gambar..." 
                                                value={tempImageUrl}
                                                onChange={e => setTempImageUrl(e.target.value)}
                                                disabled={formStepImages.length >= 10}
                                                className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddImageUrl}
                                                disabled={formStepImages.length >= 10}
                                                className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-colors shrink-0 disabled:opacity-50"
                                            >
                                                Tambah
                                            </button>
                                        </div>
                                    </div>

                                    {/* Uploaded images display list */}
                                    {formStepImages.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                                            {formStepImages.map((img, idx) => (
                                                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 group">
                                                    <img 
                                                        src={img} 
                                                        alt={`Langkah img ${idx + 1}`} 
                                                        className="w-full h-full object-cover" 
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    
                                                    {/* Overlays / Control buttons */}
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                        {/* Reorder Left */}
                                                        <button
                                                            type="button"
                                                            disabled={idx === 0}
                                                            onClick={() => handleMoveImage(idx, 'left')}
                                                            className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-xs disabled:opacity-30"
                                                            title="Geser Kiri"
                                                        >
                                                            <i className="ph-bold ph-caret-left"></i>
                                                        </button>
                                                        
                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveImage(idx)}
                                                            className="w-6 h-6 rounded bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs"
                                                            title="Hapus"
                                                        >
                                                            <i className="ph-bold ph-trash"></i>
                                                        </button>

                                                        {/* Reorder Right */}
                                                        <button
                                                            type="button"
                                                            disabled={idx === formStepImages.length - 1}
                                                            onClick={() => handleMoveImage(idx, 'right')}
                                                            className="w-6 h-6 rounded bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-xs disabled:opacity-30"
                                                            title="Geser Kanan"
                                                        >
                                                            <i className="ph-bold ph-caret-right"></i>
                                                        </button>
                                                    </div>

                                                    {/* Number Badge */}
                                                    <span className="absolute bottom-1 right-1 bg-black/75 text-[8px] font-black text-white px-1 py-0.5 rounded">
                                                        {idx + 1}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 border border-dashed border-gray-200 dark:border-gray-700/80 rounded-2xl text-[11px] font-bold text-gray-400">
                                            Belum ada gambar/materi pendukung untuk langkah ini.
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit"
                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <i className={`ph-bold ${isEditingStep !== null ? 'ph-check-square' : 'ph-plus'} text-base`}></i>
                                    {isEditingStep !== null ? 'Simpan Pembaruan Langkah' : 'Tambahkan Langkah Ini'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* RIGHT SIDE: Visual Preview and Steps List / Reordering (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {/* MAIN CARD: MANAGING STEPS LIST */}
                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                            <div>
                                <h3 className="font-black text-lg text-gray-900 dark:text-white flex items-center">
                                    <i className="ph-bold ph-list-numbers mr-3 text-purple-500 text-2xl"></i> 
                                    Langkah Aktif ({steps.length})
                                </h3>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mt-1">Draf Tampilan Landing Page</span>
                            </div>
                            
                            {isSuperadmin && (
                                <button 
                                    type="button"
                                    onClick={handleResetToDefault}
                                    className="px-2.5 py-1.5 border border-dashed border-gray-200 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:border-gray-700 dark:hover:bg-rose-950/30 dark:hover:border-rose-800/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                                    title="Reset ke default sistem"
                                >
                                    <i className="ph-bold ph-arrow-counter-clockwise"></i> Reset Default
                                </button>
                            )}
                        </div>

                        {isTutorialLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                                <i className="ph-bold ph-spinner ph-spin text-3xl text-indigo-500 mb-2.5"></i>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-wider">Memuat tutorial dari Google Sheets...</p>
                            </div>
                        ) : tutorialError ? (
                            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 text-center">
                                <i className="ph-bold ph-warning-circle text-rose-500 text-3xl mb-2 block"></i>
                                <p className="text-xs font-bold text-rose-700 dark:text-rose-400">{tutorialError}</p>
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 transition-colors"
                                >
                                    Coba Lagi
                                </button>
                            </div>
                        ) : steps.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl text-gray-400">
                                <i className="ph-bold ph-folder-open text-4xl opacity-40 mb-2 block"></i>
                                <p className="text-xs font-bold">Langkah tutorial kosong.</p>
                                <p className="text-[10px] text-gray-500 mt-1">Gunakan form di sebelah kiri untuk menambah langkah.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {steps.map((step, idx) => {
                                    const isEditingThis = isEditingStep === step.step;
                                    return (
                                        <div 
                                            key={step.step} 
                                            draggable={isSuperadmin}
                                            onDragStart={(e) => handleDragStart(e, idx)}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDrop={(e) => handleDrop(e, idx)}
                                            className={`p-4 rounded-2xl border transition-all relative flex items-start gap-3 group select-none ${
                                                isSuperadmin ? 'cursor-grab active:cursor-grabbing' : ''
                                            } ${
                                                isEditingThis 
                                                    ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-300 dark:border-amber-800/60 shadow-md' 
                                                    : 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-100 dark:border-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600'
                                            } ${draggedIndex === idx ? 'opacity-40 scale-95 border-dashed border-indigo-400' : ''}`}
                                        >
                                            {/* Drag Grip Handle & Step Badge */}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {isSuperadmin && (
                                                    <div className="text-gray-400 dark:text-gray-600 hover:text-indigo-500 transition-colors" title="Tarik untuk mengurutkan langkah">
                                                        <i className="ph-bold ph-dots-six-vertical text-lg"></i>
                                                    </div>
                                                )}
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shadow-sm">
                                                    {step.step}
                                                </div>
                                            </div>

                                            {/* Step Content */}
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="flex items-center gap-1.5">
                                                    <i className={`ph-fill ${step.icon.replace('ph-bold', 'ph-fill')} text-indigo-500 shrink-0`}></i>
                                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate leading-tight">{step.title}</h4>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2 md:line-clamp-none">{step.description}</p>
                                            </div>

                                            {/* Reordering and Actions Controls */}
                                            {isSuperadmin && (
                                                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-1.5 shrink-0 transition-opacity">
                                                    <div className="flex xl:flex-col gap-0.5">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleMoveStep(idx, 'up')}
                                                            disabled={idx === 0}
                                                            className="w-6 h-6 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 text-gray-500 disabled:opacity-40"
                                                            title="Pindahkan ke atas"
                                                        >
                                                            <i className="ph-bold ph-caret-up text-xs"></i>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleMoveStep(idx, 'down')}
                                                            disabled={idx === steps.length - 1}
                                                            className="w-6 h-6 rounded bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:bg-gray-50 text-gray-500 disabled:opacity-40"
                                                            title="Pindahkan ke bawah"
                                                        >
                                                            <i className="ph-bold ph-caret-down text-xs"></i>
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex xl:flex-col gap-0.5 mt-1 sm:mt-0 lg:mt-1 xl:mt-0">
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleEditClick(step)}
                                                            className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900"
                                                            title="Edit langkah"
                                                        >
                                                            <i className="ph-bold ph-pencil-simple text-xs"></i>
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleDeleteStep(step.step)}
                                                            className="w-6 h-6 rounded bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-900"
                                                            title="Hapus langkah"
                                                        >
                                                            <i className="ph-bold ph-trash text-xs"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {isSuperadmin && !isTutorialLoading && !tutorialError && (
                            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700/60">
                                <button
                                    type="button"
                                    onClick={handleSaveTutorialToSheets}
                                    disabled={isSavingTutorial}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                >
                                    {isSavingTutorial ? (
                                        <>
                                            <i className="ph-bold ph-spinner ph-spin text-base"></i> Menyimpan ke Sheets...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ph-bold ph-floppy-disk text-base"></i> Simpan Tutorial ke Sheets
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-gray-400 font-bold mt-2 text-center">
                                    Simpan seluruh urutan dan draf langkah di atas langsung ke database Google Sheets (07_TUTORIAL)
                                </p>
                            </div>
                        )}
                    </div>

                    {/* LIVE PREVIEW BANNER CARD */}
                    <div className="bg-gradient-to-br from-purple-900 to-indigo-950 p-6 rounded-3xl border border-indigo-800 text-white relative overflow-hidden shadow-lg shadow-indigo-900/20">
                        <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 shadow-inner shrink-0">
                                <i className="ph-bold ph-device-mobile text-lg"></i>
                            </div>
                            <div>
                                <h4 className="font-black text-sm tracking-wide text-indigo-200 uppercase">Akses Offline & Responsif</h4>
                                <p className="text-xs text-indigo-100 mt-1.5 leading-relaxed">
                                    Langkah-langkah di atas akan disajikan dalam format carousels/steppers interaktif yang responsif di Halaman Utama (Landing/Login) untuk membimbing calon perekrut mendaftar dan mulai bekerja.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
                </div>
            )}
            
            {/* Custom confirmation and alert modals */}
            <CustomDialog 
                isOpen={dialogOpen}
                title={dialogTitle}
                message={dialogMessage}
                type={dialogType}
                onConfirm={dialogOnConfirm}
                onCancel={() => setDialogOpen(false)}
            />
        </div>
    );
};
