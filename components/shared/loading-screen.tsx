import { Loader2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" subtitle="Memuat aplikasi…" />
        <Loader2 className="size-5 animate-spin text-primary" />
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
