import { fromDbDailyLog, toAiSummaryRecord, toDbDailyLogDraft } from "@/lib/adapters";
import type { CoachPayload } from "@/lib/coach";
import { defaultDailyLogDraft } from "@/lib/db/defaults";
import {
  mapCustomPlanRow,
  mapDailyLogRow,
  mapProfileRow,
  mapProfileSettingsRow,
  toCustomPlanInsertRow,
  toDailyLogInsertRow,
  toProfileInsertRow,
  toProfileSettingsInsertRow,
} from "@/lib/db/mappers";
import type {
  CustomPlan,
  CustomPlanRow,
  DailyLogRow,
  Profile,
  ProfileRow,
  ProfileSettings,
  ProfileSettingsRow,
  ThemePreference,
} from "@/lib/db/types";
import { createEmptyDailyLog, todayIsoDate } from "@/lib/log-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DailyLog, DailyPlans, FacePlan, PhysicPlan } from "@/lib/types";

export interface PrimeformWorkspace {
  profile: Profile | null;
  settings: ProfileSettings | null;
  plans: DailyPlans;
  currentLog: DailyLog;
  history: DailyLog[];
}

function mergePlanTargets(plans: CustomPlan[]): DailyPlans {
  const merged: DailyPlans = {};

  for (const plan of plans) {
    const target = plan.target as Record<string, unknown>;

    if (plan.pillar === "face") {
      merged.face = {
        ...merged.face,
        ...target,
      };
      continue;
    }

    if (plan.pillar === "physic") {
      merged.physic = {
        ...merged.physic,
        ...target,
      };
      continue;
    }

    merged.brain = {
      ...merged.brain,
      ...target,
    };
  }

  return merged;
}

export async function getPrimeformWorkspace(
  userId: string,
  date = todayIsoDate(),
): Promise<PrimeformWorkspace> {
  const supabase = await createSupabaseServerClient();

  const [profileResult, settingsResult, planResult, logResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle<ProfileRow>(),
    supabase
      .from("profile_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<ProfileSettingsRow>(),
    supabase
      .from("custom_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .returns<CustomPlanRow[]>(),
    supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })
      .limit(90)
      .returns<DailyLogRow[]>(),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (settingsResult.error) {
    throw settingsResult.error;
  }

  if (planResult.error) {
    throw planResult.error;
  }

  if (logResult.error) {
    throw logResult.error;
  }

  const profile = profileResult.data ? mapProfileRow(profileResult.data) : null;
  const settings = settingsResult.data ? mapProfileSettingsRow(settingsResult.data) : null;
  const plans = mergePlanTargets((planResult.data ?? []).map((row) => mapCustomPlanRow(row)));
  const logs = (logResult.data ?? []).map((row) => fromDbDailyLog(mapDailyLogRow(row)));
  const currentLog = logs.find((log) => log.date === date) ?? createEmptyDailyLog(date);
  const history = logs.filter((log) => log.date !== date);

  return {
    profile,
    settings,
    plans,
    currentLog,
    history,
  };
}

export async function listDailyLogsForUser(userId: string, limit = 30) {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .order("log_date", { ascending: false })
    .limit(limit)
    .returns<DailyLogRow[]>();

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((row) => fromDbDailyLog(mapDailyLogRow(row)));
}

export async function saveDailyLogForUser(userId: string, log: DailyLog, payload: CoachPayload) {
  const supabase = await createSupabaseServerClient();
  const draft = {
    ...defaultDailyLogDraft,
    ...toDbDailyLogDraft(log),
  };

  const insert = toDailyLogInsertRow(userId, draft, {
    face_score: payload.score.face.score,
    physic_score: payload.score.physic.score,
    brain_score: payload.score.brain.score,
    prime_score: payload.score.overall,
    ai_summary: toAiSummaryRecord(
      payload.score,
      {
        summary: payload.insights.summary,
        strengths: payload.insights.strengths,
        improvements: payload.insights.improvements,
        tomorrowActions: payload.insights.tomorrowActions,
      },
      payload.mode,
      payload.model,
    ),
  });

  const result = await supabase
    .from("daily_logs")
    .upsert(insert, {
      onConflict: "user_id,log_date",
    })
    .select("id")
    .single();

  if (result.error) {
    throw result.error;
  }

  return true;
}

const FACE_SETTINGS_TITLE = "Primeform Face Setup";
const PHYSIC_SETTINGS_TITLE = "Primeform Physic Setup";

async function upsertCustomPlanByTitle(
  userId: string,
  pillar: "face" | "physic",
  title: string,
  target: Record<string, unknown>,
  planType: "skincare" | "wellness",
) {
  const supabase = await createSupabaseServerClient();
  const existing = await supabase
    .from("custom_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .order("updated_at", { ascending: false })
    .limit(1)
    .returns<Array<{ id: string }>>();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.[0]?.id) {
    const result = await supabase
      .from("custom_plans")
      .update({
        target,
        pillar,
        plan_type: planType,
        is_active: true,
        description: title,
      })
      .eq("id", existing.data[0].id)
      .eq("user_id", userId)
      .select("id")
      .single();

    if (result.error) {
      throw result.error;
    }

    return true;
  }

  const insert = toCustomPlanInsertRow(userId, {
    pillar,
    title,
    planType,
    description: title,
    target: target as Record<string, never>,
    isActive: true,
  });

  const result = await supabase.from("custom_plans").insert(insert).select("id").single();

  if (result.error) {
    throw result.error;
  }

  return true;
}

export async function savePrimeformSettings(
  userId: string,
  input: {
    displayName: string;
    theme: ThemePreference;
    face: FacePlan;
    physic: PhysicPlan;
  },
) {
  const supabase = await createSupabaseServerClient();

  const profileUpsert = await supabase
    .from("profiles")
    .upsert(toProfileInsertRow(userId, { displayName: input.displayName }), {
      onConflict: "user_id",
    })
    .select("user_id")
    .single();

  if (profileUpsert.error) {
    throw profileUpsert.error;
  }

  const settingsUpsert = await supabase
    .from("profile_settings")
    .upsert(
      toProfileSettingsInsertRow(userId, {
        theme: input.theme,
      }),
      {
        onConflict: "user_id",
      },
    )
    .select("user_id")
    .single();

  if (settingsUpsert.error) {
    throw settingsUpsert.error;
  }

  await upsertCustomPlanByTitle(userId, "face", FACE_SETTINGS_TITLE, input.face as Record<string, unknown>, "skincare");
  await upsertCustomPlanByTitle(userId, "physic", PHYSIC_SETTINGS_TITLE, input.physic as Record<string, unknown>, "wellness");

  return true;
}
