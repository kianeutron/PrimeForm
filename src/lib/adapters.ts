import type { DailyLog as DbDailyLog, DailyLogDraft as DbDailyLogDraft, JsonValue } from "@/lib/db/types";
import type { DailyInsights, DailyLog, DailyPrimeScore } from "@/lib/types";

function firstNumber(...values: Array<number | null | undefined>) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

export function toDbDailyLogDraft(log: DailyLog): DbDailyLogDraft {
  return {
    logDate: log.date,
    face: {
      skincareRoutineMorning: Boolean(log.face?.morningRoutineCompleted),
      skincareRoutineNight: Boolean(log.face?.nightRoutineCompleted),
      productsUsed: log.face?.productsUsed ?? [],
      sunscreenApplied: Boolean(log.face?.sunscreenApplied),
      sunscreenSpf: log.face?.sunscreenSpf ?? null,
      waterLiters: log.face?.waterLiters ?? log.shared?.waterLiters ?? null,
      sleepHours: log.face?.sleepHours ?? log.shared?.sleepHours ?? null,
      sleepQuality: log.face?.sleepQuality ?? log.shared?.sleepQuality ?? null,
      makeupWorn: Boolean(log.face?.makeupWorn),
      makeupRemoved: Boolean(log.face?.makeupRemoved),
      skinRating: {
        acne: log.face?.skinCondition?.acne ?? 5,
        texture: log.face?.skinCondition?.texture ?? log.face?.skinCondition?.overall ?? 5,
        glow: log.face?.skinCondition?.glow ?? log.face?.skinCondition?.overall ?? 5,
        dryness: log.face?.skinCondition?.dryness ?? 5,
      },
      notes: log.face?.notes ?? "",
    },
    physic: {
      workout: {
        completed: Boolean(log.physic?.workoutCompleted),
        workoutType: log.physic?.workoutType ?? "",
        durationMinutes: log.physic?.workoutMinutes ?? null,
        intensity:
          log.physic?.workoutIntensity === "high"
            ? 9
            : log.physic?.workoutIntensity === "moderate"
              ? 6
              : log.physic?.workoutIntensity === "low"
                ? 3
                : null,
      },
      caloriesConsumed: log.physic?.caloriesConsumed ?? null,
      caloriesTarget: log.physic?.calorieTarget ?? null,
      proteinGrams: log.physic?.proteinGrams ?? null,
      mealCount: log.physic?.mealsCount ?? null,
      mealTimes: log.physic?.mealTiming ?? [],
      mealJournal: log.physic?.mealJournal ?? "",
      waterLiters: log.physic?.waterLiters ?? log.shared?.waterLiters ?? null,
      steps: log.physic?.steps ?? null,
      sleepHours: log.physic?.sleepHours ?? log.shared?.sleepHours ?? null,
      sleepQuality: log.physic?.sleepQuality ?? log.shared?.sleepQuality ?? null,
      soreness: log.physic?.soreness ?? null,
      weightKg: log.physic?.bodyMeasurements?.weightKg ?? null,
      measurements: {
        chestCm: log.physic?.bodyMeasurements?.chestCm ?? null,
        waistCm: log.physic?.bodyMeasurements?.waistCm ?? null,
        hipsCm: log.physic?.bodyMeasurements?.hipsCm ?? null,
        armsCm: log.physic?.bodyMeasurements?.armsCm ?? null,
        thighsCm: log.physic?.bodyMeasurements?.thighsCm ?? null,
      },
      notes: log.physic?.notes ?? "",
    },
    brain: {
      deepWorkHours: log.brain?.deepWorkHours ?? null,
      topics: log.brain?.focusTopics ?? [],
      caffeineMg: log.brain?.caffeineMg ?? null,
      caffeineTakenAt: log.brain?.caffeineEntries?.[0]?.takenAt ?? null,
      supplements:
        log.brain?.supplements?.map((supplement) => ({
          name: supplement.name,
          dosage: supplement.dose ?? supplement.amountMg?.toString() ?? "",
          takenAt: supplement.takenAt ?? "",
        })) ?? [],
      screenTimeMinutes: log.brain?.screenTimeMinutes ?? null,
      screenTimeBreakdown: {
        social: log.brain?.socialMediaMinutes ?? null,
        entertainment: log.brain?.entertainmentMinutes ?? null,
      },
      socialScreenTimeMinutes:
        (log.brain?.socialMediaMinutes ?? 0) + (log.brain?.entertainmentMinutes ?? 0) || null,
      meditationMinutes: log.brain?.meditationMinutes ?? null,
      moodRating: log.brain?.moodRating ?? null,
      emotionTags: log.brain?.moodTags ?? [],
      mentalClarityRating: log.brain?.mentalClarity ?? null,
      sleepQuality: log.brain?.sleepQuality ?? log.shared?.sleepQuality ?? null,
      notes: log.brain?.notes ?? "",
    },
    notes: log.notes ?? log.shared?.notes ?? "",
  };
}

export function fromDbDailyLog(dbLog: DbDailyLog): DailyLog {
  const sharedWater = firstNumber(dbLog.payload.face.waterLiters, dbLog.payload.physic.waterLiters);
  const sharedSleepHours = firstNumber(dbLog.payload.face.sleepHours, dbLog.payload.physic.sleepHours);
  const sharedSleepQuality = firstNumber(
    dbLog.payload.face.sleepQuality,
    dbLog.payload.physic.sleepQuality,
    dbLog.payload.brain.sleepQuality,
  );

  return {
    date: dbLog.logDate,
    shared: {
      waterLiters: sharedWater,
      sleepHours: sharedSleepHours,
      sleepQuality: sharedSleepQuality,
      notes: dbLog.notes,
    },
    face: {
      morningRoutineCompleted: dbLog.payload.face.skincareRoutineMorning,
      nightRoutineCompleted: dbLog.payload.face.skincareRoutineNight,
      productsUsed: dbLog.payload.face.productsUsed,
      sunscreenApplied: dbLog.payload.face.sunscreenApplied,
      sunscreenSpf: dbLog.payload.face.sunscreenSpf ?? undefined,
      waterLiters: dbLog.payload.face.waterLiters ?? undefined,
      sleepHours: dbLog.payload.face.sleepHours ?? undefined,
      sleepQuality: dbLog.payload.face.sleepQuality ?? undefined,
      makeupWorn: dbLog.payload.face.makeupWorn,
      makeupRemoved: dbLog.payload.face.makeupRemoved,
      skinCondition: {
        acne: dbLog.payload.face.skinRating.acne,
        texture: dbLog.payload.face.skinRating.texture,
        glow: dbLog.payload.face.skinRating.glow,
        dryness: dbLog.payload.face.skinRating.dryness,
      },
      notes: dbLog.payload.face.notes,
    },
    physic: {
      workoutCompleted: dbLog.payload.physic.workout.completed,
      workoutType: dbLog.payload.physic.workout.workoutType,
      workoutMinutes: dbLog.payload.physic.workout.durationMinutes ?? undefined,
      workoutIntensity:
        dbLog.payload.physic.workout.intensity == null
          ? undefined
          : dbLog.payload.physic.workout.intensity >= 8
            ? "high"
            : dbLog.payload.physic.workout.intensity >= 5
              ? "moderate"
              : "low",
      caloriesConsumed: dbLog.payload.physic.caloriesConsumed ?? undefined,
      calorieTarget: dbLog.payload.physic.caloriesTarget ?? undefined,
      proteinGrams: dbLog.payload.physic.proteinGrams ?? undefined,
      mealsCount: dbLog.payload.physic.mealCount ?? undefined,
      mealTiming: dbLog.payload.physic.mealTimes,
      mealJournal: dbLog.payload.physic.mealJournal ?? undefined,
      waterLiters: dbLog.payload.physic.waterLiters ?? undefined,
      steps: dbLog.payload.physic.steps ?? undefined,
      sleepHours: dbLog.payload.physic.sleepHours ?? undefined,
      sleepQuality: dbLog.payload.physic.sleepQuality ?? undefined,
      soreness: dbLog.payload.physic.soreness ?? undefined,
      bodyMeasurements: {
        weightKg: dbLog.payload.physic.weightKg ?? undefined,
        chestCm: typeof dbLog.payload.physic.measurements.chestCm === "number" ? dbLog.payload.physic.measurements.chestCm : undefined,
        waistCm: typeof dbLog.payload.physic.measurements.waistCm === "number" ? dbLog.payload.physic.measurements.waistCm : undefined,
        hipsCm: typeof dbLog.payload.physic.measurements.hipsCm === "number" ? dbLog.payload.physic.measurements.hipsCm : undefined,
        armsCm: typeof dbLog.payload.physic.measurements.armsCm === "number" ? dbLog.payload.physic.measurements.armsCm : undefined,
        thighsCm: typeof dbLog.payload.physic.measurements.thighsCm === "number" ? dbLog.payload.physic.measurements.thighsCm : undefined,
      },
      notes: dbLog.payload.physic.notes,
    },
    brain: {
      deepWorkHours: dbLog.payload.brain.deepWorkHours ?? undefined,
      focusTopics: dbLog.payload.brain.topics,
      caffeineMg: dbLog.payload.brain.caffeineMg ?? undefined,
      caffeineEntries: dbLog.payload.brain.caffeineTakenAt
        ? [{ amountMg: dbLog.payload.brain.caffeineMg ?? undefined, takenAt: dbLog.payload.brain.caffeineTakenAt }]
        : undefined,
      supplements:
        dbLog.payload.brain.supplements?.map((supplement) => ({
          name: supplement.name,
          dose: supplement.dosage,
          takenAt: supplement.takenAt,
        })) ?? [],
      screenTimeMinutes: dbLog.payload.brain.screenTimeMinutes ?? undefined,
      socialMediaMinutes:
        typeof dbLog.payload.brain.screenTimeBreakdown.social === "number"
          ? dbLog.payload.brain.screenTimeBreakdown.social
          : undefined,
      entertainmentMinutes:
        typeof dbLog.payload.brain.screenTimeBreakdown.entertainment === "number"
          ? dbLog.payload.brain.screenTimeBreakdown.entertainment
          : undefined,
      meditationMinutes: dbLog.payload.brain.meditationMinutes ?? undefined,
      moodRating: dbLog.payload.brain.moodRating ?? undefined,
      moodTags: dbLog.payload.brain.emotionTags,
      mentalClarity: dbLog.payload.brain.mentalClarityRating ?? undefined,
      sleepQuality: dbLog.payload.brain.sleepQuality ?? undefined,
      notes: dbLog.payload.brain.notes,
    },
    notes: dbLog.notes,
  };
}

export function toAiSummaryRecord(
  score: DailyPrimeScore,
  insights: DailyInsights,
  mode: "groq" | "deterministic",
  model: string,
): Record<string, JsonValue> {
  return {
    mode,
    model,
    summary: insights.summary,
    strengths: insights.strengths,
    improvements: insights.improvements,
    tomorrowActions: insights.tomorrowActions,
    overall: score.overall,
    face: score.face.score,
    physic: score.physic.score,
    brain: score.brain.score,
  };
}
