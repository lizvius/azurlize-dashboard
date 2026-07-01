// ====================================================================
// BACKEND API RECRUITOPS - GOOGLE APPS SCRIPT (INTEGRATED & SELF-HEALING)
// ====================================================================

// Nama Sheet Konstanta
const SHEET_USERS = '01_TeamMembes';
const SHEET_ANNOUNCEMENTS = '02_Announcements';
const SHEET_DAILY_DATA = '03_DailyData';
const SHEET_PERF = '04_DailyStats';
const SHEET_PAYROLL = '05_Payroll';
const SHEET_TUTORIAL = '07_TUTORIAL';
const SHEET_LANDING_CONFIG = '08_LANDING_CONFIG';
const SHEET_PERMISSIONS = '09_PERMISSIONS';
const SHEET_ACTIVITY_LOGS = '10_ACTIVITY_LOGS';

/**
 * Endpoint Utama POST untuk menangani seluruh aksi dari frontend React.
 */
function doPost(e) {
  try {
    // Inisialisasi awal seluruh lembar kerja jika belum ada (Self-Healing)
    initAllSheets();
    
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    // 1. FITUR USERS & AUTH
    if (action === 'login') {
      return respondJson(handleLogin(data.username, data.uid));
    }
    if (action === 'getUsers') {
      return respondJson(getUsers());
    }
    if (action === 'addUser') {
      return respondJson(handleAddUser(data));
    }
    if (action === 'updateUser') {
      return respondJson(updateUser(data));
    }
    if (action === 'deleteUser') {
      return respondJson(deleteUser(data.username));
    }
    if (action === 'getLogs') {
      return respondJson(getLogs(data.username));
    }
    if (action === 'addLog') {
      return respondJson(addLog(data));
    }
    if (action === 'getPermissions') {
      return respondJson(getPermissions());
    }
    if (action === 'savePermissions') {
      return respondJson(savePermissions(data.permissions));
    }

    // 2. FITUR DAILY DATA PELAMAR
    if (action === 'getDailyData') {
      return respondJson(getDailyData(data.role, data.username, data.name));
    }
    if (action === 'addDailyData') {
      return respondJson(addDailyData(data));
    }
    if (action === 'updateDailyData') {
      return respondJson(updateDailyData(data));
    }
    if (action === 'deleteDailyData') {
      return respondJson(deleteDailyData(data.id));
    }

    // 3. FITUR PERFORMANCE / DAILY STATS
    if (action === 'getPerfData') {
      return respondJson(getPerfData(data));
    }
    if (action === 'addPerfData') {
      return respondJson(addPerfData(data));
    }
    if (action === 'deletePerfData') {
      return respondJson(deletePerfData(data.id));
    }

    // 4. FITUR PAYROLL
    if (action === 'getPayrollData') {
      return respondJson(getPayrollData());
    }
    if (action === 'addPayrollData') {
      return respondJson(addPayrollData(data));
    }
    if (action === 'updatePayrollData') {
      return respondJson(updatePayrollData(data));
    }
    if (action === 'deletePayrollData') {
      return respondJson(deletePayrollData(data.id));
    }

    // 5. FITUR TUTORIAL
    if (action === 'getTutorialSteps') {
      return respondJson(getTutorialSteps());
    }
    if (action === 'saveTutorialSteps') {
      return respondJson(saveTutorialSteps(data.steps));
    }

    // 6. FITUR LANDING CONFIG
    if (action === 'getLandingConfig') {
      return respondJson(getLandingConfig());
    }
    if (action === 'saveLandingConfig') {
      return respondJson(saveLandingConfig(data.config));
    }

    return respondError("Aksi '" + action + "' tidak valid.");
  } catch (error) {
    return respondError("Server error: " + error.toString());
  }
}

/**
 * Endpoint Utama GET untuk pengecekan status API dan penarikan data publik.
 */
function doGet(e) {
  try {
    initAllSheets();
    const action = e.parameter.action;
    if (action === 'getTutorialSteps') {
      return respondJson(getTutorialSteps());
    }
    if (action === 'getLandingConfig') {
      return respondJson(getLandingConfig());
    }
  } catch (error) {
    return respondJson({ success: false, error: error.toString() });
  }
  return ContentService.createTextOutput("🚀 RecruitOps API is Online, Running, and Self-Healing!");
}

// ====================================================================
// UTILITY FUNCTIONS & DRIVE UPLOAD INTEGRATION
// ====================================================================

function respondJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function respondError(message) {
  return respondJson({ status: "error", message: message });
}

/**
 * Fungsi untuk mengunggah berkas Base64 ke Google Drive dan mengembalikan URL shareable.
 */
function uploadToGoogleDrive(base64Data, mimeType, originalFilename) {
  if (!base64Data) return "";
  try {
    const folderName = "RecruitOps_Shared_Assets";
    const folders = DriveApp.getFoldersByName(folderName);
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, originalFilename);
    const file = folder.createFile(blob);
    
    // Set izin agar siapa saja yang memiliki tautan dapat melihat foto
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    const fileId = file.getId();
    // Kembalikan URL embed langsung (lh3) yang bisa dirender di HTML <img>
    return "https://lh3.googleusercontent.com/d/" + fileId;
  } catch (e) {
    // Jika Drive API mengalami error, kembalikan data URL lokal sebagai fallback
    return "data:" + mimeType + ";base64," + base64Data;
  }
}

/**
 * Inisialisasi otomatis lembar kerja Google Sheets agar pengguna tidak perlu membuatnya manual.
 */
function initAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. SHEET USERS
  let sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
    sheetUsers.appendRow(['name', 'username', 'password', 'uid', 'role', 'status', 'photoUrl']);
    // Masukkan data default Superadmin pertama
    sheetUsers.appendRow(['Superadmin', '@admin', 'admin123', 'SA999', 'Superadmin', 'Aktif', '']);
  }
  
  // 2. SHEET ANNOUNCEMENTS (GALLERY & PROMO MATERIALS)
  let sheetAnnounce = ss.getSheetByName(SHEET_ANNOUNCEMENTS);
  if (!sheetAnnounce) {
    sheetAnnounce = ss.insertSheet(SHEET_ANNOUNCEMENTS);
    sheetAnnounce.appendRow(['id', 'title', 'caption', 'imageUrl', 'uploadedBy', 'role', 'timestamp']);
    sheetAnnounce.appendRow([
      'post_' + Date.now(),
      'Materi Promosi Perdana',
      'Gabung bersama kami! Dapatkan komisi menarik dan bonus mingguan.',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
      'Superadmin',
      'Superadmin',
      new Date().toISOString()
    ]);
  }
  
  // 3. SHEET DAILY DATA (LOG ABSENSI PELAMAR)
  let sheetDaily = ss.getSheetByName(SHEET_DAILY_DATA);
  if (!sheetDaily) {
    sheetDaily = ss.insertSheet(SHEET_DAILY_DATA);
    sheetDaily.appendRow(['id', 'tanggal', 'recruiter', 'channels', 'email', 'wa', 'uid', 'username', 'results', 'grup']);
  }
  
  // 4. SHEET DAILY STATS (PERFORMANCE SUMMARY)
  let sheetPerf = ss.getSheetByName(SHEET_PERF);
  if (!sheetPerf) {
    sheetPerf = ss.insertSheet(SHEET_PERF);
    sheetPerf.appendRow(['id', 'date', 'perekrut', 'grup', 'jumlahLolos', 'keterangan', 'timestamp']);
  }
  
  // 5. SHEET PAYROLL
  let sheetPayroll = ss.getSheetByName(SHEET_PAYROLL);
  if (!sheetPayroll) {
    sheetPayroll = ss.insertSheet(SHEET_PAYROLL);
    sheetPayroll.appendRow([
      "id", "periode", "username", "uid", "hariKerja", "totalPostingan", "deklarasiT0", 
      "sebenarnyaT0", "t3", "deklarasiV0", "sebenarnyaV0", "rasioPeningkatan", 
      "komisi", "bonusT0", "bonusT3", "otherBonus", "deduksi", "status", "levelGaji", "gajiPokok", "totalGaji"
    ]);
  }
  
  // 6. SHEET TUTORIAL
  let sheetTut = ss.getSheetByName(SHEET_TUTORIAL);
  if (!sheetTut) {
    getTutorialSteps(); // Otomatis menginisialisasi
  }
  
  // 7. SHEET LANDING CONFIG
  let sheetLanding = ss.getSheetByName(SHEET_LANDING_CONFIG);
  if (!sheetLanding) {
    getLandingConfig(); // Otomatis menginisialisasi
  }

  // 8. SHEET PERMISSIONS
  let sheetPerms = ss.getSheetByName(SHEET_PERMISSIONS);
  if (!sheetPerms) {
    sheetPerms = ss.insertSheet(SHEET_PERMISSIONS);
    sheetPerms.appendRow(['pageId', 'pageName', 'viewRoles', 'editRoles', 'orderIndex', 'icon', 'category']);
    sheetPerms.appendRow(['dashboard', 'Dashboard', 'Superadmin,Admin,Staff', 'Superadmin,Admin', 1, 'ph-squares-four', 'Overview']);
    sheetPerms.appendRow(['performance', 'Performance', 'Superadmin,Admin,Staff', 'Superadmin,Admin', 2, 'ph-medal', 'Performance']);
    sheetPerms.appendRow(['daily_data', 'Daily Data', 'Superadmin,Admin,Staff', 'Superadmin,Admin', 3, 'ph-address-book', 'Management']);
    sheetPerms.appendRow(['daily_stats', 'Daily Stats', 'Superadmin,Admin,Staff', 'Superadmin,Admin', 4, 'ph-chart-bar', 'Management']);
    sheetPerms.appendRow(['payroll', 'Payroll', 'Superadmin,Admin,Staff', 'Superadmin,Admin', 5, 'ph-currency-circle-dollar', 'Management']);
    sheetPerms.appendRow(['users', 'User Accounts', 'Superadmin,Admin,Staff', 'Superadmin,Admin,Staff', 6, 'ph-user-gear', 'Management']);
  }

  // 9. ACTIVITY LOGS
  let sheetLogs = ss.getSheetByName(SHEET_ACTIVITY_LOGS);
  if (!sheetLogs) {
    sheetLogs = ss.insertSheet(SHEET_ACTIVITY_LOGS);
    sheetLogs.appendRow(['id', 'username', 'action', 'description', 'timestamp']);
  }
}

// ====================================================================
// SECTION 1: USERS & AUTHENTICATION HANDLERS
// ====================================================================

function handleLogin(username, uid) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const userIdx = headers.indexOf('username');
  const uidIdx = headers.indexOf('uid');
  
  for (let i = 1; i < data.length; i++) {
    const sheetUser = String(data[i][userIdx]).trim();
    const sheetUid = uidIdx !== -1 ? String(data[i][uidIdx]).trim() : '';
    
    // Allow matching with or without '@' prefix for username
    const cleanUsername = String(username || '').trim().toLowerCase();
    const usernameWithAt = cleanUsername.startsWith('@') ? cleanUsername : '@' + cleanUsername;
    const usernameWithoutAt = cleanUsername.startsWith('@') ? cleanUsername.slice(1) : cleanUsername;
    
    const dbUsername = sheetUser.toLowerCase();
    const dbUsernameWithAt = dbUsername.startsWith('@') ? dbUsername : '@' + dbUsername;
    const dbUsernameWithoutAt = dbUsername.startsWith('@') ? dbUsername.slice(1) : dbUsername;
    
    const usernameMatches = (dbUsername === cleanUsername) || 
                            (dbUsernameWithAt === usernameWithAt) || 
                            (dbUsernameWithoutAt === usernameWithoutAt);
                            
    const cleanUid = String(uid || '').trim();
    const uidMatches = sheetUid === cleanUid;
    
    if (usernameMatches && uidMatches) {
      // Buat user object
      const userObj = {};
      headers.forEach((h, index) => {
        userObj[h] = data[i][index];
      });
      
      if (userObj.status === 'Nonaktif' || userObj.status === 'Suspend') {
        return { status: 'error', message: 'Akun Anda sedang ditangguhkan / nonaktif. Hubungi Admin.' };
      }
      
      // Catat log login
      try {
        const sheetLogs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ACTIVITY_LOGS);
        if (sheetLogs) {
          sheetLogs.appendRow(['log_' + Date.now(), userObj.username, 'Login Berhasil', 'Mengakses via Web Panel', new Date().toISOString()]);
        }
      } catch (e) {}

      return { status: 'success', data: userObj };
    }
  }
  
  return { status: 'error', message: 'Username atau UID tidak ditemukan atau salah.' };
}

function getLogs(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ACTIVITY_LOGS);
  if (!sheet) return { status: 'success', data: [] };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', data: [] };
  
  const headers = data[0];
  const result = [];
  const cleanUser = String(username || '').trim().toLowerCase();
  
  for (let i = data.length - 1; i > 0; i--) {
    const row = data[i];
    const logUser = String(row[headers.indexOf('username')] || '').trim().toLowerCase();
    
    if (!username || logUser === cleanUser || logUser.slice(1) === cleanUser || logUser === cleanUser.slice(1)) {
       const logObj = {};
       headers.forEach((h, index) => {
         logObj[h] = row[index];
       });
       result.push(logObj);
    }
  }
  return { status: 'success', data: result };
}

function addLog(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ACTIVITY_LOGS);
  if (!sheet) return { status: 'error', message: 'Sheet not found' };
  
  sheet.appendRow([
    'log_' + Date.now(),
    payload.username,
    payload.action || 'activity',
    payload.description || '',
    new Date().toISOString()
  ]);
  return { status: 'success' };
}

function getPermissions() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PERMISSIONS);
    if (!sheet) {
      return { status: 'success', data: {} };
    }
    const data = sheet.getDataRange().getValues();
    const result = {};
    for (let i = 1; i < data.length; i++) {
      const pageId = data[i][0];
      const pageName = data[i][1];
      const viewRoles = String(data[i][2]).split(',').map(r => r.trim()).filter(Boolean);
      const editRoles = String(data[i][3]).split(',').map(r => r.trim()).filter(Boolean);
      const orderIndex = data[i][4] !== undefined ? Number(data[i][4]) : i;
      const icon = data[i][5] || '';
      const category = data[i][6] || '';
      result[pageId] = {
        name: pageName,
        view: viewRoles,
        edit: editRoles,
        orderIndex: orderIndex,
        icon: icon,
        category: category
      };
    }
    return { status: 'success', data: result };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function savePermissions(permissionsObj) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PERMISSIONS);
    if (!sheet) {
      return { status: 'error', message: 'Sheet permissions tidak ditemukan' };
    }
    sheet.clearContents();
    sheet.appendRow(['pageId', 'pageName', 'viewRoles', 'editRoles', 'orderIndex', 'icon', 'category']);
    for (const pageId in permissionsObj) {
      const perm = permissionsObj[pageId];
      sheet.appendRow([
        pageId,
        perm.name || '',
        (perm.view || []).join(','),
        (perm.edit || []).join(','),
        perm.orderIndex !== undefined ? Number(perm.orderIndex) : 99,
        perm.icon || '',
        perm.category || ''
      ]);
    }
    return { status: 'success' };
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const users = [];
  for (let i = 1; i < data.length; i++) {
    const userObj = {};
    headers.forEach((h, index) => {
      userObj[h] = data[i][index];
    });
    users.push(userObj);
  }
  
  return { status: 'success', data: users };
}

function handleAddUser(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const userIdx = headers.indexOf('username');
  const uidIdx = headers.indexOf('uid');
  
  let user = payload.username.trim();
  if (!user.startsWith('@')) user = '@' + user;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIdx]).toLowerCase() === user.toLowerCase()) {
      return { status: 'error', message: 'Username sudah digunakan.' };
    }
    if (payload.uid && String(data[i][uidIdx]).trim() === String(payload.uid).trim()) {
      return { status: 'error', message: 'UID sudah digunakan.' };
    }
  }
  
  let finalPhotoUrl = "";
  if (payload.photoBase64) {
    finalPhotoUrl = uploadToGoogleDrive(payload.photoBase64, payload.photoMimeType, "profile_" + user + ".png");
  }
  
  const newRow = headers.map(h => {
    if (h === 'photoUrl') return finalPhotoUrl;
    if (h === 'username') return user;
    return payload[h] !== undefined ? payload[h] : '';
  });
  
  sheet.appendRow(newRow);
  return { status: 'success', message: 'User berhasil ditambahkan.' };
}

function updateUser(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const userColIdx = headers.indexOf('username');
  const oldUsername = payload.oldUsername || payload.username;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userColIdx]).toLowerCase() === oldUsername.toLowerCase()) {
      let finalPhotoUrl = data[i][headers.indexOf('photoUrl')] || "";
      if (payload.photoBase64) {
        finalPhotoUrl = uploadToGoogleDrive(payload.photoBase64, payload.photoMimeType, "profile_update_" + payload.username + ".png");
      }
      
      const updatedRow = headers.map((h, index) => {
        if (h === 'photoUrl') return finalPhotoUrl;
        if (h === 'password' && !payload.password) return data[i][index]; // pertahankan sandi lama
        return payload[h] !== undefined ? payload[h] : data[i][index];
      });
      
      sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
      
      // Catat log edit profile
      try {
        const sheetLogs = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ACTIVITY_LOGS);
        if (sheetLogs) {
          const actionName = payload.photoBase64 ? 'Update Foto Profil' : 'Edit Profil';
          sheetLogs.appendRow(['log_' + Date.now(), oldUsername, actionName, 'Data profil telah diperbarui', new Date().toISOString()]);
        }
      } catch (e) {}

      return { status: 'success', message: 'Data user berhasil diperbarui.' };
    }
  }
  
  return { status: 'error', message: 'User tidak ditemukan.' };
}

function deleteUser(username) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USERS);
  const data = sheet.getDataRange().getValues();
  const userColIdx = data[0].indexOf('username');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userColIdx]).toLowerCase() === username.toLowerCase()) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Akun user berhasil dihapus.' };
    }
  }
  
  return { status: 'error', message: 'Akun tidak ditemukan.' };
}

// ====================================================================
// SECTION 2: DAILY DATA PELAMAR HANDLERS
// ====================================================================

function getDailyData(role, username, name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DAILY_DATA);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', data: [] };
  
  const headers = data[0];
  let rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = data[i][idx];
    });
    rows.push(obj);
  }
  
  // Staff hanya boleh melihat data yang dia inputkan sendiri
  if (role === 'Staff') {
    rows = rows.filter(r => 
      String(r.recruiter).toLowerCase() === String(username).toLowerCase() || 
      String(r.recruiter).toLowerCase() === String(name).toLowerCase()
    );
  }
  
  return { status: 'success', data: rows };
}

function addDailyData(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DAILY_DATA);
  const headers = sheet.getDataRange().getValues()[0];
  
  const newRow = headers.map(h => payload[h] !== undefined ? payload[h] : '');
  sheet.appendRow(newRow);
  return { status: 'success', message: 'Data pelamar harian berhasil disimpan.' };
}

function updateDailyData(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DAILY_DATA);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(payload.id)) {
      const updatedRow = headers.map((h, idx) => payload[h] !== undefined ? payload[h] : data[i][idx]);
      sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
      return { status: 'success', message: 'Data pelamar harian berhasil diperbarui.' };
    }
  }
  return { status: 'error', message: 'Data pelamar tidak ditemukan.' };
}

function deleteDailyData(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DAILY_DATA);
  const data = sheet.getDataRange().getValues();
  const idColIdx = data[0].indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Data pelamar berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Data tidak ditemukan.' };
}

// ====================================================================
// SECTION 3: DAILY STATS / PERFORMANCE HANDLERS
// ====================================================================

function getPerfData(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PERF);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', data: [] };
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = data[i][idx];
    });
    rows.push(obj);
  }
  
  return { status: 'success', data: rows };
}

function addPerfData(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PERF);
  const headers = sheet.getDataRange().getValues()[0];
  
  const id = 'perf_' + Date.now();
  const newRow = headers.map(h => {
    if (h === 'id') return id;
    if (h === 'timestamp') return new Date().toISOString();
    return payload[h] !== undefined ? payload[h] : '';
  });
  
  sheet.appendRow(newRow);
  return { status: 'success', message: 'Statistik harian berhasil ditambahkan.' };
}

function deletePerfData(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PERF);
  const data = sheet.getDataRange().getValues();
  const idColIdx = data[0].indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Data statistik berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Data statistik tidak ditemukan.' };
}

// ====================================================================
// SECTION 4: PAYROLL HANDLERS
// ====================================================================

function getPayrollData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PAYROLL);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { status: 'success', data: [] };
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = data[i][idx];
    });
    rows.push(obj);
  }
  
  return { status: 'success', data: rows.reverse() };
}

function addPayrollData(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PAYROLL);
  const headers = sheet.getDataRange().getValues()[0];
  
  const newRow = headers.map(h => payload[h] !== undefined ? payload[h] : '');
  sheet.appendRow(newRow);
  return { status: 'success', message: 'Data slip gaji berhasil disimpan.' };
}

function updatePayrollData(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PAYROLL);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idColIdx = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(payload.id)) {
      const updatedRow = headers.map((h, idx) => payload[h] !== undefined ? payload[h] : data[i][idx]);
      sheet.getRange(i + 1, 1, 1, updatedRow.length).setValues([updatedRow]);
      return { status: 'success', message: 'Data slip gaji berhasil diperbarui.' };
    }
  }
  return { status: 'error', message: 'Data slip gaji tidak ditemukan.' };
}

function deletePayrollData(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PAYROLL);
  const data = sheet.getDataRange().getValues();
  const idColIdx = data[0].indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { status: 'success', message: 'Data slip gaji berhasil dihapus.' };
    }
  }
  return { status: 'error', message: 'Data slip gaji tidak ditemukan.' };
}

// ====================================================================
// SECTION 5: TUTORIAL STEPS HANDLERS
// ====================================================================

function getTutorialSteps() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_TUTORIAL);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TUTORIAL);
    sheet.appendRow(['STEP', 'TITLE', 'DESCRIPTION', 'ICON', 'IMAGES', 'UPDATED_AT']);
    
    const defaultSteps = [
      [1, "Daftarkan Akun Anda", "Hubungi admin atau superadmin untuk membuat akun dan mendapatkan UID unik Anda agar bisa login ke dashboard.", "ph-user-plus", "", new Date()],
      [2, "Ambil Bahan Promosi", "Salin bahan lowongan kerja (teks & materi gambar) terbaru dari menu Performance atau panduan grup resmi.", "ph-copy", "", new Date()],
      [3, "Sebarkan Informasi Lowongan", "Posting info lowongan di jejaring sosial seperti Facebook, LinkedIn, atau grup chat untuk menjangkau calon kandidat.", "ph-megaphone", "", new Date()],
      [4, "Skrining & Arahkan Pelamar", "Verifikasi kualifikasi dasar pelamar, kemudian masukkan pelamar sesuai grup yang tepat (T0-Sandi atau V0-Elite).", "ph-chats", "", new Date()],
      [5, "Input Laporan Daily Data", "Lapor pelamar yang lolos setiap hari di tab Daily Data untuk mempermudah pencatatan dan klaim kehadiran harian.", "ph-file-text", "", new Date()],
      [6, "Klaim Gaji Pokok & Bonus", "Raih pencapaian performa bulanan, nikmati gaji pokok, bonus konversi, dan bonus kehadiran penuh 7 hari Rp 50.000!", "ph-coins", "", new Date()]
    ];
    
    defaultSteps.forEach(row => {
      sheet.appendRow(row);
    });
  }
  
  const data = sheet.getDataRange().getValues();
  const steps = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const stepNum = parseInt(row[0]) || i;
    const title = String(row[1] || '').trim();
    const description = String(row[2] || '').trim();
    const icon = String(row[3] || 'ph-user-plus').trim();
    const imagesRaw = String(row[4] || '').trim();
    const images = parseImages(imagesRaw);
    
    if (title || description) {
      steps.push({
        step: stepNum,
        title: title,
        description: description,
        icon: icon,
        images: images
      });
    }
  }
  
  steps.sort((a, b) => a.step - b.step);
  return { status: 'success', data: steps };
}

function saveTutorialSteps(stepsArray) {
  if (!stepsArray || !Array.isArray(stepsArray)) {
    return { status: 'error', message: 'Data tutorial harus berformat Array.' };
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_TUTORIAL);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_TUTORIAL);
  } else {
    sheet.clearContents();
  }
  
  sheet.appendRow(['STEP', 'TITLE', 'DESCRIPTION', 'ICON', 'IMAGES', 'UPDATED_AT']);
  const now = new Date().toISOString();
  
  for (let i = 0; i < stepsArray.length; i++) {
    const s = stepsArray[i];
    const stepNum = parseInt(s.step) || (i + 1);
    const title = String(s.title || '').trim();
    const desc = String(s.description || '').trim();
    const icon = String(s.icon || 'ph-user-plus').trim();
    const imagesJoined = Array.isArray(s.images) ? s.images.join('|') : '';
    
    sheet.appendRow([stepNum, title, desc, icon, imagesJoined, now]);
  }
  
  return { status: 'success', message: 'Langkah tutorial berhasil disimpan.' };
}

function parseImages(imagesRaw) {
  if (!imagesRaw || typeof imagesRaw !== 'string') return [];
  return imagesRaw.split('|').map(p => p.trim()).filter(Boolean);
}

// ====================================================================
// SECTION 6: LANDING CONFIG HANDLERS
// ====================================================================

function getLandingConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_LANDING_CONFIG);
  
  const defaultConfig = {
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

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LANDING_CONFIG);
    sheet.appendRow(['KEY', 'VALUE', 'DESCRIPTION']);
    
    Object.keys(defaultConfig).forEach(key => {
      sheet.appendRow([key, defaultConfig[key], 'Konfigurasi landing page untuk kolom ' + key]);
    });
  }
  
  const data = sheet.getDataRange().getValues();
  const config = {};
  
  Object.keys(defaultConfig).forEach(key => {
    config[key] = defaultConfig[key];
  });
  
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0]).trim();
    const val = String(data[i][1]).trim();
    if (key) {
      config[key] = val;
    }
  }
  
  return { status: 'success', data: config };
}

function saveLandingConfig(configObj) {
  if (!configObj) {
    return { status: 'error', message: 'Data config tidak boleh kosong.' };
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_LANDING_CONFIG);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_LANDING_CONFIG);
  }
  
  sheet.clearContents();
  sheet.appendRow(['KEY', 'VALUE', 'DESCRIPTION']);
  
  Object.keys(configObj).forEach(key => {
    const val = String(configObj[key] || '').trim();
    sheet.appendRow([key, val, 'Konfigurasi landing page untuk kolom ' + key]);
  });
  
  return { status: 'success', message: 'Landing page berhasil diperbarui.' };
}
