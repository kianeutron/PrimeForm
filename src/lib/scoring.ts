import type {
  BrainDailyLog,
  BrainPlan,
  DailyLog,
  DailyPlans,
  DailyPrimeScore,
  FaceDailyLog,
  FacePlan,
  Intensity,
  PillarScore,
  PhysicDailyLog,
  PhysicPlan,
  ScoreReason,
} from "./types";

const DEFAULT_FACE_PLAN: Required<Pick<FacePlan, "sunscreenExpected" | "waterTargetLiters" | "sleepTargetHours" | "sleepTargetQuality">> = {
  sunscreenExpected: true,
  waterTargetLiters: 2,
  sleepTargetHours: 7.5,
  sleepTargetQuality: 7,
};

const DEFAULT_PHYSIC_PLAN: Required<Pick<PhysicPlan, "workoutTargetMinutes" | "calorieTarget" | "proteinTargetGrams" | "mealsTarget" | "waterTargetLiters" | "stepTarget" | "sleepTargetHours" | "sleepTargetQuality" | "sorenessTargetMax">> = {
  workoutTargetMinutes: 45,
  calorieTarget: 2200,
  proteinTargetGrams: 120,
  mealsTarget: 4,
  waterTargetLiters: 3,
  stepTarget: 8000,
  sleepTargetHours: 7.5,
  sleepTargetQuality: 7,
  sorenessTargetMax: 4,
};

const PROTEIN_GRAMS_PER_KG = 1.6;
const BASELINE_ACTIVITY_FACTOR = 1.4;

const DEFAULT_BRAIN_PLAN: Required<Pick<BrainPlan, "deepWorkTargetHours" | "screenTimeMaxMinutes" | "socialMediaMaxMinutes" | "meditationTargetMinutes" | "caffeineMaxMg" | "sleepTargetHours" | "sleepTargetQuality" | "moodTargetMinimum" | "clarityTargetMinimum">> = {
  deepWorkTargetHours: 4,
  screenTimeMaxMinutes: 180,
  socialMediaMaxMinutes: 60,
  meditationTargetMinutes: 10,
  caffeineMaxMg: 250,
  sleepTargetHours: 7.5,
  sleepTargetQuality: 7,
  moodTargetMinimum: 7,
  clarityTargetMinimum: 7,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function definedList(values?: readonly string[]): string[] {
  return (values ?? []).map((value) => value.trim()).filter(Boolean);
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeEntries(values?: readonly string[]): string[] {
  return definedList(values).map(normalizeText);
}

function hasKeyword(entries: readonly string[], keywords: readonly string[]): boolean {
  return entries.some((entry) => keywords.some((keyword) => entry.includes(keyword)));
}

function sum(values: Array<number | undefined>): number {
  return values.filter(isFiniteNumber).reduce((total, value) => total + value, 0);
}

function parseHour(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return undefined;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return undefined;
  }

  return hours + (minutes / 60);
}

const SKINCARE_EVIDENCE = {
  cleanser: ["cleanser", "face wash", "gel wash", "foam cleanser", "cleansing"],
  moisturizer: ["moisturizer", "cream", "ceramide", "lotion", "emollient", "barrier", "cica"],
  sunscreen: ["sunscreen", "spf", "sunblock", "uv"],
  retinoid: ["retinol", "retinal", "tretinoin", "adapalene", "retinoid"],
  antioxidant: ["vitamin c", "ascorbic", "antioxidant", "ferulic"],
  acneActive: ["salicylic", "bha", "benzoyl", "azelaic", "adapalene", "sulfur"],
  hydration: ["hyaluronic", "glycerin", "panthenol", "squalane", "urea"],
  eyeCare: ["eye serum", "under eye", "eye cream", "eye gel", "caffeine eye", "eye treatment"],
  hairGrowth: ["minoxidil", "rogaine"],
} as const;

type SkincareCategory = keyof typeof SKINCARE_EVIDENCE;

function detectSkincareCategories(entry: string): SkincareCategory[] {
  const categories = (Object.keys(SKINCARE_EVIDENCE) as SkincareCategory[]).filter((category) =>
    SKINCARE_EVIDENCE[category].some((keyword) => entry.includes(keyword)),
  );

  if (categories.length > 0) {
    return categories;
  }

  if (entry.includes("face wash")) {
    return ["cleanser"];
  }

  if (entry.includes("eye serum") || entry.includes("under eye serum")) {
    return ["eyeCare"];
  }

  return [];
}

const SUPPLEMENT_EVIDENCE = {
  strongPerformance: ["creatine monohydrate", "creatine", "whey", "protein powder", "casein", "electrolyte"],
  probableRecovery: ["omega-3", "fish oil", "epa", "dha", "vitamin d", "magnesium"],
  possibleFocus: ["l-theanine", "theanine", "rhodiola", "bacopa"],
  sleepSupport: ["melatonin", "magnesium glycinate", "glycine"],
  highStimulant: ["pre-workout", "preworkout", "yohimbine", "dmaa", "synephrine"],
  uncertainNootropic: ["alpha gpc", "alpha-gpc", "noopept", "phenibut", "racetam", "modafinil"],
} as const;

function average(values: Array<number | undefined>): number | undefined {
  const filtered = values.filter(isFiniteNumber);
  if (filtered.length === 0) {
    return undefined;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function ratingToScore(value: number | undefined, weight: number, maxRating = 10): number {
  if (!isFiniteNumber(value)) {
    return 0;
  }

  return weight * clamp(value / maxRating, 0, 1);
}

function minimumRatingScore(value: number | undefined, minimum: number, weight: number): number {
  if (!isFiniteNumber(value) || !isFiniteNumber(minimum) || minimum <= 0) {
    return 0;
  }

  if (value >= minimum) {
    return weight;
  }

  return weight * clamp(value / minimum, 0, 1);
}

function ratioToScore(actual: number | undefined, target: number, weight: number): number {
  if (!isFiniteNumber(actual) || !isFiniteNumber(target) || target <= 0) {
    return 0;
  }

  return weight * clamp(actual / target, 0, 1);
}

function inverseRatioToScore(actual: number | undefined, targetMax: number, weight: number): number {
  if (!isFiniteNumber(actual) || !isFiniteNumber(targetMax) || targetMax <= 0) {
    return 0;
  }

  if (actual <= targetMax) {
    return weight;
  }

  const overflow = (actual - targetMax) / targetMax;
  return weight * clamp(1 - overflow, 0, 1);
}

function bandScore(actual: number | undefined, target: number, weight: number, tolerance = 0.15): number {
  if (!isFiniteNumber(actual) || !isFiniteNumber(target) || target <= 0) {
    return 0;
  }

  const lower = target * (1 - tolerance);
  const upper = target * (1 + tolerance);

  if (actual >= lower && actual <= upper) {
    return weight;
  }

  if (actual < lower) {
    return weight * clamp(actual / lower, 0, 1);
  }

  const overflow = (actual - upper) / upper;
  return weight * clamp(1 - overflow * 1.5, 0, 1);
}

function estimateCalorieTarget(plan: PhysicPlan): number | undefined {
  if (!isFiniteNumber(plan.bodyWeightKg) || !isFiniteNumber(plan.heightCm) || !isFiniteNumber(plan.age)) {
    return undefined;
  }

  const sexAdjustment =
    plan.biologicalSex === "male" ? 5 : plan.biologicalSex === "female" ? -161 : -78;
  const bmr = (10 * plan.bodyWeightKg) + (6.25 * plan.heightCm) - (5 * plan.age) + sexAdjustment;

  return bmr > 0 ? Math.round(bmr * BASELINE_ACTIVITY_FACTOR) : undefined;
}

function resolveProteinTarget(plan: PhysicPlan, explicitTarget: number): number {
  if (isFiniteNumber(plan.proteinTargetGrams) && plan.proteinTargetGrams > 0) {
    return plan.proteinTargetGrams;
  }

  if (isFiniteNumber(plan.bodyWeightKg) && plan.bodyWeightKg > 0) {
    return Math.round(plan.bodyWeightKg * PROTEIN_GRAMS_PER_KG);
  }

  return explicitTarget;
}

function createReason(key: string, label: string, score: number, weight: number, detail: string): ScoreReason {
  const normalizedScore = clamp(score, 0, weight);
  const direction = normalizedScore >= weight * 0.7 ? "positive" : "negative";
  const impact = direction === "positive" ? round(normalizedScore) : -round(weight - normalizedScore);

  return {
    key,
    label,
    impact,
    detail,
    direction,
  };
}

function resolveSharedSleepHours(log: DailyLog, face?: FaceDailyLog, physic?: PhysicDailyLog, brain?: BrainDailyLog): number | undefined {
  return log.shared?.sleepHours ?? face?.sleepHours ?? physic?.sleepHours ?? brain?.sleepHours;
}

function resolveSharedSleepQuality(log: DailyLog, face?: FaceDailyLog, physic?: PhysicDailyLog, brain?: BrainDailyLog): number | undefined {
  return log.shared?.sleepQuality ?? face?.sleepQuality ?? physic?.sleepQuality ?? brain?.sleepQuality;
}

function countProductCoverage(requiredProducts: string[] | undefined, productsUsed: string[] | undefined): number {
  const required = normalizeEntries(requiredProducts);
  const used = normalizeEntries(productsUsed);

  if (required.length === 0) {
    return used.length > 0 ? Math.min(used.length / 4, 1) : 0;
  }

  if (used.length === 0) {
    return 0;
  }

  const usedSet = new Set(used);
  const usedCategories = new Set(used.flatMap((entry) => detectSkincareCategories(entry)));
  const covered = required.filter((product) => {
    if (usedSet.has(product)) {
      return true;
    }

    const requiredCategories = detectSkincareCategories(product);
    return requiredCategories.some((category) => usedCategories.has(category));
  }).length;

  return covered / required.length;
}

function scoreSkincareEvidence(productsUsed: string[] | undefined): { score: number; detail: string } {
  const products = normalizeEntries(productsUsed);

  if (products.length === 0) {
    return {
      score: 0,
      detail: "No skincare products were logged.",
    };
  }

  const evidencePoints = sum([
    hasKeyword(products, SKINCARE_EVIDENCE.cleanser) ? 2.5 : 0,
    hasKeyword(products, SKINCARE_EVIDENCE.moisturizer) ? 3 : 0,
    hasKeyword(products, SKINCARE_EVIDENCE.retinoid) ? 3.5 : 0,
    hasKeyword(products, SKINCARE_EVIDENCE.antioxidant) ? 2 : 0,
    hasKeyword(products, SKINCARE_EVIDENCE.acneActive) ? 2.5 : 0,
    hasKeyword(products, SKINCARE_EVIDENCE.hydration) ? 2.5 : 0,
    hasKeyword(products, SKINCARE_EVIDENCE.eyeCare) ? 1.5 : 0,
  ]);

  const fallbackPoints = evidencePoints === 0 ? Math.min(products.length, 2) : 0;
  const score = clamp(evidencePoints + fallbackPoints, 0, 16);
  const signals: string[] = [];

  if (hasKeyword(products, SKINCARE_EVIDENCE.retinoid)) {
    signals.push("retinoid");
  }

  if (hasKeyword(products, SKINCARE_EVIDENCE.antioxidant)) {
    signals.push("antioxidant");
  }

  if (hasKeyword(products, SKINCARE_EVIDENCE.acneActive)) {
    signals.push("acne active");
  }

  if (hasKeyword(products, SKINCARE_EVIDENCE.moisturizer) || hasKeyword(products, SKINCARE_EVIDENCE.hydration)) {
    signals.push("barrier/hydration support");
  }

  if (hasKeyword(products, SKINCARE_EVIDENCE.eyeCare)) {
    signals.push("eye-area care");
  }

  if (hasKeyword(products, SKINCARE_EVIDENCE.hairGrowth)) {
    signals.push("hair-growth treatment logged separately");
  }

  return {
    score,
    detail:
      hasKeyword(products, SKINCARE_EVIDENCE.hairGrowth) && signals.length === 1
        ? "Hair-growth treatment like minoxidil was logged, but it is not treated as a core face-skin quality driver."
        : signals.length > 0
        ? `Products include ${signals.join(", ")} support.`
        : `Products were logged, but no strongly evidence-based active was clearly recognized.`,
  };
}

function workoutLoadMultiplier(intensity: Intensity | undefined): number {
  switch (intensity) {
    case "high":
      return 1.6;
    case "moderate":
      return 1;
    case "low":
      return 0.7;
    default:
      return 0.85;
  }
}

function resolveCaffeineMg(brain: BrainDailyLog): number | undefined {
  if (isFiniteNumber(brain.caffeineMg)) {
    return brain.caffeineMg;
  }

  const total = sum((brain.caffeineEntries ?? []).map((entry) => entry.amountMg));
  return total > 0 ? total : undefined;
}

function countLateCaffeineEntries(brain: BrainDailyLog): number {
  return (brain.caffeineEntries ?? []).filter((entry) => {
    const hour = parseHour(entry.takenAt);
    return isFiniteNumber(hour) && hour >= 14;
  }).length;
}

function scoreSupplementEvidence(brain: BrainDailyLog): { score: number; detail: string } {
  const names = normalizeEntries((brain.supplements ?? []).map((entry) => entry.name));

  if (names.length === 0) {
    return {
      score: 0,
      detail: "No supplements were logged.",
    };
  }

  let score = 0;
  const notes: string[] = [];

  if (hasKeyword(names, SUPPLEMENT_EVIDENCE.strongPerformance)) {
    score += 2;
    notes.push("performance-supported");
  }

  if (hasKeyword(names, SUPPLEMENT_EVIDENCE.probableRecovery)) {
    score += 1.5;
    notes.push("recovery/general health support");
  }

  if (hasKeyword(names, SUPPLEMENT_EVIDENCE.possibleFocus) || hasKeyword(names, SUPPLEMENT_EVIDENCE.sleepSupport)) {
    score += 1;
    notes.push("possible focus or sleep support");
  }

  if (hasKeyword(names, SUPPLEMENT_EVIDENCE.highStimulant)) {
    score -= 1.5;
    notes.push("high-stimulant product");
  }

  if (hasKeyword(names, SUPPLEMENT_EVIDENCE.uncertainNootropic)) {
    score -= 0.5;
    notes.push("weak-evidence nootropic");
  }

  return {
    score: clamp(score, 0, 4),
    detail: notes.length > 0 ? `Supplement profile includes ${notes.join(", ")}.` : "Supplements were logged with unclear evidence value.",
  };
}

function scoreFace(log: DailyLog, plans?: FacePlan): PillarScore {
  const face = log.face;
  if (!face) {
    return {
      pillar: "face",
      score: 0,
      reasons: [
        createReason("face_missing", "Face log missing", 0, 100, "No face log was submitted for this day."),
      ],
    };
  }

  const plan = plans ?? {};
  const waterTarget = plan.waterTargetLiters ?? DEFAULT_FACE_PLAN.waterTargetLiters;
  const sleepTargetHours = plan.sleepTargetHours ?? DEFAULT_FACE_PLAN.sleepTargetHours;
  const sleepTargetQuality = plan.sleepTargetQuality ?? DEFAULT_FACE_PLAN.sleepTargetQuality;
  const morningRoutineSize = definedList(plan.morningRoutineItems).length;
  const nightRoutineSize = definedList(plan.nightRoutineItems).length;
  const waterLiters = log.shared?.waterLiters ?? face.waterLiters;
  const sleepHours = resolveSharedSleepHours(log, face);
  const sleepQuality = resolveSharedSleepQuality(log, face);
  const productsScoreRatio = countProductCoverage(plan.requiredProducts, face.productsUsed);
  const skincareEvidence = scoreSkincareEvidence(face.productsUsed);
  const skinCondition = face.skinCondition;
  const skinAverage =
    skinCondition?.overall ??
    average([
      isFiniteNumber(skinCondition?.acne) ? 11 - (skinCondition?.acne as number) : undefined,
      skinCondition?.texture,
      skinCondition?.glow,
      isFiniteNumber(skinCondition?.dryness) ? 11 - (skinCondition?.dryness as number) : undefined,
    ]);

  const morningScoreWeight = morningRoutineSize > 0 ? 8 : 6;
  const nightScoreWeight = nightRoutineSize > 0 ? 8 : 6;
  const morningScore = face.morningRoutineCompleted ? morningScoreWeight : 0;
  const nightScore = face.nightRoutineCompleted ? nightScoreWeight : 0;
  const planCoverageScore = productsScoreRatio > 0 ? 4 * clamp(productsScoreRatio, 0, 1) : 0;
  const productsScore = clamp(skincareEvidence.score + planCoverageScore, 0, 16);
  const sunscreenExpected = plan.sunscreenExpected ?? DEFAULT_FACE_PLAN.sunscreenExpected;
  const sunscreenScore = sunscreenExpected
    ? face.sunscreenApplied
      ? face.sunscreenSpf && face.sunscreenSpf >= 30
        ? 18
        : face.sunscreenSpf && face.sunscreenSpf >= 15
          ? 13
          : 15
      : 0
    : 14;
  const waterScore = ratioToScore(waterLiters, waterTarget, 8);
  const sleepHoursScore = ratioToScore(sleepHours, sleepTargetHours, 9);
  const sleepQualityScore = minimumRatingScore(sleepQuality, sleepTargetQuality, 7);
  const sleepScore = sleepHoursScore + sleepQualityScore;
  const skinScore = ratingToScore(skinAverage, 24, 10);
  const makeupScore =
    face.makeupWorn === false
      ? 6
      : face.makeupWorn === true
        ? face.makeupRemoved
          ? 6
          : 0
        : 3;

  const reasons: ScoreReason[] = [
    createReason(
      "face_morning_routine",
      "Morning skincare routine",
      morningScore,
      morningScoreWeight,
      face.morningRoutineCompleted
        ? `Morning skincare was completed${morningRoutineSize > 0 ? ` against a ${morningRoutineSize}-step routine` : ""}.`
        : `Morning skincare was missed${morningRoutineSize > 0 ? ` for a ${morningRoutineSize}-step routine` : ""}.`
    ),
    createReason(
      "face_night_routine",
      "Night skincare routine",
      nightScore,
      nightScoreWeight,
      face.nightRoutineCompleted
        ? `Night skincare was completed${nightRoutineSize > 0 ? ` against a ${nightRoutineSize}-step routine` : ""}.`
        : `Night skincare was missed${nightRoutineSize > 0 ? ` for a ${nightRoutineSize}-step routine` : ""}.`
    ),
    createReason(
      "face_products",
      "Products used",
      productsScore,
      16,
      productsScore > 0
        ? productsScoreRatio > 0
          ? `${skincareEvidence.detail} Plan coverage was ${Math.round(productsScoreRatio * 100)}%.`
          : skincareEvidence.detail
        : "No clearly useful skincare products were logged."
    ),
    createReason(
      "face_sunscreen",
      "Sunscreen",
      sunscreenScore,
      18,
      sunscreenExpected
        ? face.sunscreenApplied
          ? `Sunscreen was applied with SPF ${face.sunscreenSpf ?? "unspecified"}.`
          : "Sunscreen was not logged."
        : "Sunscreen was not required today."
    ),
    createReason(
      "face_water",
      "Water intake",
      waterScore,
      8,
      isFiniteNumber(waterLiters)
        ? `Water intake was ${waterLiters.toFixed(1)}L against a ${waterTarget.toFixed(1)}L target.`
        : "Water intake was not logged."
    ),
    createReason(
      "face_sleep",
      "Sleep",
      sleepScore,
      16,
      isFiniteNumber(sleepHours)
        ? `Sleep was ${sleepHours.toFixed(1)}h with quality ${sleepQuality ?? "unlogged"}/10.`
        : "Sleep was not logged."
    ),
    createReason(
      "face_skin_condition",
      "Skin condition",
      skinScore,
      24,
      isFiniteNumber(skinAverage)
        ? `Skin self-rating averaged ${skinAverage.toFixed(1)}/10.`
        : "Skin condition was not logged."
    ),
    createReason(
      "face_makeup",
      "Makeup removal",
      makeupScore,
      6,
      face.makeupWorn === true
        ? face.makeupRemoved
          ? "Makeup was removed properly."
          : "Makeup was worn but not removed."
        : face.makeupWorn === false
          ? "No makeup was worn today."
          : "Makeup status was not logged."
    ),
  ];

  const score = clamp(round(morningScore + nightScore + productsScore + sunscreenScore + waterScore + sleepScore + skinScore + makeupScore));

  return {
    pillar: "face",
    score,
    reasons,
  };
}

function scorePhysic(log: DailyLog, plans?: PhysicPlan): PillarScore {
  const physic = log.physic;
  if (!physic) {
    return {
      pillar: "physic",
      score: 0,
      reasons: [
        createReason("physic_missing", "Physic log missing", 0, 100, "No physic log was submitted for this day."),
      ],
    };
  }

  const plan = plans ?? {};
  const workoutTargetMinutes = plan.workoutTargetMinutes ?? DEFAULT_PHYSIC_PLAN.workoutTargetMinutes;
  const calorieTarget = plan.calorieTarget ?? estimateCalorieTarget(plan) ?? DEFAULT_PHYSIC_PLAN.calorieTarget;
  const proteinTargetGrams = resolveProteinTarget(plan, DEFAULT_PHYSIC_PLAN.proteinTargetGrams);
  const mealsTarget = plan.mealsTarget ?? DEFAULT_PHYSIC_PLAN.mealsTarget;
  const waterTargetLiters = plan.waterTargetLiters ?? DEFAULT_PHYSIC_PLAN.waterTargetLiters;
  const stepTarget = plan.stepTarget ?? DEFAULT_PHYSIC_PLAN.stepTarget;
  const sleepTargetHours = plan.sleepTargetHours ?? DEFAULT_PHYSIC_PLAN.sleepTargetHours;
  const sleepTargetQuality = plan.sleepTargetQuality ?? DEFAULT_PHYSIC_PLAN.sleepTargetQuality;
  const sorenessTargetMax = plan.sorenessTargetMax ?? DEFAULT_PHYSIC_PLAN.sorenessTargetMax;

  const waterLiters = log.shared?.waterLiters ?? physic.waterLiters;
  const sleepHours = resolveSharedSleepHours(log, undefined, physic);
  const sleepQuality = resolveSharedSleepQuality(log, undefined, physic);
  const workoutMinutes = physic.workoutMinutes;
  const workoutCompleted = physic.workoutCompleted || (isFiniteNumber(workoutMinutes) && workoutMinutes > 0);
  const activityEquivalentMinutes =
    isFiniteNumber(workoutMinutes) ? workoutMinutes * workoutLoadMultiplier(physic.workoutIntensity) : undefined;
  const workoutConsistencyScore = workoutCompleted ? 8 : 0;
  const workoutDoseScore = ratioToScore(activityEquivalentMinutes, workoutTargetMinutes, 24);
  const calorieScore = bandScore(physic.caloriesConsumed, calorieTarget, 8, 0.15);
  const proteinScore = ratioToScore(physic.proteinGrams, proteinTargetGrams, 12);
  const mealsScore = bandScore(physic.mealsCount, mealsTarget, 6, 0.35);
  const waterScore = ratioToScore(waterLiters, waterTargetLiters, 8);
  const stepScore = ratioToScore(physic.steps, stepTarget, 10);
  const sleepHoursScore = ratioToScore(sleepHours, sleepTargetHours, 9);
  const sleepQualityScore = minimumRatingScore(sleepQuality, sleepTargetQuality, 7);
  const sleepScore = sleepHoursScore + sleepQualityScore;
  const sorenessScore = inverseRatioToScore(physic.soreness, sorenessTargetMax, 8);

  const reasons: ScoreReason[] = [
    createReason(
      "physic_workout",
      "Workout consistency",
      workoutConsistencyScore,
      8,
      workoutCompleted
        ? physic.workoutType
          ? `Workout completed: ${physic.workoutType}.`
          : "Workout was completed."
        : "Workout was missed."
    ),
    createReason(
      "physic_workout_quality",
      "Training dose",
      workoutDoseScore,
      24,
      isFiniteNumber(workoutMinutes)
        ? `Workout contributed about ${(activityEquivalentMinutes ?? 0).toFixed(0)} moderate-equivalent minutes from ${workoutMinutes.toFixed(0)} minutes at ${physic.workoutIntensity ?? "unspecified"} intensity.`
        : "Workout duration was not logged."
    ),
    createReason(
      "physic_calories",
      "Calories",
      calorieScore,
      8,
      isFiniteNumber(physic.caloriesConsumed)
        ? `Calories consumed: ${physic.caloriesConsumed.toFixed(0)} against a ${calorieTarget.toFixed(0)} target${plan.calorieTarget ? "" : estimateCalorieTarget(plan) ? " estimated from body settings" : ""}.`
        : "Calories were not logged."
    ),
    createReason(
      "physic_protein",
      "Protein",
      proteinScore,
      12,
      isFiniteNumber(physic.proteinGrams)
        ? `Protein intake was ${physic.proteinGrams.toFixed(0)}g against a ${proteinTargetGrams.toFixed(0)}g target${plan.proteinTargetGrams ? "" : plan.bodyWeightKg ? " based on body weight" : ""}.`
        : "Protein intake was not logged."
    ),
    createReason(
      "physic_meals",
      "Meal timing and count",
      mealsScore,
      6,
      isFiniteNumber(physic.mealsCount)
        ? `Meals logged: ${physic.mealsCount.toFixed(0)} against a ${mealsTarget.toFixed(0)} meal target.`
        : "Meal count was not logged."
    ),
    createReason(
      "physic_water",
      "Water intake",
      waterScore,
      8,
      isFiniteNumber(waterLiters)
        ? `Water intake was ${waterLiters.toFixed(1)}L against a ${waterTargetLiters.toFixed(1)}L target.`
        : "Water intake was not logged."
    ),
    createReason(
      "physic_steps",
      "Daily movement",
      stepScore,
      10,
      isFiniteNumber(physic.steps)
        ? `Movement logged ${physic.steps.toFixed(0)} steps against a ${stepTarget.toFixed(0)} step target.`
        : "Steps were not logged."
    ),
    createReason(
      "physic_sleep",
      "Sleep",
      sleepScore,
      16,
      isFiniteNumber(sleepHours)
        ? `Sleep was ${sleepHours.toFixed(1)}h with quality ${sleepQuality ?? "unlogged"}/10.`
        : "Sleep was not logged."
    ),
    createReason(
      "physic_recovery",
      "Recovery",
      sorenessScore,
      8,
      isFiniteNumber(physic.soreness)
        ? `Soreness was ${physic.soreness.toFixed(0)}/10 against a max target of ${sorenessTargetMax.toFixed(0)}.`
        : "Soreness was not logged."
    ),
  ];

  const score = clamp(
    round(
      workoutConsistencyScore +
        workoutDoseScore +
        calorieScore +
        proteinScore +
        mealsScore +
        waterScore +
        stepScore +
        sleepScore +
        sorenessScore
    )
  );

  return {
    pillar: "physic",
    score,
    reasons,
  };
}

function scoreBrain(log: DailyLog, plans?: BrainPlan): PillarScore {
  const brain = log.brain;
  if (!brain) {
    return {
      pillar: "brain",
      score: 0,
      reasons: [
        createReason("brain_missing", "Brain log missing", 0, 100, "No brain log was submitted for this day."),
      ],
    };
  }

  const plan = plans ?? {};
  const deepWorkTargetHours = plan.deepWorkTargetHours ?? DEFAULT_BRAIN_PLAN.deepWorkTargetHours;
  const screenTimeMaxMinutes = plan.screenTimeMaxMinutes ?? DEFAULT_BRAIN_PLAN.screenTimeMaxMinutes;
  const socialMediaMaxMinutes = plan.socialMediaMaxMinutes ?? DEFAULT_BRAIN_PLAN.socialMediaMaxMinutes;
  const meditationTargetMinutes = plan.meditationTargetMinutes ?? DEFAULT_BRAIN_PLAN.meditationTargetMinutes;
  const caffeineMaxMg = plan.caffeineMaxMg ?? DEFAULT_BRAIN_PLAN.caffeineMaxMg;
  const sleepTargetHours = plan.sleepTargetHours ?? DEFAULT_BRAIN_PLAN.sleepTargetHours;
  const sleepTargetQuality = plan.sleepTargetQuality ?? DEFAULT_BRAIN_PLAN.sleepTargetQuality;
  const moodTargetMinimum = plan.moodTargetMinimum ?? DEFAULT_BRAIN_PLAN.moodTargetMinimum;
  const clarityTargetMinimum = plan.clarityTargetMinimum ?? DEFAULT_BRAIN_PLAN.clarityTargetMinimum;

  const sleepHours = resolveSharedSleepHours(log, undefined, undefined, brain);
  const sleepQuality = resolveSharedSleepQuality(log, undefined, undefined, brain);
  const caffeineMg = resolveCaffeineMg(brain);
  const lateCaffeineEntries = countLateCaffeineEntries(brain);
  const supplementEvidence = scoreSupplementEvidence(brain);
  const deepWorkScore = ratioToScore(brain.deepWorkHours, deepWorkTargetHours, 20);
  const topicScore = definedList(brain.focusTopics).length > 0 ? 2 : brain.deepWorkHours ? 1 : 0;
  const screenScore = inverseRatioToScore(brain.screenTimeMinutes, screenTimeMaxMinutes, 10);
  const socialScreenMinutes = (brain.socialMediaMinutes ?? 0) + (brain.entertainmentMinutes ?? 0);
  const socialScore =
    brain.socialMediaMinutes != null || brain.entertainmentMinutes != null
      ? inverseRatioToScore(socialScreenMinutes, socialMediaMaxMinutes, 6)
      : brain.screenTimeMinutes != null
        ? 3
        : 0;
  const meditationScore = ratioToScore(brain.meditationMinutes, meditationTargetMinutes, 4);
  const moodScore = minimumRatingScore(brain.moodRating, moodTargetMinimum, 10);
  const clarityScore = minimumRatingScore(brain.mentalClarity, clarityTargetMinimum, 12);
  const caffeineBaseScore = inverseRatioToScore(caffeineMg, Math.min(caffeineMaxMg, 400), 8);
  const lateCaffeinePenalty = lateCaffeineEntries > 0 ? Math.min(3, lateCaffeineEntries * 1.5) : 0;
  const caffeineScore = clamp(caffeineBaseScore - lateCaffeinePenalty, 0, 8);
  const sleepHoursScore = ratioToScore(sleepHours, sleepTargetHours, 14);
  const sleepQualityScore = minimumRatingScore(sleepQuality, sleepTargetQuality, 10);
  const sleepScore = sleepHoursScore + sleepQualityScore;

  const reasons: ScoreReason[] = [
    createReason(
      "brain_deep_work",
      "Deep work",
      deepWorkScore,
      20,
      isFiniteNumber(brain.deepWorkHours)
        ? `Deep work totaled ${brain.deepWorkHours.toFixed(1)}h against a ${deepWorkTargetHours.toFixed(1)}h target.`
        : "Deep work time was not logged."
    ),
    createReason(
      "brain_topics",
      "Focus topics",
      topicScore,
      2,
      definedList(brain.focusTopics).length > 0
        ? `Focus topics logged: ${definedList(brain.focusTopics).join(", ")}.`
        : "No focus topics were logged."
    ),
    createReason(
      "brain_screen_time",
      "Screen time",
      screenScore,
      10,
      isFiniteNumber(brain.screenTimeMinutes)
        ? `Screen time was ${brain.screenTimeMinutes.toFixed(0)} minutes against a ${screenTimeMaxMinutes.toFixed(0)} minute limit.`
        : "Screen time was not logged."
    ),
    createReason(
      "brain_social_screen",
      "Social and entertainment screen time",
      socialScore,
      6,
      socialScreenMinutes > 0
        ? `Social and entertainment screen time totaled ${socialScreenMinutes.toFixed(0)} minutes.`
        : "Social and entertainment screen time was not logged."
    ),
    createReason(
      "brain_meditation",
      "Meditation",
      meditationScore,
      4,
      isFiniteNumber(brain.meditationMinutes)
        ? `Meditation totaled ${brain.meditationMinutes.toFixed(0)} minutes against a ${meditationTargetMinutes.toFixed(0)} minute target.`
        : "Meditation was not logged."
    ),
    createReason(
      "brain_mood",
      "Mood",
      moodScore,
      10,
      isFiniteNumber(brain.moodRating)
        ? `Mood was rated ${brain.moodRating.toFixed(0)}/10 with tags ${definedList(brain.moodTags).length > 0 ? definedList(brain.moodTags).join(", ") : "none"}.`
        : "Mood was not logged."
    ),
    createReason(
      "brain_clarity",
      "Mental clarity",
      clarityScore,
      12,
      isFiniteNumber(brain.mentalClarity)
        ? `Mental clarity was rated ${brain.mentalClarity.toFixed(0)}/10.`
        : "Mental clarity was not logged."
    ),
    createReason(
      "brain_caffeine",
      "Caffeine balance",
      caffeineScore,
      8,
      isFiniteNumber(caffeineMg)
        ? `Caffeine intake was ${caffeineMg.toFixed(0)}mg with ${lateCaffeineEntries} late dose${lateCaffeineEntries === 1 ? "" : "s"}.`
        : "Caffeine was not logged."
    ),
    createReason(
      "brain_supplements",
      "Supplement evidence fit",
      supplementEvidence.score,
      4,
      supplementEvidence.detail
    ),
    createReason(
      "brain_sleep",
      "Sleep",
      sleepScore,
      24,
      isFiniteNumber(sleepHours)
        ? `Sleep was ${sleepHours.toFixed(1)}h with quality ${sleepQuality ?? "unlogged"}/10.`
        : "Sleep was not logged."
    ),
  ];

  const score = clamp(
    round(
      deepWorkScore +
        topicScore +
        screenScore +
        socialScore +
        meditationScore +
        moodScore +
        clarityScore +
        caffeineScore +
        supplementEvidence.score +
        sleepScore
    )
  );

  return {
    pillar: "brain",
    score,
    reasons,
  };
}

export function scoreDailyLog(log: DailyLog, plans?: DailyPlans): DailyPrimeScore {
  const face = scoreFace(log, plans?.face);
  const physic = scorePhysic(log, plans?.physic);
  const brain = scoreBrain(log, plans?.brain);
  const overall = clamp(round((face.score + physic.score + brain.score) / 3));

  return {
    date: log.date,
    face,
    physic,
    brain,
    overall,
    reasons: [...face.reasons, ...physic.reasons, ...brain.reasons],
  };
}

export { DEFAULT_BRAIN_PLAN, DEFAULT_FACE_PLAN, DEFAULT_PHYSIC_PLAN };
export { scoreBrain, scoreFace, scorePhysic };
