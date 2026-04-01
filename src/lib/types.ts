export type Pillar = "face" | "physic" | "brain";

export type Intensity = "low" | "moderate" | "high";

export type QuickLogKind =
  | "workout"
  | "caffeine"
  | "deep-work"
  | "skincare"
  | "meal"
  | "meditation"
  | "sleep"
  | "note";

export interface SkinConditionMetrics {
  acne?: number;
  texture?: number;
  glow?: number;
  dryness?: number;
  overall?: number;
}

export interface SharedDailyLog {
  waterLiters?: number;
  sleepHours?: number;
  sleepQuality?: number;
  notes?: string;
}

export interface FaceDailyLog {
  morningRoutineCompleted?: boolean;
  nightRoutineCompleted?: boolean;
  productsUsed?: string[];
  sunscreenApplied?: boolean;
  sunscreenSpf?: number;
  waterLiters?: number;
  sleepHours?: number;
  sleepQuality?: number;
  makeupWorn?: boolean;
  makeupRemoved?: boolean;
  skinCondition?: SkinConditionMetrics;
  photoUrl?: string;
  notes?: string;
}

export interface BodyMeasurements {
  weightKg?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
}

export interface PhysicDailyLog {
  workoutCompleted?: boolean;
  workoutType?: string;
  workoutMinutes?: number;
  workoutIntensity?: Intensity;
  caloriesConsumed?: number;
  calorieTarget?: number;
  proteinGrams?: number;
  proteinTarget?: number;
  mealsCount?: number;
  mealTiming?: string[];
  mealJournal?: string;
  waterLiters?: number;
  steps?: number;
  stepTarget?: number;
  sleepHours?: number;
  sleepQuality?: number;
  soreness?: number;
  bodyMeasurements?: BodyMeasurements;
  notes?: string;
}

export interface BrainSupplementEntry {
  name: string;
  dose?: string;
  amountMg?: number;
  takenAt?: string;
}

export interface BrainCaffeineEntry {
  name?: string;
  amountMg?: number;
  takenAt?: string;
}

export interface BrainDailyLog {
  deepWorkHours?: number;
  focusTopics?: string[];
  caffeineMg?: number;
  caffeineEntries?: BrainCaffeineEntry[];
  supplements?: BrainSupplementEntry[];
  screenTimeMinutes?: number;
  socialMediaMinutes?: number;
  entertainmentMinutes?: number;
  meditationMinutes?: number;
  moodRating?: number;
  moodTags?: string[];
  mentalClarity?: number;
  sleepHours?: number;
  sleepQuality?: number;
  notes?: string;
}

export interface DailyQuickLogEvent {
  at?: string;
  kind: QuickLogKind;
  title: string;
  detail?: string;
}

export interface DailyLog {
  date: string;
  shared?: SharedDailyLog;
  face?: FaceDailyLog;
  physic?: PhysicDailyLog;
  brain?: BrainDailyLog;
  quickEvents?: DailyQuickLogEvent[];
  notes?: string;
}

export interface FacePlan {
  morningRoutineItems?: string[];
  nightRoutineItems?: string[];
  requiredProducts?: string[];
  sunscreenExpected?: boolean;
  waterTargetLiters?: number;
  sleepTargetHours?: number;
  sleepTargetQuality?: number;
}

export interface PhysicPlan {
  workoutTargetMinutes?: number;
  workoutTargetDaysPerWeek?: number;
  workoutIntensityTarget?: Intensity;
  heightCm?: number;
  bodyWeightKg?: number;
  age?: number;
  biologicalSex?: "male" | "female" | "other";
  calorieTarget?: number;
  proteinTargetGrams?: number;
  mealsTarget?: number;
  waterTargetLiters?: number;
  stepTarget?: number;
  sleepTargetHours?: number;
  sleepTargetQuality?: number;
  sorenessTargetMax?: number;
}

export interface BrainPlan {
  deepWorkTargetHours?: number;
  screenTimeMaxMinutes?: number;
  socialMediaMaxMinutes?: number;
  meditationTargetMinutes?: number;
  caffeineMaxMg?: number;
  sleepTargetHours?: number;
  sleepTargetQuality?: number;
  moodTargetMinimum?: number;
  clarityTargetMinimum?: number;
}

export interface DailyPlans {
  face?: FacePlan;
  physic?: PhysicPlan;
  brain?: BrainPlan;
}

export interface ScoreReason {
  key: string;
  label: string;
  impact: number;
  detail: string;
  direction: "positive" | "negative";
}

export interface PillarScore {
  pillar: Pillar;
  score: number;
  reasons: ScoreReason[];
}

export interface DailyPrimeScore {
  date: string;
  face: PillarScore;
  physic: PillarScore;
  brain: PillarScore;
  overall: number;
  reasons: ScoreReason[];
}

export interface DailyInsights {
  summary: string;
  strengths: string[];
  improvements: string[];
  tomorrowActions: string[];
}
