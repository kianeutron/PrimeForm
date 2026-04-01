export const PILLARS = ["face", "physic", "brain"] as const;
export type Pillar = (typeof PILLARS)[number];

export const PLAN_TYPES = ["skincare", "workout", "study", "wellness", "other"] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

export const THEME_PREFERENCES = ["system", "dark", "light"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

export const UNIT_PREFERENCES = ["metric", "imperial"] as const;
export type UnitPreference = (typeof UNIT_PREFERENCES)[number];

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type Id = string;
export type ISODate = string;
export type ISODateTime = string;

export interface ProfileRow {
  user_id: Id;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  timezone: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface ProfileInsertRow {
  user_id: Id;
  display_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string;
}

export interface ProfileSettingsRow {
  user_id: Id;
  theme: ThemePreference;
  units: UnitPreference;
  analysis_model: string;
  face_photo_reminder_enabled: boolean;
  brain_screen_time_required: boolean;
  daily_cutoff_time: string;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface ProfileSettingsInsertRow {
  user_id: Id;
  theme?: ThemePreference;
  units?: UnitPreference;
  analysis_model?: string;
  face_photo_reminder_enabled?: boolean;
  brain_screen_time_required?: boolean;
  daily_cutoff_time?: string;
}

export interface CustomPlanRow {
  id: Id;
  user_id: Id;
  pillar: Pillar;
  plan_type: PlanType;
  title: string;
  description: string | null;
  target: JsonObject;
  schedule: JsonObject;
  is_active: boolean;
  starts_on: ISODate | null;
  ends_on: ISODate | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface CustomPlanInsertRow {
  user_id: Id;
  pillar: Pillar;
  plan_type?: PlanType;
  title: string;
  description?: string | null;
  target?: JsonObject;
  schedule?: JsonObject;
  is_active?: boolean;
  starts_on?: ISODate | null;
  ends_on?: ISODate | null;
}

export interface DailyLogRow {
  id: Id;
  user_id: Id;
  log_date: ISODate;
  face_score: number | null;
  physic_score: number | null;
  brain_score: number | null;
  prime_score: number | null;
  face_payload: JsonObject;
  physic_payload: JsonObject;
  brain_payload: JsonObject;
  ai_summary: JsonObject;
  notes: string | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface DailyLogInsertRow {
  user_id: Id;
  log_date: ISODate;
  face_payload?: FaceLog;
  physic_payload?: PhysicLog;
  brain_payload?: BrainLog;
  ai_summary?: JsonObject;
  notes?: string | null;
  face_score?: number | null;
  physic_score?: number | null;
  brain_score?: number | null;
  prime_score?: number | null;
}

export interface FaceProgressPhotoRow {
  id: Id;
  user_id: Id;
  log_date: ISODate;
  storage_path: string;
  public_url: string | null;
  caption: string | null;
  metadata: JsonObject;
  created_at: ISODateTime;
}

export interface FaceProgressPhotoInsertRow {
  user_id: Id;
  log_date: ISODate;
  storage_path: string;
  public_url?: string | null;
  caption?: string | null;
  metadata?: JsonObject;
}

export interface SkinRating {
  acne: number;
  texture: number;
  glow: number;
  dryness: number;
}

export interface FaceLog {
  skincareRoutineMorning: boolean;
  skincareRoutineNight: boolean;
  productsUsed: string[];
  sunscreenApplied: boolean;
  sunscreenSpf: number | null;
  waterLiters: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  makeupWorn: boolean;
  makeupRemoved: boolean;
  skinRating: SkinRating;
  notes: string;
}

export interface WorkoutLog {
  completed: boolean;
  workoutType: string;
  durationMinutes: number | null;
  intensity: number | null;
}

export interface PhysicLog {
  workout: WorkoutLog;
  caloriesConsumed: number | null;
  caloriesTarget: number | null;
  proteinGrams: number | null;
  mealCount: number | null;
  mealTimes: string[];
  mealJournal?: string;
  waterLiters: number | null;
  steps: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  soreness: number | null;
  weightKg: number | null;
  measurements: Record<string, number | null>;
  notes: string;
}

export interface SupplementIntake {
  name: string;
  dosage: string;
  takenAt: string;
}

export interface BrainLog {
  deepWorkHours: number | null;
  topics: string[];
  caffeineMg: number | null;
  caffeineTakenAt: string | null;
  supplements: SupplementIntake[];
  screenTimeMinutes: number | null;
  screenTimeBreakdown: Record<string, number | null>;
  socialScreenTimeMinutes: number | null;
  meditationMinutes: number | null;
  moodRating: number | null;
  emotionTags: string[];
  mentalClarityRating: number | null;
  sleepQuality: number | null;
  notes: string;
}

export interface DailyLogPayload {
  face: FaceLog;
  physic: PhysicLog;
  brain: BrainLog;
}

export interface DailyLogAnalysis {
  faceScore: number;
  physicScore: number;
  brainScore: number;
  primeScore: number;
  strengths: string[];
  improvements: string[];
  tomorrowActions: string[];
  summary: string;
}

export interface CustomPlan {
  id: Id;
  userId: Id;
  pillar: Pillar;
  planType: PlanType;
  title: string;
  description: string;
  target: Record<string, JsonValue>;
  schedule: Record<string, JsonValue>;
  isActive: boolean;
  startsOn: ISODate | null;
  endsOn: ISODate | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface DailyLog {
  id: Id;
  userId: Id;
  logDate: ISODate;
  faceScore: number | null;
  physicScore: number | null;
  brainScore: number | null;
  primeScore: number | null;
  payload: DailyLogPayload;
  analysis: Record<string, JsonValue>;
  notes: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface FaceProgressPhoto {
  id: Id;
  userId: Id;
  logDate: ISODate;
  storagePath: string;
  publicUrl: string;
  caption: string;
  metadata: Record<string, JsonValue>;
  createdAt: ISODateTime;
}

export interface Profile {
  userId: Id;
  displayName: string;
  avatarUrl: string;
  bio: string;
  timezone: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ProfileSettings {
  userId: Id;
  theme: ThemePreference;
  units: UnitPreference;
  analysisModel: string;
  facePhotoReminderEnabled: boolean;
  brainScreenTimeRequired: boolean;
  dailyCutoffTime: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface DailyLogDraft {
  logDate: ISODate;
  face: FaceLog;
  physic: PhysicLog;
  brain: BrainLog;
  notes: string;
}
