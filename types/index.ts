export type Role = "superadmin" | "admin" | "student";

export type UserStatus = "active" | "inactive";

export type LoanStatus = "borrowed" | "returned" | "overdue";

export type FineStatus = "unpaid" | "paid";

export type BookStatus = "available" | "borrowed" | "unavailable";

export type ActivityType =
  | "loan"
  | "return"
  | "fine"
  | "user"
  | "book"
  | "assignment"
  | "attendance"
  | "system";

export type AssignmentStatus = "open" | "closed";

export type SubmissionStatus = "draft" | "submitted";

/** Status tugas dilihat dari sisi siswa. */
export type StudentTaskState =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "late";

/** Status pengumpulan dilihat dari sisi guru. */
export type CollectionStatus = "submitted" | "late" | "not_collected";

export type AttendanceStatus =
  | "present"
  | "permission"
  | "sick"
  | "absent"
  | "late";

export type AttendanceSessionStatus = "open" | "closed";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: Role;
  nis?: string;
  className?: string;
  phone?: string;
  address?: string;
  bio?: string;
  gender?: string;
  birthDate?: string;
  photoUrl?: string;
  emailVerified?: boolean;
  status: UserStatus;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  bookCount: number;
  color: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  categoryId: string;
  publisher: string;
  year: number;
  totalCopies: number;
  availableCopies: number;
  cover?: string;
  status: BookStatus;
}

export interface Loan {
  id: string;
  bookId: string;
  studentId: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  status: LoanStatus;
  fineAmount?: number;
}

export interface Fine {
  id: string;
  loanId: string;
  studentId: string;
  amount: number;
  status: FineStatus;
  issuedAt: string;
  paidAt?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  user: string;
  timestamp: string;
}

export interface StatCard {
  label: string;
  value: number;
  change: string;
  trend: "up" | "down" | "flat";
}

export interface ChartDatum {
  label: string;
  loans: number;
  returns: number;
}

export interface BookRecord extends Book {
  categoryName: string;
  categoryColor: string;
}

export interface LoanRecord extends Loan {
  bookTitle: string;
  bookAuthor?: string;
  studentName: string;
  className?: string;
}

export interface FineRecord extends Fine {
  studentName: string;
  bookTitle: string;
}

export interface CategoryDatum {
  name: string;
  count: number;
}

export interface DashboardStats {
  totalBooks: number;
  totalStudents: number;
  totalAdmins: number;
  borrowedBooks: number;
  availableBooks: number;
  totalFines: number;
  unpaidFines: number;
  activeLoans: number;
  overdueLoans: number;
}

export interface StudentDashboardData {
  activeLoans: LoanRecord[];
  totalLoans: number;
  overdueCount: number;
  finesTotal: number;
  recentLoans: LoanRecord[];
  upcomingDue: LoanRecord[];
}

export interface Settings {
  libraryName: string;
  libraryAddress: string;
  loanDurationDays: number;
  finePerDay: number;
  maxLoansPerStudent: number;
  openHour: string;
  closeHour: string;
}

export const DEFAULT_SETTINGS: Settings = {
  libraryName: "SchoolHub",
  libraryAddress: "Jl. Pendidikan No. 1, Jakarta",
  loanDurationDays: 7,
  finePerDay: 1000,
  maxLoansPerStudent: 3,
  openHour: "08:00",
  closeHour: "16:00",
};

/* ===================== Tugas (Assignment) ===================== */

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  className: string;
  teacherId: string;
  deadline: string;
  attachment?: string;
  status: AssignmentStatus;
  createdAt: string;
}

export interface AssignmentRecord extends Assignment {
  teacherName: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileName?: string;
  notes?: string;
  submittedAt?: string;
  status: SubmissionStatus;
  /** Nilai dari guru (0-100). */
  grade?: number;
  /** Komentar guru terhadap pengumpulan. */
  gradeComment?: string;
  /** Waktu penilaian terakhir oleh guru. */
  gradedAt?: string;
  updatedAt: string;
}

/** Tugas beserta status pengumpulan dari sisi siswa. */
export interface StudentTaskView extends AssignmentRecord {
  submission?: Submission | null;
  taskState: StudentTaskState;
}

/** Baris pengumpulan dari sisi guru. */
export interface CollectionView {
  studentId: string;
  studentName: string;
  nis?: string;
  className?: string;
  submission?: Submission | null;
  status: CollectionStatus;
}

export interface SubmissionChartDatum {
  label: string;
  submitted: number;
  notCollected: number;
}

/* ===================== Absensi (Attendance) ===================== */

export interface AttendanceSession {
  id: string;
  date: string;
  className: string;
  teacherId: string;
  status: AttendanceSessionStatus;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  subjectId?: string;
}

export interface AttendanceSessionRecord extends AttendanceSession {
  teacherName: string;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  permissionCount: number;
  sickCount: number;
  absentCount: number;
  subjectName?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  note?: string;
  checkIn?: string;
  checkOut?: string;
  teacherNote?: string;
  markedBy?: string;
  createdAt: string;
}

export interface AttendanceRecordView extends AttendanceRecord {
  studentName: string;
  nis?: string;
  className?: string;
}

export interface AttendanceRecapRow {
  className: string;
  sessions: number;
  present: number;
  late: number;
  permission: number;
  sick: number;
  absent: number;
  total: number;
  attendanceRate: number;
}

export interface StudentAttendanceSummary {
  records: StudentAttendanceRecord[];
  totalSessions: number;
  present: number;
  late: number;
  permission: number;
  sick: number;
  absent: number;
  percentage: number;
}

/** Riwayat absensi dilihat dari sisi siswa. */
export interface StudentAttendanceRecord extends AttendanceRecordView {
  sessionDate: string;
  sessionClassName: string;
}

/** Status absensi + metadata waktu untuk kalender/heatmap siswa. */
export interface StudentAttendanceDay {
  date: string;
  status: AttendanceStatus | null;
  checkIn?: string;
  checkOut?: string;
  className?: string;
  teacherName?: string;
  note?: string;
}

export interface AttendanceChartDatum {
  label: string;
  present: number;
  late: number;
  permission: number;
  sick: number;
  absent: number;
}

export interface AttendanceAchievementView {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  unlocked: boolean;
  progress: number;
  goal: number;
}

export interface AttendanceInsight {
  tone: "good" | "warn" | "bad";
  title: string;
  message: string;
}

export interface AdminAttendanceSummary {
  totalStudents: number;
  present: number;
  late: number;
  permission: number;
  sick: number;
  absent: number;
  notMarked: number;
  percentage: number;
  todaySessionCount: number;
}

export interface SubjectAttendanceStat {
  subjectId?: string;
  subjectName: string;
  sessions: number;
  present: number;
  late: number;
  permission: number;
  sick: number;
  absent: number;
  attendanceRate: number;
}

export interface AttendanceTopRow {
  className: string;
  attendanceRate: number;
  present: number;
  total: number;
}

export interface AttendanceStudentRow {
  uid: string;
  name: string;
  className?: string;
  attendanceRate: number;
  present: number;
  late: number;
  total: number;
}

export interface SuperAdminAttendanceAnalytics {
  totalStudents: number;
  totalTeachers: number;
  totalSessions: number;
  totalRecords: number;
  present: number;
  late: number;
  permission: number;
  sick: number;
  absent: number;
  attendanceRate: number;
  bestClasses: AttendanceTopRow[];
  worstClasses: AttendanceTopRow[];
  bestStudents: AttendanceStudentRow[];
  worstStudents: AttendanceStudentRow[];
}

/* ===================== Statistik tambahan ===================== */

export interface StudentTaskSummary {
  totalAssignments: number;
  completed: number;
  pending: number;
  dueToday: number;
  recent: StudentTaskView[];
}

export interface AdminTeachingStats {
  totalStudents: number;
  totalAssignments: number;
  submittedCount: number;
  notSubmittedCount: number;
  attendanceTodayPresent: number;
  attendanceTodayTotal: number;
  submissionChart: SubmissionChartDatum[];
  attendanceChart: { label: string; present: number; absent: number }[];
}

/* ===================== Akademik (Academic) ===================== */

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  teacherId: string;
  gradeLevel: string;
  createdAt: string;
}

export interface SubjectRecord extends Subject {
  teacherName: string;
  scheduleCount: number;
  materialCount: number;
}

export interface ScheduleEntry {
  id: string;
  subjectId: string;
  teacherId: string;
  className: string;
  /** 0 = Senin, 1 = Selasa, …, 6 = Minggu */
  day: number;
  startTime: string;
  endTime: string;
  room: string;
}

export interface ScheduleEntryRecord extends ScheduleEntry {
  subjectName: string;
  teacherName: string;
  color: string;
}

export type AcademicEventType =
  | "deadline"
  | "exam"
  | "holiday"
  | "event"
  | "announcement";

export interface AcademicEvent {
  id: string;
  title: string;
  type: AcademicEventType;
  date: string;
  description?: string;
  className?: string;
  startTime?: string;
  endTime?: string;
}

export interface ExamSchedule {
  id: string;
  title: string;
  subjectId: string;
  className: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  description?: string;
}

export interface ExamScheduleRecord extends ExamSchedule {
  subjectName: string;
  color: string;
}

export type GradeType = "tugas" | "uts" | "uas" | "quiz";

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  type: GradeType;
  score: number;
  comment?: string;
  gradedAt: string;
}

export interface GradeRecord extends Grade {
  studentName: string;
  className: string;
  subjectName: string;
  teacherName: string;
}

export interface SubjectGradeSummary {
  subjectId: string;
  subjectName: string;
  color: string;
  scores: GradeRecord[];
  average: number;
  predicate: string;
}

export interface StudentGradeSummary {
  totalGrades: number;
  average: number;
  predicate: string;
  status: "lulus" | "belum";
  perSubject: SubjectGradeSummary[];
}

export interface GradeHeatDatum {
  label: string;
  value: number;
}

/* ===================== Bank Soal & Quiz ===================== */

export type QuestionType = "multiple_choice" | "essay" | "true_false";

export type QuestionDifficulty = "mudah" | "sedang" | "sulit";

export interface BankQuestion {
  id: string;
  type: QuestionType;
  subjectId: string;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: QuestionDifficulty;
  points: number;
  createdAt: string;
}

export interface BankQuestionRecord extends BankQuestion {
  subjectName: string;
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  className: string;
  teacherId: string;
  questions: QuizQuestion[];
  timeLimitMinutes: number;
  dueAt?: string;
  createdAt: string;
}

export interface QuizRecord extends Quiz {
  subjectName: string;
  teacherName: string;
  questionCount: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, string>;
  score: number;
  maxScore: number;
  startedAt: string;
  submittedAt: string;
}

export interface QuizAttemptRecord extends QuizAttempt {
  quizTitle: string;
  quizSubject: string;
  studentName: string;
  percentage: number;
}

export interface QuizStudentView extends QuizRecord {
  attempt?: QuizAttempt | null;
}

/* ===================== Rubrik ===================== */

export interface RubricCriterion {
  id: string;
  label: string;
  maxScore: number;
}

export interface Rubric {
  id: string;
  title: string;
  description?: string;
  criteria: RubricCriterion[];
  createdAt: string;
}

/* ===================== Materi Pembelajaran ===================== */

export type MaterialType = "pdf" | "ppt" | "doc" | "video" | "link";

export interface Material {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  teacherId: string;
  type: MaterialType;
  fileName?: string;
  url?: string;
  sizeKb?: number;
  createdAt: string;
}

export interface MaterialRecord extends Material {
  subjectName: string;
  teacherName: string;
  color: string;
}

/* ===================== Forum Diskusi ===================== */

export interface ForumThread {
  id: string;
  assignmentId: string;
  title: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ForumThreadRecord extends ForumThread {
  assignmentTitle: string;
  postCount: number;
  lastPostAt?: string;
}

/* ===================== Pengumuman ===================== */

export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  priority: AnnouncementPriority;
  attachment?: string;
  pinned: boolean;
  createdAt: string;
}

export interface AnnouncementRecord extends Announcement {
  authorName: string;
}

/* ===================== Notifikasi ===================== */

export type NotificationType =
  | "assignment"
  | "deadline"
  | "grade"
  | "announcement"
  | "book_due"
  | "quiz"
  | "material"
  | "system"
  | "attendance";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

/* ===================== Gamifikasi ===================== */

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
}

export interface UserAchievement {
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface XpLog {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface LeaderboardRow {
  userId: string;
  name: string;
  role: Role;
  className?: string;
  xp: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActive: string;
}

/* ===================== Fitur Siswa ===================== */

export interface TaskBookmark {
  id: string;
  studentId: string;
  assignmentId: string;
  createdAt: string;
}

export interface StudyNote {
  id: string;
  studentId: string;
  title: string;
  content: string;
  color: string;
  updatedAt: string;
}

export interface StudyTarget {
  id: string;
  studentId: string;
  title: string;
  goal: number;
  progress: number;
  unit: string;
  deadline?: string;
  done: boolean;
  createdAt: string;
}

export interface StudentLearningStats {
  totalAssignments: number;
  submittedCount: number;
  onTimeCount: number;
  totalQuizzes: number;
  quizTakenCount: number;
  avgQuizScore: number;
  attendanceRate: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
}

/* ===================== Perpustakaan Tambahan ===================== */

export interface BookRating {
  id: string;
  bookId: string;
  userId: string;
  rating: number;
  createdAt: string;
}

export interface BookWishlistItem {
  id: string;
  bookId: string;
  userId: string;
  createdAt: string;
}

export interface BookRecordExtra extends Book {
  categoryName: string;
  rating: number;
  ratingCount: number;
  favorite: boolean;
  wishlisted: boolean;
  loanCount: number;
}

export interface BookRecommendation extends BookRecordExtra {
  reason: string;
}

/* ===================== Audit Log & Analytics ===================== */

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

/* ===================== Akun & Keamanan ===================== */

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  browser: string;
  device: string;
  status: "success" | "failed";
}

export interface PasswordStrength {
  score: number;
  label: "Weak" | "Medium" | "Strong";
  requirements: { hasMin: boolean; hasUpper: boolean; hasLower: boolean; hasNumber: boolean };
}

export interface SuperAdminAnalytics {
  totalUsers: number;
  totalStudents: number;
  totalAdmins: number;
  totalBooks: number;
  borrowedBooks: number;
  activeAssignments: number;
  attendanceToday: { present: number; total: number };
  activeToday: number;
  userGrowth: { label: string; users: number }[];
  loanTrend: ChartDatum[];
  submissionRate: number;
  quizRate: number;
  popularBooks: BookRecordExtra[];
}

/* ===================== Chat antar User ===================== */

export type MessageStatus = "sending" | "sent" | "delivered" | "read";

export interface ChatAttachment {
  type: "image" | "document" | "file";
  name: string;
  url?: string;
  sizeKb?: number;
  mime?: string;
}

/**
 * Satu pesan chat. `deletedFor` berisi uid yang telah menghapus pesan ini
 * hanya untuk dirinya sendiri (soft delete) — data asli tidak pernah hilang.
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  status: MessageStatus;
  /** Waktu pesan dibaca oleh penerima; null selama belum dibaca. */
  readAt: string | null;
  /** Waktu pesan sampai ke perangkat penerima; null selama belum terkirim. */
  deliveredAt: string | null;
  /** Pesan yang sedang di-reply (opsional). */
  replyToId?: string | null;
  /** Soft delete: uid yang menyembunyikan pesan ini dari tampilannya. */
  deletedFor?: string[];
  /** Struktur lampiran (gambar/dokumen/file) untuk kebutuhan masa depan. */
  attachment?: ChatAttachment | null;
}

/**
 * Satu percakapan antara tepat dua user. Id bersifat deterministik dari
 * pasangan uid (urutan di-sort) sehingga percakapan tidak dibuat dua kali.
 */
export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: string;
  createdAt: string;
  updatedAt: string;
  /** Soft delete: uid yang menyembunyikan percakapan dari daftarnya. */
  deletedFor?: string[];
}

/** Ringkasan satu percakapan untuk daftar chat (dilihat dari satu user). */
export interface ConversationSummary {
  conversationId: string;
  userId: string;
  name: string;
  role: Role;
  className?: string;
  photoUrl?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageFromMe: boolean;
  unreadCount: number;
}

/** Hasil pencarian isi pesan lama bagi user tertentu. */
export interface ChatSearchResult {
  conversationId: string;
  messageId: string;
  message: string;
  createdAt: string;
  senderName: string;
  peerName: string;
  peerId: string;
}

/* ===================== Pencarian ===================== */

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchResultGroup {
  category: string;
  icon: string;
  items: SearchResultItem[];
}
