"use client";

import { useState } from "react";

type TagInputProps = {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  helperText?: string;
};

export function TagInput({
  label,
  value,
  onChange,
  placeholder = "Type and press Enter",
  helperText,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(nextValue: string) {
    const normalized = nextValue.trim();
    if (!normalized || value.includes(normalized)) {
      return;
    }
    onChange([...value, normalized]);
    setDraft("");
  }

  return (
    <div className="pf-input-shell rounded-[1.65rem] p-4">
      <label className="pf-overline block">{label}</label>
      {helperText ? <p className="pf-muted mt-1 text-sm">{helperText}</p> : null}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag(draft);
          }
          if (event.key === "Backspace" && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        placeholder={placeholder}
        className="pf-input-control mt-4 px-4 py-3.5"
      />
      {value.length ? (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              className="pf-chip rounded-full px-3 py-1.5 text-sm transition hover:border-cyan-400/30 hover:text-[var(--foreground)]"
            >
              {tag}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
