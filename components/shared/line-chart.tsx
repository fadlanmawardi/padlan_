interface LineChartDatum {
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineChartDatum[];
  color?: string;
  height?: number;
}

export function LineChart({
  data,
  color = "var(--primary)",
  height = 160,
}: LineChartProps) {
  if (data.length === 0) return null;

  const width = 100;
  const padding = 8;
  const max = Math.max(100, ...data.map((d) => d.value));
  const min = Math.min(0, ...data.map((d) => d.value));
  const range = max - min || 1;
  const stepX = (width - padding * 2) / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - (d.value - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${
    height - padding
  } L ${points[0].x.toFixed(2)} ${height - padding} Z`;

  const lastPoint = points[points.length - 1];
  const lastValue = data[data.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id="lineChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#lineChartFill)" />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.5"
          fill={color}
          className="drop-shadow-sm"
        />
      </svg>
      <div className="mt-2 flex items-end justify-between gap-1">
        <span className="text-muted-foreground text-[10px]">
          {data[0]?.label ?? ""}
        </span>
        <span className="text-xs font-semibold">
          {lastValue.label}: {lastValue.value}
        </span>
      </div>
    </div>
  );
}
