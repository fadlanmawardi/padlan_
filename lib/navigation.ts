import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  FolderOpen,
  GraduationCap,
  HandCoins,
  History,
  LayoutDashboard,
  LibraryBig,
  ListTodo,
  Megaphone,
  MessagesSquare,
  NotebookPen,
  Presentation,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Tags,
  Target,
  Trophy,
  Undo2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_ITEMS: Record<Role, NavSection[]> = {
  superadmin: [
    {
      title: "Utama",
      items: [
        {
          title: "Dashboard",
          href: "/super-admin/dashboard",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: "Akademik",
      items: [
        {
          title: "Jadwal Pelajaran",
          href: "/super-admin/schedule",
          icon: CalendarDays,
        },
        {
          title: "Kalender Akademik",
          href: "/super-admin/academic-calendar",
          icon: CalendarRange,
        },
        {
          title: "Mata Pelajaran",
          href: "/super-admin/subjects",
          icon: BookOpen,
        },
        {
          title: "Jadwal Ujian",
          href: "/super-admin/exams",
          icon: ClipboardCheck,
        },
        { title: "Nilai", href: "/super-admin/grades", icon: BarChart3 },
        { title: "Rapor", href: "/super-admin/report-cards", icon: ScrollText },
      ],
    },
    {
      title: "Pengajaran",
      items: [
        { title: "Bank Soal", href: "/super-admin/bank-soal", icon: FileQuestion },
        { title: "Quiz Online", href: "/super-admin/quizzes", icon: ClipboardCheck },
        {
          title: "Rubrik Penilaian",
          href: "/super-admin/rubrics",
          icon: Presentation,
        },
        {
          title: "Materi Pembelajaran",
          href: "/super-admin/materials",
          icon: FolderOpen,
        },
        {
          title: "Forum Diskusi",
          href: "/super-admin/forums",
          icon: MessagesSquare,
        },
      ],
    },
    {
      title: "Manajemen",
      items: [
        {
          title: "Admin & Guru",
          href: "/super-admin/admin",
          icon: ShieldCheck,
        },
        { title: "Siswa", href: "/super-admin/students", icon: GraduationCap },
        { title: "Buku", href: "/super-admin/books", icon: LibraryBig },
        { title: "Kategori", href: "/super-admin/categories", icon: Tags },
        { title: "Tugas", href: "/super-admin/assignments", icon: ClipboardList },
        { title: "Absensi", href: "/super-admin/attendance", icon: CalendarCheck },
        {
          title: "Peminjaman",
          href: "/super-admin/loans",
          icon: ArrowLeftRight,
        },
        {
          title: "Pengembalian",
          href: "/super-admin/returns",
          icon: Undo2,
        },
        { title: "Denda", href: "/super-admin/fines", icon: HandCoins },
      ],
    },
    {
      title: "Komunitas",
      items: [
        { title: "Pengumuman", href: "/super-admin/announcements", icon: Megaphone },
        { title: "Notifikasi", href: "/super-admin/notifications", icon: Bell },
        { title: "Aktivitas", href: "/super-admin/activity", icon: Activity },
        { title: "Leaderboard", href: "/super-admin/leaderboard", icon: Trophy },
        { title: "Audit Log", href: "/super-admin/audit-log", icon: ScrollText },
      ],
    },
    {
      title: "Sistem",
      items: [
        { title: "Laporan", href: "/super-admin/reports", icon: BarChart3 },
        { title: "Pengaturan", href: "/super-admin/settings", icon: Settings },
        { title: "Profil", href: "/super-admin/profile", icon: UserRound },
      ],
    },
  ],
  admin: [
    {
      title: "Utama",
      items: [
        {
          title: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: "Akademik",
      items: [
        { title: "Jadwal Pelajaran", href: "/admin/schedule", icon: CalendarDays },
        {
          title: "Kalender Akademik",
          href: "/admin/academic-calendar",
          icon: CalendarRange,
        },
        { title: "Mata Pelajaran", href: "/admin/subjects", icon: BookOpen },
        { title: "Jadwal Ujian", href: "/admin/exams", icon: ClipboardCheck },
        { title: "Nilai", href: "/admin/grades", icon: BarChart3 },
        { title: "Rapor", href: "/admin/report-cards", icon: ScrollText },
      ],
    },
    {
      title: "Pengajaran",
      items: [
        { title: "Bank Soal", href: "/admin/bank-soal", icon: FileQuestion },
        { title: "Quiz Online", href: "/admin/quizzes", icon: ClipboardCheck },
        {
          title: "Rubrik Penilaian",
          href: "/admin/rubrics",
          icon: Presentation,
        },
        {
          title: "Materi Pembelajaran",
          href: "/admin/materials",
          icon: FolderOpen,
        },
        { title: "Forum Diskusi", href: "/admin/forums", icon: MessagesSquare },
      ],
    },
    {
      title: "Manajemen",
      items: [
        { title: "Siswa", href: "/admin/students", icon: GraduationCap },
        { title: "Tugas", href: "/admin/assignments", icon: ClipboardList },
        { title: "Absensi", href: "/admin/attendance", icon: CalendarCheck },
        { title: "Buku", href: "/admin/books", icon: LibraryBig },
        { title: "Kategori", href: "/admin/categories", icon: Tags },
        { title: "Peminjaman", href: "/admin/loans", icon: ArrowLeftRight },
        { title: "Pengembalian", href: "/admin/returns", icon: Undo2 },
        { title: "Denda", href: "/admin/fines", icon: HandCoins },
      ],
    },
    {
      title: "Komunitas",
      items: [
        { title: "Pengumuman", href: "/admin/announcements", icon: Megaphone },
        { title: "Notifikasi", href: "/admin/notifications", icon: Bell },
        { title: "Aktivitas", href: "/admin/activity", icon: Activity },
        { title: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
      ],
    },
    {
      title: "Sistem",
      items: [
        { title: "Laporan", href: "/admin/reports", icon: BarChart3 },
        { title: "Profil", href: "/admin/profile", icon: UserRound },
      ],
    },
  ],
  student: [
    {
      title: "Menu",
      items: [
        {
          title: "Dashboard",
          href: "/student/dashboard",
          icon: LayoutDashboard,
          exact: true,
        },
        { title: "Tugas", href: "/student/assignments", icon: ClipboardList },
        { title: "Jadwal Pelajaran", href: "/student/schedule", icon: CalendarDays },
        {
          title: "Kalender Akademik",
          href: "/student/academic-calendar",
          icon: CalendarRange,
        },
        { title: "Jadwal Ujian", href: "/student/exams", icon: ClipboardCheck },
        { title: "Nilai", href: "/student/grades", icon: BarChart3 },
        { title: "Rapor", href: "/student/report-cards", icon: ScrollText },
      ],
    },
    {
      title: "Pembelajaran",
      items: [
        { title: "Quiz Online", href: "/student/quizzes", icon: ClipboardCheck },
        {
          title: "Materi Pembelajaran",
          href: "/student/materials",
          icon: FolderOpen,
        },
        { title: "Forum Diskusi", href: "/student/forums", icon: MessagesSquare },
        { title: "Bookmark Tugas", href: "/student/bookmarks", icon: BookMarked },
        { title: "Catatan Belajar", href: "/student/study-notes", icon: NotebookPen },
        { title: "Target Belajar", href: "/student/targets", icon: Target },
      ],
    },
    {
      title: "Perpustakaan",
      items: [
        { title: "Buku", href: "/student/books", icon: Search },
        { title: "Buku Saya", href: "/student/my-books", icon: BookMarked },
        { title: "Wishlist Buku", href: "/student/wishlist", icon: Star },
      ],
    },
    {
      title: "Komunitas",
      items: [
        { title: "Pengumuman", href: "/student/announcements", icon: Megaphone },
        { title: "Notifikasi", href: "/student/notifications", icon: Bell },
        { title: "Aktivitas", href: "/student/activity", icon: Activity },
        { title: "Leaderboard", href: "/student/leaderboard", icon: Trophy },
        { title: "Achievement", href: "/student/achievements", icon: ListTodo },
      ],
    },
    {
      title: "Lainnya",
      items: [
        { title: "Absensi", href: "/student/attendance", icon: CalendarCheck },
        { title: "Riwayat", href: "/student/history", icon: History },
        { title: "Profil", href: "/student/profile", icon: UserRound },
      ],
    },
  ],
};

export function getPageTitle(role: Role, pathname: string): string {
  const sections = NAV_ITEMS[role];
  for (const section of sections) {
    const found = section.items.find(
      (item) => item.href === pathname || pathname.startsWith(item.href + "/")
    );
    if (found) return found.title;
  }
  return "SchoolHub";
}
