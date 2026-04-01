import type { DailyLog } from "@/lib/types";

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function createEmptyDailyLog(date = todayIsoDate()): DailyLog {
  return {
    date,
    shared: {},
    face: {
      productsUsed: [],
      skinCondition: {},
    },
    physic: {
      mealTiming: [],
      mealJournal: "",
      bodyMeasurements: {},
    },
    brain: {
      focusTopics: [],
      caffeineEntries: [],
      supplements: [],
      moodTags: [],
    },
    quickEvents: [],
    notes: "",
  };
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulValue(item));
  }

  if (typeof value === "object") {
    return Object.values(value).some((item) => hasMeaningfulValue(item));
  }

  return false;
}

export function hasMeaningfulLogData(log: DailyLog) {
  const { date, ...rest } = log;
  void date;
  return hasMeaningfulValue(rest);
}
