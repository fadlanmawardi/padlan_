import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorScreenProps {
  status: number;
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
}

export function ErrorScreen({
  status,
  title,
  description,
  icon: Icon,
  action,
}: ErrorScreenProps) {
  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <div
        className="bg-primary/10 absolute -top-24 -right-24 size-72 rounded-full blur-3xl"
        aria-hidden
      />
      <div
        className="bg-primary/10 absolute -bottom-24 -left-24 size-72 rounded-full blur-3xl"
        aria-hidden
      />
      <div className="relative space-y-5">
        <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-2xl">
          <Icon className="size-8" />
        </div>
        <div className="space-y-2">
          <p className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-6xl font-bold tracking-tight text-transparent">
            {status}
          </p>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">
            {description}
          </p>
        </div>
        {action ?? (
          <Button asChild>
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
