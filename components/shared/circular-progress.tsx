import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackClassName?: string;
  label?: string;
  sublabel?: string;
}

export function CircularProgress({
  value,
  size = 64,
  stroke = 6,
  color,
  label,
  sublabel,
  trackClassName,
}: CircularProgressProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={cn("stroke-muted", trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={color ?? "var(--primary)"}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label !== undefined ? (
          <>
            <span className="text-sm font-semibold leading-none">{label}</span>
            {sublabel && (
              <span className="text-muted-foreground mt-0.5 text-[10px] leading-none">
                {sublabel}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm font-semibold leading-none">
            {Math.round(clamped)}%
          </span>
        )}
      </div>
    </div>
  );
}
