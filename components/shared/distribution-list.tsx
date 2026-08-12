import type { CategoryDatum } from "@/types";
import { cn } from "@/lib/utils";

interface DistributionListProps {
  data: CategoryDatum[];
  className?: string;
}

export function DistributionList({ data, className }: DistributionListProps) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        const color = `var(--color-chart-${(index % 5) + 1})`;
        const percentage = Math.round((item.count / max) * 100);
        return (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.count} buku</span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
