"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Megaphone,
  NotebookPen,
  Plus,
  Search,
  X,
} from "lucide-react";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  href: string;
  icon: typeof Plus;
  color: string;
}

const ROLE_ACTIONS: Record<Role, QuickAction[]> = {
  superadmin: [
    { label: "Buat Tugas", href: "/super-admin/assignments", icon: ClipboardList, color: "bg-blue-500" },
    { label: "Tambah Buku", href: "/super-admin/books", icon: BookOpen, color: "bg-emerald-500" },
    { label: "Buat Pengumuman", href: "/super-admin/announcements", icon: Megaphone, color: "bg-amber-500" },
    { label: "Input Nilai", href: "/super-admin/grades", icon: BarChart3, color: "bg-violet-500" },
  ],
  admin: [
    { label: "Buat Tugas", href: "/admin/assignments", icon: ClipboardList, color: "bg-blue-500" },
    { label: "Tambah Buku", href: "/admin/books", icon: BookOpen, color: "bg-emerald-500" },
    { label: "Buat Pengumuman", href: "/admin/announcements", icon: Megaphone, color: "bg-amber-500" },
    { label: "Input Nilai", href: "/admin/grades", icon: BarChart3, color: "bg-violet-500" },
  ],
  student: [
    { label: "Cari Buku", href: "/student/books", icon: Search, color: "bg-blue-500" },
    { label: "Kerjakan Tugas", href: "/student/assignments", icon: ClipboardList, color: "bg-emerald-500" },
    { label: "Catatan Belajar", href: "/student/study-notes", icon: NotebookPen, color: "bg-amber-500" },
    { label: "Kerjakan Quiz", href: "/student/quizzes", icon: BarChart3, color: "bg-violet-500" },
  ],
};

export function FloatingActionButton({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const actions = ROLE_ACTIONS[role];

  return (
    <div className="fixed right-4 bottom-24 z-30 flex flex-col items-end gap-2 sm:right-6 sm:bottom-24">
      {open && (
        <div className="space-y-2">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={() => setOpen(false)}
              className="group flex items-center gap-2"
            >
              <span className="bg-card text-foreground rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {action.label}
              </span>
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105",
                  action.color
                )}
              >
                <action.icon className="size-5" />
              </span>
            </Link>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "bg-primary text-primary-foreground flex size-14 items-center justify-center rounded-full shadow-xl transition-transform",
          open ? "rotate-90" : "hover:scale-105"
        )}
        aria-label={open ? "Tutup aksi cepat" : "Aksi cepat"}
      >
        {open ? <X className="size-6" /> : <Plus className="size-6" />}
      </button>
    </div>
  );
}
