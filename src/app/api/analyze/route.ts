import { NextResponse } from "next/server";
import { generateCoachPayload } from "@/lib/coach";
import { getPrimeformWorkspace } from "@/lib/db/workspace";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { DailyLog, DailyPlans } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser().catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        log?: DailyLog;
        plans?: DailyPlans;
        history?: DailyLog[];
        profileName?: string | null;
        modelOverride?: string | null;
      }
    | null;

  if (!body?.log?.date) {
    return NextResponse.json({ error: "A valid daily log is required." }, { status: 400 });
  }

  const workspace = await getPrimeformWorkspace(user.id, body.log.date);
  const payload = await generateCoachPayload(body.log, body.plans ?? workspace.plans, {
    history: workspace.history,
    profileName: workspace.profile?.displayName ?? user.email ?? null,
    modelOverride: workspace.settings?.analysisModel ?? body.modelOverride,
  });
  return NextResponse.json(payload);
}
