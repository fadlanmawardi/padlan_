import type {
  Activity,
  AppUser,
  Assignment,
  AttendanceRecord,
  AttendanceSession,
  Book,
  Category,
  Fine,
  Loan,
  Submission,
} from "@/types";

const DAY = 24 * 60 * 60 * 1000;

function daysFromNow(offset: number): string {
  return new Date(Date.now() + offset * DAY).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const mockUsers: AppUser[] = [
  {
    uid: "u-super",
    name: "Hikmawan Surianto",
    email: "superadmin@schoolhub.id",
    role: "superadmin",
    phone: "081234567890",
    status: "active",
    createdAt: daysFromNow(-400),
  },
  {
    uid: "u-a1",
    name: "Budi Santoso",
    email: "budi@schoolhub.id",
    role: "admin",
    phone: "081298765432",
    status: "active",
    createdAt: daysFromNow(-320),
  },
  {
    uid: "u-a2",
    name: "Siti Rahayu",
    email: "siti@schoolhub.id",
    role: "admin",
    phone: "082111223344",
    status: "active",
    createdAt: daysFromNow(-280),
  },
  {
    uid: "u-a3",
    name: "Andi Wijaya",
    email: "andi@schoolhub.id",
    role: "admin",
    phone: "083876543210",
    status: "inactive",
    createdAt: daysFromNow(-150),
  },
  {
    uid: "u-a4",
    name: "Dewi Lestari",
    email: "dewi@schoolhub.id",
    role: "admin",
    phone: "085123456789",
    status: "active",
    createdAt: daysFromNow(-90),
  },
  {
    uid: "u-a5",
    name: "Rina Marlina",
    email: "rina@schoolhub.id",
    role: "admin",
    phone: "081378945612",
    status: "active",
    createdAt: daysFromNow(-240),
  },
  {
    uid: "u-a6",
    name: "Yusuf Ramadhan",
    email: "yusuf@schoolhub.id",
    role: "admin",
    phone: "082199887766",
    status: "active",
    createdAt: daysFromNow(-210),
  },
  {
    uid: "u-a7",
    name: "Lina Kartika",
    email: "lina@schoolhub.id",
    role: "admin",
    phone: "085211334455",
    status: "active",
    createdAt: daysFromNow(-180),
  },
  {
    uid: "u-a8",
    name: "Hendri Setiawan",
    email: "hendri@schoolhub.id",
    role: "admin",
    phone: "081566778899",
    status: "inactive",
    createdAt: daysFromNow(-130),
  },
  {
    uid: "u-a9",
    name: "Maya Anggraini",
    email: "maya@schoolhub.id",
    role: "admin",
    phone: "082144556677",
    status: "active",
    createdAt: daysFromNow(-100),
  },
  {
    uid: "u-a10",
    name: "Bagus Prakoso",
    email: "bagus@schoolhub.id",
    role: "admin",
    phone: "085377889900",
    status: "active",
    createdAt: daysFromNow(-75),
  },
  {
    uid: "u-s01",
    name: "Alya Putri",
    email: "alya@student.schoolhub.id",
    role: "student",
    nis: "22010101",
    className: "XI IPA 1",
    status: "active",
    createdAt: daysFromNow(-200),
  },
  {
    uid: "u-s02",
    name: "Bagas Pratama",
    email: "bagas@student.schoolhub.id",
    role: "student",
    nis: "22010102",
    className: "XI IPA 2",
    status: "active",
    createdAt: daysFromNow(-198),
  },
  {
    uid: "u-s03",
    name: "Citra Ayu",
    email: "citra@student.schoolhub.id",
    role: "student",
    nis: "22010103",
    className: "X IPS 1",
    status: "active",
    createdAt: daysFromNow(-195),
  },
  {
    uid: "u-s04",
    name: "Dimas Saputra",
    email: "dimas@student.schoolhub.id",
    role: "student",
    nis: "22010104",
    className: "XII IPA 1",
    status: "active",
    createdAt: daysFromNow(-190),
  },
  {
    uid: "u-s05",
    name: "Eka Nurhayati",
    email: "eka@student.schoolhub.id",
    role: "student",
    nis: "22010105",
    className: "XI IPS 2",
    status: "active",
    createdAt: daysFromNow(-180),
  },
  {
    uid: "u-s06",
    name: "Fajar Ramadhan",
    email: "fajar@student.schoolhub.id",
    role: "student",
    nis: "22010106",
    className: "X IPS 2",
    status: "active",
    createdAt: daysFromNow(-170),
  },
  {
    uid: "u-s07",
    name: "Gita Permata",
    email: "gita@student.schoolhub.id",
    role: "student",
    nis: "22010107",
    className: "XII IPA 2",
    status: "active",
    createdAt: daysFromNow(-160),
  },
  {
    uid: "u-s08",
    name: "Hendra Gunawan",
    email: "hendra@student.schoolhub.id",
    role: "student",
    nis: "22010108",
    className: "XII IPS 1",
    status: "active",
    createdAt: daysFromNow(-155),
  },
  {
    uid: "u-s09",
    name: "Intan Puspita",
    email: "intan@student.schoolhub.id",
    role: "student",
    nis: "22010109",
    className: "XI IPA 1",
    status: "inactive",
    createdAt: daysFromNow(-140),
  },
  {
    uid: "u-s10",
    name: "Joko Susilo",
    email: "joko@student.schoolhub.id",
    role: "student",
    nis: "22010110",
    className: "X IPS 1",
    status: "active",
    createdAt: daysFromNow(-120),
  },
];

const STUDENT_CLASSES = [
  "X IPA 1",
  "X IPA 2",
  "X IPS 1",
  "XI IPA 1",
  "XI IPA 2",
  "XI IPS 1",
  "XII IPA 1",
  "XII IPS 1",
];

const EXTRA_STUDENT_FIRST = [
  "Kartika", "Lukman", "Maya", "Nadia", "Oscar", "Putri", "Qori", "Rangga",
  "Salsabila", "Taufik", "Umi", "Vina", "Wahyu", "Xenia", "Yoga", "Zahra",
  "Arif", "Bunga", "Candra", "Eko", "Fitri", "Gilang", "Hana", "Ilham",
  "Jihan", "Kevin", "Laras", "Maulana", "Nabila", "Oki", "Pandu", "Rina",
  "Satria", "Tasya", "Umar", "Vega", "Wulan", "Yudha", "Zaki", "Ayu",
];

const EXTRA_STUDENT_LAST = [
  "Azzahra", "Basuki", "Cahyono", "Darmawan", "Efendi", "Firmansyah",
  "Gunawan", "Hidayat", "Iskandar", "Julianto", "Kurniawan", "Lestari",
  "Maulida", "Nugroho", "Oktaviani", "Prasetyo", "Qomaruddin", "Rahmawati",
  "Santoso", "Tanjung", "Utami", "Verdiansyah", "Wijaya", "Yulianti",
  "Zulkarnain", "Anggraini", "Budiman", "Cahyo", "Damayanti", "Fauziah",
  "Ginting", "Handayani", "Irawan", "Kusuma", "Latifah", "Maharani",
  "Ningsih", "Permana", "Rahayu", "Susanti",
];

for (let i = 0; i < 40; i++) {
  const n = 11 + i;
  const firstName = EXTRA_STUDENT_FIRST[i];
  const lastName = EXTRA_STUDENT_LAST[i];
  mockUsers.push({
    uid: `u-s${String(n).padStart(2, "0")}`,
    name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${n}@student.schoolhub.id`,
    role: "student",
    nis: `22010${n}`,
    className: STUDENT_CLASSES[i % STUDENT_CLASSES.length],
    status: i % 9 === 0 ? "inactive" : "active",
    createdAt: daysFromNow(-(190 - i)),
  });
}

export const mockCategories: Category[] = [
  {
    id: "c-1",
    name: "Fiksi",
    description: "Karya sastra imajinatif berupa novel dan cerita",
    bookCount: 6,
    color: "chart-1",
  },
  {
    id: "c-2",
    name: "Non-Fiksi",
    description: "Buku berdasarkan fakta dan kejadian nyata",
    bookCount: 4,
    color: "chart-2",
  },
  {
    id: "c-3",
    name: "Sains",
    description: "Ilmu pengetahuan alam dan eksakta",
    bookCount: 4,
    color: "chart-3",
  },
  {
    id: "c-4",
    name: "Teknologi",
    description: "Komputer, pemrograman, dan jaringan",
    bookCount: 3,
    color: "chart-4",
  },
  {
    id: "c-5",
    name: "Sejarah",
    description: "Peristiwa masa lampau dan tokohnya",
    bookCount: 3,
    color: "chart-5",
  },
  {
    id: "c-6",
    name: "Ekonomi",
    description: "Ilmu ekonomi, akuntansi, dan bisnis",
    bookCount: 2,
    color: "chart-1",
  },
  {
    id: "c-7",
    name: "Komik",
    description: "Bacaan bergambar dan komik edukatif",
    bookCount: 2,
    color: "chart-3",
  },
  {
    id: "c-8",
    name: "Religi",
    description: "Keagamaan dan pengembangan spiritual",
    bookCount: 1,
    color: "chart-2",
  },
];

export const mockBooks: Book[] = [
  {
    id: "b-1",
    title: "Laskar Pelangi",
    author: "Andrea Hirata",
    isbn: "978-979-3062-79-2",
    categoryId: "c-1",
    publisher: "Bentang Pustaka",
    year: 2005,
    totalCopies: 5,
    availableCopies: 4,
    status: "available",
  },
  {
    id: "b-2",
    title: "Bumi Manusia",
    author: "Pramoedya Ananta Toer",
    isbn: "978-979-9731-23-2",
    categoryId: "c-1",
    publisher: "Lentera Dipantara",
    year: 1980,
    totalCopies: 3,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-3",
    title: "Ayah",
    author: "Andrea Hirata",
    isbn: "978-602-291-085-9",
    categoryId: "c-1",
    publisher: "Bentang Pustaka",
    year: 2015,
    totalCopies: 4,
    availableCopies: 4,
    status: "available",
  },
  {
    id: "b-4",
    title: "Filosofi Teras",
    author: "Henry Manampiring",
    isbn: "978-602-291-595-3",
    categoryId: "c-2",
    publisher: "Buku Kompas",
    year: 2018,
    totalCopies: 4,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-5",
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "978-602-06-3183-5",
    categoryId: "c-2",
    publisher: "Gramedia",
    year: 2019,
    totalCopies: 3,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-6",
    title: "Sapiens",
    author: "Yuval Noah Harari",
    isbn: "978-602-03-4018-8",
    categoryId: "c-2",
    publisher: "Kepustakaan Populer Gramedia",
    year: 2017,
    totalCopies: 2,
    availableCopies: 2,
    status: "available",
  },
  {
    id: "b-7",
    title: "Fisika untuk SMA Kelas XI",
    author: "Tim Ganesha Operation",
    isbn: "978-602-241-147-2",
    categoryId: "c-3",
    publisher: "Ganesha Operation",
    year: 2020,
    totalCopies: 6,
    availableCopies: 6,
    status: "available",
  },
  {
    id: "b-8",
    title: "Biologi Jilid 2",
    author: "Neil A. Campbell",
    isbn: "978-979-099-608-1",
    categoryId: "c-3",
    publisher: "Erlangga",
    year: 2016,
    totalCopies: 5,
    availableCopies: 4,
    status: "available",
  },
  {
    id: "b-9",
    title: "Matematika Diskrit",
    author: "Rinaldi Munir",
    isbn: "978-602-298-820-9",
    categoryId: "c-3",
    publisher: "Informatika",
    year: 2018,
    totalCopies: 4,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-10",
    title: "Belajar Python untuk Pemula",
    author: "Muhammad Rizky",
    isbn: "978-623-00-2105-4",
    categoryId: "c-4",
    publisher: "Elex Media Komputindo",
    year: 2021,
    totalCopies: 5,
    availableCopies: 4,
    status: "available",
  },
  {
    id: "b-11",
    title: "Computer Networks",
    author: "Andrew S. Tanenbaum",
    isbn: "978-013-212-695-3",
    categoryId: "c-4",
    publisher: "Pearson",
    year: 2011,
    totalCopies: 3,
    availableCopies: 2,
    status: "available",
  },
  {
    id: "b-12",
    title: "Sejarah Indonesia",
    author: "Marwati Djoened",
    isbn: "978-979-785-033-0",
    categoryId: "c-5",
    publisher: "Balai Pustaka",
    year: 2008,
    totalCopies: 4,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-13",
    title: "Sang Pencerah",
    author: "Akmal Nasery Basral",
    isbn: "978-979-910-588-2",
    categoryId: "c-5",
    publisher: "Mizan",
    year: 2010,
    totalCopies: 3,
    availableCopies: 2,
    status: "available",
  },
  {
    id: "b-14",
    title: "Pengantar Ekonomi Mikro",
    author: "N. Gregory Mankiw",
    isbn: "978-979-061-594-1",
    categoryId: "c-6",
    publisher: "Salemba Empat",
    year: 2013,
    totalCopies: 5,
    availableCopies: 4,
    status: "available",
  },
  {
    id: "b-15",
    title: "Komik Pahlawan Indonesia",
    author: "Tim Komik Indonesia",
    isbn: "978-602-221-333-2",
    categoryId: "c-7",
    publisher: "Cakrawala",
    year: 2019,
    totalCopies: 4,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-16",
    title: "Rahasia Keluarga Bahagia",
    author: "Ustadz Yusuf Mansur",
    isbn: "978-979-024-445-4",
    categoryId: "c-8",
    publisher: "Zikrul Hakim",
    year: 2015,
    totalCopies: 3,
    availableCopies: 2,
    status: "available",
  },
  {
    id: "b-17",
    title: "Negeri 5 Menara",
    author: "Ahmad Fuadi",
    isbn: "978-602-291-015-9",
    categoryId: "c-1",
    publisher: "Gramedia",
    year: 2009,
    totalCopies: 5,
    availableCopies: 4,
    status: "available",
  },
  {
    id: "b-18",
    title: "Sang Pemimpi",
    author: "Andrea Hirata",
    isbn: "978-979-3062-92-7",
    categoryId: "c-1",
    publisher: "Bentang Pustaka",
    year: 2006,
    totalCopies: 4,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-19",
    title: "5 CM",
    author: "Donny Dhirgantoro",
    isbn: "978-979-910-588-3",
    categoryId: "c-1",
    publisher: "Grasindo",
    year: 2005,
    totalCopies: 4,
    availableCopies: 4,
    status: "available",
  },
  {
    id: "b-20",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    isbn: "978-602-03-2849-0",
    categoryId: "c-2",
    publisher: "Gramedia",
    year: 2018,
    totalCopies: 2,
    availableCopies: 2,
    status: "available",
  },
  {
    id: "b-21",
    title: "Kimia untuk SMA Kelas X",
    author: "Tim Erlangga",
    isbn: "978-602-298-877-3",
    categoryId: "c-3",
    publisher: "Erlangga",
    year: 2019,
    totalCopies: 6,
    availableCopies: 6,
    status: "available",
  },
  {
    id: "b-22",
    title: "Pemrograman Web dengan JavaScript",
    author: "Abdul Kadir",
    isbn: "978-979-29-9541-1",
    categoryId: "c-4",
    publisher: "Andi Offset",
    year: 2020,
    totalCopies: 4,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-23",
    title: "Sejarah Dunia yang Disembunyikan",
    author: "Jonathan Black",
    isbn: "978-602-9483-10-8",
    categoryId: "c-5",
    publisher: "Ufuk Press",
    year: 2012,
    totalCopies: 3,
    availableCopies: 2,
    status: "available",
  },
  {
    id: "b-24",
    title: "Akuntansi Dasar",
    author: "Haryono Jusup",
    isbn: "978-979-420-437-5",
    categoryId: "c-6",
    publisher: "STIE YKPN",
    year: 2011,
    totalCopies: 4,
    availableCopies: 3,
    status: "available",
  },
  {
    id: "b-25",
    title: "Komik Anak Nusantara",
    author: "Tim Komik Nusantara",
    isbn: "978-602-619-874-5",
    categoryId: "c-7",
    publisher: "Cakrawala",
    year: 2021,
    totalCopies: 5,
    availableCopies: 4,
    status: "available",
  },
];

export const mockLoans: Loan[] = [
  {
    id: "L-001",
    bookId: "b-1",
    studentId: "u-s01",
    borrowedAt: daysFromNow(-20),
    dueAt: daysFromNow(-13),
    returnedAt: daysFromNow(-10),
    status: "returned",
  },
  {
    id: "L-002",
    bookId: "b-5",
    studentId: "u-s03",
    borrowedAt: daysFromNow(-18),
    dueAt: daysFromNow(-11),
    returnedAt: daysFromNow(-12),
    status: "returned",
    fineAmount: 1000,
  },
  {
    id: "L-003",
    bookId: "b-3",
    studentId: "u-s02",
    borrowedAt: daysFromNow(-15),
    dueAt: daysFromNow(-8),
    returnedAt: daysFromNow(-9),
    status: "returned",
  },
  {
    id: "L-004",
    bookId: "b-6",
    studentId: "u-s04",
    borrowedAt: daysFromNow(-14),
    dueAt: daysFromNow(-7),
    returnedAt: daysFromNow(-2),
    status: "returned",
    fineAmount: 5000,
  },
  {
    id: "L-005",
    bookId: "b-2",
    studentId: "u-s05",
    borrowedAt: daysFromNow(-12),
    dueAt: daysFromNow(-5),
    returnedAt: daysFromNow(-6),
    status: "returned",
  },
  {
    id: "L-006",
    bookId: "b-10",
    studentId: "u-s06",
    borrowedAt: daysFromNow(-10),
    dueAt: daysFromNow(-3),
    returnedAt: daysFromNow(-1),
    status: "returned",
    fineAmount: 2000,
  },
  {
    id: "L-007",
    bookId: "b-7",
    studentId: "u-s01",
    borrowedAt: daysFromNow(-9),
    dueAt: daysFromNow(-2),
    returnedAt: daysFromNow(-3),
    status: "returned",
  },
  {
    id: "L-008",
    bookId: "b-4",
    studentId: "u-s07",
    borrowedAt: daysFromNow(-8),
    dueAt: daysFromNow(-1),
    returnedAt: daysFromNow(0),
    status: "returned",
    fineAmount: 1000,
  },
  {
    id: "L-009",
    bookId: "b-8",
    studentId: "u-s02",
    borrowedAt: daysFromNow(-6),
    dueAt: daysFromNow(1),
    returnedAt: daysFromNow(0),
    status: "returned",
  },
  {
    id: "L-010",
    bookId: "b-12",
    studentId: "u-s03",
    borrowedAt: daysFromNow(-5),
    dueAt: daysFromNow(2),
    status: "borrowed",
  },
  {
    id: "L-011",
    bookId: "b-15",
    studentId: "u-s08",
    borrowedAt: daysFromNow(-4),
    dueAt: daysFromNow(3),
    status: "borrowed",
  },
  {
    id: "L-012",
    bookId: "b-16",
    studentId: "u-s04",
    borrowedAt: daysFromNow(-4),
    dueAt: daysFromNow(3),
    status: "borrowed",
  },
  {
    id: "L-013",
    bookId: "b-9",
    studentId: "u-s05",
    borrowedAt: daysFromNow(-3),
    dueAt: daysFromNow(4),
    status: "borrowed",
  },
  {
    id: "L-014",
    bookId: "b-13",
    studentId: "u-s06",
    borrowedAt: daysFromNow(-3),
    dueAt: daysFromNow(4),
    status: "borrowed",
  },
  {
    id: "L-015",
    bookId: "b-14",
    studentId: "u-s07",
    borrowedAt: daysFromNow(-2),
    dueAt: daysFromNow(5),
    status: "borrowed",
  },
  {
    id: "L-016",
    bookId: "b-11",
    studentId: "u-s08",
    borrowedAt: daysFromNow(-2),
    dueAt: daysFromNow(5),
    status: "borrowed",
  },
  {
    id: "L-017",
    bookId: "b-1",
    studentId: "u-s09",
    borrowedAt: daysFromNow(-1),
    dueAt: daysFromNow(6),
    status: "borrowed",
  },
  {
    id: "L-018",
    bookId: "b-10",
    studentId: "u-s10",
    borrowedAt: daysFromNow(-12),
    dueAt: daysFromNow(-5),
    status: "overdue",
    fineAmount: 5000,
  },
  {
    id: "L-019",
    bookId: "b-4",
    studentId: "u-s02",
    borrowedAt: daysFromNow(-16),
    dueAt: daysFromNow(-9),
    status: "overdue",
    fineAmount: 9000,
  },
  {
    id: "L-020",
    bookId: "b-17",
    studentId: "u-s11",
    borrowedAt: daysFromNow(-22),
    dueAt: daysFromNow(-15),
    returnedAt: daysFromNow(-16),
    status: "returned",
  },
  {
    id: "L-021",
    bookId: "b-18",
    studentId: "u-s12",
    borrowedAt: daysFromNow(-21),
    dueAt: daysFromNow(-14),
    returnedAt: daysFromNow(-13),
    status: "returned",
    fineAmount: 1000,
  },
  {
    id: "L-022",
    bookId: "b-19",
    studentId: "u-s13",
    borrowedAt: daysFromNow(-20),
    dueAt: daysFromNow(-13),
    returnedAt: daysFromNow(-12),
    status: "returned",
  },
  {
    id: "L-023",
    bookId: "b-20",
    studentId: "u-s14",
    borrowedAt: daysFromNow(-19),
    dueAt: daysFromNow(-12),
    returnedAt: daysFromNow(-11),
    status: "returned",
    fineAmount: 1000,
  },
  {
    id: "L-024",
    bookId: "b-21",
    studentId: "u-s15",
    borrowedAt: daysFromNow(-18),
    dueAt: daysFromNow(-11),
    returnedAt: daysFromNow(-10),
    status: "returned",
  },
  {
    id: "L-025",
    bookId: "b-22",
    studentId: "u-s16",
    borrowedAt: daysFromNow(-17),
    dueAt: daysFromNow(-10),
    returnedAt: daysFromNow(-8),
    status: "returned",
  },
  {
    id: "L-026",
    bookId: "b-23",
    studentId: "u-s17",
    borrowedAt: daysFromNow(-16),
    dueAt: daysFromNow(-9),
    returnedAt: daysFromNow(-7),
    status: "returned",
    fineAmount: 2000,
  },
  {
    id: "L-027",
    bookId: "b-24",
    studentId: "u-s18",
    borrowedAt: daysFromNow(-15),
    dueAt: daysFromNow(-8),
    returnedAt: daysFromNow(-6),
    status: "returned",
  },
  {
    id: "L-028",
    bookId: "b-25",
    studentId: "u-s19",
    borrowedAt: daysFromNow(-14),
    dueAt: daysFromNow(-7),
    returnedAt: daysFromNow(-5),
    status: "returned",
  },
  {
    id: "L-029",
    bookId: "b-1",
    studentId: "u-s20",
    borrowedAt: daysFromNow(-13),
    dueAt: daysFromNow(-6),
    returnedAt: daysFromNow(-4),
    status: "returned",
    fineAmount: 1000,
  },
  {
    id: "L-030",
    bookId: "b-5",
    studentId: "u-s21",
    borrowedAt: daysFromNow(-12),
    dueAt: daysFromNow(-5),
    returnedAt: daysFromNow(-3),
    status: "returned",
  },
];

export const mockFines: Fine[] = [
  {
    id: "F-001",
    loanId: "L-002",
    studentId: "u-s03",
    amount: 1000,
    status: "unpaid",
    issuedAt: daysFromNow(-12),
  },
  {
    id: "F-002",
    loanId: "L-004",
    studentId: "u-s04",
    amount: 5000,
    status: "unpaid",
    issuedAt: daysFromNow(-2),
  },
  {
    id: "F-003",
    loanId: "L-018",
    studentId: "u-s10",
    amount: 5000,
    status: "unpaid",
    issuedAt: daysFromNow(-5),
  },
  {
    id: "F-004",
    loanId: "L-019",
    studentId: "u-s02",
    amount: 9000,
    status: "unpaid",
    issuedAt: daysFromNow(-9),
  },
  {
    id: "F-005",
    loanId: "L-006",
    studentId: "u-s06",
    amount: 2000,
    status: "paid",
    issuedAt: daysFromNow(-1),
    paidAt: daysFromNow(0),
  },
  {
    id: "F-006",
    loanId: "L-008",
    studentId: "u-s07",
    amount: 1000,
    status: "paid",
    issuedAt: daysFromNow(0),
    paidAt: daysFromNow(0),
  },
  {
    id: "F-007",
    loanId: "L-021",
    studentId: "u-s12",
    amount: 1000,
    status: "unpaid",
    issuedAt: daysFromNow(-13),
  },
  {
    id: "F-008",
    loanId: "L-023",
    studentId: "u-s14",
    amount: 1000,
    status: "unpaid",
    issuedAt: daysFromNow(-11),
  },
  {
    id: "F-009",
    loanId: "L-026",
    studentId: "u-s17",
    amount: 2000,
    status: "unpaid",
    issuedAt: daysFromNow(-7),
  },
  {
    id: "F-010",
    loanId: "L-029",
    studentId: "u-s20",
    amount: 1000,
    status: "paid",
    issuedAt: daysFromNow(-4),
    paidAt: daysFromNow(-3),
  },
];

export const mockActivities: Activity[] = [
  {
    id: "act-1",
    type: "loan",
    message: "meminjam buku Laskar Pelangi",
    user: "Intan Puspita",
    timestamp: hoursAgo(3),
  },
  {
    id: "act-2",
    type: "return",
    message: "mengembalikan buku Filosofi Teras",
    user: "Gita Permata",
    timestamp: hoursAgo(5),
  },
  {
    id: "act-3",
    type: "fine",
    message: "membayar denda keterlambatan Rp 1.000",
    user: "Gita Permata",
    timestamp: hoursAgo(6),
  },
  {
    id: "act-4",
    type: "loan",
    message: "meminjam buku Pengantar Ekonomi Mikro",
    user: "Gita Permata",
    timestamp: hoursAgo(8),
  },
  {
    id: "act-5",
    type: "loan",
    message: "meminjam buku Computer Networks",
    user: "Hendra Gunawan",
    timestamp: hoursAgo(10),
  },
  {
    id: "act-6",
    type: "return",
    message: "mengembalikan buku Belajar Python untuk Pemula",
    user: "Fajar Ramadhan",
    timestamp: hoursAgo(12),
  },
  {
    id: "act-7",
    type: "loan",
    message: "meminjam buku Matematika Diskrit",
    user: "Eka Nurhayati",
    timestamp: hoursAgo(14),
  },
  {
    id: "act-8",
    type: "book",
    message: "menambahkan buku Rahasia Keluarga Bahagia",
    user: "Siti Rahayu",
    timestamp: hoursAgo(20),
  },
  {
    id: "act-9",
    type: "user",
    message: "menambahkan siswa Joko Susilo",
    user: "Budi Santoso",
    timestamp: hoursAgo(26),
  },
  {
    id: "act-10",
    type: "loan",
    message: "meminjam buku Komik Pahlawan Indonesia",
    user: "Hendra Gunawan",
    timestamp: hoursAgo(30),
  },
  {
    id: "act-11",
    type: "fine",
    message: "memberlakukan denda keterlambatan Rp 5.000",
    user: "Sistem",
    timestamp: hoursAgo(34),
  },
  {
    id: "act-12",
    type: "return",
    message: "mengembalikan buku Sapiens",
    user: "Dimas Saputra",
    timestamp: hoursAgo(40),
  },
  {
    id: "act-13",
    type: "book",
    message: "memperbarui stok buku Biologi Jilid 2",
    user: "Dewi Lestari",
    timestamp: hoursAgo(48),
  },
  {
    id: "act-14",
    type: "system",
    message: "menjalankan pencadangan data perpustakaan",
    user: "Sistem",
    timestamp: hoursAgo(72),
  },
];

/* ===================== Tugas (Assignments) ===================== */

const TASK_SUBJECTS = [
  "Matematika",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Fisika",
  "Kimia",
  "Biologi",
  "Sejarah",
  "Ekonomi",
  "Geografi",
  "Sosiologi",
  "Teknologi Informasi",
  "Pendidikan Agama",
];

const TASK_DEFS: [string, string][] = [
  ["Persamaan Linear Dua Variabel", "Kerjakan latihan soal 1–10 di buku catatan"],
  ["Esai Refleksi Bacaan", "Tulis esai refleksi tentang buku yang kamu baca"],
  ["Presentasi Simple Past Tense", "Buat presentasi tentang kegiatan liburan menggunakan Simple Past"],
  ["Soal Hukum Newton", "Selesaikan 15 soal tentang Hukum Newton dan jelaskan cara penyelesaiannya"],
  ["Laporan Praktikum Reaksi Kimia", "Buat laporan praktikum tentang reaksi asam-basa"],
  ["Makalah Keanekaragaman Hayati", "Susun makalah singkat tentang keanekaragaman hayati di Indonesia"],
  ["Rangkuman Proklamasi Kemerdekaan", "Buat rangkuman kronologis peristiwa proklamasi kemerdekaan"],
  ["Analisis Permintaan dan Penawaran", "Jawab soal analisis kurva permintaan dan penawaran"],
  ["Peta Persebaran Gunung Berapi", "Gambar dan beri keterangan peta persebaran gunung berapi di Indonesia"],
  ["Studi Kasus Sosial", "Analisis studi kasus interaksi sosial di lingkungan sekolah"],
  ["Praktik HTML Dasar", "Buat halaman web sederhana menggunakan HTML dan CSS"],
  ["Rangkuman Rukun Iman", "Buat rangkuman dan penjelasan singkat tentang rukun iman"],
  ["Uji Pemahaman Persamaan Kuadrat", "Kerjakan soal pemahaman persamaan kuadrat"],
  ["Karya Tulis Cerpen", "Tulis cerpen dengan tema persahabatan minimal 500 kata"],
  ["Latihan Reading Comprehension", "Baca teks bahasa Inggris dan jawab pertanyaan pemahaman"],
  ["Praktikum Optik", "Lakukan percobaan pembentukan bayangan pada lensa dan cermin"],
  ["Laporan Observasi Ekosistem", "Buat laporan observasi ekosistem di sekitar lingkungan"],
  ["Tugas Peta Konsep Peradaban", "Buat peta konsep perkembangan peradaban kuno"],
  ["Kasus Pendapatan Nasional", "Hitung dan analisis pendapatan nasional dari data yang diberikan"],
  ["Soal Dinamika Rotasi", "Kerjakan soal tentang torsi dan momen inersia"],
];

export const mockAssignments: Assignment[] = TASK_DEFS.map(
  ([title, description], index) => {
    const deadlineOffset = -6 + index * 2;
    return {
      id: `T-${String(index + 1).padStart(3, "0")}`,
      title,
      subject: TASK_SUBJECTS[index % TASK_SUBJECTS.length],
      description,
      className: STUDENT_CLASSES[index % STUDENT_CLASSES.length],
      teacherId: mockUsers.filter((u) => u.role === "admin")[index % 10].uid,
      deadline: daysFromNow(deadlineOffset),
      attachment: index % 3 === 0 ? `lampiran-tugas-${index + 1}.pdf` : undefined,
      status: deadlineOffset < 0 ? "closed" : "open",
      createdAt: daysFromNow(deadlineOffset - 8),
    };
  }
);

export const mockSubmissions: Submission[] = [];

for (let a = 0; a < mockAssignments.length; a++) {
  const assignment = mockAssignments[a];
  const classStudents = mockUsers.filter(
    (u) => u.role === "student" && u.className === assignment.className
  );
  const deadline = new Date(assignment.deadline);
  for (let si = 0; si < classStudents.length; si++) {
    const student = classStudents[si];
    const bucket = (si * 3 + a * 7) % 10;
    const base = `T-${String(a + 1).padStart(3, "0")}-S${student.uid.slice(-2)}`;
    if (bucket <= 5) {
      const submittedAt = new Date(deadline.getTime() - (2 + (si % 3)) * 24 * 60 * 60 * 1000);
      mockSubmissions.push({
        id: `${base}-D`,
        assignmentId: assignment.id,
        studentId: student.uid,
        fileName: `tugas-${a + 1}-${student.nis}.pdf`,
        notes: bucket % 2 === 0 ? "Mohon periksa tugas saya, terima kasih." : undefined,
        submittedAt: submittedAt.toISOString(),
        status: "submitted",
        updatedAt: submittedAt.toISOString(),
      });
    } else if (bucket === 6) {
      const submittedAt = new Date(deadline.getTime() + (1 + (si % 2)) * 24 * 60 * 60 * 1000);
      mockSubmissions.push({
        id: `${base}-L`,
        assignmentId: assignment.id,
        studentId: student.uid,
        fileName: `tugas-terlambat-${a + 1}-${student.nis}.pdf`,
        submittedAt: submittedAt.toISOString(),
        status: "submitted",
        updatedAt: submittedAt.toISOString(),
      });
    } else if (bucket === 7) {
      mockSubmissions.push({
        id: `${base}-Draft`,
        assignmentId: assignment.id,
        studentId: student.uid,
        fileName: `draft-${a + 1}-${student.nis}.docx`,
        status: "draft",
        updatedAt: daysFromNow(-(2 + si)),
      });
    }
  }
}

/* ===================== Absensi (Attendance) ===================== */

const ADMIN_UIDS = mockUsers.filter((u) => u.role === "admin").map((u) => u.uid);

const ATTENDANCE_SUBJECT_IDS = Array.from({ length: 12 }, (_, i) => `subj-${i + 1}`);

function attTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isWeekend(offset: number): boolean {
  const day = new Date(Date.now() + offset * DAY).getDay();
  return day === 0 || day === 6;
}

export const mockAttendanceSessions: AttendanceSession[] = [];
export const mockAttendanceRecords: AttendanceRecord[] = [];

let attendanceSeq = 0;

for (let offset = 90; offset >= 0; offset--) {
  if (isWeekend(offset)) continue;
  for (let c = 0; c < STUDENT_CLASSES.length; c++) {
    attendanceSeq += 1;
    const id = `AB-${String(attendanceSeq).padStart(3, "0")}`;
    const isToday = offset === 0;
    const subjectId =
      ATTENDANCE_SUBJECT_IDS[(c * 3 + offset) % ATTENDANCE_SUBJECT_IDS.length];
    mockAttendanceSessions.push({
      id,
      date: daysFromNow(-offset),
      className: STUDENT_CLASSES[c],
      teacherId: ADMIN_UIDS[(c + offset) % ADMIN_UIDS.length],
      status: isToday ? "open" : "closed",
      createdAt: daysFromNow(-offset),
      startTime: "07:00",
      endTime: isToday ? "08:00" : "07:30",
      subjectId,
    });

    const classStudents = mockUsers.filter(
      (u) => u.role === "student" && u.className === STUDENT_CLASSES[c]
    );
    for (let si = 0; si < classStudents.length; si++) {
      const student = classStudents[si];
      if (isToday) {
        const marked = student.uid !== "u-s01" && si % 3 === 0;
        mockAttendanceRecords.push({
          id: `AR-${id}-${student.uid}`,
          sessionId: id,
          studentId: student.uid,
          status: marked ? "present" : "absent",
          checkIn: marked ? attTime(390 + ((si * 7 + offset) % 25)) : undefined,
          markedBy: marked ? ADMIN_UIDS[(c + offset) % ADMIN_UIDS.length] : undefined,
          createdAt: daysFromNow(0),
        });
        continue;
      }

      const isDemo = student.uid === "u-s01";
      const bucket = (si * 7 + c * 5 + offset * 3) % 100;
      const lateThreshold = isDemo ? 92 : 88;
      const permissionThreshold = isDemo ? 95 : 92;
      const sickThreshold = isDemo ? 98 : 96;
      const status =
        bucket < lateThreshold
          ? "present"
          : bucket < permissionThreshold
            ? "late"
            : bucket < sickThreshold
              ? "permission"
              : bucket < 99
                ? "sick"
                : "absent";

      const isPresent = status === "present" || status === "late";
      const checkIn =
        status === "present"
          ? attTime(400 + ((si * 7 + offset * 3) % 35))
          : status === "late"
            ? attTime(455 + ((si * 5 + offset) % 25))
            : undefined;
      const checkOut = isPresent
        ? attTime(780 + ((si * 11 + offset * 2) % 120))
        : undefined;
      const teacherNote =
        status === "present" && (si + offset) % 9 === 0
          ? "Aktif mengikuti pembelajaran."
          : status === "late"
            ? "Terlambat masuk, diminta menjaga waktu."
            : status === "permission"
              ? "Membawa surat izin dari orang tua."
              : status === "sick"
                ? "Sakit, surat dokter menyusul."
                : undefined;

      mockAttendanceRecords.push({
        id: `AR-${id}-${student.uid}`,
        sessionId: id,
        studentId: student.uid,
        status,
        note:
          status === "permission"
            ? "Ada keperluan keluarga"
            : status === "sick"
              ? "Izin sakit"
              : undefined,
        checkIn,
        checkOut,
        teacherNote,
        markedBy: ADMIN_UIDS[(c + offset) % ADMIN_UIDS.length],
        createdAt: daysFromNow(-offset),
      });
    }
  }
}
