import type {
  AcademicEvent,
  Announcement,
  AuditEntry,
  BankQuestion,
  BookRating,
  BookWishlistItem,
  ExamSchedule,
  ForumPost,
  ForumThread,
  Grade,
  Material,
  Quiz,
  QuizAttempt,
  Rubric,
  ScheduleEntry,
  StudyNote,
  StudyTarget,
  Subject,
  TaskBookmark,
} from "@/types";
import { CLASS_OPTIONS } from "@/lib/constants";
import { mockAssignments, mockBooks, mockUsers } from "./mock";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function daysFromNow(offset: number): string {
  return new Date(Date.now() + offset * DAY).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

export const ADMIN_UIDS = mockUsers
  .filter((u) => u.role === "admin" && u.status === "active")
  .map((u) => u.uid);

export const STUDENT_UIDS = mockUsers
  .filter((u) => u.role === "student")
  .map((u) => u.uid);

/* ===================== Mata Pelajaran ===================== */

export const mockSubjects: Subject[] = [
  ["Matematika", "MTK", "Hitung, aljabar, geometri, dan statistika", "#2563eb"],
  ["Bahasa Indonesia", "BIN", "Keterampilan berbahasa dan sastra Indonesia", "#0ea5e9"],
  ["Bahasa Inggris", "BIG", "English language and literature", "#f59e0b"],
  ["PAI", "PAI", "Pendidikan Agama Islam", "#10b981"],
  ["PPLG", "PPLG", "Pengembangan Perangkat Lunak dan Gim", "#8b5cf6"],
  ["IPS", "IPS", "Ilmu Pengetahuan Sosial", "#ef4444"],
  ["IPA", "IPA", "Ilmu Pengetahuan Alam", "#14b8a6"],
  ["Fisika", "FIS", "Ilmu fisika dan penerapannya", "#6366f1"],
  ["Kimia", "KIM", "Ilmu kimia dasar dan lanjutan", "#d946ef"],
  ["Biologi", "BIO", "Ilmu biologi dan keanekaragaman hayati", "#22c55e"],
  ["Sejarah", "SJRH", "Sejarah Indonesia dan dunia", "#f97316"],
  ["Ekonomi", "EKO", "Ilmu ekonomi, akuntansi, dan bisnis", "#0d9488"],
].map(([name, code, description, color], index) => ({
  id: `subj-${index + 1}`,
  name,
  code,
  description,
  color,
  teacherId: ADMIN_UIDS[index % ADMIN_UIDS.length],
  gradeLevel: String(10 + (index % 3)),
  createdAt: daysFromNow(-120 + index * 3),
}));

/* ===================== Jadwal Pelajaran ===================== */

const SCHEDULE_SLOTS = [
  { startTime: "07:00", endTime: "08:30" },
  { startTime: "08:30", endTime: "10:00" },
  { startTime: "10:15", endTime: "11:45" },
  { startTime: "12:30", endTime: "14:00" },
  { startTime: "14:00", endTime: "15:30" },
];

const ROOMS = ["R. 101", "R. 102", "R. 203", "Lab. Fisika", "Lab. Komputer", "R. 305"];

export const mockScheduleEntries: ScheduleEntry[] = [];

for (let c = 0; c < CLASS_OPTIONS.length; c++) {
  const className = CLASS_OPTIONS[c];
  for (let day = 0; day < 6; day++) {
    for (let slot = 0; slot < 5; slot++) {
      const subject = mockSubjects[(c * 3 + day * 2 + slot) % mockSubjects.length];
      mockScheduleEntries.push({
        id: `sch-${className.replace(/\s/g, "")}-${day}-${slot}`,
        subjectId: subject.id,
        teacherId: subject.teacherId,
        className,
        day,
        startTime: SCHEDULE_SLOTS[slot].startTime,
        endTime: SCHEDULE_SLOTS[slot].endTime,
        room: ROOMS[(c + slot) % ROOMS.length],
      });
    }
  }
}

/* ===================== Kalender Akademik ===================== */

export const mockAcademicEvents: AcademicEvent[] = [
  {
    id: "ev-1",
    title: "Ujian Tengah Semester",
    type: "exam",
    date: daysFromNow(12).slice(0, 10),
    description: "UTS seluruh mata pelajaran",
    startTime: "07:00",
    endTime: "11:00",
  },
  {
    id: "ev-2",
    title: "Deadline Tugas Matematika",
    type: "deadline",
    date: daysFromNow(2).slice(0, 10),
    description: "Persamaan Linear Dua Variabel",
    className: "XI IPA 1",
  },
  {
    id: "ev-3",
    title: "Libur Nasional — Maulid Nabi",
    type: "holiday",
    date: daysFromNow(20).slice(0, 10),
    description: "Peringatan Maulid Nabi Muhammad SAW",
  },
  {
    id: "ev-4",
    title: "Pentas Seni & Bazar",
    type: "event",
    date: daysFromNow(30).slice(0, 10),
    description: "Kegiatan tahunan sekolah di lapangan utama",
    startTime: "08:00",
    endTime: "14:00",
  },
  {
    id: "ev-5",
    title: "Pengumuman Hasil Ujian",
    type: "announcement",
    date: daysFromNow(6).slice(0, 10),
    description: "Hasil ujian tengah semester diumumkan melalui SchoolHub",
  },
  {
    id: "ev-6",
    title: "Rapat Orang Tua Murid",
    type: "event",
    date: daysFromNow(9).slice(0, 10),
    description: "Pembagian rapor tengah semester",
    startTime: "08:00",
    endTime: "11:00",
  },
  {
    id: "ev-7",
    title: "Libur Akhir Semester",
    type: "holiday",
    date: daysFromNow(45).slice(0, 10),
    description: "Libur akhir semester ganjil",
  },
  {
    id: "ev-8",
    title: "Deadline Tugas Bahasa Inggris",
    type: "deadline",
    date: daysFromNow(4).slice(0, 10),
    className: "XI IPA 2",
  },
  {
    id: "ev-9",
    title: "Ujian Praktik PPLG",
    type: "exam",
    date: daysFromNow(16).slice(0, 10),
    description: "Ujian praktik pembuatan aplikasi",
    className: "XI IPA 1",
    startTime: "09:00",
    endTime: "12:00",
  },
];

/* ===================== Jadwal Ujian ===================== */

export const mockExamSchedules: ExamSchedule[] = [
  {
    id: "ex-1",
    title: "Ujian Tengah Semester Ganjil",
    subjectId: "subj-1",
    className: "XI IPA 1",
    date: daysFromNow(12).slice(0, 10),
    startTime: "07:00",
    endTime: "09:00",
    room: "R. 101",
    description: "Materi: persamaan linear & fungsi kuadrat",
  },
  {
    id: "ex-2",
    title: "Ujian Tengah Semester Ganjil",
    subjectId: "subj-2",
    className: "XI IPA 1",
    date: daysFromNow(12).slice(0, 10),
    startTime: "09:30",
    endTime: "11:30",
    room: "R. 102",
  },
  {
    id: "ex-3",
    title: "Ujian Tengah Semester Ganjil",
    subjectId: "subj-3",
    className: "XI IPA 2",
    date: daysFromNow(13).slice(0, 10),
    startTime: "07:00",
    endTime: "09:00",
    room: "R. 203",
  },
  {
    id: "ex-4",
    title: "Ujian Praktik",
    subjectId: "subj-5",
    className: "XI IPA 1",
    date: daysFromNow(16).slice(0, 10),
    startTime: "09:00",
    endTime: "12:00",
    room: "Lab. Komputer",
    description: "Praktik membuat halaman web sederhana",
  },
  {
    id: "ex-5",
    title: "Ujian Tengah Semester Ganjil",
    subjectId: "subj-4",
    className: "X IPS 1",
    date: daysFromNow(13).slice(0, 10),
    startTime: "07:00",
    endTime: "08:30",
    room: "R. 305",
  },
  {
    id: "ex-6",
    title: "Ujian Tengah Semester Ganjil",
    subjectId: "subj-6",
    className: "XII IPS 1",
    date: daysFromNow(14).slice(0, 10),
    startTime: "07:00",
    endTime: "09:00",
    room: "R. 305",
  },
];

/* ===================== Nilai ===================== */

const SUBJECTS_FOR_GRADE = mockSubjects;

function clampScore(value: number): number {
  return Math.min(100, Math.max(45, Math.round(value)));
}

export const mockGrades: Grade[] = [];

for (let si = 0; si < STUDENT_UIDS.length; si++) {
  const uid = STUDENT_UIDS[si];
  for (let subj = 0; subj < SUBJECTS_FOR_GRADE.length; subj++) {
    const subject = SUBJECTS_FOR_GRADE[subj];
    const base =
      76 + ((si * 7 + subj * 5) % 22) + (uid === "u-s01" ? 6 : 0);
    const types: Grade["type"][] = ["tugas", "uts", "uas"];
    for (let t = 0; t < types.length; t++) {
      const type = types[t];
      const score = clampScore(base - (t === 0 ? 3 : t === 2 ? 2 : 0));
      mockGrades.push({
        id: `gr-${uid.slice(-3)}-${subject.id}-${type}`,
        studentId: uid,
        subjectId: subject.id,
        teacherId: subject.teacherId,
        type,
        score,
        comment:
          t === 0 && score >= 88
            ? "Bagus, pertahankan!"
            : t === 2 && score < 70
              ? "Perlu bimbingan tambahan"
              : undefined,
        gradedAt: daysFromNow(-(30 - ((si + subj + t * 3) % 25))),
      });
    }
  }
}

/* ===================== Bank Soal ===================== */

function q(
  type: BankQuestion["type"],
  subjectIndex: number,
  text: string,
  options: string[] | undefined,
  correctAnswer: string,
  explanation: string,
  difficulty: BankQuestion["difficulty"],
  points: number
): BankQuestion {
  return {
    id: `bq-${mockBankQuestions.length + 1}`,
    type,
    subjectId: mockSubjects[subjectIndex].id,
    text,
    options,
    correctAnswer,
    explanation,
    difficulty,
    points,
    createdAt: daysFromNow(-20),
  };
}

export const mockBankQuestions: BankQuestion[] = [];

mockBankQuestions.push(
  q("multiple_choice", 0, "Hasil dari 2x + 6 = 18 adalah …", ["4", "6", "8", "10"], "6", "2x = 18 - 6 → x = 6", "mudah", 10),
  q("multiple_choice", 0, "Akar-akar persamaan x² - 5x + 6 = 0 adalah …", ["2 dan 3", "-2 dan -3", "1 dan 6", "-1 dan 6"], "2 dan 3", "Faktor (x-2)(x-3)=0", "sedang", 15),
  q("essay", 0, "Jelaskan langkah menyelesaikan sistem persamaan linear dua variabel dengan metode substitusi!", undefined, "Guru memeriksa jawaban", "Metode substitusi: nyatakan satu variabel lalu substitusi ke persamaan lain", "sedang", 20),
  q("true_false", 0, "Bilangan 0 termasuk bilangan asli.", undefined, "Salah", "Bilangan asli dimulai dari 1", "mudah", 5),
  q("multiple_choice", 1, "Sinonim kata 'abadi' adalah …", ["fana", "sementara", "kekal", "musnah"], "kekal", "Abadi berarti kekal atau tidak berakhir", "mudah", 10),
  q("essay", 1, "Tuliskan struktur teks cerpen yang benar!", undefined, "Guru memeriksa jawaban", "Orientasi, komplikasi, resolusi, koda", "sedang", 20),
  q("true_false", 2, "Simple past tense digunakan untuk kegiatan yang terjadi di masa lampau.", undefined, "Benar", "Simple past untuk kejadian lampau yang selesai", "mudah", 5),
  q("multiple_choice", 2, "Choose the correct sentence:", ["He go to school", "He goes to school", "He going to school", "He gone to school"], "He goes to school", "Subject he/she/it → verb+s", "mudah", 10),
  q("multiple_choice", 4, "Tag HTML untuk membuat paragraf adalah …", ["<p>", "<h1>", "<div>", "<span>"], "<p>", "Tag <p> mendefinisikan paragraf", "mudah", 10),
  q("essay", 4, "Jelaskan perbedaan HTML dan CSS!", undefined, "Guru memeriksa jawaban", "HTML struktur, CSS tampilan", "sedang", 20),
  q("multiple_choice", 5, "Kebutuhan manusia yang paling dasar menurut Maslow adalah …", ["Sosial", "Fisiologis", "Keamanan", "Penghargaan"], "Fisiologis", "Fisiologis adalah hierarki terendah", "sedang", 10),
  q("true_false", 6, "Fotosintesis menghasilkan oksigen.", undefined, "Benar", "Fotosintesis menghasilkan glukosa dan oksigen", "mudah", 5),
  q("multiple_choice", 7, "Satuan gaya dalam SI adalah …", ["Joule", "Watt", "Newton", "Pascal"], "Newton", "Gaya diukur dalam Newton", "mudah", 10),
  q("multiple_choice", 8, "Lambang kimia untuk emas adalah …", ["Ag", "Au", "Fe", "Cu"], "Au", "Au = Aurum (emas)", "sedang", 10),
  q("true_false", 9, "Sel merupakan unit terkecil penyusun makhluk hidup.", undefined, "Benar", "Sel adalah unit struktural dan fungsional", "mudah", 5),
  q("multiple_choice", 10, "Proklamasi kemerdekaan Indonesia dibacakan pada tanggal …", ["17 Agustus 1945", "17 Agustus 1946", "28 Oktober 1945", "1 Juni 1945"], "17 Agustus 1945", "17 Agustus 1945 oleh Soekarno-Hatta", "mudah", 10),
  q("essay", 11, "Jelaskan hukum permintaan beserta contohnya!", undefined, "Guru memeriksa jawaban", "Harga naik → permintaan turun, ceteris paribus", "sedang", 20),
  q("true_false", 3, "Rukun Islam ada 5.", undefined, "Benar", "Syahadat, salat, zakat, puasa, haji", "mudah", 5)
);

/* ===================== Quiz Online ===================== */

function makeQuestions(): Quiz["questions"] {
  return [
    {
      id: "q1",
      type: "multiple_choice",
      text: "Berapa hasil 7 × 8?",
      options: ["54", "56", "64", "72"],
      correctAnswer: "56",
      points: 10,
    },
    {
      id: "q2",
      type: "true_false",
      text: "Air membeku pada suhu 0°C.",
      correctAnswer: "Benar",
      points: 10,
    },
    {
      id: "q3",
      type: "multiple_choice",
      text: "Ibukota Indonesia adalah …",
      options: ["Bandung", "Surabaya", "Jakarta", "Yogyakarta"],
      correctAnswer: "Jakarta",
      points: 10,
    },
    {
      id: "q4",
      type: "essay",
      text: "Sebutkan tiga ciri makhluk hidup!",
      correctAnswer: "Jawaban dapat bervariasi",
      points: 20,
    },
    {
      id: "q5",
      type: "multiple_choice",
      text: "HTML adalah singkatan dari …",
      options: [
        "Hyper Text Markup Language",
        "High Tech Modern Language",
        "Hyper Transfer Markup Language",
        "Home Tool Markup Language",
      ],
      correctAnswer: "Hyper Text Markup Language",
      points: 10,
    },
  ];
}

export const mockQuizzes: Quiz[] = [
  {
    id: "qz-1",
    title: "Kuis Matematika Dasar",
    description: "Kuis singkat materi persamaan linear.",
    subjectId: "subj-1",
    className: "XI IPA 1",
    teacherId: "u-a1",
    questions: makeQuestions(),
    timeLimitMinutes: 15,
    dueAt: daysFromNow(5),
    createdAt: daysFromNow(-4),
  },
  {
    id: "qz-2",
    title: "Kuis Bahasa Inggris: Tenses",
    description: "Latihan simple present & simple past.",
    subjectId: "subj-3",
    className: "XI IPA 1",
    teacherId: "u-a4",
    questions: makeQuestions().map((question) => ({
      ...question,
      text:
        question.id === "q1"
          ? "She ___ to school every day."
          : question.text,
      correctAnswer: question.id === "q1" ? "goes" : question.correctAnswer,
      options: question.id === "q1" ? ["go", "goes", "going", "gone"] : question.options,
    })),
    timeLimitMinutes: 10,
    dueAt: daysFromNow(3),
    createdAt: daysFromNow(-2),
  },
  {
    id: "qz-3",
    title: "Kuis PPLG: HTML & CSS",
    description: "Dasar-dasar pengembangan web.",
    subjectId: "subj-5",
    className: "X IPS 1",
    teacherId: "u-a7",
    questions: makeQuestions(),
    timeLimitMinutes: 20,
    dueAt: daysFromNow(8),
    createdAt: daysFromNow(-1),
  },
];

export const mockQuizAttempts: QuizAttempt[] = [];

for (let qz = 0; qz < mockQuizzes.length; qz++) {
  const quiz = mockQuizzes[qz];
  const classStudents = mockUsers.filter(
    (u) => u.role === "student" && u.className === quiz.className
  );
  for (let si = 0; si < classStudents.length; si++) {
    const student = classStudents[si];
    const bucket = (si * 3 + qz * 5) % 10;
    if (bucket > 6) continue;
    const raw = 62 + ((si * 11 + qz * 17) % 35);
    const isDemo = student.uid === "u-s01";
    const score = Math.min(100, raw + (isDemo ? 12 : 0));
    const maxScore = quiz.questions.reduce((sum, question) => sum + question.points, 0);
    const numericMax = quiz.questions
      .filter((question) => question.type !== "essay")
      .reduce((sum, question) => sum + question.points, 0);
    const autoScore = Math.round((score / 100) * numericMax);
    const essayPoints = maxScore - numericMax;
    mockQuizAttempts.push({
      id: `qa-${quiz.id}-${student.uid.slice(-3)}`,
      quizId: quiz.id,
      studentId: student.uid,
      answers: {
        q1: "56",
        q2: "Benar",
        q3: "Jakarta",
        q4: "Bergerak, bernapas, tumbuh.",
        q5: "Hyper Text Markup Language",
      },
      score: autoScore + Math.round(essayPoints * (score / 100)),
      maxScore,
      startedAt: hoursAgo(30 + qz * 10 + si),
      submittedAt: hoursAgo(30 + qz * 10 + si - 1),
    });
  }
}

/* ===================== Rubrik ===================== */

export const mockRubrics: Rubric[] = [
  {
    id: "rb-1",
    title: "Rubrik Tugas Esai",
    description: "Penilaian esai dan karya tulis.",
    criteria: [
      { id: "c1", label: "Isi", maxScore: 40 },
      { id: "c2", label: "Ketepatan", maxScore: 30 },
      { id: "c3", label: "Kerapihan", maxScore: 15 },
      { id: "c4", label: "Kreativitas", maxScore: 15 },
    ],
    createdAt: daysFromNow(-30),
  },
  {
    id: "rb-2",
    title: "Rubrik Presentasi",
    description: "Penilaian presentasi kelompok.",
    criteria: [
      { id: "c1", label: "Isi", maxScore: 35 },
      { id: "c2", label: "Ketepatan", maxScore: 25 },
      { id: "c3", label: "Kerapihan", maxScore: 15 },
      { id: "c4", label: "Kreativitas", maxScore: 25 },
    ],
    createdAt: daysFromNow(-25),
  },
  {
    id: "rb-3",
    title: "Rubrik Laporan Praktikum",
    description: "Penilaian laporan praktikum IPA.",
    criteria: [
      { id: "c1", label: "Isi", maxScore: 40 },
      { id: "c2", label: "Ketepatan", maxScore: 30 },
      { id: "c3", label: "Kerapihan", maxScore: 20 },
      { id: "c4", label: "Kreativitas", maxScore: 10 },
    ],
    createdAt: daysFromNow(-20),
  },
];

/* ===================== Materi Pembelajaran ===================== */

export const mockMaterials: Material[] = [
  {
    id: "mt-1",
    title: "Bab 1 — Persamaan Linear",
    description: "Slide materi persamaan linear dua variabel.",
    subjectId: "subj-1",
    teacherId: "u-a1",
    type: "ppt",
    fileName: "persamaan-linear.pptx",
    sizeKb: 2400,
    createdAt: daysFromNow(-15),
  },
  {
    id: "mt-2",
    title: "Modul Teks Narasi",
    description: "PDF materi teks narasi Bahasa Indonesia.",
    subjectId: "subj-2",
    teacherId: "u-a2",
    type: "pdf",
    fileName: "modul-teks-narasi.pdf",
    sizeKb: 1800,
    createdAt: daysFromNow(-12),
  },
  {
    id: "mt-3",
    title: "Video Tutorial HTML Dasar",
    description: "Video pengenalan struktur HTML.",
    subjectId: "subj-5",
    teacherId: "u-a7",
    type: "video",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    sizeKb: 51200,
    createdAt: daysFromNow(-10),
  },
  {
    id: "mt-4",
    title: "Link Materi Tenses",
    description: "Referensi belajar tenses bahasa Inggris.",
    subjectId: "subj-3",
    teacherId: "u-a4",
    type: "link",
    url: "https://learnenglish.britishcouncil.org/grammar",
    createdAt: daysFromNow(-9),
  },
  {
    id: "mt-5",
    title: "Rangkuman Hukum Newton",
    description: "Dokumen rangkuman Hukum Newton.",
    subjectId: "subj-8",
    teacherId: "u-a5",
    type: "doc",
    fileName: "ranguman-hukum-newton.docx",
    sizeKb: 950,
    createdAt: daysFromNow(-8),
  },
  {
    id: "mt-6",
    title: "Lembar Kerja Reaksi Kimia",
    description: "LKS praktikum reaksi asam-basa.",
    subjectId: "subj-9",
    teacherId: "u-a6",
    type: "pdf",
    fileName: "lks-reaksi-kimia.pdf",
    sizeKb: 1200,
    createdAt: daysFromNow(-7),
  },
];

/* ===================== Forum Diskusi ===================== */

export const mockForumThreads: ForumThread[] = [
  {
    id: "th-1",
    assignmentId: mockAssignments[0]?.id ?? "T-001",
    title: "Diskusi: Persamaan Linear Dua Variabel",
    authorId: "u-a1",
    authorName: "Budi Santoso",
    createdAt: daysFromNow(-4),
  },
  {
    id: "th-2",
    assignmentId: mockAssignments[3]?.id ?? "T-004",
    title: "Tanya jawab Hukum Newton",
    authorId: "u-s01",
    authorName: "Alya Putri",
    createdAt: daysFromNow(-3),
  },
  {
    id: "th-3",
    assignmentId: mockAssignments[1]?.id ?? "T-002",
    title: "Kumpul referensi esai refleksi",
    authorId: "u-s02",
    authorName: "Bagas Pratama",
    createdAt: daysFromNow(-2),
  },
];

export const mockForumPosts: ForumPost[] = [
  {
    id: "fp-1",
    threadId: "th-1",
    authorId: "u-a1",
    authorName: "Budi Santoso",
    content:
      "Silakan diskusikan kendala kalian dalam menyelesaikan soal persamaan linear di sini. Saya akan bantu jelaskan.",
    createdAt: daysFromNow(-4),
  },
  {
    id: "fp-2",
    threadId: "th-1",
    authorId: "u-s01",
    authorName: "Alya Putri",
    content:
      "Pak, untuk soal nomor 5 apakah menggunakan metode substitusi atau eliminasi?",
    createdAt: daysFromNow(-4),
  },
  {
    id: "fp-3",
    threadId: "th-1",
    authorId: "u-a1",
    authorName: "Budi Santoso",
    content: "Boleh keduanya, Alya. Tapi eliminasi lebih singkat untuk soal itu.",
    createdAt: daysFromNow(-3),
  },
  {
    id: "fp-4",
    threadId: "th-2",
    authorId: "u-s01",
    authorName: "Alya Putri",
    content: "Bagaimana cara membedakan Hukum Newton 2 dan 3 dalam soal cerita?",
    createdAt: daysFromNow(-3),
  },
  {
    id: "fp-5",
    threadId: "th-3",
    authorId: "u-s02",
    authorName: "Bagas Pratama",
    content: "Saya taruh beberapa referensi esai yang bagus di sini ya teman-teman.",
    createdAt: daysFromNow(-2),
  },
];

/* ===================== Pengumuman ===================== */

export const mockAnnouncements: Announcement[] = [
  {
    id: "an-1",
    title: "Jadwal UTS Ganjil Diumumkan",
    content:
      "Ujian Tengah Semester Ganjil akan dilaksanakan mulai tanggal 12 hari ke depan. Mohon seluruh siswa mempersiapkan diri dan memeriksa jadwal di menu Jadwal Ujian.",
    authorId: "u-a1",
    priority: "urgent",
    attachment: "jadwal-uts.pdf",
    pinned: true,
    createdAt: daysFromNow(-1),
  },
  {
    id: "an-2",
    title: "Perpustakaan Buka Jam Tambahan",
    content:
      "Perpustakaan akan buka tambahan setiap sore pukul 16.00–18.00 selama pekan UTS untuk mendukung belajar siswa.",
    authorId: "u-a2",
    priority: "important",
    pinned: false,
    createdAt: daysFromNow(-2),
  },
  {
    id: "an-3",
    title: "Pendaftaran Ekstrakurikuler",
    content:
      "Pendaftaran ekstrakurikuler semester ini dibuka sampai akhir bulan. Silakan hubungi wali kelas masing-masing.",
    authorId: "u-a4",
    priority: "normal",
    attachment: "daftar-eskul.pdf",
    pinned: false,
    createdAt: daysFromNow(-3),
  },
  {
    id: "an-4",
    title: "Peringatan: Batas Pengumpulan Tugas",
    content:
      "Seluruh tugas yang berstatus terbuka wajib dikumpulkan sebelum deadline. Pengumpulan setelah deadline tetap diterima namun dicatat terlambat.",
    authorId: "u-a1",
    priority: "important",
    pinned: false,
    createdAt: daysFromNow(-4),
  },
  {
    id: "an-5",
    title: "Kegiatan Bersih-Bersih Sekolah",
    content:
      "Jumat bersih akan dilaksanakan setiap Jumat pertama. Mohon membawa peralatan kebersihan dari rumah.",
    authorId: "u-a5",
    priority: "normal",
    pinned: false,
    createdAt: daysFromNow(-5),
  },
];

/* ===================== Notifikasi ===================== */

export interface SeedNotification {
  id: string;
  userId: string;
  type: AppNotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

type AppNotificationType = import("@/types").NotificationType;

export const mockNotifications: SeedNotification[] = [
  {
    id: "ntf-1",
    userId: "u-s01",
    type: "assignment",
    title: "Tugas baru",
    message: "Guru Budi Santoso menambahkan tugas 'Praktik HTML Dasar'.",
    link: "/student/assignments",
    read: false,
    createdAt: hoursAgo(3),
  },
  {
    id: "ntf-2",
    userId: "u-s01",
    type: "deadline",
    title: "Deadline mendekat",
    message: "Tugas 'Persamaan Linear Dua Variabel' jatuh tempo dalam 2 hari.",
    link: "/student/assignments",
    read: false,
    createdAt: hoursAgo(6),
  },
  {
    id: "ntf-3",
    userId: "u-s01",
    type: "grade",
    title: "Nilai keluar",
    message: "Nilai tugas Matematika kamu sudah keluar: 92.",
    link: "/student/grades",
    read: false,
    createdAt: hoursAgo(8),
  },
  {
    id: "ntf-4",
    userId: "u-s01",
    type: "announcement",
    title: "Pengumuman penting",
    message: "Jadwal UTS Ganjil telah diumumkan.",
    link: "/student/announcements",
    read: false,
    createdAt: hoursAgo(12),
  },
  {
    id: "ntf-5",
    userId: "u-s01",
    type: "quiz",
    title: "Quiz baru",
    message: "Kuis 'Kuis Matematika Dasar' tersedia untuk dikerjakan.",
    link: "/student/quizzes",
    read: false,
    createdAt: hoursAgo(20),
  },
  {
    id: "ntf-6",
    userId: "u-s01",
    type: "material",
    title: "Materi baru",
    message: "Materi 'Bab 1 — Persamaan Linear' diunggah guru.",
    link: "/student/materials",
    read: true,
    createdAt: daysFromNow(-2),
  },
  {
    id: "ntf-7",
    userId: "u-s01",
    type: "book_due",
    title: "Buku jatuh tempo",
    message: "Buku 'Laskar Pelangi' harus dikembalikan dalam 3 hari.",
    link: "/student/my-books",
    read: false,
    createdAt: daysFromNow(-1),
  },
  {
    id: "ntf-8",
    userId: "u-s02",
    type: "deadline",
    title: "Deadline mendekat",
    message: "Tugas 'Esai Refleksi Bacaan' jatuh tempo besok.",
    link: "/student/assignments",
    read: false,
    createdAt: hoursAgo(5),
  },
  {
    id: "ntf-9",
    userId: "u-a1",
    type: "system",
    title: "Ringkasan mingguan",
    message: "10 pengumpulan baru perlu diperiksa minggu ini.",
    link: "/admin/assignments",
    read: false,
    createdAt: hoursAgo(4),
  },
];

/* ===================== Perpustakaan tambahan ===================== */

export const mockBookRatings: BookRating[] = [];

for (let b = 0; b < mockBooks.length; b++) {
  const count = 2 + ((b * 7) % 5);
  for (let r = 0; r < count; r++) {
    const rating = 3 + ((b * 3 + r * 2) % 3);
    mockBookRatings.push({
      id: `rt-${b}-${r}`,
      bookId: mockBooks[b].id,
      userId: STUDENT_UIDS[(b * 3 + r * 7) % STUDENT_UIDS.length],
      rating,
      createdAt: daysFromNow(-(40 - b - r)),
    });
  }
}

export const mockWishlist: BookWishlistItem[] = [
  { id: "wl-1", bookId: "b-20", userId: "u-s01", createdAt: daysFromNow(-5) },
  { id: "wl-2", bookId: "b-6", userId: "u-s01", createdAt: daysFromNow(-3) },
  { id: "wl-3", bookId: "b-17", userId: "u-s02", createdAt: daysFromNow(-4) },
  { id: "wl-4", bookId: "b-1", userId: "u-s03", createdAt: daysFromNow(-2) },
  { id: "wl-5", bookId: "b-22", userId: "u-s04", createdAt: daysFromNow(-1) },
];

/* ===================== Fitur siswa ===================== */

export const mockBookmarks: TaskBookmark[] = [
  { id: "bk-1", studentId: "u-s01", assignmentId: mockAssignments[0]?.id ?? "T-001", createdAt: daysFromNow(-2) },
  { id: "bk-2", studentId: "u-s01", assignmentId: mockAssignments[1]?.id ?? "T-002", createdAt: daysFromNow(-1) },
  { id: "bk-3", studentId: "u-s02", assignmentId: mockAssignments[0]?.id ?? "T-001", createdAt: daysFromNow(-2) },
];

export const mockStudyNotes: StudyNote[] = [
  {
    id: "nt-1",
    studentId: "u-s01",
    title: "Rumus Persamaan Linear",
    content:
      "Bentuk umum ax + by = c. Eliminasi: samakan koefisien lalu kurangkan. Substitusi: nyatakan x dalam y lalu masukkan ke persamaan lain.",
    color: "#2563eb",
    updatedAt: daysFromNow(-1),
  },
  {
    id: "nt-2",
    studentId: "u-s01",
    title: "Kosakata Bahasa Inggris",
    content: "achieve = mencapai, diligent = rajin, gather = mengumpulkan, submit = mengumpulkan.",
    color: "#10b981",
    updatedAt: daysFromNow(-2),
  },
  {
    id: "nt-3",
    studentId: "u-s01",
    title: "Hukum Newton",
    content: "Hukum 1: kelembaman. Hukum 2: F = ma. Hukum 3: aksi-reaksi, gaya sama besar berlawanan arah.",
    color: "#8b5cf6",
    updatedAt: daysFromNow(-3),
  },
];

export const mockStudyTargets: StudyTarget[] = [
  {
    id: "tg-1",
    studentId: "u-s01",
    title: "Selesaikan 5 tugas minggu ini",
    goal: 5,
    progress: 3,
    unit: "tugas",
    done: false,
    createdAt: daysFromNow(-4),
  },
  {
    id: "tg-2",
    studentId: "u-s01",
    title: "Hadir 100% minggu ini",
    goal: 6,
    progress: 5,
    unit: "sesi",
    done: false,
    createdAt: daysFromNow(-3),
  },
  {
    id: "tg-3",
    studentId: "u-s01",
    title: "Baca 2 buku per bulan",
    goal: 2,
    progress: 1,
    unit: "buku",
    done: false,
    createdAt: daysFromNow(-10),
  },
];

/* ===================== Audit log ===================== */

export const mockAuditEntries: AuditEntry[] = [
  { id: "au-1", actor: "Hikmawan Surianto", action: "Masuk ke sistem", target: "Super Admin Dashboard", timestamp: hoursAgo(2) },
  { id: "au-2", actor: "Budi Santoso", action: "Membuat tugas", target: "Praktik HTML Dasar", timestamp: hoursAgo(5) },
  { id: "au-3", actor: "Alya Putri", action: "Mengumpulkan tugas", target: "Esai Refleksi Bacaan", timestamp: hoursAgo(6) },
  { id: "au-4", actor: "Siti Rahayu", action: "Meminjamkan buku", target: "Laskar Pelangi", timestamp: hoursAgo(9) },
  { id: "au-5", actor: "Alya Putri", action: "Mengikuti quiz", target: "Kuis Matematika Dasar", timestamp: hoursAgo(11) },
  { id: "au-6", actor: "Dewi Lestari", action: "Memperbarui materi", target: "Link Materi Tenses", timestamp: hoursAgo(14) },
  { id: "au-7", actor: "Gita Permata", action: "Mengembalikan buku", target: "Filosofi Teras", timestamp: hoursAgo(18) },
  { id: "au-8", actor: "Hikmawan Surianto", action: "Membuat pengumuman", target: "Jadwal UTS Ganjil Diumumkan", timestamp: hoursAgo(24) },
  { id: "au-9", actor: "Sistem", action: "Mencadangkan data", target: "Backup database", timestamp: daysFromNow(-1) },
  { id: "au-10", actor: "Budi Santoso", action: "Menilai tugas", target: "Persamaan Linear Dua Variabel", timestamp: daysFromNow(-1) },
];
