"use client";

import * as React from "react";

type MetricSliderProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  helperText?: string;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function MetricSlider({
  label,
  value,
  min = 0,
  max = 10,
  step = 1,
  helperText,
  prefix,
  suffix,
  onChange,
  className,
  disabled = false,
  id,
}: MetricSliderProps) {
  const sliderId = React.useId();
  const inputId = id ?? sliderId;

  return (
    <div className={cn("pf-card rounded-[1.75rem] p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor={inputId} className="pf-overline">
            {label}
          </label>
          {helperText ? <p className="pf-muted mt-1 text-sm">{helperText}</p> : null}
        </div>
        <div className="pf-chip rounded-[1.2rem] px-3.5 py-2 text-right">
          <div className="pf-overline text-[10px]">Value</div>
          <div className="mt-1 text-lg font-semibold text-[var(--foreground)]">
            {prefix}
            {value}
            {suffix}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <input
          id={inputId}
          type="range"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2.5 w-full cursor-pointer rounded-full bg-[color:color-mix(in_srgb,var(--foreground)_10%,transparent)] accent-cyan-400 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label}
        />
        <div className="pf-muted mt-3 flex justify-between text-xs">
          <span>
            {prefix}
            {min}
            {suffix}
          </span>
          <span>
            {prefix}
            {max}
            {suffix}
          </span>
        </div>
      </div>
    </div>
  );
}

export type { MetricSliderProps };
