"use client";

import { useState } from "react";
import { FieldInput } from "@/components/forms/field-input";
import { SectionCard } from "@/components/forms/section-card";
import { TagInput } from "@/components/forms/tag-input";
import { applyThemePreference } from "@/components/theme/theme-controller";
import type { ThemePreference } from "@/lib/db/types";
import type { FacePlan, PhysicPlan } from "@/lib/types";

type SettingsStudioProps = {
  initialDisplayName: string;
  initialTheme: ThemePreference;
  initialFacePlan: FacePlan | undefined;
  initialPhysicPlan: PhysicPlan | undefined;
};

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function SettingsStudio({
  initialDisplayName,
  initialTheme,
  initialFacePlan,
  initialPhysicPlan,
}: SettingsStudioProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [facePlan, setFacePlan] = useState<FacePlan>(initialFacePlan ?? {});
  const [physicPlan, setPhysicPlan] = useState<PhysicPlan>(initialPhysicPlan ?? {});
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function saveSettings() {
    setIsSaving(true);
    setStatus("");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          theme,
          face: facePlan,
          physic: physicPlan,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Settings save failed.");
      }

      setStatus("Settings saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Settings save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col gap-8 px-5 py-6 pb-28 sm:px-8 lg:px-12 xl:px-14 xl:pb-6">
      <section className="pf-panel rounded-[2.5rem] p-6 md:p-8">
        <div className="pointer-events-none absolute inset-x-10 top-0 h-28 rounded-b-[2rem] bg-[radial-gradient(circle_at_top,rgba(101,217,255,0.12),transparent_70%)]" />
        <p className="pf-overline relative text-cyan-200/70">Settings</p>
        <h1 className="relative mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">Set your baseline.</h1>
        <p className="pf-muted relative mt-4 max-w-3xl text-base leading-7 sm:text-lg">
          Your body stats and routines shape the score.
        </p>
      </section>

      <div className="flex flex-col gap-8">
        <SectionCard
          eyebrow="Profile"
          title="Body baseline"
          description="These values shape fallback calorie and protein targets when the daily log does not define them."
          accent="amber"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldInput label="Display name" value={displayName} onChange={setDisplayName} placeholder="Kian" />
            <label className="block rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
              <span className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Biological sex</span>
              <select
                value={physicPlan.biologicalSex ?? ""}
                onChange={(event) =>
                  setPhysicPlan((current) => ({
                    ...current,
                    biologicalSex: (event.target.value || undefined) as PhysicPlan["biologicalSex"],
                  }))
                }
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-cyan-400/40"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
            <FieldInput
              label="Height (cm)"
              type="number"
              value={physicPlan.heightCm ?? ""}
              onChange={(value) => setPhysicPlan((current) => ({ ...current, heightCm: parseOptionalNumber(value) }))}
              placeholder="182"
            />
            <FieldInput
              label="Weight (kg)"
              type="number"
              step={0.1}
              value={physicPlan.bodyWeightKg ?? ""}
              onChange={(value) => setPhysicPlan((current) => ({ ...current, bodyWeightKg: parseOptionalNumber(value) }))}
              placeholder="82"
            />
            <FieldInput
              label="Age"
              type="number"
              value={physicPlan.age ?? ""}
              onChange={(value) => setPhysicPlan((current) => ({ ...current, age: parseOptionalNumber(value) }))}
              placeholder="27"
            />
            <FieldInput
              label="Workout target (min)"
              type="number"
              value={physicPlan.workoutTargetMinutes ?? ""}
              onChange={(value) =>
                setPhysicPlan((current) => ({ ...current, workoutTargetMinutes: parseOptionalNumber(value) }))
              }
              placeholder="45"
            />
            <FieldInput
              label="Calorie target"
              type="number"
              value={physicPlan.calorieTarget ?? ""}
              onChange={(value) => setPhysicPlan((current) => ({ ...current, calorieTarget: parseOptionalNumber(value) }))}
              placeholder="Leave blank to estimate"
            />
            <FieldInput
              label="Protein target"
              type="number"
              value={physicPlan.proteinTargetGrams ?? ""}
              onChange={(value) =>
                setPhysicPlan((current) => ({ ...current, proteinTargetGrams: parseOptionalNumber(value) }))
              }
              placeholder="Leave blank to use body weight"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {(["system", "dark", "light"] as ThemePreference[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setTheme(option);
                  applyThemePreference(option);
                }}
                className={`rounded-full border px-4 py-2 text-sm capitalize transition ${
                  theme === option
                    ? "border-cyan-300/40 bg-cyan-400/12 text-cyan-100"
                    : "border-white/10 bg-white/[0.05] text-white/70"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Face"
          title="Routine definitions"
          description="These define what the daily skincare toggles and product coverage should mean."
          accent="emerald"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TagInput
              label="Morning routine"
              value={facePlan.morningRoutineItems ?? []}
              onChange={(items) => setFacePlan((current) => ({ ...current, morningRoutineItems: items }))}
              helperText="Examples: cleanser, vitamin c, moisturizer, SPF."
            />
            <TagInput
              label="Night routine"
              value={facePlan.nightRoutineItems ?? []}
              onChange={(items) => setFacePlan((current) => ({ ...current, nightRoutineItems: items }))}
              helperText="Examples: cleanse, retinoid, moisturizer."
            />
            <TagInput
              label="Required products"
              value={facePlan.requiredProducts ?? []}
              onChange={(items) => setFacePlan((current) => ({ ...current, requiredProducts: items }))}
              helperText="Used for product coverage scoring on daily logs."
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFacePlan((current) => ({ ...current, sunscreenExpected: true }))}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                facePlan.sunscreenExpected !== false
                  ? "border-emerald-300/40 bg-emerald-400/12 text-emerald-100"
                  : "border-white/10 bg-white/[0.05] text-white/70"
              }`}
            >
              Sunscreen expected
            </button>
            <button
              type="button"
              onClick={() => setFacePlan((current) => ({ ...current, sunscreenExpected: false }))}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                facePlan.sunscreenExpected === false
                  ? "border-amber-300/40 bg-amber-400/12 text-amber-100"
                  : "border-white/10 bg-white/[0.05] text-white/70"
              }`}
            >
              Sunscreen optional
            </button>
          </div>
        </SectionCard>
      </div>

      <div className="pf-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
        <p className="pf-muted text-sm">
          Daily scoring and Groq analysis will use these settings as context. Morning and night routine switches are judged against this setup.
        </p>
        <div className="flex items-center gap-3">
          {status ? <span className="pf-muted text-sm">{status}</span> : null}
          <button
            type="button"
            onClick={saveSettings}
            disabled={isSaving}
            className="rounded-full border border-cyan-400/25 bg-cyan-400/12 px-5 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/18 disabled:cursor-wait disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </main>
  );
}
