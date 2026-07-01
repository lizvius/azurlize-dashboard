import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialise Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required in settings/secrets");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// API endpoint for AI content generation
app.post("/api/ai/generate", async (req, res) => {
  try {
    const { action, title, description, platform, size, theme, color } = req.body;
    const ai = getGemini();

    if (action === 'text') {
      const prompt = `Anda adalah Senior Copywriter dan Recruitment Specialist di TeamAzurLize.
Tugas Anda adalah membuat copywriting promosi lowongan rekrutmen yang sangat menarik berdasarkan info berikut:
- Judul: ${title}
- Deskripsi: ${description}
- Target Platform: ${platform}
- Tema Visual: ${theme}
- Warna Dominan: ${color}

Hasilkan output dalam format JSON valid dengan key:
- caption: Copywriting caption media sosial yang menarik, informatif, persuasif, memiliki jarak paragraf yang baik (readability tinggi), dan menggunakan emoji yang relevan.
- hashtags: 5-8 hashtag populer dan relevan dalam satu baris, diawali dengan #.
- cta: Call To Action pendek yang menarik (misalnya: "Daftar sekarang melalui link di bio!", atau "Hubungi Telegram admin kami!").
- imagePrompt: Prompt deskriptif detail bahasa Inggris (sekitar 50-80 kata) untuk generator gambar AI. Prompt harus fokus pada latar belakang abstrak profesional yang estetik, modern, minimalis, dan futuristik dengan kombinasi warna dominan ${color} dan tema ${theme}, tanpa teks di dalam gambar untuk dijadikan latar belakang poster lowongan kerja.

Gunakan bahasa Indonesia yang profesional namun santai dan persuasif untuk caption, hashtags, dan cta. Untuk imagePrompt wajib menggunakan bahasa Inggris.
Output HARUS hanya berupa JSON valid tanpa markdown block.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              caption: { type: Type.STRING },
              hashtags: { type: Type.STRING },
              cta: { type: Type.STRING },
              imagePrompt: { type: Type.STRING }
            },
            required: ["caption", "hashtags", "cta", "imagePrompt"]
          }
        }
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText.trim());
      return res.json({ status: "success", data: parsed });
    }

    if (action === 'image') {
      const { prompt: imagePrompt, size } = req.body;
      let aspectRatio = "1:1";
      if (size === "Story (1080x1920)") aspectRatio = "9:16";
      else if (size === "Portrait (1080x1350)") aspectRatio = "3:4";
      else if (size === "Landscape (1920x1080)") aspectRatio = "16:9";

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              text: `${imagePrompt || 'Abstract minimal geometric background with corporate colors, professional, modern, HR promotion poster background'}. High definition, cinematic style, vector-like clean graphics, no text, no letters.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
          }
        }
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!base64Image) {
        throw new Error("No image data returned from Gemini Image API");
      }

      return res.json({ status: "success", imageUrl: base64Image });
    }

    return res.status(400).json({ error: "Invalid action specified" });
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return res.status(500).json({ error: error.message || "Gagal berkomunikasi dengan AI" });
  }
});

const DB_FILE = path.join(process.cwd(), "db_store.json");

function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      users: [
        { name: "Superadmin", username: "@admin", password: "admin123", uid: "SA999", role: "Superadmin", status: "Aktif", photoUrl: "" },
        { name: "Admin", username: "@user", password: "user123", uid: "AD001", role: "Admin", status: "Aktif", photoUrl: "" }
      ],
      permissions: {
        dashboard: { name: "Dashboard", view: ["Superadmin", "Admin", "Staff"], edit: ["Superadmin", "Admin"], orderIndex: 1, icon: "ph-squares-four", category: "Overview" },
        performance: { name: "Performance", view: ["Superadmin", "Admin", "Staff"], edit: ["Superadmin", "Admin"], orderIndex: 2, icon: "ph-medal", category: "Performance" },
        daily_data: { name: "Daily Data", view: ["Superadmin", "Admin", "Staff"], edit: ["Superadmin", "Admin"], orderIndex: 3, icon: "ph-address-book", category: "Management" },
        daily_stats: { name: "Daily Stats", view: ["Superadmin", "Admin", "Staff"], edit: ["Superadmin", "Admin"], orderIndex: 4, icon: "ph-chart-bar", category: "Management" },
        payroll: { name: "Payroll", view: ["Superadmin", "Admin", "Staff"], edit: ["Superadmin", "Admin"], orderIndex: 5, icon: "ph-currency-circle-dollar", category: "Management" },
        users: { name: "User Accounts", view: ["Superadmin", "Admin", "Staff"], edit: ["Superadmin", "Admin", "Staff"], orderIndex: 6, icon: "ph-user-gear", category: "Management" },
        settings: { name: "Settings", view: ["Superadmin", "Admin", "Staff"], edit: ["Superadmin", "Admin"], orderIndex: 7, icon: "ph-gear", category: "System" }
      },
      announcements: [
        {
          id: "post_1",
          title: "Materi Promosi Perdana",
          caption: "Gabung bersama kami! Dapatkan komisi menarik dan bonus mingguan.",
          imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80",
          uploadedBy: "Superadmin",
          role: "Superadmin",
          timestamp: new Date().toISOString()
        }
      ],
      dailyData: [],
      perf: [],
      payroll: [],
      tutorialSteps: [
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
      ],
      landingConfig: {
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
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
    return initialDb;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (err) {
    console.error("Error reading JSON db:", err);
    return {};
  }
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing JSON db:", err);
  }
}

app.post("/api/proxy", async (req, res) => {
  const payload = req.body || {};
  const action = payload.action;

  // Override res.json to automatically inject both success and status flags for maximum client compatibility
  const originalJson = res.json;
  res.json = function (body: any): any {
    if (body && typeof body === 'object') {
      if (body.status === 'success' && body.success === undefined) {
        body.success = true;
      } else if (body.status === 'error' && body.success === undefined) {
        body.success = false;
      } else if (body.success === true && body.status === undefined) {
        body.status = 'success';
      } else if (body.success === false && body.status === undefined) {
        body.status = 'error';
      }
    }
    return originalJson.call(this, body);
  };

  // 1. Try to fetch from real Google Apps Script first
  const realScriptUrl = "https://script.google.com/macros/s/AKfycbzphzP7NCpZy5lpXZPgTr6EgEBTnKhaHGTHLGX4VQ_uvW27zKP7x52YkkpEjr0Ri0A3/exec";
  try {
    const response = await fetch(realScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000)
    });

    if (response.ok && response.headers.get("content-type")?.includes("json")) {
      const data = await response.json();
      return res.json(data);
    }
    console.warn(`Google Apps Script returned status ${response.status} with content-type: ${response.headers.get("content-type")}. Falling back to local database.`);
  } catch (error) {
    console.warn("Failed to reach Google Apps Script, using local database fallback:", error);
  }

  // 2. Local Database simulation (Fallback)
  try {
    const db = getDb();

    if (action === 'login') {
      const users = db.users || [];
      const cleanUsername = String(payload.username || '').trim().toLowerCase();
      const matchedUser = users.find((u: any) => String(u.username || '').trim().toLowerCase() === cleanUsername);
      if (matchedUser) {
        if (matchedUser.status === 'Nonaktif' || matchedUser.status === 'Suspend') {
          return res.json({ status: 'error', message: 'Akun Anda sedang ditangguhkan / nonaktif. Hubungi Admin.' });
        }
        return res.json({ status: 'success', data: matchedUser });
      }
      return res.json({ status: 'error', message: 'Username tidak ditemukan atau salah.' });
    }

    if (action === 'getUsers') {
      return res.json({ status: 'success', data: db.users || [] });
    }

    if (action === 'addUser') {
      let user = String(payload.username || '').trim();
      if (!user.startsWith('@')) user = '@' + user;
      const users = db.users || [];
      if (users.some((u: any) => String(u.username || '').trim().toLowerCase() === user.toLowerCase())) {
        return res.json({ status: 'error', message: 'Username sudah digunakan.' });
      }
      if (payload.uid && users.some((u: any) => String(u.uid).trim() === String(payload.uid).trim())) {
        return res.json({ status: 'error', message: 'UID sudah digunakan.' });
      }

      let finalPhotoUrl = "";
      if (payload.photoBase64) {
        finalPhotoUrl = `data:${payload.photoMimeType || 'image/png'};base64,${payload.photoBase64}`;
      }

      const newUser = {
        name: payload.name || '',
        username: user,
        password: payload.password || '',
        uid: payload.uid || '',
        role: payload.role || 'Staff',
        status: payload.status || 'Aktif',
        photoUrl: finalPhotoUrl || payload.photoUrl || ''
      };
      users.push(newUser);
      db.users = users;
      saveDb(db);
      return res.json({ status: 'success', message: 'User berhasil ditambahkan.' });
    }

    if (action === 'updateUser') {
      const users = db.users || [];
      const oldUsername = payload.oldUsername || payload.username;
      const idx = users.findIndex((u: any) => String(u.username || '').trim().toLowerCase() === String(oldUsername || '').trim().toLowerCase());
      if (idx !== -1) {
        let finalPhotoUrl = users[idx].photoUrl || "";
        if (payload.photoBase64) {
          finalPhotoUrl = `data:${payload.photoMimeType || 'image/png'};base64,${payload.photoBase64}`;
        }

        users[idx] = {
          ...users[idx],
          name: payload.name !== undefined ? payload.name : users[idx].name,
          username: payload.username !== undefined ? payload.username : users[idx].username,
          password: payload.password ? payload.password : users[idx].password,
          uid: payload.uid !== undefined ? payload.uid : users[idx].uid,
          role: payload.role !== undefined ? payload.role : users[idx].role,
          status: payload.status !== undefined ? payload.status : users[idx].status,
          photoUrl: payload.photoBase64 ? finalPhotoUrl : (payload.photoUrl !== undefined ? payload.photoUrl : users[idx].photoUrl)
        };
        db.users = users;
        saveDb(db);
        return res.json({ status: 'success', message: 'Data user berhasil diperbarui.' });
      }
      return res.json({ status: 'error', message: 'User tidak ditemukan.' });
    }

    if (action === 'deleteUser') {
      const users = db.users || [];
      const idx = users.findIndex((u: any) => String(u.username || '').trim().toLowerCase() === String(payload.username || '').trim().toLowerCase());
      if (idx !== -1) {
        users.splice(idx, 1);
        db.users = users;
        saveDb(db);
        return res.json({ status: 'success', message: 'Akun user berhasil dihapus.' });
      }
      return res.json({ status: 'error', message: 'Akun tidak ditemukan.' });
    }

    if (action === 'getPermissions') {
      return res.json({ status: 'success', data: db.permissions || {} });
    }

    if (action === 'savePermissions') {
      db.permissions = payload.permissions || {};
      saveDb(db);
      return res.json({ status: 'success' });
    }

    if (action === 'getDailyData') {
      let rows = db.dailyData || [];
      if (payload.role === 'Staff') {
        const usernameLower = String(payload.username || '').toLowerCase();
        const nameLower = String(payload.name || '').toLowerCase();
        rows = rows.filter((r: any) =>
          String(r.recruiter || '').toLowerCase() === usernameLower ||
          String(r.recruiter || '').toLowerCase() === nameLower
        );
      }
      return res.json({ status: 'success', data: rows });
    }

    if (action === 'addDailyData') {
      const rows = db.dailyData || [];
      const newRow = {
        id: payload.id || 'daily_' + Date.now(),
        tanggal: payload.tanggal || '',
        recruiter: payload.recruiter || '',
        channels: payload.channels || '',
        email: payload.email || '',
        wa: payload.wa || '',
        uid: payload.uid || '',
        username: payload.username || '',
        results: payload.results || 'Pending',
        grup: payload.grup || ''
      };
      rows.push(newRow);
      db.dailyData = rows;
      saveDb(db);
      return res.json({ status: 'success', message: 'Data pelamar harian berhasil disimpan.' });
    }

    if (action === 'updateDailyData') {
      const rows = db.dailyData || [];
      const idx = rows.findIndex((r: any) => String(r.id) === String(payload.id));
      if (idx !== -1) {
        rows[idx] = {
          ...rows[idx],
          ...payload
        };
        db.dailyData = rows;
        saveDb(db);
        return res.json({ status: 'success', message: 'Data pelamar harian berhasil diperbarui.' });
      }
      return res.json({ status: 'error', message: 'Data pelamar tidak ditemukan.' });
    }

    if (action === 'deleteDailyData') {
      const rows = db.dailyData || [];
      const idx = rows.findIndex((r: any) => String(r.id) === String(payload.id));
      if (idx !== -1) {
        rows.splice(idx, 1);
        db.dailyData = rows;
        saveDb(db);
        return res.json({ status: 'success', message: 'Data pelamar berhasil dihapus.' });
      }
      return res.json({ status: 'error', message: 'Data tidak ditemukan.' });
    }

    if (action === 'getPerfData') {
      return res.json({ status: 'success', data: db.perf || [] });
    }

    if (action === 'addPerfData') {
      const rows = db.perf || [];
      const id = 'perf_' + Date.now();
      const newRow = {
        id: id,
        date: payload.date || '',
        perekrut: payload.perekrut || '',
        grup: payload.grup || '',
        jumlahLolos: Number(payload.jumlahLolos || 0),
        keterangan: payload.keterangan || '',
        timestamp: new Date().toISOString()
      };
      rows.push(newRow);
      db.perf = rows;
      saveDb(db);
      return res.json({ status: 'success', message: 'Statistik harian berhasil ditambahkan.' });
    }

    if (action === 'deletePerfData') {
      const rows = db.perf || [];
      const idx = rows.findIndex((r: any) => String(r.id) === String(payload.id));
      if (idx !== -1) {
        rows.splice(idx, 1);
        db.perf = rows;
        saveDb(db);
        return res.json({ status: 'success', message: 'Data statistik berhasil dihapus.' });
      }
      return res.json({ status: 'error', message: 'Data statistik tidak ditemukan.' });
    }

    if (action === 'getPayrollData') {
      return res.json({ status: 'success', data: [...(db.payroll || [])].reverse() });
    }

    if (action === 'addPayrollData') {
      const rows = db.payroll || [];
      const newRow = {
        id: payload.id || 'pay_' + Date.now(),
        periode: payload.periode || '',
        username: payload.username || '',
        uid: payload.uid || '',
        hariKerja: Number(payload.hariKerja || 0),
        totalPostingan: Number(payload.totalPostingan || 0),
        deklarasiT0: Number(payload.deklarasiT0 || 0),
        sebenarnyaT0: Number(payload.sebenarnyaT0 || 0),
        t3: Number(payload.t3 || 0),
        deklarasiV0: Number(payload.deklarasiV0 || 0),
        sebenarnyaV0: Number(payload.sebenarnyaV0 || 0),
        rasioPeningkatan: Number(payload.rasioPeningkatan || 0),
        komisi: Number(payload.komisi || 0),
        bonusT0: Number(payload.bonusT0 || 0),
        bonusT3: Number(payload.bonusT3 || 0),
        otherBonus: Number(payload.otherBonus || 0),
        deduksi: Number(payload.deduksi || 0),
        status: payload.status || 'Draft',
        levelGaji: payload.levelGaji || '',
        gajiPokok: Number(payload.gajiPokok || 0),
        totalGaji: Number(payload.totalGaji || 0)
      };
      rows.push(newRow);
      db.payroll = rows;
      saveDb(db);
      return res.json({ status: 'success', message: 'Data slip gaji berhasil disimpan.' });
    }

    if (action === 'updatePayrollData') {
      const rows = db.payroll || [];
      const idx = rows.findIndex((r: any) => String(r.id) === String(payload.id));
      if (idx !== -1) {
        rows[idx] = {
          ...rows[idx],
          ...payload
        };
        db.payroll = rows;
        saveDb(db);
        return res.json({ status: 'success', message: 'Data slip gaji berhasil diperbarui.' });
      }
      return res.json({ status: 'error', message: 'Data slip gaji tidak ditemukan.' });
    }

    if (action === 'deletePayrollData') {
      const rows = db.payroll || [];
      const idx = rows.findIndex((r: any) => String(r.id) === String(payload.id));
      if (idx !== -1) {
        rows.splice(idx, 1);
        db.payroll = rows;
        saveDb(db);
        return res.json({ status: 'success', message: 'Data slip gaji berhasil dihapus.' });
      }
      return res.json({ status: 'error', message: 'Data slip gaji tidak ditemukan.' });
    }

    if (action === 'getTutorialSteps') {
      return res.json({ status: 'success', data: db.tutorialSteps || [] });
    }

    if (action === 'saveTutorialSteps') {
      db.tutorialSteps = payload.steps || [];
      saveDb(db);
      return res.json({ status: 'success', message: 'Langkah tutorial berhasil disimpan.' });
    }

    if (action === 'getLandingConfig') {
      return res.json({ status: 'success', data: db.landingConfig || {} });
    }

    if (action === 'saveLandingConfig') {
      db.landingConfig = payload.config || {};
      saveDb(db);
      return res.json({ status: 'success', message: 'Landing page berhasil diperbarui.' });
    }

    return res.status(400).json({ error: "Aksi tidak valid" });
  } catch (err: any) {
    console.error("Local DB proxy error:", err);
    return res.status(500).json({ status: 'error', message: err.message || 'Error executing action in local DB' });
  }
});

// Vite middleware in development / static in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
