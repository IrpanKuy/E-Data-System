dirancang untuk mendigitalkan dan mengotomatisasi seluruh alur pengumpulan data, mulai dari permintaan data, pengisian, verifikasi, hingga pemantauan progres (monitoring) secara real-time.

Fitur Utama Aplikasi

1. Dashboard Interaktif

_Fungsi:_ Pusat informasi visual yang menyajikan ringkasan status pengumpulan data secara keseluruhan.

- **Isi:** Grafik progres pengumpulan, statistik data masuk, serta akses cepat ke menu-menu penting.

2. Master Data (Template Permintaan Data)

- \*Fungsi:\*\*Tempat penyimpanan standar atau template format permintaan data yang akan diisi oleh instansi terkait.
- \*Isi:\*\* Format baku atau petunjuk teknis agar data yang dikumpulkan seragam dan sesuai standar.

3. Formulir Pengumpulan Data (Data Submission Form)

- \*Fungsi:\*\* Wadah utama bagi instansi untuk mengunggah dan menyerahkan data.
- \*Atribut Isian Form:\*\*
- Nama Instansi
- Nama Pengisi
- Jabatan Pengisi
- Tahun Data
- Indikator / Jenis Data
- Tautan (Link) Folder Pengumpulan (untuk lampiran dokumen pendukung)

4. Verifikasi Data

- \*Fungsi:\*\* Alur pemeriksaan validitas data yang dikirimkan oleh instansi.
- \*Status Verifikasi:\*\*
- \*Proses Verifikasi:\*\* Data sedang diperiksa oleh admin.
- \*_Disetujui:_ Data valid dan diterima.
- \*Ditolak:\*\* Data tidak sesuai dan perlu diperbaiki/diunggah ulang.

5. Monitoring (Pemantauan Progres)

- **Akses Admin:\* Dapat memantau progres pengumpulan data dari **seluruh instansi\*\* secara komprehensif.
- **Akses User:** Hanya dapat memantau progres dan status pengumpulan data dari **instansinya sendiri**.

6. Sistem Pengingat (Reminder)

- **Fungsi:** Notifikasi otomatis untuk menjaga kedisiplinan jadwal.
- **Isi Informasi:**
- Pemberitahuan jadwal mulai masa pengumpulan data.
- Pengingat batas waktu (_deadline_) pengumpulan data

7. Kelola pengguna

- **Fungsi:** sytem pengelolaan user
- **Isi Informasi:**
- Tambah pengguna
- Ubah pengguna
- Hapus pengguna

👥 Pembagian Hak Akses Pengguna

1. Admin (Akses Penuh)
      Admin memiliki kendali penuh terhadap seluruh sistem aplikasi. Tugas dan hak akses admin meliputi:
      Mengelola dan mengatur seluruh isi Dashboard Interaktif.
      Membuat, memperbarui, dan mengelola Master Data serta template permintaan data.
      Mengawasi dan membaca seluruh data yang masuk melalui Formulir Pengumpulan Data dari semua instansi.
      Melakukan Verifikasi Data (menyetujui atau menolak data yang masuk).
      Menggunakan fitur Monitoring untuk memantau progres pengumpulan data dari seluruh instansi tanpa terkecuali.
      Mengatur jadwal dan mengirimkan Reminder terkait batas waktu pengumpulan data.
2. User / Instansi (Akses Terbatas)
   User merupakan perwakilan dari masing-masing instansi yang bertugas menyetorkan data. Tugas dan hak akses user meliputi:
   Melihat informasi umum melalui Dashboard Interaktif.
   Mengunduh dan melihat Master Data atau template permintaan data yang disediakan oleh admin.
   Mengisi dan mengirimkan data melalui Formulir Pengumpulan Data untuk instansi mereka sendiri.
   Memantau status Verifikasi Data milik instansi mereka (apakah sedang diproses, disetujui, atau ditolak).
   Menggunakan fitur Monitoring yang cakupannya terbatas untuk memantau progres instansinya sendiri.
   Menerima informasi dan Reminder terkait jadwal mulai serta deadline pengumpulan data.

---

🔑 Informasi Akun Pengguna (Data Seed Otomatis)

Semua akun otomatis dibuat saat fungsi `setupDatabase()` dijalankan di Google Apps Script:

### 1. Akun Administrator
- **Username:** `admin`
- **Password:** `password123`
- **Role:** `Admin` (Akses Penuh Seluruh Menu & Verifikasi)

### 2. Akun User Instansi (Password Default: `password123`)
| No | Username | Nama Petugas / PIC | Instansi Terkait |
|:---|:---|:---|:---|
| 1 | `user_kesehatan` | Dr. Budi Santoso | Dinas Kesehatan |
| 2 | `user_pendidikan` | Siti Rahayu, M.Pd | Dinas Pendidikan & Kebudayaan |
| 3 | `user_dishub` | Ahmad Hidayat, S.T | Dinas Perhubungan |
| 4 | `user_pupr` | Ir. Eko Prabowo | Dinas Pekerjaan Umum & PR |
| 5 | `user_bappeda` | Dewi Wulandari, S.E | Bappeda Daerah |
| 6 | `user_kominfo` | Rina Suryani, S.Kom | Diskominfo & Persandian |
| 7 | `user_inspektorat` | Agus Kurniawan, S.H | Inspektorat Daerah |
| 8 | `user_dinsos` | Sri Astuti, S.Sos | Dinas Sosial & PMD |
| 9 | `user_dlh` | Hendra Saputra, S.Si | Dinas Lingkungan Hidup |
| 10 | `user_satpolpp` | Rudi Hermawan, S.STP | Satuan Polisi Pamong Praja |
| 11 | `user_dukcapil` | Maya Lestari, S.AP | Dinas Dukcapil |
| 12 | `user_pertanian` | Dedi Setiawan, S.P | Dinas Pertanian & Ketenagakerjaan |
| 13 | `user_disperindag` | Titin Nuryani, S.E | Dinas Perindustrian & Perdagangan |
| 14 | `user_dpmptsp` | Heri Purnomo, S.H | Dinas Penanaman Modal & PTSP |
| 15 | `user_dispora` | Nining Mardiana, S.Pd | Dinas Pemuda & Olahraga |

---

📊 Data Pengkondisian Seeder Otomatis (`setupDatabase`):
1. **Instansi**: 15 instansi daerah lengkap dengan link drive template masing-masing.
2. **Master Templates**: Ragam template untuk target `ALL` maupun khusus instansi tertentu (Dinas Kesehatan, Sosial, PUPR, Dishub, DLH, dsb.).
3. **Pengajuan Data (Submissions)**: 7 data riwayat pengajuan dengan berbagai status:
   - `Disetujui` (Lengkap dengan catatan verifikasi valid).
   - `Proses Verifikasi` (Menunggu tindakan verifikasi admin).
   - `Ditolak` (Lengkap dengan catatan perbaikan/revisi).
4. **Pengumuman & Pengingat**: Pengingat aktif dengan tautan surat Google Drive, pengingat khusus dinas, dan pengingat arsip.
