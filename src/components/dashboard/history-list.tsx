import * as React from "react";

type HistoryItem = {
  id: string;
  dateLabel: string;
  title: string;
  summary?: string;
  faceScore?: number;
  physicScore?: number;
  brainScore?: number;
  primeScore: number;
  tags?: string[];
  status?: "up" | "flat" | "down";
};

type HistoryListProps = {
  items: HistoryItem[];
  className?: string;
  emptyState?: React.ReactNode;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function statusStyles(status?: HistoryItem["status"]) {
  switch (status) {
    case "up":
      return "text-emerald-300 bg-emerald-400/10 border-emerald-400/20";
    case "down":
      return "text-rose-300 bg-rose-400/10 border-rose-400/20";
    default:
      return "pf-chip";
  }
}

export function HistoryList({ items, className, emptyState }: HistoryListProps) {
  if (items.length === 0) {
    return (
      <div className={cn("pf-panel rounded-3xl p-6 text-sm pf-muted", className)}>
        {emptyState ?? "No history yet."}
      </div>
    );
  }

  return (
    <section
      className={cn("pf-panel rounded-[1.9rem] p-5 lg:p-6", className)}
      aria-label="Daily history"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="pf-overline">History</p>
          <p className="pf-muted mt-1 text-sm">Recent daily check-ins and score breakdowns.</p>
        </div>
        <span className="pf-chip rounded-full px-3 py-1 text-xs">
          {items.length} days
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="pf-card rounded-[1.5rem] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[var(--foreground)]">{item.title}</p>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-[0.18em]", statusStyles(item.status))}>
                    {item.status ?? "steady"}
                  </span>
                </div>
                <p className="pf-muted mt-1 text-sm">{item.dateLabel}</p>
                {item.summary ? <p className="pf-muted mt-2 text-sm leading-6">{item.summary}</p> : null}
              </div>
              <div className="pf-chip rounded-2xl px-3.5 py-2.5 text-right">
                <div className="pf-overline text-[10px]">Prime</div>
                <div className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{Math.round(item.primeScore)}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
              {typeof item.faceScore === "number" ? scorePill("Face", item.faceScore) : null}
              {typeof item.physicScore === "number" ? scorePill("Physic", item.physicScore) : null}
              {typeof item.brainScore === "number" ? scorePill("Brain", item.brainScore) : null}
            </div>

            {item.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="pf-chip rounded-full px-2.5 py-1 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function scorePill(label: string, value: number) {
  return (
    <div className="pf-chip rounded-2xl px-3 py-2.5">
      <div className="pf-overline text-[10px]">{label}</div>
      <div className="mt-1 font-medium text-[var(--foreground)]">{Math.round(value)}</div>
    </div>
  );
}

export type { HistoryItem, HistoryListProps };
