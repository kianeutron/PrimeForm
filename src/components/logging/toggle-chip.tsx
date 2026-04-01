"use client";

import * as React from "react";

type ToggleChipProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ToggleChip({
  label,
  checked,
  onChange,
  description,
  className,
  disabled = false,
  id,
}: ToggleChipProps) {
  const reactId = React.useId();
  const inputId = id ?? reactId;

  return (
    <div className={cn("pf-card rounded-[1.65rem] p-4", className)}>
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-center justify-between gap-4 rounded-[1.35rem] border px-4 py-3.5 transition focus-within:ring-2 focus-within:ring-cyan-400/30",
          checked
            ? "border-cyan-400/30 bg-[color:color-mix(in_srgb,var(--cyan)_12%,transparent)]"
            : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card-strong)_68%,transparent)]",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <span>
          <span className="block text-sm font-medium text-[var(--foreground)]">{label}</span>
          {description ? <span className="pf-muted mt-1 block text-sm">{description}</span> : null}
        </span>

        <span
          className={cn(
            "relative inline-flex h-7 w-12 items-center rounded-full border transition",
            checked
              ? "border-cyan-400/40 bg-[color:color-mix(in_srgb,var(--cyan)_18%,transparent)]"
              : "border-[var(--border)] bg-[color:color-mix(in_srgb,var(--foreground)_8%,transparent)]",
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "inline-block h-5 w-5 rounded-full bg-[var(--foreground)] shadow transition-transform",
              checked ? "translate-x-5" : "translate-x-1",
            )}
          />
        </span>
      </label>

      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
        aria-label={label}
      />
    </div>
  );
}

export type { ToggleChipProps };
