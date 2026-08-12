import type { Role, SearchResultGroup, SearchResultItem } from "@/types";
import {
  dbAnnouncements,
  dbAssignments,
  dbBooks,
  dbExamSchedules,
  dbGrades,
  dbQuizzes,
  dbScheduleEntries,
  dbSubjects,
  dbUsers,
  delay,
} from "./store";

const GROUP_ICONS: Record<string, string> = {
  Buku: "LibraryBig",
  "Mata Pelajaran": "BookOpen",
  "Guru & Admin": "Users",
  Siswa: "GraduationCap",
  Jadwal: "CalendarDays",
  Pengumuman: "Megaphone",
  Tugas: "ClipboardList",
  "Jadwal Ujian": "PenSquare",
  Quiz: "HelpCircle",
  Nilai: "BarChart3",
};

export interface SearchQuery {
  query: string;
  role: Role;
  userId?: string;
}

function matches(query: string, ...fields: (string | undefined)[]) {
  const q = query.toLowerCase();
  return fields.some((field) => (field ?? "").toLowerCase().includes(q));
}

export async function smartSearch(input: SearchQuery): Promise<SearchResultGroup[]> {
  await delay(250);
  const q = input.query.trim();
  if (q.length < 2) return [];
  const prefix = input.role === "student" ? "/student" : input.role === "superadmin" ? "/super-admin" : "/admin";
  const groups: SearchResultGroup[] = [];

  const books: SearchResultItem[] = dbBooks
    .filter((b) => matches(q, b.title, b.author, b.isbn))
    .slice(0, 5)
    .map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: `${b.author} · ${b.isbn}`,
      href: `${prefix}/books`,
    }));
  if (books.length) groups.push({ category: "Buku", icon: GROUP_ICONS.Buku, items: books });

  const subjects: SearchResultItem[] = dbSubjects
    .filter((s) => matches(q, s.name, s.code, s.description))
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      title: s.name,
      subtitle: s.code,
      href: `${prefix}/subjects`,
    }));
  if (subjects.length) groups.push({ category: "Mata Pelajaran", icon: GROUP_ICONS["Mata Pelajaran"], items: subjects });

  const teachers: SearchResultItem[] = dbUsers
    .filter((u) => u.role === "admin" && matches(q, u.name, u.email))
    .slice(0, 4)
    .map((u) => ({
      id: u.uid,
      title: u.name,
      subtitle: "Guru & Admin",
      href: `${prefix}/admin`,
    }));
  if (teachers.length && input.role !== "student") {
    groups.push({ category: "Guru & Admin", icon: GROUP_ICONS["Guru & Admin"], items: teachers });
  }

  const students: SearchResultItem[] = dbUsers
    .filter((u) => u.role === "student" && matches(q, u.name, u.nis ?? "", u.className ?? ""))
    .slice(0, 5)
    .map((u) => ({
      id: u.uid,
      title: u.name,
      subtitle: `${u.nis ?? "-"} · ${u.className ?? "-"}`,
      href: `${prefix}/students`,
    }));
  if (students.length && input.role !== "student") {
    groups.push({ category: "Siswa", icon: GROUP_ICONS.Siswa, items: students });
  }

  const scheduleHref =
    input.role === "student" ? `${prefix}/schedule` : `${prefix}/schedule`;
  const schedules: SearchResultItem[] = dbScheduleEntries
    .filter((s) => {
      const subject = dbSubjects.find((sub) => sub.id === s.subjectId);
      return matches(q, subject?.name ?? "", s.room, s.className);
    })
    .slice(0, 5)
    .map((s) => {
      const subject = dbSubjects.find((sub) => sub.id === s.subjectId);
      return {
        id: s.id,
        title: subject?.name ?? "Mata pelajaran",
        subtitle: `${s.className} · ${s.startTime}–${s.endTime} · ${s.room}`,
        href: scheduleHref,
      };
    });
  if (schedules.length) groups.push({ category: "Jadwal", icon: GROUP_ICONS.Jadwal, items: schedules });

  const announcements: SearchResultItem[] = dbAnnouncements
    .filter((a) => matches(q, a.title, a.content))
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: a.content.length > 60 ? `${a.content.slice(0, 60)}…` : a.content,
      href: `${prefix}/announcements`,
    }));
  if (announcements.length) groups.push({ category: "Pengumuman", icon: GROUP_ICONS.Pengumuman, items: announcements });

  const assignments: SearchResultItem[] = dbAssignments
    .filter((a) => matches(q, a.title, a.subject, a.description))
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      title: a.title,
      subtitle: `${a.subject} · ${a.className}`,
      href: `${prefix}/assignments`,
    }));
  if (assignments.length) groups.push({ category: "Tugas", icon: GROUP_ICONS.Tugas, items: assignments });

  const exams: SearchResultItem[] = dbExamSchedules
    .filter((e) => {
      const subject = dbSubjects.find((s) => s.id === e.subjectId);
      return matches(q, subject?.name ?? "", e.title, e.className);
    })
    .slice(0, 4)
    .map((e) => {
      const subject = dbSubjects.find((s) => s.id === e.subjectId);
      return {
        id: e.id,
        title: e.title,
        subtitle: `${subject?.name ?? "-"} · ${e.className} · ${e.room}`,
        href: `${prefix}/exams`,
      };
    });
  if (exams.length) groups.push({ category: "Jadwal Ujian", icon: GROUP_ICONS["Jadwal Ujian"], items: exams });

  const quizzes: SearchResultItem[] = dbQuizzes
    .filter((quiz) => {
      const subject = dbSubjects.find((s) => s.id === quiz.subjectId);
      return matches(q, quiz.title, subject?.name ?? "");
    })
    .slice(0, 4)
    .map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      subtitle: quiz.className,
      href: `${prefix}/quizzes`,
    }));
  if (quizzes.length) groups.push({ category: "Quiz", icon: GROUP_ICONS.Quiz, items: quizzes });

  if (input.role === "student" && input.userId) {
    const grades: SearchResultItem[] = dbGrades
      .filter((g) => {
        if (g.studentId !== input.userId) return false;
        const subject = dbSubjects.find((s) => s.id === g.subjectId);
        return matches(q, subject?.name ?? "", String(g.score));
      })
      .slice(0, 4)
      .map((g) => {
        const subject = dbSubjects.find((s) => s.id === g.subjectId);
        return {
          id: g.id,
          title: `${subject?.name ?? "Mata pelajaran"} — ${g.score}`,
          subtitle: `Nilai ${g.type}`,
          href: `${prefix}/grades`,
        };
      });
    if (grades.length) groups.push({ category: "Nilai", icon: GROUP_ICONS.Nilai, items: grades });
  }

  return groups;
}
