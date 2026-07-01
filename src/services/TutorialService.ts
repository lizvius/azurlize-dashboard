import { SCRIPT_URL } from '../utils';

export interface TutorialStep {
    step: number;
    title: string;
    description: string;
    icon: string;
    images?: string[];
}

export interface LandingConfig {
    hero_badge: string;
    hero_title: string;
    hero_desc: string;
    hero_btn_text: string;
    benefits_title: string;
    benefits_desc: string;
    benefit1_title: string;
    benefit1_desc: string;
    benefit1_icon: string;
    benefit2_title: string;
    benefit2_desc: string;
    benefit2_icon: string;
    benefit3_title: string;
    benefit3_desc: string;
    benefit3_icon: string;
    cta_title: string;
    cta_desc: string;
}

export const DEFAULT_LANDING_CONFIG: LandingConfig = {
    hero_badge: "Onboarding & Karir Perekrut",
    hero_title: "Bangun Karir Hebat Sebagai Perekrut Profesional",
    hero_desc: "Sistem manajemen rekrutmen terpadu Team AzurLize. Kami menyediakan dashboard transparan, data pelamar real-time, pencatatan otomatis harian, serta proses klaim gaji dan bonus yang instan & aman.",
    hero_btn_text: "Mulai Bekerja Sekarang",
    benefits_title: "Mengapa Bergabung dengan Team AzurLize?",
    benefits_desc: "Dapatkan berbagai kemudahan dan kepastian pembayaran di ekosistem rekrutmen kami.",
    benefit1_title: "SLA Otomatis",
    benefit1_desc: "Kami secara otomatis memantau status pelamar harian, menandai penumpukan data > 7 hari agar tidak merugikan klaim Anda.",
    benefit1_icon: "ph-alarm",
    benefit2_title: "PWA Mobile Instan",
    benefit2_desc: "Aplikasi dapat diinstal langsung di HP Android atau Tablet Anda untuk pelaporan dan pemantauan cepat di mana saja.",
    benefit2_icon: "ph-device-mobile-camera",
    benefit3_title: "Sistem Gaji Terbuka",
    benefit3_desc: "Detail konversi T0 Sandi dan V0 Elite ditarik otomatis dari formulir absensi harian Anda tanpa proses manual yang rumit.",
    benefit3_icon: "ph-currency-circle-dollar",
    cta_title: "Siap Memulai Karir Menjadi Perekrut Handal?",
    cta_desc: "Masuk ke portal perekrut Anda dengan kredensial terdaftar untuk melihat detail target, menginput absensi harian pelamar, dan menarik laporan gaji bulanan Anda."
};

export const DEFAULT_TUTORIAL_STEPS: TutorialStep[] = [
    {
        step: 1,
        title: "Daftarkan Akun Anda",
        description: "Hubungi admin atau superadmin untuk membuat akun dan mendapatkan UID unik Anda agar bisa login ke dashboard.",
        icon: "ph-user-plus"
    },
    {
        step: 2,
        title: "Ambil Bahan Promosi",
        description: "Salin bahan lowongan kerja (teks & materi gambar) terbaru dari menu Performance atau panduan grup resmi.",
        icon: "ph-copy"
    },
    {
        step: 3,
        title: "Sebarkan Informasi Lowongan",
        description: "Posting info lowongan di jejaring sosial seperti Facebook, LinkedIn, atau grup chat untuk menjangkau calon kandidat.",
        icon: "ph-megaphone"
    },
    {
        step: 4,
        title: "Skrining & Arahkan Pelamar",
        description: "Verifikasi kualifikasi dasar pelamar, kemudian masukkan pelamar sesuai grup yang tepat (T0-Sandi atau V0-Elite).",
        icon: "ph-chats"
    },
    {
        step: 5,
        title: "Input Laporan Daily Data",
        description: "Lapor pelamar yang lolos setiap hari di tab Daily Data untuk mempermudah pencatatan dan klaim kehadiran harian.",
        icon: "ph-file-text"
    },
    {
        step: 6,
        title: "Klaim Gaji Pokok & Bonus",
        description: "Raih pencapaian performa bulanan, nikmati gaji pokok, bonus konversi, dan bonus kehadiran penuh 7 hari Rp 50.000!",
        icon: "ph-coins"
    }
];

export const TutorialService = {
    /**
     * Mengambil langkah-langkah tutorial dari Google Sheets melalui Google Apps Script.
     * Jika terjadi kegagalan/error, otomatis menggunakan DEFAULT_TUTORIAL_STEPS.
     */
    async getTutorialSteps(): Promise<TutorialStep[]> {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getTutorialSteps' })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result && result.success && Array.isArray(result.data)) {
                // Ensure every step has an images array (even if empty) to prevent crashes
                return result.data.map((item: any) => ({
                    step: Number(item.step),
                    title: String(item.title || ''),
                    description: String(item.description || ''),
                    icon: String(item.icon || 'ph-user-plus'),
                    images: Array.isArray(item.images) ? item.images : []
                }));
            }
            
            throw new Error(result?.error || 'Respon API tidak sukses atau format data salah');
        } catch (error) {
            console.warn('Gagal memuat langkah tutorial dari backend Google Sheets. Menggunakan data bawaan (fallback):', error);
            return DEFAULT_TUTORIAL_STEPS;
        }
    },

    /**
     * Menyimpan seluruh langkah tutorial ke Google Sheets melalui Google Apps Script.
     */
    async saveTutorialSteps(steps: TutorialStep[]): Promise<boolean> {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'saveTutorialSteps',
                    steps: steps
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result && result.success) {
                return true;
            }
            
            throw new Error(result?.error || 'Gagal menyimpan ke spreadsheet');
        } catch (error) {
            console.error('Error saat menyimpan tutorial:', error);
            throw error;
        }
    },

    /**
     * Mengambil konfigurasi konten landing page dari Google Sheets.
     */
    async getLandingConfig(): Promise<LandingConfig> {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'getLandingConfig' })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result && result.success && result.data) {
                // Return fetched configuration with default fallback merge
                return {
                    ...DEFAULT_LANDING_CONFIG,
                    ...result.data
                };
            }
            throw new Error(result?.error || 'Format data salah');
        } catch (error) {
            console.warn('Gagal memuat konfigurasi landing page dari Sheets, menggunakan default:', error);
            return DEFAULT_LANDING_CONFIG;
        }
    },

    /**
     * Menyimpan seluruh konfigurasi landing page ke Google Sheets.
     */
    async saveLandingConfig(config: LandingConfig): Promise<boolean> {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'saveLandingConfig',
                    config: config
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (result && result.success) {
                return true;
            }
            throw new Error(result?.error || 'Respon gagal dari Sheets');
        } catch (error) {
            console.error('Gagal menyimpan konfigurasi landing page:', error);
            throw error;
        }
    }
};
