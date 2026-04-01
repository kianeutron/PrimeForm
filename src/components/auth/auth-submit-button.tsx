"use client";

import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

export function AuthSubmitButton({ label, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/12 px-5 py-3 text-sm font-medium text-cyan-50 transition hover:border-cyan-200/50 hover:bg-cyan-300/18 disabled:cursor-wait disabled:opacity-70"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
