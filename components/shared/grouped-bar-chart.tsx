import { cn } from "@/lib/utils";

export interface GroupedBarSeries {
  name: string;
  value: number;
  className: string;
  legendClass?: string;
}

interface GroupedBarChartProps {
  data: { label: string; series: GroupedBarSeries[] }[];
  className?: string;
}

export function GroupedBarChart({ data, className }: GroupedBarChartProps) {
  if (data.length === 0) return null;
  const max = Math.max(
    1,
    ...data.flatMap((d) => d.series.map((s) => s.value))
  );

  return (
    <div className={cn("space-y-4", className)}>
      {data.map((row) => (
        <div key={row.label}>
          <p className="mb-1.5 truncate text-xs font-medium text-muted-foreground">
            {row.label}
          </p>
          <div className="space-y-1.5">
            {row.series.map((series) => (
              <div key={series.name} className="flex items-center gap-2">
                <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground">
                  {series.value}
                </span>
                <div className="bg-muted h-3 flex-1 overflow-hidden rounded-full">
                  <div
                    className={cn("h-full rounded-full", series.className)}
                    style={{ width: `${(series.value / max) * 100}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 truncate text-[10px] text-muted-foreground">
                  {series.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {data[0] && data[0].series.length > 1 && (
        <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-muted-foreground">
          {data[0].series.map((series) => (
            <span key={series.name} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "inline-block size-2.5 rounded-sm",
                  series.legendClass ?? series.className
                )}
              />
              {series.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
