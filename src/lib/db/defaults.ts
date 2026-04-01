import type {
  BrainLog,
  DailyLogDraft,
  FaceLog,
  PhysicLog,
  Profile,
  ProfileSettings,
} from "./types";

export const defaultFaceLog: FaceLog = {
  skincareRoutineMorning: false,
  skincareRoutineNight: false,
  productsUsed: [],
  sunscreenApplied: false,
  sunscreenSpf: null,
  waterLiters: null,
  sleepHours: null,
  sleepQuality: null,
  makeupWorn: false,
  makeupRemoved: false,
  skinRating: {
    acne: 5,
    texture: 5,
    glow: 5,
    dryness: 5,
  },
  notes: "",
};

export const defaultPhysicLog: PhysicLog = {
  workout: {
    completed: false,
    workoutType: "",
    durationMinutes: null,
    intensity: null,
  },
  caloriesConsumed: null,
  caloriesTarget: null,
  proteinGrams: null,
  mealCount: null,
  mealTimes: [],
  mealJournal: "",
  waterLiters: null,
  steps: null,
  sleepHours: null,
  sleepQuality: null,
  soreness: null,
  weightKg: null,
  measurements: {},
  notes: "",
};

export const defaultBrainLog: BrainLog = {
  deepWorkHours: null,
  topics: [],
  caffeineMg: null,
  caffeineTakenAt: null,
  supplements: [],
  screenTimeMinutes: null,
  screenTimeBreakdown: {},
  socialScreenTimeMinutes: null,
  meditationMinutes: null,
  moodRating: null,
  emotionTags: [],
  mentalClarityRating: null,
  sleepQuality: null,
  notes: "",
};

export const defaultDailyLogDraft: DailyLogDraft = {
  logDate: new Date().toISOString().slice(0, 10),
  face: defaultFaceLog,
  physic: defaultPhysicLog,
  brain: defaultBrainLog,
  notes: "",
};

export const defaultProfile: Profile = {
  userId: "",
  displayName: "",
  avatarUrl: "",
  bio: "",
  timezone: "UTC",
  createdAt: "",
  updatedAt: "",
};

export const defaultProfileSettings: ProfileSettings = {
  userId: "",
  theme: "system",
  units: "metric",
  analysisModel: "openai/gpt-oss-20b",
  facePhotoReminderEnabled: true,
  brainScreenTimeRequired: true,
  dailyCutoffTime: "21:00",
  createdAt: "",
  updatedAt: "",
};
