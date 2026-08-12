"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { LoadingScreen } from "@/components/shared/loading-screen";
import {
  evaluatePassword,
  isValidEmail,
  passwordErrors,
  STRENGTH_STYLES,
} from "@/lib/password";
import { cn } from "@/lib/utils";
import { resetPassword } from "@/services/account-service";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const initialToken = searchParams.get("token") ?? "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const strength = evaluatePassword(password);
  const errors = passwordErrors(password);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!initialToken) {
      toast.error(
        "Token reset tidak ditemukan. Ulangi dari halaman lupa kata sandi."
      );
      router.push("/forgot-password");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Format email tidak valid");
      return;
    }
    if (errors.length > 0) {
      toast.error("Kata sandi tidak memenuhi ketentuan");
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi kata sandi tidak cocok");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(initialToken, email, password);
      toast.success("Password berhasil diganti");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengatur ulang kata sandi"
      );
    } finally {
      setSubmitting(false);
    }
  }

  const req = strength.requirements;

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center lg:hidden">
          <Logo size="lg" subtitle="Perpustakaan Digital" />
        </div>

        <div className="space-y-2 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl">
            <LockKeyhole className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Kata Sandi Baru
          </h1>
          <p className="text-muted-foreground text-sm">
            Buat kata sandi baru yang kuat untuk akun Anda.
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
            <Label htmlFor="new-password">Kata Sandi Baru</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label="Tampilkan kata sandi"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {password.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <span
                        key={bar}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          bar <= strength.score
                            ? STRENGTH_STYLES[strength.label].bar
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      STRENGTH_STYLES[strength.label].text
                    )}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                  {[
                    { label: "8 karakter", ok: req.hasMin },
                    { label: "Huruf besar", ok: req.hasUpper },
                    { label: "Huruf kecil", ok: req.hasLower },
                    { label: "Angka", ok: req.hasNumber },
                  ].map((item) => (
                    <span
                      key={item.label}
                      className={cn(
                        "flex items-center gap-1",
                        item.ok ? "text-success" : "text-muted-foreground"
                      )}
                    >
                      <CheckCircle2
                        className={cn("size-3", !item.ok && "opacity-40")}
                      />
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                placeholder="Ulangi kata sandi"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={cn(
                  "pr-10",
                  confirm.length > 0 &&
                    (password === confirm ? "border-success" : "border-destructive")
                )}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                aria-label="Tampilkan konfirmasi"
              >
                {showConfirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {confirm.length > 0 && password !== confirm && (
              <p className="text-destructive text-xs">
                Kata sandi tidak cocok.
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Menyimpan…" : "Simpan Kata Sandi Baru"}
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">
              <ArrowLeft className="size-4" />
              Kembali ke halaman masuk
            </Link>
          </Button>
        </form>
      </div>
    </div>
  );
}
