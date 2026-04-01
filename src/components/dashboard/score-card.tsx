import * as React from "react";

type ScoreTone = "emerald" | "cyan" | "amber" | "rose" | "violet";

type ScoreCardProps = {
  title: string;
  score: number;
  subtitle?: string;
  delta?: number;
  deltaLabel?: string;
  tone?: ScoreTone;
  icon?: React.ReactNode;
  footnote?: string;
  className?: string;
};

const toneStyles: Record<ScoreTone, { ring: string; fill: string; text: string }> = {
  emerald: {
    ring: "from-stone-300/14 via-stone-300/6 to-transparent",
    fill: "bg-stone-400",
    text: "text-stone-300",
  },
  cyan: {
    ring: "from-slate-300/14 via-slate-300/6 to-transparent",
    fill: "bg-slate-400",
    text: "text-slate-300",
  },
  amber: {
    ring: "from-zinc-300/14 via-zinc-300/6 to-transparent",
    fill: "bg-zinc-400",
    text: "text-zinc-300",
  },
  rose: {
    ring: "from-neutral-300/14 via-neutral-300/6 to-transparent",
    fill: "bg-neutral-400",
    text: "text-neutral-300",
  },
  violet: {
    ring: "from-slate-400/16 via-slate-400/7 to-transparent",
    fill: "bg-slate-500",
    text: "text-slate-300",
  },
};

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ScoreCard({
  title,
  score,
  subtitle,
  delta,
  deltaLabel = "vs yesterday",
  tone = "emerald",
  icon,
  footnote,
  className,
}: ScoreCardProps) {
  const styles = toneStyles[tone];
  const normalized = clampScore(score);
  const deltaPositive = typeof delta === "number" ? delta >= 0 : null;

  return (
    <section
      className={cn(
        "pf-panel rounded-[1.9rem] p-5 lg:p-6",
        className,
      )}
      aria-label={`${title} score card`}
    >
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-85", styles.ring)} />
      <div className="pointer-events-none absolute inset-x-5 top-0 h-24 rounded-b-[1.75rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_72%)]" />
      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="pf-overline">{title}</p>
            {subtitle ? <p className="pf-muted mt-1 text-sm">{subtitle}</p> : null}
          </div>
          {icon ? (
            <div className="pf-chip rounded-2xl p-2.5 text-[var(--foreground)]">{icon}</div>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">{normalized}</span>
              <span className="pb-1 text-lg text-[color:color-mix(in_srgb,var(--foreground)_34%,transparent)]">/100</span>
            </div>
            {footnote ? <p className="pf-muted mt-2 text-sm">{footnote}</p> : null}
          </div>

          <div className="w-28 shrink-0">
            <div className="h-2.5 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)]">
              <div
                className={cn("h-full rounded-full", styles.fill)}
                style={{ width: `${normalized}%` }}
                aria-hidden="true"
              />
            </div>
            {typeof delta === "number" ? (
              <p className={cn("mt-3 text-right text-sm font-medium", deltaPositive ? styles.text : "text-rose-300")}>
                {deltaPositive ? "+" : ""}
                {delta.toFixed(0)} {deltaLabel}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export type { ScoreCardProps, ScoreTone };
