import { NextResponse } from "next/server";
import type { ThemePreference } from "@/lib/db/types";
import { savePrimeformSettings } from "@/lib/db/workspace";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { FacePlan, PhysicPlan } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        displayName?: string;
        theme?: ThemePreference;
        face?: FacePlan;
        physic?: PhysicPlan;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Settings payload is required." }, { status: 400 });
  }

  await savePrimeformSettings(user.id, {
    displayName: body.displayName?.trim() || user.email || "Primeform User",
    theme: body.theme ?? "dark",
    face: body.face ?? {},
    physic: body.physic ?? {},
  });

  return NextResponse.json({ ok: true });
}
