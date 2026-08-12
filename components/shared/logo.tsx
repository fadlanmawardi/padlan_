import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  className?: string;
  subtitle?: string;
}

export function Logo({
  size = "md",
  compact = false,
  className,
  subtitle = "Sistem Informasi Sekolah",
}: LogoProps) {
  const iconBox =
    size === "sm"
      ? "size-8 rounded-lg"
      : size === "lg"
        ? "size-12 rounded-2xl"
        : "size-9 rounded-xl";
  const iconText = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  const titleSize = size === "lg" ? "text-xl" : "text-[15px]";
  const subSize = size === "lg" ? "text-xs" : "text-[11px]";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "bg-gradient-to-br from-primary to-primary/70 flex shrink-0 items-center justify-center text-primary-foreground shadow-sm",
          iconBox
        )}
      >
        <span className={cn("font-black leading-none tracking-tight", iconText)}>
          S
        </span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className={cn("font-semibold tracking-tight", titleSize)}>
            School<span className="text-primary">Hub</span>
          </p>
          {subtitle && (
            <p
              className={cn(
                "text-muted-foreground",
                subSize
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
