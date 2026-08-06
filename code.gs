// ==============================================================================
// CONFIGURATION & GLOBAL CONSTANTS
// ==============================================================================
const SHEETS = {
  USERS: "Users",
  TEMPLATES: "MasterTemplates",
  SUBMISSIONS: "DataSubmissions",
  REMINDERS: "Reminders",
  SETTINGS: "AppSettings",
};

/**
 * Menyajikan antarmuka utama WebApp (Index.html)
 */
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Sistem Pengumpulan & Pemantauan Data Instansi")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Menangani HTTP POST Request untuk Hybrid Deploy (Hosting Eksternal via GAS_URL)
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;
    const payload = requestData.payload || {};

    let result;

    switch (action) {
      case "loginUser":
        result = loginUser(payload.username, payload.password);
        break;
      case "getInitialData":
        result = getInitialData(payload.token);
        break;
      case "saveUser":
        result = saveUser(payload.token, payload.userData);
        break;
      case "deleteUser":
        result = deleteUser(payload.token, payload.userId);
        break;
      case "saveMasterTemplate":
        result = saveMasterTemplate(payload.token, payload.tplData);
        break;
      case "deleteMasterTemplate":
        result = deleteMasterTemplate(payload.token, payload.tplId);
        break;
      case "saveSubmission":
        result = saveSubmission(payload.token, payload.subData);
        break;
      case "verifySubmission":
        result = verifySubmission(
          payload.token,
          payload.subId,
          payload.status,
          payload.catatan,
        );
        break;
      case "deleteSubmission":
        result = deleteSubmission(payload.token, payload.subId);
        break;
      case "saveReminder":
        result = saveReminder(payload.token, payload.remData);
        break;
      case "deleteReminder":
        result = deleteReminder(payload.token, payload.remId);
        break;
      case "changePassword":
        result = changePassword(
          payload.token,
          payload.oldPass,
          payload.newPass,
        );
        break;
      case "updateAppSettings":
        result = updateAppSettings(payload.token, payload.settingsData);
        break;
      case "generateSeed":
        result = generateSeed(payload.token, payload.count);
        break;
      default:
        throw new Error("Aksi tidak dikenali: " + action);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, data: result }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: error.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Inisialisasi otomatis tabel Google Sheets & data awal (Seeder)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet Users
  let sheetUsers = ss.getSheetByName(SHEETS.USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEETS.USERS);
    sheetUsers.appendRow([
      "id",
      "username",
      "password",
      "fullname",
      "instansi",
      "role",
      "status",
      "created_at",
    ]);
    // Seed Default Admin (Pass: admin123 -> SHA-256)
    const adminPassHash = hashPassword("admin123");
    sheetUsers.appendRow([
      "USR-1000",
      "admin",
      adminPassHash,
      "Administrator Pusat",
      "Dinas Pusat",
      "Admin",
      "Aktif",
      new Date().toISOString(),
    ]);
  }

  // 2. Sheet MasterTemplates
  let sheetTemplates = ss.getSheetByName(SHEETS.TEMPLATES);
  if (!sheetTemplates) {
    sheetTemplates = ss.insertSheet(SHEETS.TEMPLATES);
    sheetTemplates.appendRow([
      "id",
      "nama_template",
      "tahun",
      "deskripsi",
      "link_drive",
      "created_at",
    ]);
    // Seed contoh template
    sheetTemplates.appendRow([
      "TPL-1001",
      "Format Laporan Capaian Kinerja (LAKIP)",
      "2026",
      "Panduan dan format Excel pengisian data LAKIP Tahunan",
      "https://drive.google.com",
      new Date().toISOString(),
    ]);
  }

  // 3. Sheet DataSubmissions
  let sheetSubmissions = ss.getSheetByName(SHEETS.SUBMISSIONS);
  if (!sheetSubmissions) {
    sheetSubmissions = ss.insertSheet(SHEETS.SUBMISSIONS);
    sheetSubmissions.appendRow([
      "id",
      "user_id",
      "instansi",
      "nama_pengisi",
      "jabatan",
      "tahun_data",
      "indikator",
      "link_folder",
      "status",
      "catatan",
      "submitted_at",
      "verified_at",
    ]);
  }

  // 4. Sheet Reminders
  let sheetReminders = ss.getSheetByName(SHEETS.REMINDERS);
  if (!sheetReminders) {
    sheetReminders = ss.insertSheet(SHEETS.REMINDERS);
    sheetReminders.appendRow([
      "id",
      "judul",
      "pesan",
      "tanggal_mulai",
      "deadline",
      "status",
      "created_at",
    ]);
    // Seed contoh pengingat
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 14);
    sheetReminders.appendRow([
      "RMD-1001",
      "Pengumpulan Data Triwulan I",
      "Diharapkan seluruh instansi melengkapi data indikator kinerja sebelum tenggat waktu.",
      today.toISOString().split("T")[0],
      nextWeek.toISOString().split("T")[0],
      "Aktif",
      new Date().toISOString(),
    ]);
  }

  // 5. Sheet AppSettings
  let sheetSettings = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet(SHEETS.SETTINGS);
    sheetSettings.appendRow(["key", "value"]);
    sheetSettings.appendRow(["app_name", "SIM-DATA INSTANSI"]);
    sheetSettings.appendRow(["app_org", "Pemerintah Daerah"]);
  }

  return "Setup Database & Seeder Berhasil Diinisialisasi!";
}

// ==============================================================================
// SECURITY & UTILITY HELPER FUNCTIONS
// ==============================================================================

/**
 * Enkripsi / Hashing Password menggunakan SHA-256
 */
function hashPassword(text) {
  if (!text) return "";
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    text,
    Utilities.Charset.UTF_8,
  );
  let txtHash = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    txtHash += byteHex;
  }
  return txtHash;
}

/**
 * [CRITICAL BUG FIX] Anti-Null Serializer Date:
 * Konversi paksa semua objek Date menjadi string format ISO
 */
function cleanObjectDates(data) {
  if (data === null || data === undefined) return data;
  if (data instanceof Date) {
    return data.toISOString();
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanObjectDates(item));
  }
  if (typeof data === "object") {
    const cleaned = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        cleaned[key] = cleanObjectDates(data[key]);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Membaca seluruh baris sheet menjadi Array of Objects
 */
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  const result = rows.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return cleanObjectDates(result);
}

/**
 * Verifikasi Session Token (Base64 payload + Auth check)
 */
function verifySessionToken(token) {
  if (!token) throw new Error("Sesi tidak valid / belum login.");
  try {
    const decoded = Utilities.newBlob(
      Utilities.base64Decode(token),
    ).getDataAsString();
    const parsed = JSON.parse(decoded);

    // Validasi keberadaan user di sheet Users
    const users = getSheetData(SHEETS.USERS);
    const user = users.find(
      (u) =>
        u.id === parsed.id &&
        u.username === parsed.username &&
        u.status === "Aktif",
    );

    if (!user)
      throw new Error("Pengguna tidak ditemukan atau telah dinonaktifkan.");
    return user;
  } catch (e) {
    throw new Error("Sesi telah kedaluwarsa. Silakan login kembali.");
  }
}

// ==============================================================================
// SERVER-SIDE AUTHENTICATION & INITIAL FETCH
// ==============================================================================

function loginUser(username, password) {
  const users = getSheetData(SHEETS.USERS);
  const hashedPassword = hashPassword(password);

  const user = users.find(
    (u) =>
      u.username.toLowerCase() === username.toLowerCase().trim() &&
      u.password === hashedPassword,
  );

  if (!user) {
    throw new Error("Username atau Password salah!");
  }
  if (user.status !== "Aktif") {
    throw new Error("Akun Anda sedang dinonaktifkan. Hubungi Admin.");
  }

  // Buat Token Sesi Sederhana
  const sessionPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
    time: new Date().getTime(),
  };

  const token = Utilities.base64Encode(JSON.stringify(sessionPayload));

  // Sanitize user output (hapus password)
  const safeUser = { ...user };
  delete safeUser.password;

  return {
    token: token,
    user: safeUser,
  };
}

function getInitialData(token) {
  const currentUser = verifySessionToken(token);
  const safeUser = { ...currentUser };
  delete safeUser.password;

  const allSubmissions = getSheetData(SHEETS.SUBMISSIONS);
  const allTemplates = getSheetData(SHEETS.TEMPLATES);
  const allReminders = getSheetData(SHEETS.REMINDERS);
  const rawSettings = getSheetData(SHEETS.SETTINGS);

  // Transform AppSettings
  const appSettings = {};
  rawSettings.forEach((s) => {
    appSettings[s.key] = s.value;
  });

  // Filter Data berdasarkan Role
  let userSubmissions = allSubmissions;
  if (currentUser.role !== "Admin") {
    userSubmissions = allSubmissions.filter(
      (s) =>
        String(s.user_id) === String(currentUser.id) ||
        s.instansi === currentUser.instansi,
    );
  }

  let usersList = [];
  if (currentUser.role === "Admin") {
    usersList = getSheetData(SHEETS.USERS).map((u) => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });
  }

  return {
    user: safeUser,
    submissions: userSubmissions,
    templates: allTemplates,
    reminders: allReminders,
    settings: appSettings,
    users: usersList,
  };
}

// ==============================================================================
// CRUD OPERATIONS: USERS
// ==============================================================================

function saveUser(token, userData) {
  const adminUser = verifySessionToken(token);
  if (adminUser.role !== "Admin")
    throw new Error("Akses ditolak. Khusus Admin.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let isUpdate = false;
  let rowIndex = -1;

  if (userData.id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(userData.id)) {
        isUpdate = true;
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (isUpdate) {
    // Update existing user
    headers.forEach((h, colIdx) => {
      if (h === "password") {
        if (userData.password && userData.password.trim() !== "") {
          sheet
            .getRange(rowIndex, colIdx + 1)
            .setValue(hashPassword(userData.password));
        }
      } else if (
        h !== "id" &&
        h !== "created_at" &&
        userData[h] !== undefined
      ) {
        sheet.getRange(rowIndex, colIdx + 1).setValue(userData[h]);
      }
    });
  } else {
    // Check Duplicate Username
    for (let i = 1; i < data.length; i++) {
      if (
        data[i][1].toString().toLowerCase() ===
        userData.username.toLowerCase().trim()
      ) {
        throw new Error(
          "Username '" + userData.username + "' sudah digunakan!",
        );
      }
    }

    const newId = "USR-" + Math.floor(1000 + Math.random() * 9000);
    const passHash = hashPassword(userData.password || "SimData#2026!");
    const newRow = [
      newId,
      userData.username.trim(),
      passHash,
      userData.fullname,
      userData.instansi,
      userData.role,
      userData.status || "Aktif",
      new Date().toISOString(),
    ];
    sheet.appendRow(newRow);
  }

  return "Data Pengguna berhasil disimpan!";
}

function deleteUser(token, userId) {
  const adminUser = verifySessionToken(token);
  if (adminUser.role !== "Admin") throw new Error("Akses ditolak.");

  if (String(adminUser.id) === String(userId)) {
    throw new Error("Anda tidak dapat menghapus akun Anda sendiri!");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      sheet.deleteRow(i + 1);
      return "Pengguna berhasil dihapus!";
    }
  }
  throw new Error("Data pengguna tidak ditemukan.");
}

// ==============================================================================
// CRUD OPERATIONS: MASTER TEMPLATES
// ==============================================================================

function saveMasterTemplate(token, tplData) {
  const adminUser = verifySessionToken(token);
  if (adminUser.role !== "Admin") throw new Error("Akses ditolak.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TEMPLATES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let isUpdate = false;
  let rowIndex = -1;

  if (tplData.id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(tplData.id)) {
        isUpdate = true;
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (isUpdate) {
    headers.forEach((h, colIdx) => {
      if (h !== "id" && h !== "created_at" && tplData[h] !== undefined) {
        sheet.getRange(rowIndex, colIdx + 1).setValue(tplData[h]);
      }
    });
  } else {
    const newId = "TPL-" + Math.floor(1000 + Math.random() * 9000);
    const newRow = [
      newId,
      tplData.nama_template,
      tplData.tahun,
      tplData.deskripsi,
      tplData.link_drive,
      new Date().toISOString(),
    ];
    sheet.appendRow(newRow);
  }

  return "Master Template berhasil disimpan!";
}

function deleteMasterTemplate(token, tplId) {
  const adminUser = verifySessionToken(token);
  if (adminUser.role !== "Admin") throw new Error("Akses ditolak.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TEMPLATES);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(tplId)) {
      sheet.deleteRow(i + 1);
      return "Master Template berhasil dihapus!";
    }
  }
  throw new Error("Template tidak ditemukan.");
}

// ==============================================================================
// CRUD OPERATIONS: DATA SUBMISSIONS
// ==============================================================================

function saveSubmission(token, subData) {
  const user = verifySessionToken(token);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SUBMISSIONS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let isUpdate = false;
  let rowIndex = -1;

  if (subData.id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(subData.id)) {
        isUpdate = true;
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (isUpdate) {
    // Validasi hak edit
    const existingUserId = data[rowIndex - 1][1];
    if (user.role !== "Admin" && String(existingUserId) !== String(user.id)) {
      throw new Error(
        "Anda tidak memiliki hak akses untuk mengubah pengajuan ini.",
      );
    }

    headers.forEach((h, colIdx) => {
      if (
        h !== "id" &&
        h !== "user_id" &&
        h !== "submitted_at" &&
        subData[h] !== undefined
      ) {
        sheet.getRange(rowIndex, colIdx + 1).setValue(subData[h]);
      }
    });
    // Set status ke Proses Verifikasi jika di-edit oleh User
    if (user.role !== "Admin") {
      sheet
        .getRange(rowIndex, headers.indexOf("status") + 1)
        .setValue("Proses Verifikasi");
      sheet.getRange(rowIndex, headers.indexOf("catatan") + 1).setValue("");
    }
  } else {
    const newId = "SUB-" + Math.floor(10000 + Math.random() * 90000);
    const newRow = [
      newId,
      user.id,
      user.instansi,
      subData.nama_pengisi,
      subData.jabatan,
      subData.tahun_data,
      subData.indikator,
      subData.link_folder,
      "Proses Verifikasi",
      "",
      new Date().toISOString(),
      "",
    ];
    sheet.appendRow(newRow);
  }

  return "Pengajuan data berhasil disimpan!";
}

function verifySubmission(token, subId, status, catatan) {
  const adminUser = verifySessionToken(token);
  if (adminUser.role !== "Admin")
    throw new Error("Akses ditolak. Khusus Admin.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SUBMISSIONS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colStatusIdx = headers.indexOf("status") + 1;
  const colCatatanIdx = headers.indexOf("catatan") + 1;
  const colVerifiedIdx = headers.indexOf("verified_at") + 1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(subId)) {
      const rowIndex = i + 1;
      sheet.getRange(rowIndex, colStatusIdx).setValue(status);
      sheet.getRange(rowIndex, colCatatanIdx).setValue(catatan || "");
      sheet
        .getRange(rowIndex, colVerifiedIdx)
        .setValue(new Date().toISOString());
      return "Status verifikasi berhasil diperbarui!";
    }
  }
  throw new Error("Pengajuan data tidak ditemukan.");
}

function deleteSubmission(token, subId) {
  const user = verifySessionToken(token);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SUBMISSIONS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(subId)) {
      const existingUserId = data[i][1];
      if (user.role !== "Admin" && String(existingUserId) !== String(user.id)) {
        throw new Error("Anda tidak diperbolehkan menghapus data ini.");
      }
      sheet.deleteRow(i + 1);
      return "Pengajuan data berhasil dihapus!";
    }
  }
  throw new Error("Pengajuan data tidak ditemukan.");
}

// ==============================================================================
// CRUD OPERATIONS: REMINDERS & SETTINGS
// ==============================================================================

function saveReminder(token, remData) {
  const adminUser = verifySessionToken(token);
  if (adminUser.role !== "Admin") throw new Error("Akses ditolak.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.REMINDERS);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  let isUpdate = false;
  let rowIndex = -1;

  if (remData.id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(remData.id)) {
        isUpdate = true;
        rowIndex = i + 1;
        break;
      }
    }
  }

  if (isUpdate) {
    headers.forEach((h, colIdx) => {
      if (h !== "id" && h !== "created_at" && remData[h] !== undefined) {
        sheet.getRange(rowIndex, colIdx + 1).setValue(remData[h]);
      }
    });
  } else {
    const newId = "RMD-" + Math.floor(1000 + Math.random() * 9000);
    const newRow = [
      newId,
      remData.judul,
      remData.pesan,
      remData.tanggal_mulai,
      remData.deadline,
      remData.status || "Aktif",
      new Date().toISOString(),
    ];
    sheet.appendRow(newRow);
  }

  return "Pengingat berhasil disimpan!";
}

function deleteReminder(token, remId) {
  const adminUser = verifySessionToken(token);
  if (adminUser.role !== "Admin") throw new Error("Akses ditolak.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.REMINDERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(remId)) {
      sheet.deleteRow(i + 1);
      return "Pengingat berhasil dihapus!";
    }
  }
  throw new Error("Pengingat tidak ditemukan.");
}

function changePassword(token, oldPass, newPass) {
  const user = verifySessionToken(token);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data = sheet.getDataRange().getValues();

  const oldHash = hashPassword(oldPass);
  const newHash = hashPassword(newPass);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(user.id)) {
      if (data[i][2] !== oldHash) {
        throw new Error("Password lama Anda salah!");
      }
      sheet.getRange(i + 1, 3).setValue(newHash);
      return "Password berhasil diubah!";
    }
  }
  throw new Error("Pengguna tidak ditemukan.");
}

function updateAppSettings(token, settingsData) {
  const adminUser = verifySessionToken(token);
  if (adminUser.role !== "Admin") throw new Error("Akses ditolak.");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.SETTINGS);

  sheet.clearContents();
  sheet.appendRow(["key", "value"]);

  for (const k in settingsData) {
    sheet.appendRow([k, settingsData[k]]);
  }

  return "Pengaturan sistem berhasil diperbarui!";
}

// ==============================================================================
// SEEDER DATA DUMMY (GENERATOR SEED DALAM JUMLAH BESAR)
// ==============================================================================

/**
 * Fungsi mandiri untuk membuat data seed (dummy) dalam jumlah besar.
 * Dapat dipanggil langsung dari Google Apps Script Editor atau via WebApp API call.
 */
function generateSeed(token = null, count = 50) {
  if (token) {
    const adminUser = verifySessionToken(token);
    if (adminUser.role !== "Admin")
      throw new Error("Akses ditolak. Khusus Admin.");
  }

  // Pastikan sheet & tabel utama sudah terinisialisasi
  setupDatabase();

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const instansiList = [
    "Dinas Kesehatan",
    "Dinas Pendidikan & Kebudayaan",
    "Dinas Perhubungan",
    "Dinas Pekerjaan Umum & PR",
    "Bappeda Daerah",
    "Diskominfo & Persandian",
    "Inspektorat Daerah",
    "Dinas Sosial & PMD",
    "Dinas Lingkungan Hidup",
    "Satuan Polisi Pamong Praja",
    "Dinas Dukcapil",
    "Dinas Pertanian & Ketenagakerjaan",
    "Dinas Perindustrian & Perdagangan",
    "Dinas Penanaman Modal & PTSP",
    "Dinas Pemuda & Olahraga",
  ];

  const indikatorList = [
    "Laporan Capaian Kinerja (LAKIP) Triwulan I",
    "Laporan Realisasi Fisik & Keuangan Bulanan",
    "Dokumen Rencana Kerja Anggaran (RKA)",
    "Data Statistik Sektoral Pengelolaan Sampah",
    "Peta Kepatuhan Standar Pelayanan Minimal (SPM)",
    "Evaluasi Pelaksanaan Sistem Akuntabilitas Kinerja",
    "Laporan Indeks Rekapitulasi Kepuasan Masyarakat",
    "Dokumen Penetapan Kinerja (PK) Tahunan",
  ];

  const namaDepan = [
    "Budi",
    "Siti",
    "Ahmad",
    "Dewi",
    "Eko",
    "Rina",
    "Agus",
    "Sri",
    "Hendra",
    "Nining",
    "Rudi",
    "Maya",
    "Dedi",
    "Titin",
    "Heri",
  ];
  const namaBelakang = [
    "Santoso",
    "Rahayu",
    "Hidayat",
    "Wulandari",
    "Prabowo",
    "Suryani",
    "Kurniawan",
    "Astuti",
    "Saputra",
    "Lestari",
  ];
  const jabatanList = [
    "Kepala Subbag Program",
    "Analis Kebijakan Ahli Muda",
    "Kepala Bidang Perencanaan",
    "Staf Pengelola Data",
    "Sekretaris Dinas",
    "Fungsional Perencana",
  ];
  const statusList = ["Proses Verifikasi", "Disetujui", "Ditolak"];

  const numRecords = Math.max(10, parseInt(count) || 50);

  // 1. Seed Users (Bila belum ada/perlu pengguna tambahan)
  const sheetUsers = ss.getSheetByName(SHEETS.USERS);
  const userRows = [];
  const defaultPassHash = hashPassword("SimData#2026!");

  for (let i = 0; i < instansiList.length; i++) {
    const instansi = instansiList[i];
    const username =
      "user_" +
      instansi
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .substring(0, 12);
    const fname =
      namaDepan[i % namaDepan.length] +
      " " +
      namaBelakang[i % namaBelakang.length];
    const userId = "USR-" + (2000 + i);

    userRows.push([
      userId,
      username,
      defaultPassHash,
      fname,
      instansi,
      "User",
      "Aktif",
      new Date(
        Date.now() - Math.floor(Math.random() * 30 * 86400000),
      ).toISOString(),
    ]);
  }

  if (userRows.length > 0) {
    sheetUsers
      .getRange(
        sheetUsers.getLastRow() + 1,
        1,
        userRows.length,
        userRows[0].length,
      )
      .setValues(userRows);
  }

  // 2. Seed Master Templates
  const sheetTemplates = ss.getSheetByName(SHEETS.TEMPLATES);
  if (sheetTemplates.getLastRow() <= 1) {
    const templateRows = [
      [
        "TPL-1001",
        "Template Indikator Permintaan Data",
        "2026",
        "Master template resmi indikator pengumpulan data instansi",
        "https://drive.google.com/drive/folders/1goO7fDcAegX3m944nNr5iVxfN_AuyW-I",
        new Date().toISOString(),
      ],
      [
        "TPL-1002",
        "Format Laporan Capaian Kinerja (LAKIP)",
        "2026",
        "Panduan dan format Excel pengisian data LAKIP Tahunan",
        "https://drive.google.com/drive/folders/1goO7fDcAegX3m944nNr5iVxfN_AuyW-I",
        new Date().toISOString(),
      ],
      [
        "TPL-1003",
        "Template Realisasi Anggaran & Fisik",
        "2026",
        "Form Laporan Realisasi Belanja Modal dan Operasional",
        "https://drive.google.com/drive/folders/1goO7fDcAegX3m944nNr5iVxfN_AuyW-I",
        new Date().toISOString(),
      ],
      [
        "TPL-1004",
        "Format Peta Mutu SPM Daerah",
        "2025",
        "Template pengisian indikator Standar Pelayanan Minimal",
        "https://drive.google.com/drive/folders/1goO7fDcAegX3m944nNr5iVxfN_AuyW-I",
        new Date().toISOString(),
      ],
    ];
    sheetTemplates
      .getRange(
        sheetTemplates.getLastRow() + 1,
        1,
        templateRows.length,
        templateRows[0].length,
      )
      .setValues(templateRows);
  }

  // 3. Seed Submissions (Batch Insert Jumlah Besar)
  const sheetSubmissions = ss.getSheetByName(SHEETS.SUBMISSIONS);
  const subRows = [];
  const driveUploadFolder =
    "https://drive.google.com/drive/folders/1z0CtFO_7oNgiYpKvAjo_Vd3P00d9IpuW";

  for (let i = 0; i < numRecords; i++) {
    const subId = "SUB-" + (10000 + i);
    const randomInstansi = instansiList[i % instansiList.length];
    const randUserIdx = i % userRows.length;
    const userId = userRows[randUserIdx]
      ? userRows[randUserIdx][0]
      : "USR-" + (2000 + (i % 15));
    const namaPengisi =
      namaDepan[(i * 3) % namaDepan.length] +
      " " +
      namaBelakang[(i * 2) % namaBelakang.length];
    const jabatan = jabatanList[i % jabatanList.length];
    const tahunData = 2024 + (i % 3);
    const indikator = indikatorList[i % indikatorList.length];
    const status = statusList[i % statusList.length];
    const catatan =
      status === "Ditolak"
        ? "Dokumen lampiran kurang lengkap. Harap perbarui file excel."
        : status === "Disetujui"
          ? "Data telah diverifikasi valid."
          : "";

    const randomDaysAgo = Math.floor(Math.random() * 60);
    const subDate = new Date(Date.now() - randomDaysAgo * 86400000);
    const verDate =
      status !== "Proses Verifikasi"
        ? new Date(subDate.getTime() + 86400000).toISOString()
        : "";

    subRows.push([
      subId,
      userId,
      randomInstansi,
      namaPengisi,
      jabatan,
      tahunData,
      indikator,
      driveUploadFolder,
      status,
      catatan,
      subDate.toISOString(),
      verDate,
    ]);
  }

  if (subRows.length > 0) {
    sheetSubmissions
      .getRange(
        sheetSubmissions.getLastRow() + 1,
        1,
        subRows.length,
        subRows[0].length,
      )
      .setValues(subRows);
  }

  return `Berhasil membuat ${subRows.length} data pengajuan seed baru secara massal!`;
}
