import type { ChartDatum } from "@/types";
import { cn } from "@/lib/utils";

interface BarChartProps {
  data: ChartDatum[];
  height?: number;
  className?: string;
}

const WIDTH = 720;
const PADDING_X = 28;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 32;

export function BarChart({ data, height = 260, className }: BarChartProps) {
  if (data.length === 0) return null;

  const chartHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const max = Math.max(1, ...data.flatMap((d) => [d.loans, d.returns]));
  const groupWidth = (WIDTH - PADDING_X * 2) / data.length;
  const barWidth = Math.min(22, groupWidth * 0.28);
  const groupGap = barWidth * 0.4;

  return (
    <div className={cn("w-full", className)}>
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          className="min-w-[540px]"
          role="img"
          aria-label="Grafik peminjaman dan pengembalian"
        >
          <defs>
            <linearGradient id="bar-loans" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="bar-returns" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity="0.95" />
              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = PADDING_TOP + chartHeight * (1 - fraction);
            return (
              <g key={fraction}>
                <line
                  x1={PADDING_X}
                  x2={WIDTH - PADDING_X}
                  y1={y}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  strokeDasharray={fraction === 0 ? "0" : "4 4"}
                />
                <text
                  x={PADDING_X - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--color-muted-foreground)"
                >
                  {Math.round(max * fraction)}
                </text>
              </g>
            );
          })}

          {data.map((datum, index) => {
            const groupX = PADDING_X + index * groupWidth;
            const centerX = groupX + groupWidth / 2;
            const loansHeight = (datum.loans / max) * chartHeight;
            const returnsHeight = (datum.returns / max) * chartHeight;
            const baseY = PADDING_TOP + chartHeight;

            return (
              <g key={datum.label}>
                <rect
                  x={centerX - barWidth - groupGap / 2}
                  y={baseY - loansHeight}
                  width={barWidth}
                  height={Math.max(loansHeight, 2)}
                  rx="4"
                  fill="url(#bar-loans)"
                />
                <rect
                  x={centerX + groupGap / 2}
                  y={baseY - returnsHeight}
                  width={barWidth}
                  height={Math.max(returnsHeight, 2)}
                  rx="4"
                  fill="url(#bar-returns)"
                />
                <text
                  x={centerX}
                  y={baseY + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fill="var(--color-muted-foreground)"
                >
                  {datum.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-center gap-5 text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="bg-chart-1 inline-block size-2.5 rounded-sm" />
          Peminjaman
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="bg-chart-2 inline-block size-2.5 rounded-sm" />
          Pengembalian
        </span>
      </div>
    </div>
  );
}
