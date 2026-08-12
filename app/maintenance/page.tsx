import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { ErrorScreen } from "@/components/shared/error-screen";

export const metadata: Metadata = { title: "Pemeliharaan" };

export default function MaintenancePage() {
  return (
    <ErrorScreen
      status={503}
      title="Sedang dalam pemeliharaan"
      description="SchoolHub sedang melakukan peningkatan sistem. Silakan kembali beberapa saat lagi."
      icon={Wrench}
      action={
        <a
          href="mailto:admin@schoolhub.id"
          className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Hubungi Admin
        </a>
      }
    />
  );
}
