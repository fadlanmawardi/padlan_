import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import Link from "next/link";
import { ErrorScreen } from "@/components/shared/error-screen";

export const metadata: Metadata = { title: "Akses Ditolak" };

export default function ForbiddenPage() {
  return (
    <ErrorScreen
      status={403}
      title="Akses ditolak"
      description="Kamu tidak memiliki izin untuk membuka halaman ini. Hubungi admin sekolah bila kamu merasa ini salah."
      icon={ShieldX}
      action={
        <Link
          href="/login"
          className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Kembali ke Halaman Masuk
        </Link>
      }
    />
  );
}
