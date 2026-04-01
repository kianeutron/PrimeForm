import * as React from "react";

type TrendPoint = {
  label: string;
  value: number;
};

type TrendChartProps = {
  title: string;
  subtitle?: string;
  data: TrendPoint[];
  yAxisLabel?: string;
  min?: number;
  max?: number;
  className?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function TrendChart({
  title,
  subtitle,
  data,
  yAxisLabel = "Score",
  min,
  max,
  className,
}: TrendChartProps) {
  const gradientId = React.useId();
  const width = 100;
  const height = 64;
  const values = data.map((point) => point.value);
  const computedMin = min ?? Math.min(...values, 0);
  const computedMax = max ?? Math.max(...values, 100);
  const span = Math.max(1, computedMax - computedMin);
  const stepX = data.length > 1 ? width / (data.length - 1) : width;

  const points = data.map((point, index) => {
    const normalized = clamp((point.value - computedMin) / span, 0, 1);
    const x = index * stepX;
    const y = height - normalized * height;
    return { ...point, x, y };
  });

  const path = points.length
    ? points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(" ")
    : "";

  const area = points.length
    ? `${path} L ${points[points.length - 1].x.toFixed(2)} ${height} L 0 ${height} Z`
    : "";

  return (
    <section
      className={cn(
        "pf-panel rounded-[1.9rem] p-5 lg:p-6",
        className,
      )}
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="pf-overline">{title}</p>
          {subtitle ? <p className="pf-muted mt-1 text-sm">{subtitle}</p> : null}
        </div>
        <span className="pf-chip rounded-full px-3 py-1 text-xs">
          {yAxisLabel}
        </span>
      </div>

      <div className="mt-5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-40 w-full overflow-visible"
          role="img"
          aria-label={`${title} trend chart`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(56,189,248,0.36)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0)" />
            </linearGradient>
          </defs>
          <line x1="0" x2={width} y1={height - 1} y2={height - 1} stroke="rgba(148,163,184,0.18)" />
          {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
          {path ? <path d={path} fill="none" stroke="rgba(125,211,252,0.95)" strokeWidth="2.5" /> : null}
          {points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="2.8" fill="rgba(15,23,42,1)" stroke="rgba(125,211,252,1)" strokeWidth="2" />
            </g>
          ))}
        </svg>
      </div>

      <div className="pf-muted mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {data.map((point) => (
          <div key={point.label} className="pf-chip rounded-2xl px-3 py-2.5">
            <div>{point.label}</div>
            <div className="mt-1 font-medium text-[var(--foreground)]">{Math.round(point.value)}</div>
          </div>
        ))}
      </div>
      <p className="sr-only">
        Trend values: {data.map((point) => `${point.label} ${point.value}`).join(", ")}
      </p>
    </section>
  );
}

export type { TrendChartProps, TrendPoint };
