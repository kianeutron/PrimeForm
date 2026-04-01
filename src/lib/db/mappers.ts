import type {
  BrainLog,
  CustomPlan,
  CustomPlanRow,
  CustomPlanInsertRow,
  DailyLog,
  DailyLogDraft,
  DailyLogRow,
  DailyLogInsertRow,
  FaceLog,
  FaceProgressPhoto,
  FaceProgressPhotoRow,
  FaceProgressPhotoInsertRow,
  PhysicLog,
  Profile,
  ProfileRow,
  ProfileInsertRow,
  ProfileSettings,
  ProfileSettingsRow,
  ProfileSettingsInsertRow,
  JsonValue,
} from "./types";

const emptyJsonObject = {} as Record<string, JsonValue>;

export function mapProfileRow(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? "",
    bio: row.bio ?? "",
    timezone: row.timezone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapProfileSettingsRow(row: ProfileSettingsRow): ProfileSettings {
  return {
    userId: row.user_id,
    theme: row.theme,
    units: row.units,
    analysisModel: row.analysis_model,
    facePhotoReminderEnabled: row.face_photo_reminder_enabled,
    brainScreenTimeRequired: row.brain_screen_time_required,
    dailyCutoffTime: row.daily_cutoff_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapCustomPlanRow(row: CustomPlanRow): CustomPlan {
  return {
    id: row.id,
    userId: row.user_id,
    pillar: row.pillar,
    planType: row.plan_type,
    title: row.title,
    description: row.description ?? "",
    target: (row.target ?? emptyJsonObject) as Record<string, JsonValue>,
    schedule: (row.schedule ?? emptyJsonObject) as Record<string, JsonValue>,
    isActive: row.is_active,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapDailyLogRow(row: DailyLogRow): DailyLog {
  return {
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    faceScore: row.face_score,
    physicScore: row.physic_score,
    brainScore: row.brain_score,
    primeScore: row.prime_score,
    payload: {
      face: (row.face_payload as unknown as FaceLog) ?? (emptyJsonObject as unknown as FaceLog),
      physic: (row.physic_payload as unknown as PhysicLog) ?? (emptyJsonObject as unknown as PhysicLog),
      brain: (row.brain_payload as unknown as BrainLog) ?? (emptyJsonObject as unknown as BrainLog),
    },
    analysis: (row.ai_summary ?? emptyJsonObject) as Record<string, JsonValue>,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapFaceProgressPhotoRow(row: FaceProgressPhotoRow): FaceProgressPhoto {
  return {
    id: row.id,
    userId: row.user_id,
    logDate: row.log_date,
    storagePath: row.storage_path,
    publicUrl: row.public_url ?? "",
    caption: row.caption ?? "",
    metadata: (row.metadata ?? emptyJsonObject) as Record<string, JsonValue>,
    createdAt: row.created_at,
  };
}

export function toDailyLogInsertRow(
  userId: string,
  draft: DailyLogDraft,
  analysis?: Pick<DailyLogInsertRow, "face_score" | "physic_score" | "brain_score" | "prime_score" | "ai_summary">,
) {
  return {
    user_id: userId,
    log_date: draft.logDate,
    face_payload: draft.face,
    physic_payload: draft.physic,
    brain_payload: draft.brain,
    notes: draft.notes,
    ...analysis,
  } satisfies DailyLogInsertRow;
}

export function toProfileInsertRow(userId: string, profile: Partial<Profile>): ProfileInsertRow {
  return {
    user_id: userId,
    display_name: profile.displayName ?? "",
    avatar_url: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
    timezone: profile.timezone ?? "UTC",
  };
}

export function toProfileSettingsInsertRow(
  userId: string,
  settings: Partial<ProfileSettings>,
): ProfileSettingsInsertRow {
  return {
    user_id: userId,
    theme: settings.theme ?? "system",
    units: settings.units ?? "metric",
    analysis_model: settings.analysisModel ?? "openai/gpt-oss-20b",
    face_photo_reminder_enabled: settings.facePhotoReminderEnabled ?? true,
    brain_screen_time_required: settings.brainScreenTimeRequired ?? true,
    daily_cutoff_time: settings.dailyCutoffTime ?? "21:00",
  };
}

export function toCustomPlanInsertRow(
  userId: string,
  plan: Pick<CustomPlan, "pillar" | "title"> & Partial<Omit<CustomPlan, "id" | "userId" | "pillar" | "title" | "createdAt" | "updatedAt">>,
): CustomPlanInsertRow {
  return {
    user_id: userId,
    pillar: plan.pillar,
    plan_type: plan.planType ?? "other",
    title: plan.title,
    description: plan.description || null,
    target: (plan.target ?? emptyJsonObject) as Record<string, JsonValue>,
    schedule: (plan.schedule ?? emptyJsonObject) as Record<string, JsonValue>,
    is_active: plan.isActive ?? true,
    starts_on: plan.startsOn,
    ends_on: plan.endsOn,
  };
}

export function toFaceProgressPhotoInsertRow(
  userId: string,
  photo: Pick<FaceProgressPhoto, "storagePath"> & Partial<Omit<FaceProgressPhoto, "id" | "userId" | "storagePath" | "createdAt">>,
): FaceProgressPhotoInsertRow {
  return {
    user_id: userId,
    log_date: photo.logDate ?? new Date().toISOString().slice(0, 10),
    storage_path: photo.storagePath,
    public_url: photo.publicUrl ?? null,
    caption: photo.caption ?? null,
    metadata: (photo.metadata ?? emptyJsonObject) as Record<string, JsonValue>,
  };
}
