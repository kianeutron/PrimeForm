import { PRIMEFORM_COACH_SYSTEM_PROMPT } from "@/data/coach-prompt";
import { appEnv } from "@/lib/env";
import { generateDailyInsights } from "@/lib/insights";
import { hasMeaningfulLogData } from "@/lib/log-state";
import { scoreDailyLog } from "@/lib/scoring";
import type { DailyInsights, DailyLog, DailyPlans, DailyPrimeScore, Pillar, ScoreReason } from "@/lib/types";

export type CoachPayload = {
  mode: "deterministic" | "groq";
  model: string;
  score: DailyPrimeScore;
  insights: DailyInsights & { headline: string };
};

type CoachContext = {
  history?: DailyLog[];
  profileName?: string | null;
  modelOverride?: string | null;
};

type AiScoreAdjustment = {
  label?: string;
  impact?: number;
  detail?: string;
};

type ParsedCoachResponse = {
  headline?: string;
  summary?: string;
  wins?: string[];
  improvements?: string[];
  tomorrow?: string[];
  score_adjustments?: Partial<Record<Pillar, AiScoreAdjustment[]>>;
};

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  const withoutFence = trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(withoutFence) as ParsedCoachResponse;
}

function ensureThree(items: string[] | undefined, fallback: string[]) {
  const normalized = (items ?? []).map((item) => item.trim()).filter(Boolean);
  return [...normalized, ...fallback].slice(0, 3);
}

function buildBlankCoach(model: string): CoachPayload {
  return {
    mode: "deterministic",
    model,
    score: {
      date: new Date().toISOString().slice(0, 10),
      face: { pillar: "face", score: 0, reasons: [] },
      physic: { pillar: "physic", score: 0, reasons: [] },
      brain: { pillar: "brain", score: 0, reasons: [] },
      overall: 0,
      reasons: [],
    },
    insights: {
      headline: "Ready for your first review",
      summary: "Log the key actions across Face, Physic, and Brain, then Primeform will generate a real daily analysis.",
      strengths: [
        "The workspace is ready to score the day once you log it.",
        "Face, Physic, and Brain can all be tracked from one review.",
        "The coach will become more specific as history builds.",
      ],
      improvements: [
        "No daily metrics are logged yet.",
        "There is not enough history to identify patterns.",
        "Custom plans are not shaping the advice yet.",
      ],
      tomorrowActions: [
        "Complete the evening review with your actual data.",
        "Track screen time and deep work so the Brain score is reliable.",
        "Log hydration and sleep because they affect every pillar.",
      ],
    },
  };
}

function summarizeHistory(history: DailyLog[] | undefined, plans?: DailyPlans) {
  const recent = (history ?? []).slice(0, 7);
  const scored = recent.map((entry) => scoreDailyLog(entry, plans));
  const previous = scored[0];
  const average =
    scored.length > 0
      ? Math.round(scored.reduce((sum, entry) => sum + entry.overall, 0) / scored.length)
      : null;

  return {
    recentDays: scored.map((entry) => ({
      date: entry.date,
      overall: entry.overall,
      face: entry.face.score,
      physic: entry.physic.score,
      brain: entry.brain.score,
    })),
    previousDayOverall: previous?.overall ?? null,
    rollingAverage: average,
  };
}

function collectFreeTextSignals(log: DailyLog) {
  const notes = [log.notes, log.shared?.notes, log.face?.notes, log.physic?.notes, log.brain?.notes]
    .map((value) => value?.trim())
    .filter(Boolean);

  return {
    faceProducts: log.face?.productsUsed ?? [],
    workoutType: log.physic?.workoutType ?? null,
    mealJournal: log.physic?.mealJournal ?? null,
    mealTiming: log.physic?.mealTiming ?? [],
    focusTopics: log.brain?.focusTopics ?? [],
    moodTags: log.brain?.moodTags ?? [],
    supplements: (log.brain?.supplements ?? []).map((entry) => ({
      name: entry.name,
      dose: entry.dose ?? null,
      amountMg: entry.amountMg ?? null,
      takenAt: entry.takenAt ?? null,
    })),
    reflections: notes,
  };
}

function clampImpact(value: number) {
  return Math.max(-4, Math.min(4, Math.round(value)));
}

function buildAiReason(pillar: Pillar, adjustment: AiScoreAdjustment, index: number): ScoreReason | null {
  if (!adjustment.label || !adjustment.detail || typeof adjustment.impact !== "number" || !Number.isFinite(adjustment.impact)) {
    return null;
  }

  const impact = clampImpact(adjustment.impact);
  if (impact === 0) {
    return null;
  }

  return {
    key: `ai_${pillar}_${index}`,
    label: adjustment.label.trim(),
    impact,
    detail: adjustment.detail.trim(),
    direction: impact > 0 ? "positive" : "negative",
  };
}

function applyAiScoreAdjustments(
  score: DailyPrimeScore,
  adjustments: Partial<Record<Pillar, AiScoreAdjustment[]>> | undefined,
): DailyPrimeScore {
  if (!adjustments) {
    return score;
  }

  const pillars: Pillar[] = ["face", "physic", "brain"];
  const nextScore: DailyPrimeScore = {
    ...score,
    face: { ...score.face, reasons: [...score.face.reasons] },
    physic: { ...score.physic, reasons: [...score.physic.reasons] },
    brain: { ...score.brain, reasons: [...score.brain.reasons] },
    reasons: [...score.reasons],
  };

  for (const pillar of pillars) {
    const reasons = (adjustments[pillar] ?? [])
      .map((adjustment, index) => buildAiReason(pillar, adjustment, index))
      .filter((reason): reason is ScoreReason => Boolean(reason));

    if (reasons.length === 0) {
      continue;
    }

    const totalImpact = Math.max(-6, Math.min(6, reasons.reduce((sum, reason) => sum + reason.impact, 0)));
    nextScore[pillar] = {
      ...nextScore[pillar],
      score: Math.max(0, Math.min(100, nextScore[pillar].score + totalImpact)),
      reasons: [...nextScore[pillar].reasons, ...reasons],
    };
  }

  nextScore.overall = Math.max(
    0,
    Math.min(100, Math.round((nextScore.face.score + nextScore.physic.score + nextScore.brain.score) / 3)),
  );
  nextScore.reasons = [...nextScore.face.reasons, ...nextScore.physic.reasons, ...nextScore.brain.reasons];

  return nextScore;
}

export async function generateCoachPayload(
  log: DailyLog,
  plans?: DailyPlans,
  context?: CoachContext,
): Promise<CoachPayload> {
  const model = context?.modelOverride?.trim() || appEnv.groqModel;

  if (!hasMeaningfulLogData(log)) {
    return buildBlankCoach(model);
  }

  const baseScore = scoreDailyLog(log, plans);
  const fallback = generateDailyInsights(baseScore);
  const historySummary = summarizeHistory(context?.history, plans);

  if (!appEnv.groqApiKey) {
    return {
      mode: "deterministic",
      model,
      score: baseScore,
      insights: {
        headline: `Prime score ${baseScore.overall}/100`,
        ...fallback,
      },
    };
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${appEnv.groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content: PRIMEFORM_COACH_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: JSON.stringify({
              profileName: context?.profileName ?? null,
              currentLog: log,
              score: baseScore,
              plans: plans ?? {},
              recentTrend: historySummary,
              fallback,
              freeTextSignals: collectFreeTextSignals(log),
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq request failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq response was empty");
    }

    const parsed = parseJsonObject(content);
    const score = applyAiScoreAdjustments(baseScore, parsed.score_adjustments);
    const scoreAwareFallback = generateDailyInsights(score);

    return {
      mode: "groq",
      model,
      score,
      insights: {
        headline: parsed.headline?.trim() || `Prime score ${score.overall}/100`,
        summary: parsed.summary?.trim() || scoreAwareFallback.summary,
        strengths: ensureThree(parsed.wins, scoreAwareFallback.strengths),
        improvements: ensureThree(parsed.improvements, scoreAwareFallback.improvements),
        tomorrowActions: ensureThree(parsed.tomorrow, scoreAwareFallback.tomorrowActions),
      },
    };
  } catch {
    return {
      mode: "deterministic",
      model,
      score: baseScore,
      insights: {
        headline: `Prime score ${baseScore.overall}/100`,
        ...fallback,
      },
    };
  }
}
