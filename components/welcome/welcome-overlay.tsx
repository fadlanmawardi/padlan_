"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Role } from "@/types";

function getTips(role: Role) {
  if (role === "superadmin") {
    return [
      { icon: ShieldCheck, text: "Kelola akun admin, guru, dan siswa." },
      { icon: Users, text: "Pantau aktivitas seluruh pengguna." },
      { icon: LayoutDashboard, text: "Lihat statistik sekolah di dashboard." },
    ];
  }
  if (role === "admin") {
    return [
      { icon: BookOpen, text: "Kelola koleksi buku & peminjaman." },
      { icon: GraduationCap, text: "Input nilai dan catat absensi." },
      { icon: LayoutDashboard, text: "Pantau performa kelas dan siswa." },
    ];
  }
  return [
    { icon: BookOpen, text: "Cari dan pinjam buku favoritmu." },
    { icon: GraduationCap, text: "Lihat nilai dan rapor digitalmu." },
    { icon: LayoutDashboard, text: "Atur target belajar di Student Hub." },
  ];
}

function confettiColors() {
  return ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];
}

export function WelcomeOverlay() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const key = `sh-welcome-${user.uid}`;
      if (localStorage.getItem(key) === "1") return;
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    } catch {
      // abaikan
    }
  }, [user]);

  const tips = useMemo(() => getTips(user?.role ?? "student"), [user]);

  function dismiss() {
    if (!user) return;
    try {
      localStorage.setItem(`sh-welcome-${user.uid}`, "1");
    } catch {
      // abaikan
    }
    setOpen(false);
  }

  const [pieces, setPieces] = useState<
    { left: number; delay: number; duration: number; color: string; size: number; rotate: number }[]
  >([]);

  useEffect(() => {
    setPieces(
      Array.from({ length: 40 }, (_, index) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.5 + Math.random() * 2,
        color: confettiColors()[index % confettiColors().length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      }))
    );
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="max-w-md overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {pieces.map((piece, index) => (
            <span
              key={index}
              className="animate-confetti absolute top-0 block rounded-sm"
              style={{
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                transform: `rotate(${piece.rotate}deg)`,
              }}
            />
          ))}
        </div>
        <div className="relative space-y-4 py-4 text-center">
          <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-2xl">
            <Sparkles className="size-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              Selamat datang, {user?.name.split(" ")[0] ?? "Kawan"}! 🎉
            </h2>
            <p className="text-muted-foreground text-sm">
              SchoolHub siap membantu aktivitas belajarmu hari ini.
            </p>
          </div>
          <div className="space-y-2 text-left">
            {tips.map((tip) => (
              <div
                key={tip.text}
                className="bg-muted/50 flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
              >
                <tip.icon className="text-primary size-4 shrink-0" />
                {tip.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1" onClick={dismiss}>
              <Link href={`/${user?.role}`}>Ke Dashboard</Link>
            </Button>
            <Button className="flex-1" onClick={dismiss}>
              Mulai Beraktivitas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
