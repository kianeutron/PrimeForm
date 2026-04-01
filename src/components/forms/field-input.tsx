"use client";

type FieldInputProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  type?: "text" | "number" | "time" | "date";
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

export function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  type = "text",
  min,
  max,
  step,
  className = "",
}: FieldInputProps) {
  return (
    <label className={`pf-input-shell block rounded-[1.65rem] p-4 ${className}`}>
      <span className="pf-overline">{label}</span>
      {helperText ? <span className="pf-muted mt-1 block text-sm">{helperText}</span> : null}
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="pf-input-control mt-4 px-4 py-3.5"
      />
    </label>
  );
}
