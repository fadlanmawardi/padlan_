"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { ErrorScreen } from "@/components/shared/error-screen";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      status={500}
      title="Terjadi kesalahan"
      description="Maaf, terjadi kendala pada sistem. Silakan muat ulang halaman."
      icon={TriangleAlert}
      action={
        <button
          type="button"
          onClick={reset}
          className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 inline-flex h-9 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Muat Ulang
        </button>
      }
    />
  );
}
