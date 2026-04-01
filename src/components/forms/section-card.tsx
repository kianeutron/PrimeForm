import type { ReactNode } from "react";

type SectionCardProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  accent?: "cyan" | "emerald" | "amber";
  className?: string;
};

const accents = {
  cyan: "from-slate-300/10 via-slate-300/4 to-transparent",
  emerald: "from-stone-300/10 via-stone-300/4 to-transparent",
  amber: "from-zinc-300/10 via-zinc-300/4 to-transparent",
} as const;

export function SectionCard({
  id,
  eyebrow,
  title,
  description,
  children,
  accent = "cyan",
  className = "",
}: SectionCardProps) {
  return (
    <section
      id={id}
      className={`pf-panel rounded-[2rem] p-7 lg:p-8 ${className}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accents[accent]} opacity-90`} />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-24 rounded-b-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_68%)]" />
      <div className="relative">
        <p className="pf-overline">{eyebrow}</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-[1.9rem] font-semibold tracking-[-0.03em] text-[var(--foreground)]">{title}</h2>
            <p className="pf-muted mt-2 max-w-2xl text-sm leading-6">{description}</p>
          </div>
        </div>
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}
