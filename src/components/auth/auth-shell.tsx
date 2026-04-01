import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  alternateHref: string;
  alternateLabel: string;
  alternateText: string;
  statusMessage?: string | null;
  statusTone?: "error" | "message";
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  alternateHref,
  alternateLabel,
  alternateText,
  statusMessage,
  statusTone = "message",
  children,
}: AuthShellProps) {
  const toneClass =
    statusTone === "error"
      ? "border-rose-400/20 bg-rose-400/10 text-rose-100"
      : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100";

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(101,217,255,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(91,225,166,0.12),transparent_24%),linear-gradient(180deg,#06080f_0%,#05070d_38%,#04050a_100%)]" />
      <section className="pf-panel w-full max-w-[1120px] rounded-[2.5rem] lg:grid lg:grid-cols-[0.92fr_1.08fr]">
        <div className="border-b border-[var(--border)] p-8 lg:border-b-0 lg:border-r lg:p-10">
          <p className="pf-overline text-cyan-200/70">Primeform</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{title}</h1>
          <p className="pf-muted mt-4 max-w-md text-base leading-7">{description}</p>

          <p className="pf-muted mt-8 max-w-sm text-sm leading-6">
            Your daily Face, Physic, and Brain data stays in one private workspace, ready on every device.
          </p>

          <div className="pf-chip mt-10 rounded-3xl p-5 text-sm">
            <span className="pf-muted">{alternateText}</span>{" "}
            <a href={alternateHref} className="font-medium text-cyan-200 transition hover:text-cyan-100">
              {alternateLabel}
            </a>
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <div className="pf-card rounded-[2rem] p-6">
            <p className="pf-overline">{eyebrow}</p>
            {statusMessage ? (
              <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClass}`}>{statusMessage}</div>
            ) : null}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
