"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/shared/logo";
import { getRedirectPath } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { isValidEmail } from "@/lib/password";

const DEMO_ACCOUNTS = [
  {
    role: "Super Admin",
    email: "superadmin@schoolhub.id",
    password: "demo1234",
    color: "bg-primary",
  },
  {
    role: "Admin / Guru",
    email: "budi@schoolhub.id",
    password: "demo1234",
    color: "bg-chart-2",
  },
  {
    role: "Siswa",
    email: "alya@student.schoolhub.id",
    password: "demo1234",
    color: "bg-success",
  },
];

const REMEMBER_KEY = "sh-remember-email";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Perpustakaan Digital",
    description: "Kelola koleksi buku, peminjaman, pengembalian, dan denda.",
  },
  {
    icon: GraduationCap,
    title: "Manajemen Akademik",
    description: "Tugas, pengumpulan, penilaian, dan absensi siswa terpusat.",
  },
  {
    icon: ShieldCheck,
    title: "Keamanan Berbasis Peran",
    description: "Akses terkontrol untuk Super Admin, Admin/Guru, dan Siswa.",
  },
];

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Mohon isi email dan kata sandi");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Format email tidak valid");
      return;
    }
    if (password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter");
      return;
    }
    setSubmitting(true);
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      const session = await signIn(email, password);
      toast.success(`Selamat datang, ${session.name}`);
      router.push(getRedirectPath(session.role));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal masuk, silakan coba lagi"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
        <p className="text-muted-foreground text-sm">
          Masuk untuk mengakses SchoolHub.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@schoolhub.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Kata Sandi</Label>
            <Button asChild type="button" variant="link" className="h-auto p-0 text-xs font-normal">
              <Link href="/forgot-password">Lupa kata sandi?</Link>
            </Button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              aria-label={
                showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
              }
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label
            htmlFor="remember"
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(checked) => setRemember(Boolean(checked))}
            />
            Ingat saya
          </label>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Memproses…" : "Masuk"}
        </Button>
      </form>

      <div className="rounded-xl border bg-card p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Akun Demo
        </p>
        <div className="space-y-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              onClick={() => fillDemo(account)}
              className="hover:bg-muted flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors"
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn("size-2 rounded-full", account.color)}
                />
                {account.role}
              </span>
              <span className="text-muted-foreground text-xs">
                {account.email}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Klik akun demo lalu tekan tombol masuk. Mode demo aktif ketika
          Firebase belum dikonfigurasi.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-background grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#09090b] p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-10 size-40 rounded-full bg-success/10 blur-2xl" />

        <div className="relative flex items-center gap-3">
          <div className="bg-primary flex size-11 items-center justify-center rounded-2xl text-primary-foreground shadow-lg">
            <span className="text-lg font-black">S</span>
          </div>
          <div className="leading-tight">
            <p className="text-lg font-semibold tracking-tight">SchoolHub</p>
            <p className="text-white/60 text-sm">
              Sistem Informasi Sekolah & Perpustakaan Digital
            </p>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight">
              Kelola sekolah dan perpustakaan dalam{" "}
              <span className="text-primary">satu platform</span> modern.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              SchoolHub menyatukan manajemen perpustakaan digital dan aktivitas
              akademik — buku, peminjaman, tugas, penilaian, hingga absensi
              siswa.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="bg-white/5 border-white/10 flex size-9 shrink-0 items-center justify-center rounded-lg border">
                    <Icon className="text-primary size-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-white/60 text-xs">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-sm text-white/60">
          <CheckCircle2 className="size-4 text-success" />
          Sistem siap digunakan · Keamanan tingkat lanjut
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 lg:hidden">
          <Logo size="lg" subtitle="Perpustakaan Digital" />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
