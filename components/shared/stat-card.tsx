import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  change: string;
  trend: "up" | "down" | "flat";
  icon: LucideIcon;
  className?: string;
  valueFormatter?: (value: number) => string;
}

export function StatCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  className,
  valueFormatter,
}: StatCardProps) {
  const TrendIcon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardContent className="flex items-start justify-between px-5 py-5">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {valueFormatter
              ? valueFormatter(value)
              : value.toLocaleString("id-ID")}
          </p>
          <p
            className={cn(
              "flex items-center gap-1 text-xs",
              trend === "up" && "text-success",
              trend === "down" && "text-destructive",
              trend === "flat" && "text-muted-foreground"
            )}
          >
            <TrendIcon className="size-3.5" />
            {change}
          </p>
        </div>
        <div className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
