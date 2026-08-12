import { cn } from "@/lib/utils";

export interface HeatCell {
  date: string;
  value: number;
}

interface HeatmapProps {
  /** Nilai 0..100 */
  data: HeatCell[];
  weeks?: number;
  emptyLabel?: string;
}

function levelClass(value: number): string {
  if (value <= 0) return "bg-muted";
  if (value < 25) return "bg-primary/25";
  if (value < 50) return "bg-primary/50";
  if (value < 75) return "bg-primary/75";
  return "bg-primary";
}

export function Heatmap({ data, weeks = 12, emptyLabel = "Tidak ada data" }: HeatmapProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = weeks * 7;
  const cells: HeatCell[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toDateString();
    const existing = data.find((d) => new Date(d.date).toDateString() === key);
    cells.push({ date: key, value: existing?.value ?? 0 });
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {Array.from({ length: weeks }).map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const cell = cells[weekIndex * 7 + dayIndex];
              if (!cell) return <div key={dayIndex} className="size-3 rounded-[3px] bg-muted" />;
              return (
                <div
                  key={dayIndex}
                  title={`${cell.date} — ${cell.value}%`}
                  className={cn("size-3 rounded-[3px]", levelClass(cell.value))}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>{emptyLabel}</span>
        <div className="ml-auto flex items-center gap-1">
          <span className="size-2.5 rounded-[3px] bg-muted" />
          <span className="size-2.5 rounded-[3px] bg-primary/25" />
          <span className="size-2.5 rounded-[3px] bg-primary/50" />
          <span className="size-2.5 rounded-[3px] bg-primary/75" />
          <span className="size-2.5 rounded-[3px] bg-primary" />
        </div>
      </div>
    </div>
  );
}
