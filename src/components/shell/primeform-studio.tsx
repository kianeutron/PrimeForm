"use client";

import { useRef, useState, type TouchEvent } from "react";
import { HistoryList } from "@/components/dashboard/history-list";
import type { HistoryItem } from "@/components/dashboard/history-list";
import { ScoreCard } from "@/components/dashboard/score-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import type { TrendPoint } from "@/components/dashboard/trend-chart";
import { FieldInput } from "@/components/forms/field-input";
import { SectionCard } from "@/components/forms/section-card";
import { TagInput } from "@/components/forms/tag-input";
import { MetricSlider } from "@/components/logging/metric-slider";
import { QuickStat } from "@/components/logging/quick-stat";
import { ToggleChip } from "@/components/logging/toggle-chip";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { generateDailyInsights } from "@/lib/insights";
import { scoreDailyLog } from "@/lib/scoring";
import type { DailyInsights, DailyLog, DailyPlans, DailyPrimeScore } from "@/lib/types";

type CoachViewModel = {
  mode: "deterministic" | "groq";
  model: string;
  score: DailyPrimeScore;
  insights: DailyInsights & { headline: string };
};

type MobileTab = "overview" | "log" | "coach" | "history";

const mobileTabs: MobileTab[] = ["overview", "log", "coach", "history"];

type PrimeformStudioProps = {
  initialLog: DailyLog;
  initialHistory: DailyLog[];
  initialPlans: DailyPlans;
  initialCoach: CoachViewModel;
  profileName: string | null;
  hasGroq: boolean;
  defaultModel: string;
  initialTab?: MobileTab;
};

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatDateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function buildFallbackCoach(score: DailyPrimeScore, model: string): CoachViewModel {
  const insights = generateDailyInsights(score);

  return {
    mode: "deterministic",
    model,
    score,
    insights: {
      headline: `Prime score ${score.overall}/100`,
      ...insights,
    },
  };
}

function dedupeHistory(logs: DailyLog[]) {
  const entries = new Map<string, DailyLog>();

  for (const log of logs) {
    entries.set(log.date, log);
  }

  return [...entries.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function buildHistoryItems(logs: DailyLog[], plans: DailyPlans): HistoryItem[] {
  const sorted = dedupeHistory(logs);

  return sorted.map((log, index) => {
    const current = scoreDailyLog(log, plans);
    const previous = sorted[index + 1] ? scoreDailyLog(sorted[index + 1], plans) : undefined;
    const delta = previous ? current.overall - previous.overall : 0;
    const insights = generateDailyInsights(current);
    const strongestReasons = [current.face, current.physic, current.brain]
      .flatMap((pillar) => pillar.reasons.filter((reason) => reason.direction === "positive").slice(0, 1))
      .map((reason) => reason.label)
      .slice(0, 3);

    return {
      id: log.date,
      dateLabel: formatDateLabel(log.date),
      title: log.date === sorted[0]?.date ? "Current daily review" : "Prime review",
      summary: insights.summary,
      faceScore: current.face.score,
      physicScore: current.physic.score,
      brainScore: current.brain.score,
      primeScore: current.overall,
      tags: strongestReasons,
      status: delta > 2 ? "up" : delta < -2 ? "down" : "flat",
    };
  });
}

function buildTrendData(logs: DailyLog[], plans: DailyPlans): TrendPoint[] {
  return dedupeHistory(logs)
    .slice(0, 7)
    .reverse()
    .map((log) => ({
      label: formatDateLabel(log.date),
      value: scoreDailyLog(log, plans).overall,
    }));
}

function buildStreak(logs: DailyLog[]) {
  const sorted = dedupeHistory(logs);

  if (sorted.length === 0) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = new Date(`${sorted[index - 1].date}T12:00:00`);
    const current = new Date(`${sorted[index].date}T12:00:00`);
    const diffDays = Math.round((previous.getTime() - current.getTime()) / 86_400_000);

    if (diffDays === 1) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

function shouldIgnoreSwipeTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, button, a, [contenteditable='true']"));
}

export function PrimeformStudio({
  initialLog,
  initialHistory,
  initialPlans,
  initialCoach,
  profileName,
  hasGroq,
  defaultModel,
  initialTab = "overview",
}: PrimeformStudioProps) {
  const [log, setLog] = useState<DailyLog>(initialLog);
  const [history, setHistory] = useState<DailyLog[]>(initialHistory);
  const [coach, setCoach] = useState<{ payload: CoachViewModel; stale: boolean }>({
    payload: initialCoach,
    stale: false,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [activeTab, setActiveTab] = useState<MobileTab>(initialTab);
  const swipeStartRef = useRef<{ x: number; y: number; ignore: boolean } | null>(null);

  const deterministicScore = scoreDailyLog(log, initialPlans);
  const fallbackCoach = buildFallbackCoach(deterministicScore, defaultModel);
  const activeCoach = coach.stale ? fallbackCoach : coach.payload;
  const score = activeCoach.score;
  const historyItems = buildHistoryItems([log, ...history], initialPlans);
  const trendData = buildTrendData([log, ...history], initialPlans);
  const streak = buildStreak([log, ...history]);
  const previousDay = historyItems[1];

  function updateLog(next: DailyLog) {
    setLog(next);
    setCoach((current) => ({ ...current, stale: true }));
    setSaveMessage("");
  }

  function moveTab(direction: "previous" | "next") {
    setActiveTab((current) => {
      const currentIndex = mobileTabs.indexOf(current);

      if (currentIndex === -1) {
        return current;
      }

      const nextIndex =
        direction === "next"
          ? Math.min(mobileTabs.length - 1, currentIndex + 1)
          : Math.max(0, currentIndex - 1);

      return mobileTabs[nextIndex];
    });
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      ignore: shouldIgnoreSwipeTarget(event.target),
    };
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const swipeStart = swipeStartRef.current;
    swipeStartRef.current = null;

    if (!swipeStart || swipeStart.ignore) {
      return;
    }

    const touch = event.changedTouches[0];

    if (!touch) {
      return;
    }

    const deltaX = touch.clientX - swipeStart.x;
    const deltaY = touch.clientY - swipeStart.y;
    const horizontalDistance = Math.abs(deltaX);
    const verticalDistance = Math.abs(deltaY);

    if (horizontalDistance < 64 || verticalDistance > 96 || horizontalDistance < verticalDistance * 1.35) {
      return;
    }

    if (deltaX < 0) {
      moveTab("next");
      return;
    }

    moveTab("previous");
  }

  function handleTouchCancel() {
    swipeStartRef.current = null;
  }

  function patchShared(patch: Partial<NonNullable<DailyLog["shared"]>>) {
    updateLog({
      ...log,
      shared: {
        ...log.shared,
        ...patch,
      },
    });
  }

  function patchFace(patch: Partial<NonNullable<DailyLog["face"]>>) {
    updateLog({
      ...log,
      face: {
        ...log.face,
        ...patch,
      },
    });
  }

  function patchPhysic(patch: Partial<NonNullable<DailyLog["physic"]>>) {
    updateLog({
      ...log,
      physic: {
        ...log.physic,
        ...patch,
      },
    });
  }

  function patchBrain(patch: Partial<NonNullable<DailyLog["brain"]>>) {
    updateLog({
      ...log,
      brain: {
        ...log.brain,
        ...patch,
      },
    });
  }

  async function refreshCoach() {
    setIsAnalyzing(true);
    setSaveMessage("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          log,
          plans: initialPlans,
          history,
          profileName,
          modelOverride: defaultModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const payload = (await response.json()) as CoachViewModel;
      setCoach({
        payload,
        stale: false,
      });
    } catch {
      setCoach({
        payload: fallbackCoach,
        stale: false,
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function saveSnapshot() {
    setSaveMessage("Saving to Supabase...");

    try {
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          log,
          plans: initialPlans,
          history,
          profileName,
          modelOverride: defaultModel,
        }),
      });

      if (!response.ok) {
        const failure = (await response.json().catch(() => null)) as { reason?: string } | null;
        throw new Error(failure?.reason || "Save request failed");
      }

      const payload = (await response.json()) as CoachViewModel & { saved: boolean; reason?: string };
      setCoach({
        payload,
        stale: false,
      });
      setHistory((current) => dedupeHistory([log, ...current]));
      setSaveMessage(payload.saved ? "Saved to Supabase." : payload.reason || "Save did not complete.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Save failed.");
    }
  }

  const heroSection = (
    <section
      id="overview"
      className="pf-panel scroll-mt-32 rounded-[2.5rem] p-6 md:p-8"
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-28 rounded-b-[2rem] bg-[radial-gradient(circle_at_top,rgba(101,217,255,0.12),transparent_72%)]" />
      <div className="max-w-3xl">
        <p className="pf-overline text-cyan-200/70">Primeform</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
          Face, Physic, Brain. One daily system.
        </h1>
        <p className="pf-muted mt-4 max-w-2xl text-base leading-7 sm:text-lg">
          Log the day, review your score, and keep momentum.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickStat
          label="Prime streak"
          value={`${streak}d`}
          detail="Consecutive logged days in the current timeline."
          delta={streak >= 3 ? "solid" : "start"}
          tone={streak >= 3 ? "emerald" : "amber"}
        />
        <QuickStat
          label="Deep work"
          value={log.brain?.deepWorkHours?.toFixed(1) ?? "0.0"}
          detail="Focused hours tracked for the current day."
          delta={`${score.brain.score}/100`}
          tone="cyan"
        />
        <QuickStat
          label="Hydration"
          value={`${(log.shared?.waterLiters ?? 0).toFixed(1)}L`}
          detail="Water intake is shared across face recovery and physical performance."
          delta={score.face.score >= 75 ? "skin-ready" : "raise it"}
          tone={score.face.score >= 75 ? "emerald" : "amber"}
        />
        <QuickStat
          label="Screen time"
          value={`${log.brain?.screenTimeMinutes ?? 0}m`}
          detail="Manual tracking keeps the brain score honest."
          delta={score.brain.score >= 75 ? "under control" : "trim it"}
          tone={score.brain.score >= 75 ? "emerald" : "rose"}
        />
      </div>
    </section>
  );

  const scoreCardsSection = (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      <ScoreCard
        title="Prime"
        score={score.overall}
        subtitle="Overall daily score"
        footnote={activeCoach.insights.headline}
        tone="violet"
        delta={previousDay ? score.overall - previousDay.primeScore : undefined}
      />
      <ScoreCard
        title="Face"
        score={score.face.score}
        subtitle="Skin health and aesthetics"
        tone="emerald"
        delta={previousDay ? score.face.score - (previousDay.faceScore ?? 0) : undefined}
      />
      <ScoreCard
        title="Physic"
        score={score.physic.score}
        subtitle="Body performance and recovery"
        tone="amber"
        delta={previousDay ? score.physic.score - (previousDay.physicScore ?? 0) : undefined}
      />
      <ScoreCard
        title="Brain"
        score={score.brain.score}
        subtitle="Focus, mood, and cognition"
        tone="cyan"
        delta={previousDay ? score.brain.score - (previousDay.brainScore ?? 0) : undefined}
      />
    </div>
  );

  const loggingSections = (
    <div id="log" className="scroll-mt-32 space-y-8">
      <SectionCard
        eyebrow="Daily Review"
        title="Shared foundation"
        description="These habits influence all three pillars and should be logged first."
        accent="cyan"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FieldInput
            label="Review date"
            type="date"
            value={log.date}
            onChange={(value) => updateLog({ ...log, date: value })}
          />
          <FieldInput
            label="Water liters"
            type="number"
            step={0.1}
            value={log.shared?.waterLiters ?? ""}
            onChange={(value) => patchShared({ waterLiters: parseOptionalNumber(value) })}
            placeholder="2.8"
          />
          <FieldInput
            label="Sleep hours"
            type="number"
            step={0.1}
            value={log.shared?.sleepHours ?? ""}
            onChange={(value) => patchShared({ sleepHours: parseOptionalNumber(value) })}
            placeholder="7.5"
          />
          <MetricSlider
            label="Sleep quality"
            helperText="How restorative did last night feel?"
            value={log.shared?.sleepQuality ?? 5}
            onChange={(value) => patchShared({ sleepQuality: value })}
          />
        </div>

        <label className="mt-4 block rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
          <span className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Reflection</span>
          <textarea
            value={log.notes ?? ""}
            onChange={(event) => updateLog({ ...log, notes: event.target.value })}
            placeholder="What actually drove the day?"
            rows={4}
            className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
          />
        </label>
      </SectionCard>

      <SectionCard
        eyebrow="Face"
        title="Skin health and presentation"
        description="Track consistency, protection, and how your skin actually responded."
        accent="emerald"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ToggleChip
            label="Morning routine"
            description="Cleanser, treatment, moisturizer, SPF."
            checked={Boolean(log.face?.morningRoutineCompleted)}
            onChange={(checked) => patchFace({ morningRoutineCompleted: checked })}
          />
          <ToggleChip
            label="Night routine"
            description="Cleanse, repair, recover before sleep."
            checked={Boolean(log.face?.nightRoutineCompleted)}
            onChange={(checked) => patchFace({ nightRoutineCompleted: checked })}
          />
          <ToggleChip
            label="Sunscreen applied"
            description="Critical for long-term skin score quality."
            checked={Boolean(log.face?.sunscreenApplied)}
            onChange={(checked) => patchFace({ sunscreenApplied: checked })}
          />
          <FieldInput
            label="SPF"
            type="number"
            value={log.face?.sunscreenSpf ?? ""}
            onChange={(value) => patchFace({ sunscreenSpf: parseOptionalNumber(value) })}
            placeholder="50"
          />
          <TagInput
            label="Products used"
            value={log.face?.productsUsed ?? []}
            onChange={(productsUsed) => patchFace({ productsUsed })}
            helperText="Examples: cleanser, vitamin c, moisturizer, retinol."
          />
          <ToggleChip
            label="Makeup worn"
            description="Track wear so removal counts properly."
            checked={Boolean(log.face?.makeupWorn)}
            onChange={(checked) => patchFace({ makeupWorn: checked })}
          />
          <ToggleChip
            label="Makeup removed"
            description="Only matters if makeup was worn."
            checked={Boolean(log.face?.makeupRemoved)}
            onChange={(checked) => patchFace({ makeupRemoved: checked })}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricSlider
            label="Acne"
            helperText="Lower is better."
            value={log.face?.skinCondition?.acne ?? 5}
            onChange={(value) =>
              patchFace({
                skinCondition: {
                  ...log.face?.skinCondition,
                  acne: value,
                },
              })
            }
          />
          <MetricSlider
            label="Texture"
            helperText="How smooth and even did skin feel?"
            value={log.face?.skinCondition?.texture ?? 5}
            onChange={(value) =>
              patchFace({
                skinCondition: {
                  ...log.face?.skinCondition,
                  texture: value,
                },
              })
            }
          />
          <MetricSlider
            label="Glow"
            helperText="Overall radiance and vitality."
            value={log.face?.skinCondition?.glow ?? 5}
            onChange={(value) =>
              patchFace({
                skinCondition: {
                  ...log.face?.skinCondition,
                  glow: value,
                },
              })
            }
          />
          <MetricSlider
            label="Dryness"
            helperText="Lower is better."
            value={log.face?.skinCondition?.dryness ?? 5}
            onChange={(value) =>
              patchFace({
                skinCondition: {
                  ...log.face?.skinCondition,
                  dryness: value,
                },
              })
            }
          />
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Physic"
        title="Body output and recovery"
        description="Capture training quality, food alignment, movement, and recovery strain."
        accent="amber"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ToggleChip
            label="Workout completed"
            description="Mark whether the planned session happened."
            checked={Boolean(log.physic?.workoutCompleted)}
            onChange={(checked) => patchPhysic({ workoutCompleted: checked })}
          />
          <FieldInput
            label="Workout type"
            value={log.physic?.workoutType ?? ""}
            onChange={(value) => patchPhysic({ workoutType: value })}
            placeholder="Upper body, legs, run..."
          />
          <FieldInput
            label="Workout minutes"
            type="number"
            value={log.physic?.workoutMinutes ?? ""}
            onChange={(value) => patchPhysic({ workoutMinutes: parseOptionalNumber(value) })}
            placeholder="55"
          />
          <FieldInput
            label="Calories"
            type="number"
            value={log.physic?.caloriesConsumed ?? ""}
            onChange={(value) => patchPhysic({ caloriesConsumed: parseOptionalNumber(value) })}
            placeholder="2200"
          />
          <FieldInput
            label="Protein grams"
            type="number"
            value={log.physic?.proteinGrams ?? ""}
            onChange={(value) => patchPhysic({ proteinGrams: parseOptionalNumber(value) })}
            placeholder="150"
          />
          <FieldInput
            label="Steps"
            type="number"
            value={log.physic?.steps ?? ""}
            onChange={(value) => patchPhysic({ steps: parseOptionalNumber(value) })}
            placeholder="10000"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricSlider
            label="Workout intensity"
            helperText="1 low, 10 maximal."
            value={
              log.physic?.workoutIntensity === "high"
                ? 9
                : log.physic?.workoutIntensity === "moderate"
                  ? 6
                  : log.physic?.workoutIntensity === "low"
                    ? 3
                    : 5
            }
            onChange={(value) =>
              patchPhysic({
                workoutIntensity: value >= 8 ? "high" : value >= 5 ? "moderate" : "low",
              })
            }
          />
          <MetricSlider
            label="Soreness"
            helperText="Lower usually means recovery is on track."
            value={log.physic?.soreness ?? 4}
            onChange={(value) => patchPhysic({ soreness: value })}
          />
          <FieldInput
            label="Meals count"
            type="number"
            value={log.physic?.mealsCount ?? ""}
            onChange={(value) => patchPhysic({ mealsCount: parseOptionalNumber(value) })}
            placeholder="4"
          />
          <FieldInput
            label="Calorie target"
            type="number"
            value={log.physic?.calorieTarget ?? initialPlans.physic?.calorieTarget ?? ""}
            onChange={(value) => patchPhysic({ calorieTarget: parseOptionalNumber(value) })}
            placeholder="2200"
          />
        </div>

        <label className="mt-4 block rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
          <span className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Food intake journal</span>
          <p className="mt-2 text-sm leading-6 text-white/50">
            Log meals, snacks, drinks, and rough amounts so nutrition quality can be analyzed.
          </p>
          <textarea
            value={log.physic?.mealJournal ?? ""}
            onChange={(event) => patchPhysic({ mealJournal: event.target.value })}
            placeholder="Breakfast: Greek yogurt, berries, honey, oats. Lunch: chicken rice bowl with avocado. Snack: apple and protein shake. Dinner: salmon, potatoes, salad. 2 coffees, 1 soda."
            rows={6}
            className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
          />
        </label>
      </SectionCard>

      <SectionCard
        eyebrow="Brain"
        title="Focus, mood, and cognitive sharpness"
        description="Track attention quality, mental load, and the habits that protect clear thinking."
        accent="cyan"
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <FieldInput
            label="Deep work hours"
            type="number"
            step={0.1}
            value={log.brain?.deepWorkHours ?? ""}
            onChange={(value) => patchBrain({ deepWorkHours: parseOptionalNumber(value) })}
            placeholder="4.0"
          />
          <FieldInput
            label="Caffeine mg"
            type="number"
            value={log.brain?.caffeineMg ?? ""}
            onChange={(value) => patchBrain({ caffeineMg: parseOptionalNumber(value) })}
            placeholder="150"
          />
          <FieldInput
            label="Screen time minutes"
            type="number"
            value={log.brain?.screenTimeMinutes ?? ""}
            onChange={(value) => patchBrain({ screenTimeMinutes: parseOptionalNumber(value) })}
            placeholder="180"
          />
          <FieldInput
            label="Social media minutes"
            type="number"
            value={log.brain?.socialMediaMinutes ?? ""}
            onChange={(value) => patchBrain({ socialMediaMinutes: parseOptionalNumber(value) })}
            placeholder="45"
          />
          <FieldInput
            label="Entertainment minutes"
            type="number"
            value={log.brain?.entertainmentMinutes ?? ""}
            onChange={(value) => patchBrain({ entertainmentMinutes: parseOptionalNumber(value) })}
            placeholder="30"
          />
          <FieldInput
            label="Meditation minutes"
            type="number"
            value={log.brain?.meditationMinutes ?? ""}
            onChange={(value) => patchBrain({ meditationMinutes: parseOptionalNumber(value) })}
            placeholder="10"
          />
          <TagInput
            label="Focus topics"
            value={log.brain?.focusTopics ?? []}
            onChange={(focusTopics) => patchBrain({ focusTopics })}
            helperText="Examples: ML, UI Design, Math."
          />
          <TagInput
            label="Mood tags"
            value={log.brain?.moodTags ?? []}
            onChange={(moodTags) => patchBrain({ moodTags })}
            helperText="Examples: calm, sharp, stressed."
          />
          <TagInput
            label="Supplements"
            value={(log.brain?.supplements ?? []).map((supplement) => supplement.name)}
            onChange={(names) =>
              patchBrain({
                supplements: names.map((name) => ({ name })),
              })
            }
            helperText="Add nootropics, supplements, or medications taken today."
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricSlider label="Mood" value={log.brain?.moodRating ?? 5} onChange={(value) => patchBrain({ moodRating: value })} />
          <MetricSlider
            label="Mental clarity"
            value={log.brain?.mentalClarity ?? 5}
            onChange={(value) => patchBrain({ mentalClarity: value })}
          />
          <MetricSlider
            label="Sleep carryover"
            helperText="How much sleep supported brain performance."
            value={log.brain?.sleepQuality ?? log.shared?.sleepQuality ?? 5}
            onChange={(value) => patchBrain({ sleepQuality: value })}
          />
          <MetricSlider
            label="Cognitive pressure"
            helperText="Proxy via workload strain. Lower is calmer."
            value={Math.max(1, 10 - (log.brain?.mentalClarity ?? 5))}
            onChange={(value) => patchBrain({ mentalClarity: 11 - value })}
          />
        </div>
      </SectionCard>
    </div>
  );

  const coachSection = (
    <SectionCard
      id="coach"
      eyebrow="AI Coach"
      title={activeCoach.insights.headline}
      description={activeCoach.insights.summary}
      accent="cyan"
    >
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={refreshCoach}
          disabled={isAnalyzing}
          className="rounded-full border border-cyan-400/25 bg-cyan-400/12 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/18 disabled:cursor-wait disabled:opacity-60"
        >
          {isAnalyzing ? "Analyzing..." : hasGroq ? "Refresh Groq coach" : "Refresh deterministic coach"}
        </button>
        <button
          type="button"
          onClick={saveSnapshot}
          className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
        >
          Save to Supabase
        </button>
      </div>

      {saveMessage ? <p className="mt-4 text-sm text-white/58">{saveMessage}</p> : null}

      <div className="mt-6 grid gap-4">
        <CoachList title="What went well" items={activeCoach.insights.strengths} tone="emerald" />
        <CoachList title="What needs work" items={activeCoach.insights.improvements} tone="amber" />
        <CoachList title="Tomorrow" items={activeCoach.insights.tomorrowActions} tone="cyan" />
      </div>
    </SectionCard>
  );

  const historySection = (
    <div id="history" className="scroll-mt-32 space-y-8">
      <TrendChart
        title="Prime trend"
        subtitle="Daily prime score across the current history window."
        data={trendData}
        yAxisLabel="Prime"
      />

      <HistoryList
        items={historyItems}
        emptyState="Log your first evening review to start the Prime timeline."
      />
    </div>
  );

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-[1780px] touch-pan-y flex-col gap-8 px-5 py-6 pb-28 sm:px-8 lg:px-12 xl:px-14 xl:pb-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="xl:block">
        <div className={activeTab === "overview" ? "xl:block" : "hidden xl:block"}>{heroSection}</div>
      </div>

      <section className="space-y-8 xl:hidden">
        {activeTab === "overview" ? (
          <>
            {scoreCardsSection}
            <TrendChart
              title="Prime trend"
              subtitle="Your recent score movement at a glance."
              data={trendData}
              yAxisLabel="Prime"
            />
          </>
        ) : null}

        {activeTab === "log" ? <div className="space-y-8">{loggingSections}</div> : null}
        {activeTab === "coach" ? coachSection : null}
        {activeTab === "history" ? <div className="space-y-8">{historySection}</div> : null}
      </section>

      <section className="hidden space-y-8 xl:block">
        <div className="space-y-8">
          {scoreCardsSection}
          {loggingSections}
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] 2xl:grid-cols-[0.82fr_1.18fr]">
          <aside>{coachSection}</aside>
          <div>{historySection}</div>
        </div>
      </section>

      <MobileBottomNav activeTab={activeTab} onDashboardTabChange={setActiveTab} />
    </main>
  );
}

function CoachList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "amber" | "cyan";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : tone === "amber"
        ? "border-amber-400/20 bg-amber-400/10 text-amber-100"
        : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100";

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
      <div className="text-xs font-medium uppercase tracking-[0.22em] text-white/38">{title}</div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className={`rounded-2xl border px-3 py-3 text-sm leading-6 ${toneClass}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
