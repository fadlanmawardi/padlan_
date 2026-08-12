export type Language = "id" | "en";

export const LANGUAGES: { value: Language; label: string; flag: string }[] = [
  { value: "id", label: "Indonesia", flag: "🇮🇩" },
  { value: "en", label: "English", flag: "🇬🇧" },
];

const en: Record<string, string> = {
  /* Navigasi */
  "Utama": "Main",
  "Manajemen": "Management",
  "Sistem": "System",
  "Menu": "Menu",
  "Dashboard": "Dashboard",
  "Admin & Guru": "Admin & Teachers",
  "Siswa": "Students",
  "Buku": "Books",
  "Kategori": "Categories",
  "Tugas": "Assignments",
  "Absensi": "Attendance",
  "Peminjaman": "Loans",
  "Pengembalian": "Returns",
  "Denda": "Fines",
  "Laporan": "Reports",
  "Pengaturan": "Settings",
  "Buku Saya": "My Books",
  "Riwayat": "History",
  "Profil": "Profile",
  "Jadwal Pelajaran": "Schedule",
  "Kalender Akademik": "Academic Calendar",
  "Mata Pelajaran": "Subjects",
  "Jadwal Ujian": "Exam Schedule",
  "Nilai": "Grades",
  "Rapor": "Report Cards",
  "Bank Soal": "Question Bank",
  "Quiz Online": "Online Quiz",
  "Rubrik Penilaian": "Grading Rubrics",
  "Materi Pembelajaran": "Learning Materials",
  "Forum Diskusi": "Discussion Forums",
  "Pengumuman": "Announcements",
  "Notifikasi": "Notifications",
  "Aktivitas": "Activity",
  "Leaderboard": "Leaderboard",
  "Achievement": "Achievements",
  "Catatan Belajar": "Study Notes",
  "Target Belajar": "Study Targets",
  "Bookmark Tugas": "Task Bookmarks",
  "Wishlist Buku": "Book Wishlist",
  "Audit Log": "Audit Log",
  "Analitik": "Analytics",

  /* Top bar & umum */
  "Cari di SchoolHub…": "Search in SchoolHub…",
  "Keluar": "Sign out",
  "Buka menu navigasi": "Open navigation menu",
  "Tema": "Theme",
  "Pilih tampilan aplikasi": "Choose app appearance",
  "Terang": "Light",
  "Gelap": "Dark",
  "aktivitas terbaru": "recent activities",
  "Tidak ada aktivitas": "No activity",

  /* Tombol umum */
  "Simpan": "Save",
  "Batal": "Cancel",
  "Hapus": "Delete",
  "Edit": "Edit",
  "Tambah": "Add",
  "Tambah Baru": "Add New",
  "Menyimpan…": "Saving…",
  "Memproses…": "Processing…",
  "Cari": "Search",
  "Lihat semua": "View all",
  "Aksi": "Actions",
  "Semua": "All",
  "Hari ini": "Today",
  "Belum": "Not yet",

  /* Umum fitur */
  "Tidak ada data": "No data",
  "Sedang memuat…": "Loading…",
  "Tutup": "Close",
  "Kembali": "Back",
};

const translations: Record<Language, Record<string, string>> = {
  id: {},
  en,
};

export function translate(lang: Language, key: string): string {
  return translations[lang][key] ?? key;
}
