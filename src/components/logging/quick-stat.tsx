import * as React from "react";

type QuickStatProps = {
  label: string;
  value: string | number;
  detail?: string;
  delta?: string;
  tone?: "emerald" | "cyan" | "amber" | "rose";
  className?: string;
  icon?: React.ReactNode;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const tones = {
  emerald: "text-stone-300 border-stone-400/20 bg-stone-400/10",
  cyan: "text-slate-300 border-slate-400/20 bg-slate-400/10",
  amber: "text-zinc-300 border-zinc-400/20 bg-zinc-400/10",
  rose: "text-neutral-300 border-neutral-400/20 bg-neutral-400/10",
} as const;

export function QuickStat({ label, value, detail, delta, tone = "cyan", className, icon }: QuickStatProps) {
  return (
    <article className={cn("pf-card rounded-[1.8rem] p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="pf-overline">{label}</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-[2rem] font-semibold tracking-[-0.03em] text-[var(--foreground)]">{value}</span>
            {delta ? <span className={cn("rounded-full border px-2 py-1 text-xs font-medium", tones[tone])}>{delta}</span> : null}
          </div>
        </div>
        {icon ? <div className="pf-chip rounded-2xl p-2.5 text-[var(--foreground)]">{icon}</div> : null}
      </div>
      {detail ? <p className="pf-muted mt-4 text-sm leading-6">{detail}</p> : null}
    </article>
  );
}

export type { QuickStatProps };
