import type {
  AdminTeachingStats,
  CategoryDatum,
  ChartDatum,
  DashboardStats,
  StudentDashboardData,
  StudentTaskSummary,
} from "@/types";
import { dbBooks, dbFines, dbLoans, dbUsers, delay } from "./store";
import { getActivities } from "./activity-service";
import { getStudentLoans } from "./loan-service";
import {
  countCollection,
  getAssignments,
  getStudentTaskViews,
} from "./assignment-service";
import { getTodayAttendance } from "./attendance-service";
import { getStudents } from "./user-service";

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(400);
  const activeLoans = dbLoans.filter(
    (l) => l.status === "borrowed" || l.status === "overdue"
  );
  const totalFines = dbFines.reduce((sum, f) => sum + f.amount, 0);
  const unpaidFines = dbFines
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + f.amount, 0);
  return {
    totalBooks: dbBooks.length,
    totalStudents: dbUsers.filter((u) => u.role === "student").length,
    totalAdmins: dbUsers.filter((u) => u.role === "admin").length,
    borrowedBooks: activeLoans.length,
    availableBooks: dbBooks.reduce((sum, b) => sum + b.availableCopies, 0),
    totalFines,
    unpaidFines,
    activeLoans: activeLoans.length,
    overdueLoans: activeLoans.filter((l) => l.status === "overdue").length,
  };
}

export async function getLoanChartData(): Promise<ChartDatum[]> {
  await delay(300);
  const now = new Date();
  const result: ChartDatum[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(
      start
    );
    const loans = dbLoans.filter((l) => {
      const t = new Date(l.borrowedAt);
      return t >= start && t < end;
    }).length;
    const returns = dbLoans.filter((l) => {
      if (!l.returnedAt) return false;
      const t = new Date(l.returnedAt);
      return t >= start && t < end;
    }).length;
    result.push({ label, loans, returns });
  }
  return result;
}

export async function getCategoryDistribution(): Promise<CategoryDatum[]> {
  await delay(300);
  const grouped = new Map<string, number>();
  for (const book of dbBooks) {
    grouped.set(book.categoryId, (grouped.get(book.categoryId) ?? 0) + 1);
  }
  const { getCategories } = await import("./category-service");
  const categories = await getCategories();
  return categories.map((c) => ({
    name: c.name,
    count: grouped.get(c.id) ?? 0,
  }));
}

export async function getStudentDashboard(
  studentId: string
): Promise<StudentDashboardData> {
  await delay(400);
  const loans = await getStudentLoans(studentId);
  const activeLoans = loans.filter(
    (l) => l.status === "borrowed" || l.status === "overdue"
  );
  const overdueLoans = loans.filter((l) => l.status === "overdue");
  const fines = dbFines
    .filter((f) => f.studentId === studentId && f.status === "unpaid")
    .reduce((sum, f) => sum + f.amount, 0);
  return {
    activeLoans,
    totalLoans: loans.length,
    overdueCount: overdueLoans.length,
    finesTotal: fines,
    recentLoans: loans.slice(0, 5),
    upcomingDue: activeLoans.sort(
      (a, b) => a.dueAt.localeCompare(b.dueAt)
    ),
  };
}

export async function getRecentActivities(limit = 8) {
  return getActivities(limit);
}

export async function getAdminTeachingStats(
  teacherId?: string
): Promise<AdminTeachingStats> {
  await delay(350);
  const assignments = await getAssignments(teacherId);
  const students = await getStudents();

  let submittedCount = 0;
  let notSubmittedCount = 0;
  for (const assignment of assignments) {
    const { collected, notCollected } = countCollection(assignment);
    submittedCount += collected;
    notSubmittedCount += notCollected;
  }

  const [today, submissionChart, attendanceChart] = await Promise.all([
    getTodayAttendance(),
    (await import("./assignment-service")).getAssignmentSubmissionChart(6),
    (await import("./attendance-service")).getAttendanceChart(6),
  ]);

  return {
    totalStudents: students.length,
    totalAssignments: assignments.length,
    submittedCount,
    notSubmittedCount,
    attendanceTodayPresent: today.present,
    attendanceTodayTotal: today.total,
    submissionChart,
    attendanceChart,
  };
}

export async function getStudentTaskSummary(
  studentId: string
): Promise<StudentTaskSummary> {
  await delay(350);
  const tasks = await getStudentTaskViews(studentId);
  const completed = tasks.filter((t) => t.taskState === "submitted").length;
  const pending = tasks.filter((t) =>
    ["not_started", "in_progress", "late"].includes(t.taskState)
  ).length;
  const today = new Date().toDateString();
  const dueToday = tasks.filter((t) => {
    const deadline = new Date(t.deadline);
    return (
      t.taskState !== "submitted" &&
      deadline.toDateString() === today &&
      deadline.getTime() >= Date.now()
    );
  }).length;
  return {
    totalAssignments: tasks.length,
    completed,
    pending,
    dueToday,
    recent: tasks.slice(0, 5),
  };
}
