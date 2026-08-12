"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { isValidEmail } from "@/lib/password";
import { requestPasswordReset } from "@/services/account-service";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<{
    email: string;
    name: string;
    token: string;
  } | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      toast.error("Masukkan email Anda");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Format email tidak valid");
      return;
    }
    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setSent({ email: email.trim(), name: result.name, token: result.token });
      toast.success("Link reset password berhasil dikirim.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Terjadi kesalahan. Coba lagi."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center lg:hidden">
          <Logo size="lg" subtitle="Perpustakaan Digital" />
        </div>

        <div className="space-y-2 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-2 flex size-14 items-center justify-center rounded-2xl">
            <KeyRound className="size-7" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lupa Kata Sandi
          </h1>
          <p className="text-muted-foreground text-sm">
            Masukkan email yang terdaftar untuk menerima link reset.
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl border bg-card p-6 text-center">
            <MailCheck className="text-success mx-auto mb-3 size-12" />
            <p className="font-semibold">Link reset terkirim!</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Mode demo: kami mengirimkan link reset ke{" "}
              <span className="font-medium text-foreground">{sent.email}</span>.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Lanjutkan ke halaman kata sandi baru untuk menyelesaikan reset.
            </p>
            <Button
              className="mt-5 w-full"
              onClick={() =>
                router.push(
                  `/reset-password?email=${encodeURIComponent(sent.email)}&token=${encodeURIComponent(sent.token)}`
                )
              }
            >
              Lanjut ke Kata Sandi Baru
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@schoolhub.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Mengirim…" : "Kirim Link Reset"}
            </Button>

            <Button asChild variant="ghost" className="w-full">
              <Link href="/login">
                <ArrowLeft className="size-4" />
                Kembali ke halaman masuk
              </Link>
            </Button>
          </form>
        )}

        <div className="bg-muted/50 text-muted-foreground flex items-start gap-2 rounded-xl px-4 py-3 text-xs">
          <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
          Jika email ditemukan, sistem akan mengirim link reset (mode demo).
          Jika tidak ditemukan, akan muncul pesan kesalahan.
        </div>
      </div>
    </div>
  );
}
