/**
 * Integration test antar role "SchoolHub".
 * Menjalankan simulasi alur nyata terhadap satu sumber data (services/store).
 *
 * Jalankan: npx tsx scripts/integration-test.ts
 */
import {
  dbAssignments,
  dbAttendanceRecords,
  dbAttendanceSessions,
  dbBooks,
  dbCategories,
  dbFines,
  dbLoans,
  dbSubmissions,
  dbUsers,
} from "../services/store";
import {
  createAssignment,
  getStudentTaskViews,
  getCollection,
  saveSubmission,
  gradeSubmission,
} from "../services/assignment-service";
import {
  createAttendanceSession,
  getStudentAttendance,
  getTodayAttendance,
  setStudentStatus,
  getAttendanceRecap,
} from "../services/attendance-service";
import {
  getAdminTeachingStats,
  getDashboardStats,
  getStudentTaskSummary,
} from "../services/dashboard-service";
import { getCategories } from "../services/category-service";
import { getFines } from "../services/fine-service";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(name: string) {
  passed++;
  console.log(`  PASS  ${name}`);
}

function fail(name: string, detail?: string) {
  failed++;
  failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
  console.log(`  FAIL  ${name}${detail ? ` (${detail})` : ""}`);
}

function expect(cond: boolean, name: string, detail?: string) {
  if (cond) ok(name);
  else fail(name, detail);
}

const todayMidday = (() => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString();
})();

async function main() {
  console.log("=== 1. Integritas data awal (semua dummy saling terhubung) ===");

  const admins = dbUsers.filter((u) => u.role === "admin");
  const students = dbUsers.filter((u) => u.role === "student");
  const supers = dbUsers.filter((u) => u.role === "superadmin");
  expect(admins.length === 10, "Ada 10 Admin/Guru", `got ${admins.length}`);
  expect(students.length === 50, "Ada 50 Siswa", `got ${students.length}`);
  expect(supers.length === 1, "Ada 1 Super Admin");

  const studentIds = new Set(students.map((s) => s.uid));
  const bookIds = new Set(dbBooks.map((b) => b.id));
  const adminIds = new Set(admins.map((a) => a.uid));

  // Loans -> books & students
  const badLoans = dbLoans.filter(
    (l) => !bookIds.has(l.bookId) || !studentIds.has(l.studentId)
  );
  expect(badLoans.length === 0, "Semua peminjaman mengacu ke buku & siswa nyata");

  // Fines -> loans & students
  const badFines = dbFines.filter(
    (f) =>
      !studentIds.has(f.studentId) ||
      !dbLoans.some((l) => l.id === f.loanId)
  );
  expect(badFines.length === 0, "Semua denda mengacu ke peminjaman & siswa nyata");

  // Setiap peminjaman dengan fineAmount harus punya record denda
  const loanIds = new Set(dbLoans.map((l) => l.id));
  const fineLoanIds = new Set(dbFines.map((f) => f.loanId));
  const loansWithoutFine = dbLoans.filter(
    (l) => l.fineAmount !== undefined && !fineLoanIds.has(l.id)
  );
  expect(
    loansWithoutFine.length === 0,
    "Setiap peminjaman ber-denda punya record denda",
    loansWithoutFine.map((l) => l.id).join(",")
  );
  const finesOnCleanLoans = dbFines.filter(
    (f) => !dbLoans.some((l) => l.id === f.loanId)
  );
  expect(finesOnCleanLoans.length === 0, "Tidak ada denda tanpa peminjaman");
  void loanIds;

  // Assignments -> teachers & class with students
  const badAssignments = dbAssignments.filter(
    (a) => !adminIds.has(a.teacherId)
  );
  expect(
    badAssignments.length === 0,
    "Semua tugas mengacu ke Admin/Guru nyata"
  );
  const classSizes = new Map<string, number>();
  for (const s of students) {
    classSizes.set(s.className ?? "", (classSizes.get(s.className ?? "") ?? 0) + 1);
  }
  const emptyClassAssignments = dbAssignments.filter(
    (a) => (classSizes.get(a.className) ?? 0) === 0
  );
  expect(
    emptyClassAssignments.length === 0,
    "Semua tugas mengacu ke kelas yang punya siswa"
  );

  // Submissions -> assignments & students of the class
  let badSubmissions = 0;
  for (const sub of dbSubmissions) {
    const assignment = dbAssignments.find((a) => a.id === sub.assignmentId);
    if (!assignment) {
      badSubmissions++;
      continue;
    }
    const inClass = students.some(
      (s) => s.uid === sub.studentId && s.className === assignment.className
    );
    if (!inClass) badSubmissions++;
  }
  expect(
    badSubmissions === 0,
    "Semua pengumpulan mengacu ke tugas & siswa di kelasnya"
  );

  // Attendance sessions -> teachers & class with students
  const badSessions = dbAttendanceSessions.filter(
    (s) => !adminIds.has(s.teacherId)
  );
  expect(badSessions.length === 0, "Semua sesi absensi mengacu ke guru nyata");
  const emptyClassSessions = dbAttendanceSessions.filter(
    (s) => (classSizes.get(s.className) ?? 0) === 0
  );
  expect(
    emptyClassSessions.length === 0,
    "Semua sesi absensi mengacu ke kelas yang punya siswa"
  );

  // Attendance records -> sessions & students of the class
  let badRecords = 0;
  for (const rec of dbAttendanceRecords) {
    const session = dbAttendanceSessions.find((s) => s.id === rec.sessionId);
    if (!session) {
      badRecords++;
      continue;
    }
    const inClass = students.some(
      (s) => s.uid === rec.studentId && s.className === session.className
    );
    if (!inClass) badRecords++;
  }
  expect(badRecords === 0, "Semua catatan absensi konsisten dengan sesi & kelas");

  // Book availability = single source dari loans aktif
  let availabilityMismatch = 0;
  const activeByBook = new Map<string, number>();
  for (const l of dbLoans) {
    if (l.status === "borrowed" || l.status === "overdue") {
      activeByBook.set(l.bookId, (activeByBook.get(l.bookId) ?? 0) + 1);
    }
  }
  for (const b of dbBooks) {
    const expectedAvailable = Math.max(0, b.totalCopies - (activeByBook.get(b.id) ?? 0));
    if (b.availableCopies !== expectedAvailable) availabilityMismatch++;
    const expectedStatus =
      b.totalCopies <= 0
        ? "unavailable"
        : expectedAvailable > 0
          ? "available"
          : "borrowed";
    if (b.status !== expectedStatus) availabilityMismatch++;
  }
  expect(
    availabilityMismatch === 0,
    "Stok & status buku konsisten dengan pinjaman aktif (single source)"
  );

  // Category bookCount sesuai jumlah buku nyata
  const catCounts = new Map<string, number>();
  for (const b of dbBooks) catCounts.set(b.categoryId, (catCounts.get(b.categoryId) ?? 0) + 1);
  let categoryMismatch = 0;
  for (const c of dbCategories) {
    if ((catCounts.get(c.id) ?? 0) !== c.bookCount) categoryMismatch++;
  }
  expect(
    categoryMismatch === 0,
    "bookCount kategori sesuai jumlah buku nyata"
  );

  // Dashboard stats dari data yang sama
  const stats = await getDashboardStats();
  expect(stats.totalStudents === 50, "Dashboard: total siswa 50");
  expect(stats.totalBooks === 25, "Dashboard: total buku 25");
  const activeLoanCount = dbLoans.filter(
    (l) => l.status === "borrowed" || l.status === "overdue"
  ).length;
  expect(
    stats.borrowedBooks === activeLoanCount,
    "Dashboard: jumlah buku dipinjam = pinjaman aktif",
    `stats=${stats.borrowedBooks} loans=${activeLoanCount}`
  );

  const cats = await getCategories();
  expect(
    cats.every((c) => c.bookCount === (catCounts.get(c.id) ?? 0)),
    "getCategories menghitung bookCount dinamis"
  );
  const fines = await getFines();
  expect(
    fines.every((f) => dbLoans.some((l) => l.id === f.loanId)),
    "getFines semua mengacu ke peminjaman nyata"
  );

  console.log("\n=== 2. Alur Tugas: Admin/Guru -> Siswa (Req 1) ===");

  const budi = admins[0];
  const alya = students.find((s) => s.uid === "u-s01")!; // XI IPA 1
  const bagas = students.find((s) => s.uid === "u-s02")!; // XI IPA 2

  const adminCountBefore = (await getAdminTeachingStats(budi.uid))
    .totalAssignments;

  const created = await createAssignment({
    title: "Tugas Uji Konektivitas",
    subject: "Matematika",
    description: "Tugas untuk memastikan konektivitas data antar role.",
    className: "XI IPA 1",
    teacherId: budi.uid,
    deadline: todayMidday,
  });

  const alyaTasks = await getStudentTaskViews(alya.uid);
  const alyaHasTask = alyaTasks.some((t) => t.id === created.id);
  expect(alyaHasTask, "Siswa di kelas XI IPA 1 melihat tugas baru");

  const bagasTasks = await getStudentTaskViews(bagas.uid);
  const bagasHasTask = bagasTasks.some((t) => t.id === created.id);
  expect(!bagasHasTask, "Siswa di kelas lain TIDAK melihat tugas tersebut");

  console.log("\n=== 3. Alur Tugas: Siswa kumpul -> Guru (Req 2 & 3) ===");
  const submitted = await saveSubmission({
    assignmentId: created.id,
    studentId: alya.uid,
    fileName: "uji-konektivitas-alya.pdf",
    notes: "Mohon diperiksa",
    submit: true,
  });
  expect(submitted.status === "submitted", "Siswa berhasil mengumpulkan tugas");

  const collection = await getCollection(created.id);
  const alyaRow = collection.find((c) => c.studentId === alya.uid);
  expect(
    alyaRow?.status === "submitted",
    "Guru melihat status Alya = Sudah Dikumpulkan",
    alyaRow?.status
  );
  const intanRow = collection.find((c) => c.studentId === "u-s09");
  expect(
    intanRow?.status === "not_collected",
    "Guru melihat siswa lain = Belum Mengumpulkan",
    intanRow?.status
  );
  expect(
    collection.length === classSizes.get("XI IPA 1"),
    "Guru melihat seluruh siswa di kelas (sudah & belum)",
    `rows=${collection.length} expected=${classSizes.get("XI IPA 1")}`
  );

  const statsAfterSubmit = await getAdminTeachingStats(budi.uid);
  expect(
    statsAfterSubmit.totalAssignments === adminCountBefore + 1,
    "Dashboard guru: total tugas bertambah 1"
  );
  expect(
    statsAfterSubmit.submittedCount >= 1,
    "Dashboard guru: jumlah sudah dikumpulkan naik"
  );

  console.log("\n=== 4. Alur Tugas: Guru nilai -> Siswa (Req 4 & 5) ===");

  const graded = await gradeSubmission({
    assignmentId: created.id,
    studentId: alya.uid,
    grade: 88,
    gradeComment: "Kerja bagus, rapi.",
  });
  expect(graded.grade === 88, "Guru menyimpan nilai 88");
  expect(graded.gradeComment === "Kerja bagus, rapi.", "Guru menyimpan komentar");

  const gradedCollection = await getCollection(created.id);
  const gradedRow = gradedCollection.find((c) => c.studentId === alya.uid);
  expect(
    gradedRow?.submission?.grade === 88,
    "Guru melihat nilai pada halaman pengumpulan"
  );

  const alyaAfterGrade = await getStudentTaskViews(alya.uid);
  const alyaTask = alyaAfterGrade.find((t) => t.id === created.id);
  expect(
    alyaTask?.submission?.grade === 88,
    "Siswa melihat nilai 88 di halaman Tugas Saya"
  );
  expect(
    alyaTask?.submission?.gradeComment === "Kerja bagus, rapi.",
    "Siswa melihat komentar guru"
  );

  const summary = await getStudentTaskSummary(alya.uid);
  expect(
    summary.completed >= 1,
    "Ringkasan tugas siswa menghitung tugas selesai"
  );

  console.log("\n=== 5. Alur Absensi: Guru buat -> Siswa (Req 6) ===");

  const newSession = await createAttendanceSession({
    date: todayMidday,
    className: "XI IPA 1",
    teacherId: budi.uid,
  });

  const alyaAttendance = await getStudentAttendance(alya.uid);
  expect(
    alyaAttendance.records.some(
      (r) =>
        r.sessionId === newSession.id &&
        r.sessionClassName === "XI IPA 1"
    ),
    "Siswa XI IPA 1 melihat sesi absensi baru"
  );
  expect(
    alyaAttendance.records.some((r) => r.sessionId === newSession.id && r.status === "absent"),
    "Status awal siswa = Alpha (belum diisi)"
  );

  const citraAttendance = await getStudentAttendance(
    students.find((s) => s.uid === "u-s03")!.uid
  );
  expect(
    !citraAttendance.records.some((r) => r.sessionId === newSession.id),
    "Siswa kelas lain TIDAK melihat sesi tersebut"
  );

  console.log("\n=== 6. Alur Absensi: ubah status -> Dashboard & Riwayat (Req 7) ===");

  const todayBefore = await getTodayAttendance();
  await setStudentStatus(newSession.id, alya.uid, "present");
  const todayAfter = await getTodayAttendance();
  expect(
    todayAfter.present === todayBefore.present + 1,
    "Dashboard kehadiran hari ini bertambah setelah Alya ditandai Hadir",
    `${todayBefore.present} -> ${todayAfter.present}`
  );

  const alyaAfterMark = await getStudentAttendance(alya.uid);
  const markedRecord = alyaAfterMark.records.find(
    (r) => r.sessionId === newSession.id
  );
  expect(
    markedRecord?.status === "present",
    "Riwayat siswa berubah menjadi Hadir"
  );
  expect(
    alyaAfterMark.present > 0 && alyaAfterMark.percentage > 0,
    "Persentase kehadiran siswa dihitung ulang"
  );

  const teacherStats = await getAdminTeachingStats(budi.uid);
  expect(
    teacherStats.attendanceTodayPresent >= todayBefore.present + 1,
    "Statistik guru: kehadiran hari ini bertambah"
  );

  const recap = await getAttendanceRecap();
  const xiIpa1Row = recap.find((r) => r.className === "XI IPA 1");
  expect(Boolean(xiIpa1Row), "Rekap kelas mencakup XI IPA 1");
  expect(
    (xiIpa1Row?.present ?? 0) >= 1,
    "Rekap: jumlah hadir XI IPA 1 bertambah"
  );

  console.log("\n=== RINGKASAN ===");
  console.log(`  Total: ${passed + failed}  PASS: ${passed}  FAIL: ${failed}`);
  if (failures.length > 0) {
    console.log("\n  Gagal:");
    for (const f of failures) console.log(`    - ${f}`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error("Test crash:", error);
  process.exit(1);
});
