import type { Role } from "@/types";
import type { SessionUser } from "@/components/auth/auth-provider";
import {
  getStudentAiData,
  getAdminAiData,
  searchAiData,
  getBookSummary,
  quizAttemptCount,
  DAY_NAMES,
  formatDate,
} from "@/services/ai-service";
import type { AiStudentSnapshot, AiAdminSnapshot } from "@/services/ai-service";
import { getWeather } from "@/services/weather-service";
import { getNotificationsForUser } from "@/services/community-service";
import { relativeTime } from "@/lib/format";

/* =============================================================
   MEMORI KONTEKS
   ============================================================= */

export interface AiMemory {
  nickname?: string;
  hobby?: string;
  favoriteSubject?: string;
  goal?: string;
  lastIntent?: string;
  askedCount: number;
}

export function createMemory(): AiMemory {
  return { askedCount: 0 };
}

/* =============================================================
   SUGGESTIONS PER ROLE
   ============================================================= */

export const SUGGESTIONS_BY_ROLE: Record<Role, string[]> = {
  student: [
    "Apa saja tugas saya yang belum dikumpulkan?",
    "Jadwal pelajaran hari ini?",
    "Bagaimana nilai Matematika saya?",
    "Buku apa yang sedang saya pinjam?",
    "Berapa XP dan peringkat saya?",
    "Jadwal ujian terdekat?",
    "Bagaimana cara meminjam buku?",
  ],
  admin: [
    "Berapa total siswa dan buku?",
    "Tugas apa yang deadline-nya terdekat?",
    "Bagaimana kehadiran siswa hari ini?",
    "Buku apa yang paling banyak dipinjam?",
    "Apa pengumuman terbaru?",
    "Bagaimana cara membuat pengumuman?",
    "Cari buku Fisika",
  ],
  superadmin: [
    "Statistik sekolah secara keseluruhan",
    "Berapa siswa, guru, dan total buku?",
    "Buku apa yang paling populer?",
    "Pengumuman penting terbaru?",
    "Tugas yang akan segera jatuh tempo",
    "Apa saja event akademik terdekat?",
    "Cari guru Matematika",
  ],
};

/* =============================================================
   HELPERS
   ============================================================= */

const hasAny = (text: string, words: string[]) => words.some((w) => text.includes(w));

function labelDays(days: number): string {
  if (days === 0) return "hari ini";
  if (days === 1) return "besok";
  if (days < 0) return `${-days} hari lalu (terlambat)`;
  return `${days} hari lagi`;
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function numbered(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function priorityLabel(priority: string): string {
  if (priority === "urgent") return "🔴 URGENT";
  if (priority === "important") return "🟠 Penting";
  return "🟢 Biasa";
}

const firstName = (name: string) => (name ? name.split(" ")[0] : "teman");

/* =============================================================
   ENGINE
   ============================================================= */

export interface EngineOptions {
  input: string;
  user: SessionUser;
  memory: AiMemory;
}

export interface EngineResult {
  answer: string;
  memory: AiMemory;
}

export async function generateReply(options: EngineOptions): Promise<EngineResult> {
  const { user, memory } = options;
  const raw = options.input.trim();
  const input = raw.toLowerCase();
  const role = user.role;
  const name = user.name ?? "";
  const first = memory.nickname ?? firstName(name);

  const nextMemory: AiMemory = {
    ...memory,
    askedCount: (memory.askedCount ?? 0) + 1,
  };

  let studentData: AiStudentSnapshot | null = null;
  const sd = (): AiStudentSnapshot | null => {
    if (role !== "student") return null;
    if (!studentData) studentData = getStudentAiData(user.uid);
    return studentData;
  };

  let adminData: AiAdminSnapshot | null = null;
  const ad = (): AiAdminSnapshot | null => {
    if (role === "student") return null;
    if (!adminData) adminData = getAdminAiData(role);
    return adminData;
  };

  /* ---------- 1. SAPAAN & IDENTITAS ---------- */

  if (/(^|\s)(halo|hai|hallo|hello|hi|yo|haii)(\s|!|\?|$)/i.test(raw) && input.length < 20) {
    nextMemory.lastIntent = "greeting";
    return { memory: nextMemory, answer: greetingAnswer(role, first, sd()?.todayAttendance) };
  }

  if (/(selamat|pagi|siang|sore|malam)/.test(input) && input.length < 30) {
    nextMemory.lastIntent = "greeting";
    return { memory: nextMemory, answer: greetingAnswer(role, first, sd()?.todayAttendance) };
  }

  if (hasAny(input, ["siapa kamu", "kamu siapa", "who are you", "kamu itu apa", "kenalan"])) {
    return { memory: nextMemory, answer: introAnswer(role) };
  }

  if (hasAny(input, ["apa kabar", "kabar baik", "gimana kabar", "baik", "apakabar"])) {
    return {
      memory: nextMemory,
      answer: `Aku baik-baik saja, terima kasih sudah bertanya, ${first}! 😊\n\nKalau kamu butuh sesuatu — cek tugas, jadwal, nilai, atau data lainnya — langsung tanya saja ya.`,
    };
  }

  if (hasAny(input, ["terima kasih", "makasih", "thanks", "thank you", "terimakasih", "makaci"])) {
    return {
      memory: nextMemory,
      answer: `Sama-sama, ${first}! 😊 Senang bisa membantu.\n\nKalau masih ada yang ingin ditanyakan — tugas, jadwal, nilai, atau buku — jangan ragu untuk bertanya lagi ya.`,
    };
  }

  if (hasAny(input, ["sampai jumpa", "dadah", "bye", "selamat tinggal", "sampai nanti", "assalamualaikum", "wassalamualaikum"])) {
    return {
      memory: nextMemory,
      answer: `Sampai jumpa, ${first}! 👋 Semoga harimu menyenangkan.\n\nKalau butuh bantuan lagi, aku selalu siap menemanimu di sini.`,
    };
  }

  if (hasAny(input, ["apa yang bisa kamu bantu", "bantuan", "help", "fitur apa", "bisa apa", "kemampuan"])) {
    return { memory: nextMemory, answer: capabilitiesAnswer(role, first) };
  }

  /* ---------- 1b. CUACA (berbasis lokasi) ---------- */

  if (hasAny(input, ["cuaca", "suhu", "hujan", "panas", "dingin", "berawan", "ramalan cuaca", "weather", "berapa derajat"])) {
    return {
      memory: { ...nextMemory, lastIntent: "cuaca" },
      answer: await weatherAnswer(),
    };
  }

  /* ---------- 1c. NOTIFIKASI (berbasis data terbaru) ---------- */

  if (hasAny(input, ["notifikasi", "pemberitahuan", "ada notif", "baca notif", "notif baru", "pesan masuk", "ada kabar", "apa kabar sekolah"])) {
    return {
      memory: { ...nextMemory, lastIntent: "notifikasi" },
      answer: await notificationAnswer(user.uid),
    };
  }

  /* ---------- 2. MEMORI: PENGINGAT ---------- */

  if (/(panggil aku apa|kamu panggil aku apa|nama panggilanku apa)/.test(input)) {
    return {
      memory: nextMemory,
      answer: nextMemory.nickname
        ? `Aku memanggilmu **${nextMemory.nickname}** 😊`
        : `Aku belum tahu nama panggilanmu. Ceritakan dulu, misalnya *"Panggil aku Fadlan"*.`,
    };
  }

  if (/(hobi saya apa|hobiku apa)/.test(input)) {
    return {
      memory: nextMemory,
      answer: nextMemory.hobby
        ? `Hobimu **${nextMemory.hobby}**, benar? Keren! 🎯`
        : `Aku belum tahu hobimu. Ceritakan, misalnya *"Hobi saya membaca novel"*.`,
    };
  }

  if (/(mapel (favorit|kesukaan) saya apa|mapel favorit saya apa)/.test(input)) {
    return {
      memory: nextMemory,
      answer: nextMemory.favoriteSubject
        ? `Mapel favoritmu **${nextMemory.favoriteSubject}**. Pilihan yang bagus! 📚`
        : `Aku belum tahu mapel favoritmu. Ceritakan, misalnya *"Mapel favorit saya Matematika"*.`,
    };
  }

  /* ---------- 3. MEMORI: MENYIMPAN INFORMASI ---------- */

  const nicknameMatch = input.match(/(?:panggil aku|panggil saya|panggil gue|sapa aku)\s+([a-z0-9 .'-]+)/);
  if (nicknameMatch && nicknameMatch[1] && !hasAny(nicknameMatch[1], ["apa", "berapa", "siapa"])) {
    nextMemory.nickname = nicknameMatch[1].trim();
    return {
      memory: nextMemory,
      answer: `Siap! Mulai sekarang aku panggil kamu **${nextMemory.nickname}** ya 😊\n\nAda yang bisa aku bantu?`,
    };
  }

  const hobbyMatch = input.match(/(?:hobi saya|hobiku|hobi aku)\s+(?:adalah\s+)?(.+)/);
  if (hobbyMatch && hobbyMatch[1] && !hasAny(hobbyMatch[1], ["apa"])) {
    nextMemory.hobby = hobbyMatch[1].trim();
    return {
      memory: nextMemory,
      answer: `Wah, hobi **${nextMemory.hobby}**! Bagus sekali 😄\n\nAku catat ya, jangan sampai lupa. Ada lagi yang mau ditanyakan?`,
    };
  }

  const subjectFavMatch = input.match(/(?:mapel favorit saya|mapel kesukaan saya|suka pelajaran)\s+(?:adalah\s+)?(.+)/);
  if (subjectFavMatch && subjectFavMatch[1] && !hasAny(subjectFavMatch[1], ["apa"])) {
    nextMemory.favoriteSubject = subjectFavMatch[1].trim();
    return {
      memory: nextMemory,
      answer: `Mapel favorit **${nextMemory.favoriteSubject}**? Mantap! 🎯\n\nSemoga nilaimu di mapel itu makin bagus ya. Ada lagi yang bisa kubantu?`,
    };
  }

  /* ---------- 4. FAQ ---------- */

  const faq = faqAnswer(input, role);
  if (faq) return { memory: nextMemory, answer: faq };

  /* ---------- 5. PENCARIAN DATA ---------- */

  const searchMatch = raw.match(/^(?:cari|search|temukan|carikan|tunjukkan)\s+(.+)$/i);
  if (searchMatch && searchMatch[1]) {
    return {
      memory: { ...nextMemory, lastIntent: "search" },
      answer: searchAnswer(searchMatch[1]),
    };
  }

  /* ---------- 6. DATA SISWA ---------- */

  if (role === "student") {
    const student = sd();
    if (student) {
      if (hasAny(input, ["nilai", "rapor", "raport", "predikat", "nilai rapor", "kkm"])) {
        if (hasAny(input, ["rapor", "raport", "kkm"])) {
          return { memory: { ...nextMemory, lastIntent: "nilai" }, answer: gradeSummaryAnswer(student, first) };
        }
        const target = student.grades.find((g) => {
          const subj = g.subject.toLowerCase();
          if (input.includes(subj)) return true;
          return subj
            .split(" ")
            .some((word) => word.length > 3 && input.includes(word));
        });
        if (target) {
          return { memory: { ...nextMemory, lastIntent: "nilai" }, answer: gradeSubjectAnswer(student, target.subject, first) };
        }
        return { memory: { ...nextMemory, lastIntent: "nilai" }, answer: gradeSummaryAnswer(student, first) };
      }

      if (hasAny(input, ["absen", "kehadiran", "hadir", "izin", "sakit", "alpha", "presensi", "hadir tidak"])) {
        return { memory: { ...nextMemory, lastIntent: "absensi" }, answer: attendanceAnswer(student, first) };
      }

      if (hasAny(input, ["buku yang saya pinjam", "pinjam", "pinjaman", "buku dipinjam", "kembalikan", "denda", "jatuh tempo"])) {
        return { memory: { ...nextMemory, lastIntent: "pinjaman" }, answer: loanAnswer(student, first) };
      }

      if (hasAny(input, ["xp", "poin", "achievement", "prestasi", "badge", "lencana", "ranking", "peringkat", "leaderboard", "papan peringkat"])) {
        return { memory: { ...nextMemory, lastIntent: "gamifikasi" }, answer: gamificationAnswer(student, first) };
      }

      if (hasAny(input, ["wishlist", "daftar keinginan"])) {
        const list = student.wishlistCount > 0
          ? bullets(student.activeLoans.map(() => "Tersimpan di menu Buku → Wishlist"))
          : "Kamu belum menambahkan buku ke wishlist. Buka menu **Buku**, lalu klik ikon hati pada buku yang kamu suka. ❤️";
        return {
          memory: { ...nextMemory, lastIntent: "wishlist" },
          answer: `📌 **Wishlist Buku**\n\nKamu memiliki **${student.wishlistCount}** buku di wishlist.\n\n${list}`,
        };
      }

      if (hasAny(input, ["target", "target belajar", "progress"])) {
        return { memory: { ...nextMemory, lastIntent: "target" }, answer: targetAnswer(student, first) };
      }

      if (hasAny(input, ["quiz", "kuis", "kui"]) ) {
        return { memory: { ...nextMemory, lastIntent: "quiz" }, answer: quizAnswer(student) };
      }

      if (hasAny(input, ["materi", "bahan ajar"])) {
        return { memory: { ...nextMemory, lastIntent: "materi" }, answer: materialAnswer(student) };
      }

      if (hasAny(input, ["forum", "diskusi"])) {
        return {
          memory: { ...nextMemory, lastIntent: "forum" },
          answer: "💬 **Forum Diskusi**\n\nForum diskusi tersedia per tugas. Kamu bisa menanyakan soal yang belum dipahami atau berbagi jawaban dengan teman sekelas di halaman detail tugas.\n\nBuka **Tugas** → pilih tugas → tab **Forum Diskusi**.",
        };
      }

      if (hasAny(input, ["ujian", "uts", "uas", "ujian tengah", "ujian akhir", "jadwal ujian"])) {
        return { memory: { ...nextMemory, lastIntent: "ujian" }, answer: examAnswer(student, first) };
      }

      if (hasAny(input, ["acara", "event", "kegiatan", "kalender", "libur", "hari libur"])) {
        return { memory: { ...nextMemory, lastIntent: "event" }, answer: eventAnswer(student, first) };
      }

      if (hasAny(input, ["pengumuman", "berita", "info terbaru", "kabar sekolah", "announcement"])) {
        return { memory: { ...nextMemory, lastIntent: "pengumuman" }, answer: announcementAnswer(student) };
      }

      if (hasAny(input, ["jadwal", "pelajaran", "mata pelajaran", "hari ini", "besok", "jam berapa", "ruang"])) {
        const tomorrow = hasAny(input, ["besok"]);
        return {
          memory: { ...nextMemory, lastIntent: "jadwal" },
          answer: scheduleAnswer(student, first, tomorrow),
        };
      }

      if (hasAny(input, ["tugas", "pr", "deadline", "pekerjaan rumah", "submit", "kumpul"])) {
        return { memory: { ...nextMemory, lastIntent: "tugas" }, answer: taskAnswer(student, input, first) };
      }

      if (hasAny(input, ["buku", "katalog", "koleksi", "perpustakaan"])) {
        const books = getBookSummary();
        return {
          memory: { ...nextMemory, lastIntent: "buku" },
          answer: `📚 **Koleksi Perpustakaan**\n\nTotal **${books.total} buku** dalam **${books.categories} kategori**. Buku paling populer:\n\n${numbered(
            books.popular.map((b) => `**${b.title}** — ${b.author} (dipinjam ${b.loans} kali, sisa ${b.available} eksemplar)`)
          )}\n\nKetik *"cari buku <judul>"* untuk mencari buku tertentu, atau tanyakan *"buku apa yang saya pinjam?"* untuk pinjamanmu. 🔍`,
        };
      }
    }
  }

  /* ---------- 7. DATA ADMIN & SUPERADMIN ---------- */

  if (role === "admin" || role === "superadmin") {
    const admin = ad();
    if (admin) {
      if (hasAny(input, ["statistik", "statistik sekolah", "ringkasan", "dashboard", "keadaan sekolah", "laporan sekolah"])) {
        return { memory: { ...nextMemory, lastIntent: "statistik" }, answer: adminSummaryAnswer(admin, first) };
      }

      if (/(berapa|total|jumlah)\s+(siswa|guru|murid|pengguna|kelas)/.test(input)) {
        return { memory: { ...nextMemory, lastIntent: "statistik" }, answer: adminCountsAnswer(admin, input) };
      }

      if (hasAny(input, ["buku", "paling banyak dipinjam", "terlaris", "populer", "peminjaman", "pinjaman", "dipinjam"])) {
        return { memory: { ...nextMemory, lastIntent: "perpustakaan" }, answer: adminBookAnswer(admin) };
      }

      if (hasAny(input, ["kehadiran", "absen", "presensi", "hadir hari ini"])) {
        return { memory: { ...nextMemory, lastIntent: "absensi" }, answer: adminAttendanceAnswer(admin) };
      }

      if (hasAny(input, ["deadline", "tugas", "pengumpulan", "submission", "belum dikumpulkan", "pr"])) {
        return { memory: { ...nextMemory, lastIntent: "tugas" }, answer: adminTaskAnswer(admin, first) };
      }

      if (hasAny(input, ["pengumuman", "berita", "announcement", "informasi"])) {
        return { memory: { ...nextMemory, lastIntent: "pengumuman" }, answer: adminAnnouncementAnswer(admin) };
      }

      if (hasAny(input, ["event", "acara", "kegiatan", "kalender", "agenda"])) {
        return { memory: { ...nextMemory, lastIntent: "event" }, answer: adminEventAnswer(admin) };
      }

      if (hasAny(input, ["aktivitas", "activity", "aktivitas terbaru", "log aktivitas"])) {
        return {
          memory: { ...nextMemory, lastIntent: "aktivitas" },
          answer: `🕘 **Aktivitas Terbaru**\n\n${bullets(admin.activities.map((a) => `**${a.message}**`))}\n\nAktivitas lengkap bisa dilihat di menu **Aktivitas** atau **Log Audit** (khusus Super Admin).`,
        };
      }
    }
  }

  /* ---------- 8. PENGETAHUAN UMUM ---------- */

  const knowledge = knowledgeAnswer(input);
  if (knowledge) return { memory: nextMemory, answer: knowledge };

  /* ---------- 9. LANJUTAN ---------- */

  if (hasAny(input, ["terus", "lalu", "selanjutnya", "apa lagi", "lanjut"])) {
    return {
      memory: nextMemory,
      answer: `Menarik! 😄 Untuk topik itu, aku sudah jelaskan yang paling penting.\n\nKalau mau ganti topik, coba tanya hal seperti:\n${bullets(SUGGESTIONS_BY_ROLE[role].slice(0, 4))}`,
    };
  }

  /* ---------- 10. FALLBACK ---------- */

  return {
    memory: nextMemory,
    answer: `Maaf, aku belum paham maksudmu. 🙏\n\nAku bisa membantu hal-hal seperti:\n${bullets(SUGGESTIONS_BY_ROLE[role])}\n\nAtau ketik *"bantuan"* untuk melihat kemampuan lengkapku.`,
  };
}

/* =============================================================
   PENYUSUN JAWABAN
   ============================================================= */

function greetingAnswer(role: Role, first: string, todayAttendance?: string | null): string {
  const attendanceNote =
    role === "student" && todayAttendance === "absent"
      ? "\n\nKamu tercatat **alpha** hari ini ya. Jangan lupa bicara dengan wali kelasmu. 🙏"
      : role === "student" && todayAttendance === "present"
        ? "\n\nKamu sudah tercatat **hadir** hari ini, keren! 👏"
        : "";
  return `Halo, ${first}! 👋 Aku **SchoolHub Assistant**, asisten pintar untuk semua kebutuhan sekolahmu.${attendanceNote}\n\nKamu bisa bertanya tentang **tugas, jadwal pelajaran, nilai, absensi, buku, ujian, pengumuman, hingga cara belajar**. Coba ketik *"bantuan"* atau pilih salah satu saran di bawah ini. ✨`;
}

function introAnswer(role: Role): string {
  const capability = SUGGESTIONS_BY_ROLE[role]
    .slice(0, 3)
    .map((s) => `- ${s}`)
    .join("\n");
  return `Aku **SchoolHub Assistant**, asisten virtual bawaan SchoolHub yang selalu siap membantumu. 🤖\n\nFitur utamaku:\n- **Memahami bahasa sehari-hari** — kamu bisa ngobrol santai.\n- **Mengenal konteks** — aku ingat nama panggilan, hobi, hingga mapel favoritmu.\n- **Terhubung ke data sekolah** — tugas, jadwal, nilai, buku, dan lainnya.\n\nUntuk role ${role === "student" ? "**Siswa**" : "**Admin/Super Admin**"}, contoh pertanyaan:\n${capability}\n\nAyo, tanya apa saja! 😄`;
}

function capabilitiesAnswer(role: Role, first: string): string {
  const common = `- 🔍 **Cari data** — misal: *"cari buku fisika"* atau *"cari guru matematika"*\n- 📖 **Pengetahuan umum** — tanya tentang React, JavaScript, cara belajar, dan lainnya\n- 💬 **Ngobrol santai** — aku ingat nama panggilan, hobi, dan mapel favoritmu`;

  const specific =
    role === "student"
      ? `- 📌 **Tugas** — apa saja yang belum dikumpulkan & deadline terdekat\n- 🗓️ **Jadwal** — pelajaran hari ini, besok, atau mingguan\n- 📊 **Nilai** — nilai per mapel, rata-rata, dan predikat\n- 🏫 **Absensi** — kehadiran dan status hari ini\n- 📚 **Buku** — buku yang sedang dipinjam & tanggal kembali\n- 🏆 **XP & peringkat** — achievements, streak, dan leaderboard`
      : `- 🎯 **Ringkasan sekolah** — statistik siswa, guru, buku, dan aktivitas\n- 📌 **Tugas** — deadline terdekat & status pengumpulan\n- 🏫 **Kehadiran** — rekap absensi hari ini\n- 📚 **Perpustakaan** — buku terpopuler & peminjaman\n- 📢 **Pengumuman** — informasi terbaru untuk seluruh warga sekolah`;

  return `Berikut yang bisa aku lakukan, ${first}:\n\n${specific}\n${common}\n\nKetik pertanyaanmu kapan saja, atau mulai dengan salah satu saran di bawah! ✨`;
}

function faqAnswer(input: string, role: Role): string | null {
  const isStudent = role === "student";

  if (hasAny(input, ["cara meminjam buku", "cara pinjam buku", "meminjam buku", "prosedur pinjam"])) {
    if (isStudent) {
      return `📚 **Cara Meminjam Buku**\n\nBerikut langkah-langkahnya:\n1. Buka menu **Buku**.\n2. Cari buku yang kamu inginkan (bisa pakai kolom pencarian).\n3. Pastikan stok **tersedia** (jumlah eksemplar lebih dari 0).\n4. Klik tombol **Pinjam** pada buku tersebut.\n5. Buku akan tercatat sebagai pinjaman aktif dengan tanggal jatuh tempo.\n\n⚠️ **Ingat!** Kembalikan buku sebelum tanggal jatuh tempo agar tidak terkena **denda**. Riwayat pinjamanmu bisa dicek di **Buku → Peminjaman**.`;
    }
    return `📚 **Meminjam Buku (Sisi Admin)**\n\nDi menu **Buku → Peminjaman**, kamu bisa:\n1. Melihat daftar peminjaman aktif dan riwayatnya.\n2. Mencatat buku yang **dikembalikan**.\n3. Melihat dan mengelola **denda** keterlambatan.\n\nPastikan stok buku diperbarui setiap kali ada peminjaman atau pengembalian.`;
  }

  if (hasAny(input, ["cara mengumpulkan tugas", "cara kumpul tugas", "mengumpulkan tugas", "cara submit tugas"])) {
    if (isStudent) {
      return `📤 **Cara Mengumpulkan Tugas**\n\nLangkahnya:\n1. Buka menu **Tugas** dan pilih tugas yang masih **terbuka**.\n2. Baca deskripsi dan lampirannya dengan teliti.\n3. Tulis jawaban atau unggah berkas pada kolom yang tersedia.\n4. Klik **Kumpulkan**.\n5. Status tugas berubah menjadi **Dikumpulkan** — jangan lupa cek nilai setelah dinilai.\n\n⏰ Kumpulkan sebelum **deadline** untuk mendapat XP *Fast Submitter*!`;
    }
    return `📤 **Pengumpulan Tugas (Sisi Admin)**\n\nKamu bisa memantau pengumpulan dari menu **Tugas → detail tugas**:\n1. Lihat daftar siswa yang sudah/belum mengumpulkan.\n2. Klik **tandai selesai** untuk tugas yang dikumpulkan manual.\n3. Nilai tugas langsung dari halaman yang sama.\n\nStatus pengumpulan juga terlihat dari menu **Grafik Pengumpulan**.`;
  }

  if (hasAny(input, ["cara ganti password", "ganti password", "ubah password", "ubah sandi", "reset password"])) {
    return `🔐 **Cara Mengganti Password**\n\n1. Klik foto profil di pojok kanan atas → **Profil**.\n2. Buka tab **Keamanan** atau bagian **Ubah Password**.\n3. Masukkan password lama, lalu password baru (minimal 8 karakter dengan kombinasi huruf dan angka).\n4. Klik **Simpan**.\n\nJika lupa password saat login, gunakan menu **Lupa Password** dan ikuti langkah reset yang dikirim ke email.`;
  }

  if (hasAny(input, ["cara lihat rapor", "cara lihat nilai", "melihat rapor", "lihat rapor", "lihat nilai"])) {
    if (isStudent) {
      return `📊 **Melihat Nilai & Rapor**\n\n1. Buka menu **Nilai**.\n2. Kamu akan melihat rata-rata, predikat, dan detail nilai per mapel.\n3. Gunakan tab **Grafik** untuk melihat perkembangan nilaimu.\n4. Untuk **rapor**, buka menu **Rapor** untuk mencetak atau mengunduh.\n\nPredikat: **A** (≥90), **B** (≥80), **C** (≥70), **D** (≥60), **E** (<60).`;
    }
    return `📊 **Melihat Nilai (Sisi Admin)**\n\n1. Buka menu **Nilai** → **Input Nilai** untuk mengisi nilai siswa.\n2. Gunakan menu **Nilai** → **Rekap** untuk melihat rekap per kelas/mapel.\n3. Guru bisa mencetak rapor kelas dari menu **Rapor**.`;
  }

  if (hasAny(input, ["jam buka", "jam perpustakaan", "waktu perpustakaan"])) {
    return `🕐 **Jam Operasional Perpustakaan**\n\n- **Senin – Jumat**: 08.00 – 16.00\n- **Pekan UTS/UAS**: 08.00 – 18.00 (jam tambahan)\n- **Sabtu**: 08.00 – 12.00\n\nPastikan meminjam atau mengembalikan buku dalam jam tersebut ya!`;
  }

  if (!isStudent && hasAny(input, ["cara membuat pengumuman", "cara buat pengumuman", "tambah pengumuman"])) {
    return `📢 **Cara Membuat Pengumuman**\n\n1. Buka menu **Pengumuman**.\n2. Klik tombol **+ Buat Pengumuman**.\n3. Isi judul dan isi pengumuman.\n4. Pilih prioritas: **Biasa**, **Penting**, atau **URGENT**.\n5. Centang **Pinned** jika pengumuman harus selalu tampil di atas.\n6. Klik **Terbitkan**.\n\nPengumuman akan tampil di dashboard dan halaman pengumuman semua pengguna.`;
  }

  if (!isStudent && hasAny(input, ["cara input nilai", "cara mengisi nilai", "input nilai"])) {
    return `📝 **Cara Input Nilai**\n\n1. Buka menu **Nilai** → **Input Nilai**.\n2. Pilih **kelas**, **mapel**, dan **jenis nilai** (Tugas/UTS/UAS/Quiz).\n3. Isi nilai per siswa, atau gunakan tombol **isi otomatis**.\n4. Klik **Simpan**.\n\nNilai di atas **KKM (75)** dianggap **lulus**. Rata-rata ≥85 akan menghitung XP *Top Student*.`;
  }

  return null;
}

function searchAnswer(term: string): string {
  const results = searchAiData(term);
  const sections: string[] = [];

  if (results.books.length) {
    sections.push(
      `**Buku**\n${bullets(
        results.books.map((b) => `**${b.title}** — ${b.author} (${b.category}, sisa ${b.available} eksemplar)`)
      )}`
    );
  }
  if (results.students.length) {
    sections.push(
      `**Siswa**\n${bullets(results.students.map((s) => `**${s.name}** — ${s.className}${s.nis ? ` (NIS ${s.nis})` : ""}`))}`
    );
  }
  if (results.teachers.length) {
    sections.push(
      `**Guru / Admin**\n${bullets(results.teachers.map((t) => `**${t.name}** — ${t.email}`))}`
    );
  }
  if (results.subjects.length) {
    sections.push(
      `**Mata Pelajaran**\n${bullets(results.subjects.map((s) => `**${s.name}** — diampu oleh ${s.teacher}`))}`
    );
  }
  if (results.assignments.length) {
    sections.push(
      `**Tugas**\n${bullets(results.assignments.map((a) => `**${a.title}** — ${a.className} (deadline ${a.deadline})`))}`
    );
  }
  if (results.announcements.length) {
    sections.push(
      `**Pengumuman**\n${bullets(results.announcements.map((a) => `**${a.title}** (${priorityLabel(a.priority)})`))}`
    );
  }
  if (results.materials.length) {
    sections.push(
      `**Materi**\n${bullets(results.materials.map((m) => `**${m.title}** — ${m.subject}`))}`
    );
  }
  if (results.quizzes.length) {
    sections.push(
      `**Quiz**\n${bullets(results.quizzes.map((q) => `**${q.title}** — ${q.className}`))}`
    );
  }
  if (results.events.length) {
    sections.push(
      `**Event / Agenda**\n${bullets(results.events.map((e) => `**${e.title}** (${e.date})`))}`
    );
  }
  if (results.forums.length) {
    sections.push(
      `**Forum Diskusi**\n${bullets(results.forums.map((f) => `**${f.title}** — oleh ${f.author}`))}`
    );
  }

  if (sections.length === 0) {
    return `🔍 Tidak ada hasil untuk *"${term}"*.\n\nCoba dengan kata kunci lain, misalnya judul buku, nama mapel, atau nama guru.`;
  }

  return `🔍 **Hasil pencarian: "${term}"**\n\n${sections.join("\n\n")}`;
}

/* ---------- Jawaban Siswa ---------- */

function scheduleAnswer(data: AiStudentSnapshot, first: string, tomorrow: boolean): string {
  const todayIndex = new Date().getDay();
  const isSunday = todayIndex === 0;
  const dayLabel = tomorrow ? "Besok" : "hari ini";
  const entries = tomorrow ? data.scheduleTomorrow : data.scheduleToday;
  const dayName = tomorrow ? DAY_NAMES[(new Date().getDay() + 1) % 7] : DAY_NAMES[(new Date().getDay() + 6) % 7];

  if (tomorrow && entries.length === 0) {
    return `📅 **Jadwal Besok (${dayName})**\n\nTidak ada jadwal pelajaran untuk kelas **${data.className}** besok. ${dayName === "Minggu" ? "Besok hari Minggu — libur, manfaatkan untuk istirahat ya! 😴" : "Kamu bisa gunakan waktu untuk mengerjakan tugas atau membaca."}`;
  }

  if (!tomorrow && isSunday) {
    return `📅 Hari ini **Minggu** — libur! 😴\n\nGunakan waktumu untuk mengerjakan tugas yang belum selesai atau membaca buku. Mau kulihatkan **jadwal besok**?`;
  }

  if (entries.length === 0) {
    return `📅 Tidak ada jadwal pelajaran untuk kelas **${data.className}** ${dayLabel}.\n\nCek menu **Jadwal Pelajaran** untuk melihat jadwal mingguan lengkap.`;
  }

  const list = numbered(
    entries.map((e) => `**${e.subject}** — ${e.start}–${e.end} (Ruang ${e.room})`)
  );

  return `📅 **Jadwal ${dayLabel[0].toUpperCase()}${dayLabel.slice(1)} — ${dayName}** (${data.className})\n\n${list}\n\nAda **${entries.length}** mata pelajaran ${dayLabel}. Semangat belajarnya, ${first}! 💪`;
}

function taskAnswer(data: AiStudentSnapshot, input: string, first: string): string {
  const late = data.tasks.filter((t) => t.taskState === "terlambat");
  const submitted = data.tasks.filter((t) => t.taskState === "dikumpulkan");
  const open = data.tasks.filter((t) => !t.closed);

  if (hasAny(input, ["selesai", "dikumpulkan", "sudah kumpul", "riwayat tugas"])) {
    if (submitted.length === 0) {
      return `✅ Kamu belum mengumpulkan tugas apa pun.\n\nJangan khawatir — cek menu **Tugas** dan mulai dari yang deadline-nya paling dekat ya.`;
    }
    return `✅ **Tugas yang Sudah Dikumpulkan**\n\n${bullets(
      submitted.slice(0, 6).map((t) => `**${t.title}** (${t.subject})${t.score !== undefined ? ` — nilai ${t.score}` : ""}`)
    )}\n\nTotal: **${submitted.length}** tugas dikumpulkan.`;
  }

  if (late.length > 0 && (hasAny(input, ["telat", "terlambat", "lewat deadline", "keterlambatan"]))) {
    return `⚠️ **Tugas Terlambat**\n\n${bullets(
      late.slice(0, 6).map((t) => `**${t.title}** (${t.subject}) — deadline ${formatDate(t.deadline)}`)
    )}\n\nSegera hubungi gurumu untuk menanyakan kemungkinan perpanjangan waktu ya.`;
  }

  if (open.length === 0) {
    return `🎉 Tidak ada tugas yang belum dikumpulkan, ${first}! Kamu sudah beres semua. \n\nTidak ada salahnya mempersiapkan diri untuk **tugas berikutnya** atau membaca buku di perpustakaan. 📚`;
  }

  const pending = data.deadlineTasks;
  if (pending.length === 0) {
    return `📌 **Tugas yang Belum Dikumpulkan**\n\nTidak ada tugas dengan deadline dalam 7 hari ke depan. Tugas yang masih terbuka:\n\n${bullets(
      open.slice(0, 5).map((t) => `**${t.title}** (${t.subject}) — deadline ${formatDate(t.deadline)}`)
    )}\n\nTetap semangat, ${first}! 💪`;
  }

  return `📌 **Tugas dengan Deadline Terdekat (${first})**\n\n${numbered(
    pending.map((t) => `**${t.title}** (${t.subject}) — deadline ${formatDate(t.deadline)} (${labelDays(t.dueInDays)})`)
  )}\n\nJangan menunda, kumpulkan **tepat waktu** agar mendapat XP ekstra! ⏰`;
}

function gradeSubjectAnswer(data: AiStudentSnapshot, subject: string, first: string): string {
  const grade = data.grades.find((g) => g.subject === subject);
  if (!grade) return `Tidak ditemukan data nilai untuk ${subject}.`;
  const pass = grade.average >= 75;
  return `📊 **Nilai ${grade.subject} (${first})**\n\n- Rata-rata: **${grade.average}** (predikat **${grade.predicate}**)\n- Jumlah nilai tercatat: **${grade.count}**\n- Nilai tertinggi: **${grade.best}**\n- Status: ${pass ? "✅ **Lulus** (di atas KKM 75)" : "⚠️ **Belum lulus** (di bawah KKM 75)"}\n\nRincian lengkap dan grafik perkembangan ada di menu **Nilai**. Semangat terus, ${first}! 💪`;
}

function gradeSummaryAnswer(data: AiStudentSnapshot, first: string): string {
  const pass = data.overallAverage >= 75;
  const strongest = data.grades[0];
  const weakest = data.grades[data.grades.length - 1];

  return `📊 **Rekap Nilai (${first})**\n\nRata-rata keseluruhan: **${data.overallAverage}** (predikat **${data.overallPredicate}**)\nStatus: ${pass ? "✅ Lulus" : "⚠️ Perlu ditingkatkan"} (KKM 75)\n\n**Nilai per mapel:**\n${bullets(
    data.grades.map((g) => `**${g.subject}**: ${g.average} (${g.predicate})${g.average >= 75 ? " ✅" : " ⚠️"}`)
  )}\n\n${strongest ? `💪 Mapel terkuatmu **${strongest.subject}** (${strongest.average}).` : ""} ${weakest ? `Fokus perbaiki **${weakest.subject}** yang masih ${weakest.average}.` : ""}\n\nDetail lengkap, grafik, dan rapor bisa diakses di menu **Nilai** dan **Rapor**.`;
}

function attendanceAnswer(data: AiStudentSnapshot, first: string): string {
  const todayLabel =
    data.todayAttendance === null
      ? "Belum ada sesi absensi tercatat untuk hari ini."
      : data.todayAttendance === "present"
        ? "✅ Kamu tercatat **Hadir** hari ini."
        : data.todayAttendance === "permission"
          ? "🟡 Kamu tercatat **Izin** hari ini."
          : data.todayAttendance === "sick"
            ? "🤒 Kamu tercatat **Sakit** hari ini."
            : "🔴 Kamu tercatat **Alpha** (tanpa keterangan) hari ini. Segera bicara dengan wali kelasmu!";

  return `🏫 **Rekap Absensi (${first})**\n\n- Total sesi: **${data.attendance.totalSessions}**\n- Hadir: **${data.attendance.present}**\n- Izin: **${data.attendance.permission}**\n- Sakit: **${data.attendance.sick}**\n- Alpha: **${data.attendance.absent}**\n- Tingkat kehadiran: **${data.attendance.percentage}%**\n\n📌 Hari ini: ${todayLabel}\n\nKehadiran ≥90% membantumu membuka achievement **Perfect Attendance**! 🌟`;
}

function loanAnswer(data: AiStudentSnapshot, first: string): string {
  if (data.activeLoans.length === 0) {
    return `📚 **Buku yang Sedang Kamu Pinjam**\n\nSaat ini kamu **tidak memiliki** pinjaman aktif.${data.loanHistoryCount > 0 ? `\n\nTotal riwayat peminjamanmu: **${data.loanHistoryCount}** buku.` : ""}\n\nCoba jelajahi katalog di menu **Buku** atau ketik *"cari buku ..."* untuk mencari judul favoritmu. 🔍`;
  }

  const overdue = data.activeLoans.filter((l) => l.status === "terlambat");

  return `📚 **Buku yang Sedang Kamu Pinjam (${first})**\n\n${numbered(
    data.activeLoans.map((l) => `**${l.title}** — kembali ${formatDate(l.dueAt)} (${l.status === "terlambat" ? `⚠️ terlambat ${labelDays(l.daysLeft)}` : `sisa ${l.daysLeft} hari`})`)
  )}\n\n${overdue.length > 0 ? `⚠️ Ada **${overdue.length}** buku yang terlambat dikembalikan. Segera kembalikan untuk menghindari denda!` : "Jangan lupa kembalikan sebelum jatuh tempo agar bebas denda ya! ⏰"}\n\n${data.unpaidFines > 0 ? `💰 Denda belum dibayar: **${data.unpaidFines}**. Selesaikan di menu **Buku → Peminjaman** atau perpustakaan.` : "Total riwayat pinjamanmu: " + data.loanHistoryCount + " buku."}`;
}

function gamificationAnswer(data: AiStudentSnapshot, first: string): string {
  const xp = data.metrics.xp;
  const rankInfo = data.rank;

  return `🏆 **XP & Peringkat (${first})**\n\n- **XP**: ${xp}\n- **Peringkat**: #${rankInfo.rank} dari ${rankInfo.total} siswa\n- **Streak belajar**: ${data.streak.current} hari (rekor ${data.streak.longest})\n\n**Achievement terbuka (${data.unlocked.length}/${data.unlocked.length + data.lockedCount}):**\n${bullets(
    data.unlocked.map((u) => `🏅 **${u.title}** (+${u.xp} XP)`) || ["Belum ada achievement, mulai dari kehadiran dan mengumpulkan tugas tepat waktu!"]
  )}\n\n**Top 5 Leaderboard:**\n${numbered(
    data.leaderboardTop.map((row, i) => `**${row.name}** (${row.className}) — ${row.xp} XP${i === rankInfo.rank - 1 ? " ⬅ kamu" : ""}`)
  )}\n\nIngin naik peringkat? Rajin hadir, kumpulkan tugas tepat waktu, pinjam buku, dan kerjakan quiz! 🚀`;
}

function targetAnswer(data: AiStudentSnapshot, first: string): string {
  if (data.targets.length === 0) {
    return `🎯 **Target Belajar**\n\nKamu belum memiliki target belajar. Buat target di menu **Target Belajar**, misalnya *"Menyelesaikan 10 soal Matematika per minggu"*.\n\nTarget yang tercapai membantumu membangun **streak belajar**! 🔥`;
  }

  return `🎯 **Target Belajar (${first})**\n\n${bullets(
    data.targets.map((t) => `**${t.title}** — ${t.progress}/${t.goal} ${t.unit} (${Math.round((t.progress / (t.goal || 1)) * 100)}%)${t.done ? " ✅ selesai" : ""}`)
  )}\n\nTetap konsisten, ${first}. Mencapai target harian menambah XP dan streak belajarmu! 🔥`;
}

function quizAnswer(data: AiStudentSnapshot): string {
  const attempts = quizAttemptCount(data.student.uid);
  return `📝 **Quiz untuk Kelas ${data.className}**\n\n${data.quizzesForClass.length > 0
    ? numbered(data.quizzesForClass.map((q) => `**${q.title}** — ${q.subject} (${q.questionCount} soal)`))
    : "Belum ada quiz aktif untuk kelasmu saat ini."}\n\nKamu sudah mengerjakan **${attempts}** quiz. Selesaikan minimal **2 quiz** untuk membuka achievement **Quiz Master**! 🧠`;
}

function materialAnswer(data: AiStudentSnapshot): string {
  return `📁 **Materi & Bahan Ajar**\n\n${bullets(
    data.materialsForClass.slice(0, 5).map((m) => `**${m.title}** — ${m.subject}`)
  )}\n\nKamu bisa mengunduh materi dari menu **Materi Pembelajaran**. Sering-seringlah mengulang materi yang sudah diajarkan agar mudah mengingatnya! 💡`;
}

function examAnswer(data: AiStudentSnapshot, first: string): string {
  if (data.examsUpcoming.length === 0) {
    return `📝 **Jadwal Ujian**\n\nTidak ada ujian yang akan datang untuk kelas **${data.className}**.\n\nManfaatkan waktu ini untuk memperdalam materi dan menyelesaikan tugas tepat waktu ya!`;
  }
  return `📝 **Jadwal Ujian Terdekat (${data.className})**\n\n${numbered(
    data.examsUpcoming.map((e) => `**${e.title}** — ${e.subject} (${formatDate(e.date)}, ${e.start}, Ruang ${e.room})`)
  )}\n\nPersiapkan dirimu dengan mengulang materi dan mengerjakan quiz, ${first}. Sukses selalu! 💪`;
}

function eventAnswer(data: AiStudentSnapshot, first: string): string {
  if (data.eventsUpcoming.length === 0) {
    return `🗓️ **Event / Agenda Akademik**\n\nBelum ada agenda mendatang untuk kelas **${data.className}**.\n\nCek menu **Kalender Akademik** untuk melihat agenda satu semester ke depan.`;
  }
  return `🗓️ **Agenda Akademik Terdekat**\n\n${bullets(
    data.eventsUpcoming.map((e) => `**${e.title}** (${formatDate(e.date)})`)
  )}\n\nCatat tanggal pentingnya di kalendermu ya, ${first}! 📌`;
}

function announcementAnswer(data: AiStudentSnapshot): string {
  if (data.announcements.length === 0) return `📢 Belum ada pengumuman. Informasi terbaru akan selalu muncul di dashboard dan menu **Pengumuman**.`;
  return `📢 **Pengumuman Terbaru**\n\n${bullets(
    data.announcements.map((a) => `**${a.title}** ${priorityLabel(a.priority)} (${formatDate(a.date)})`)
  )}\n\nSemua pengumuman bisa dibaca lengkap di menu **Pengumuman**.`;
}

/* ---------- Jawaban Admin ---------- */

function adminSummaryAnswer(admin: AiAdminSnapshot, first: string): string {
  return `📊 **Ringkasan ${admin.roleName} — ${first}**\n\n**Sumber daya:**\n- 👨‍🎓 Siswa: **${admin.totalStudents}**\n- 👩‍🏫 Guru/Admin: **${admin.totalTeachers}**\n- 📚 Buku: **${admin.totalBooks}** (${admin.totalCategories} kategori)\n- 🏫 Kelas: **${admin.classes}**\n\n**Aktivitas akademik:**\n- 📌 Tugas: **${admin.totalAssignments}** (${admin.totalSubmissions} pengumpulan)\n- 📝 Quiz: **${admin.quizCount}**\n- 🗓️ Ujian mendatang: **${admin.upcomingExamCount}**\n\n**Perpustakaan:**\n- 📖 Peminjaman aktif: **${admin.activeLoans}** (${admin.overdueLoans} terlambat)\n- 💰 Denda belum dibayar: **${admin.unpaidFines}**\n\n**Kehadiran hari ini:** **${admin.todayPresent}/${admin.todayTotal}** (${admin.todayAttendanceRate}%)\n\nTanyakan lebih spesifik untuk detail: *"berapa siswa?"*, *"buku terpopuler?"*, atau *"deadline tugas?"*.`;
}

function adminCountsAnswer(admin: AiAdminSnapshot, input: string): string {
  const counts: string[] = [];
  if (hasAny(input, ["siswa", "murid"])) counts.push(`👨‍🎓 **${admin.totalStudents}** siswa aktif`);
  if (hasAny(input, ["guru", "pengajar"])) counts.push(`👩‍🏫 **${admin.totalTeachers}** guru/admin`);
  if (hasAny(input, ["kelas"])) counts.push(`🏫 **${admin.classes}** kelas`);
  if (hasAny(input, ["pengguna", "user"])) counts.push(`👥 **${admin.activeUsers}** pengguna aktif`);
  if (counts.length === 0) {
    counts.push(
      `👨‍🎓 **${admin.totalStudents}** siswa`,
      `👩‍🏫 **${admin.totalTeachers}** guru/admin`,
      `📚 **${admin.totalBooks}** buku`,
      `🏫 **${admin.classes}** kelas`
    );
  }
  return `📊 **Jumlah Pengguna Sekolah**\n\n${bullets(counts)}\n\nStatistik lengkap bisa kamu lihat di halaman **Dashboard**.`;
}

function adminBookAnswer(admin: AiAdminSnapshot): string {
  return `📚 **Perpustakaan**\n\n- Total buku: **${admin.totalBooks}** (${admin.totalCategories} kategori)\n- Peminjaman aktif: **${admin.activeLoans}** (${admin.overdueLoans} terlambat)\n- Denda belum dibayar: **${admin.unpaidFines}**\n\n**Buku paling populer:**\n${numbered(
    admin.popularBooks.map((b) => `**${b.title}** — dipinjam ${b.loans} kali`)
  )}\n\nKelola peminjaman dan denda dari menu **Buku → Peminjaman**.`;
}

function adminAttendanceAnswer(admin: AiAdminSnapshot): string {
  return `🏫 **Kehadiran Siswa Hari Ini**\n\n- Hadir: **${admin.todayPresent}**\n- Belum tercatat / tidak hadir: **${admin.todayTotal - admin.todayPresent}**\n- Tingkat kehadiran: **${admin.todayAttendanceRate}%**\n\nRekap per kelas dan rekap mingguan bisa dilihat di menu **Absensi**.`;
}

function adminTaskAnswer(admin: AiAdminSnapshot, first: string): string {
  return `📌 **Tugas & Deadline**\n\n- Total tugas: **${admin.totalAssignments}**\n- Tugas dengan deadline ≤7 hari: **${admin.upcomingDeadlineCount}**\n- Pengumpulan tercatat: **${admin.totalSubmissions}**\n\nPantau status pengumpulan per siswa di **Tugas → detail tugas** dan lihat grafiknya di menu **Grafik Pengumpulan**. Ingatkan siswa yang belum mengumpulkan ya, ${first}!`;
}

function adminAnnouncementAnswer(admin: AiAdminSnapshot): string {
  if (admin.recentAnnouncements.length === 0) {
    return `📢 Belum ada pengumuman. Buat pengumuman pertama dari menu **Pengumuman** → **+ Buat Pengumuman**.`;
  }
  return `📢 **Pengumuman Terbaru**\n\n${bullets(
    admin.recentAnnouncements.map((a) => `**${a.title}** ${priorityLabel(a.priority)}`)
  )}\n\nTotal pengumuman: **${admin.announcementCount}**. Kelola dari menu **Pengumuman**.`;
}

function adminEventAnswer(admin: AiAdminSnapshot): string {
  if (admin.events.length === 0) {
    return `🗓️ Belum ada agenda mendatang. Tambahkan event di menu **Kalender Akademik**.`;
  }
  return `🗓️ **Agenda Akademik Terdekat**\n\n${bullets(
    admin.events.map((e) => `**${e.title}** (${formatDate(e.date)})`)
  )}\n\nKelola agenda satu semester dari menu **Kalender Akademik**.`;
}

/* ---------- Cuaca & Notifikasi ---------- */

async function weatherAnswer(): Promise<string> {
  try {
    const weather = await getWeather();
    const tips = [
      weather.code >= 80
        ? "🌂 Jangan lupa bawa payung, ada hujan!"
      : weather.code >= 95
        ? "⛈️ Hati-hati badai petir hari ini, usahakan tidak banyak keluar."
      : weather.temp >= 33
        ? "🥵 Cuaca panas, perbanyak minum air putih ya."
      : weather.temp <= 24
        ? "🧥 Cuaca agak dingin, pakai jaket agar tetap nyaman."
      : "😊 Cuaca cukup bersahabat hari ini.",
    ];
    return `🌤️ **Cuaca di ${weather.city}**\n\n- Kondisi: **${weather.description}**\n- Suhu: **${weather.temp}°C** (terasa ${weather.feelsLike}°C)\n- Kelembapan: **${weather.humidity}%**\n- Angin: **${weather.windSpeed} km/j**\n- Matahari terbit **${weather.sunrise}**, terbenam **${weather.sunset}**\n\n${tips.join(" ")}\n\nSumber lokasi: ${weather.source === "manual" ? "kota pilihanmu" : "lokasi otomatis"}.`;
  } catch {
    return `🌤️ **Cuaca**\n\nMaaf, layanan cuaca sedang tidak bisa diakses saat ini. Coba lagi beberapa saat ya. 🙏`;
  }
}

async function notificationAnswer(userId: string): Promise<string> {
  try {
    const notifications = await getNotificationsForUser(userId);
    const unread = notifications.filter((n) => !n.read);
    if (notifications.length === 0) {
      return "🔔 **Notifikasi**\n\nBelum ada notifikasi untukmu. Semua pemberitahuan akan tampil otomatis di ikon lonceng dan halaman **Notifikasi**.";
    }
    const top = notifications.slice(0, 5).map(
      (n) => `- ${n.read ? "" : "🔴 "}**${n.title}** — ${n.message} (${relativeTime(n.createdAt)})`
    );
    return `🔔 **Notifikasi Terbaru (${unread.length} belum dibaca dari ${notifications.length})**\n\n${top.join("\n")}\n\nBuka ikon lonceng atau halaman **Notifikasi** untuk melihat semuanya.`;
  } catch {
    return "🔔 Maaf, tidak bisa mengambil notifikasi saat ini.";
  }
}

/* ---------- Pengetahuan Umum ---------- */

function knowledgeAnswer(input: string): string | null {
  if (hasAny(input, ["react", "apakah react"])) {
    return `⚛️ **React**\n\nReact adalah **library JavaScript** untuk membangun antarmuka pengguna (UI), dikembangkan oleh Meta.\n\n**Konsep kunci:**\n- **Komponen** — UI dipecah menjadi bagian kecil yang bisa dipakai ulang.\n- **JSX** — sintaks mirip HTML yang ditulis di dalam JavaScript.\n- **State & Props** — cara React mengelola data antarkomponen.\n- **Virtual DOM** — pembaruan UI jadi lebih cepat.\n\n💡 *Tips belajar:* kuasai dulu JavaScript dasar, lalu bangun proyek kecil seperti *daftar tugas* untuk memahami komponen dan state.`;
  }
  if (hasAny(input, ["javascript", "js", "apakah javascript"]) && !hasAny(input, ["next.js", "next js"])) {
    return `📜 **JavaScript**\n\nJavaScript adalah **bahasa pemrograman** yang membuat halaman web menjadi interaktif — mulai dari validasi form, animasi, hingga aplikasi web lengkap.\n\n**Yang sering dipakai:**\n- **Variabel & tipe data** (let, const, string, number, array, object)\n- **Fungsi** dan *arrow function*\n- **DOM** untuk mengubah elemen halaman\n- **Event** seperti klik dan input\n- **Async** dengan Promise dan async/await\n\n💡 *Tips belajar:* praktik langsung di console browser, lalu coba proyek kecil seperti *kalkulator* atau *todolist*.`;
  }
  if (hasAny(input, ["next.js", "next js", "apakah next"])) {
    return `▲ **Next.js**\n\nNext.js adalah **framework React** untuk membangun aplikasi web modern — termasuk website SchoolHub ini!\n\n**Keunggulannya:**\n- **App Router** & file-based routing\n- **SSR/SSG** untuk SEO lebih baik\n- **API Routes** untuk backend dalam satu proyek\n- **Server Components** untuk performa tinggi\n\n💡 *Tips belajar:* pahami React dulu, lalu coba buat halaman + route sederhana dengan Next.js.`;
  }
  if (hasAny(input, ["algoritma", "apa itu algoritma"])) {
    return `🧠 **Algoritma**\n\nAlgoritma adalah **langkah-langkah logis** yang tersusun untuk menyelesaikan suatu masalah, layaknya resep memasak.\n\n**Karakteristik:**\n- **Input & output** yang jelas\n- **Finiteness** — harus berhenti\n- **Deterministik** — langkah yang jelas dan tidak ambigu\n- **Efektif** — bisa dijalankan\n\n**Contoh sehari-hari:** mencari kata di kamus, menyusun jadwal, atau mengurutkan angka.\n\n💡 *Tips belajar:* tulis langkah solusi dalam bahasa sehari-hari dulu, baru ubah ke kode.`;
  }
  if (hasAny(input, ["cara belajar", "tips belajar", "belajar efektif", "belajar yang baik", "cara belajar efektif"])) {
    return `📖 **Cara Belajar Efektif**\n\n1. **Buat target harian** yang realistis — misalnya 1 bab atau 10 soal per hari.\n2. Gunakan teknik **Pomodoro** — belajar 25 menit, istirahat 5 menit.\n3. **Catat ulang** materi dengan bahasamu sendiri.\n4. **Evaluasi** dengan mengerjakan quiz dan latihan soal.\n5. **Ulangi berkala** (spaced repetition) agar ingatan lebih kuat.\n\nSchoolHub sudah menyediakan **Target Belajar**, **Catatan**, **Quiz**, dan **Forum Diskusi** untuk mendukung semuanya. Manfaatkan ya! 💪`;
  }
  if (hasAny(input, ["kkm", "apa itu kkm"])) {
    return `🎯 **KKM (Kriteria Ketuntasan Minimal)**\n\nKKM adalah **nilai minimal** yang harus dicapai siswa agar dinyatakan **tuntas/lulus** pada suatu mapel.\n\nDi SchoolHub, **KKM = 75**.\n- Nilai **≥ 75** → Lulus ✅\n- Nilai **< 75** → Perlu perbaikan ⚠️\n\nPredikat: **A** (≥90), **B** (≥80), **C** (≥70), **D** (≥60), **E** (<60).`;
  }
  if (hasAny(input, ["predikat", "apa itu predikat"])) {
    return `🏅 **Predikat Nilai**\n\nPredikat adalah label kualitatif dari nilai rata-rata siswa:\n- **A** — Sangat Baik (≥90)\n- **B** — Baik (≥80)\n- **C** — Cukup (≥70)\n- **D** — Kurang (≥60)\n- **E** — Sangat Kurang (<60)\n\nKamu bisa melihat predikat tiap mapel di menu **Nilai** atau tanyakan *"bagaimana nilai saya?"*`;
  }
  return null;
}
