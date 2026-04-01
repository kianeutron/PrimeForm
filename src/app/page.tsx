import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { PrimeformStudio } from "@/components/shell/primeform-studio";
import { generateCoachPayload } from "@/lib/coach";
import { getPrimeformWorkspace } from "@/lib/db/workspace";
import { hasGroqConfig, hasSupabaseAuthConfig } from "@/lib/env";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function readTab(value: string | string[] | undefined) {
  const tab = Array.isArray(value) ? value[0] : value;
  return tab === "overview" || tab === "log" || tab === "coach" || tab === "history" ? tab : "overview";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!hasSupabaseAuthConfig()) {
    redirect("/auth/sign-in?error=Supabase+Auth+is+not+configured." as never);
  }

  const params = await searchParams;
  const user = await requireAuthenticatedUser();
  const workspace = await getPrimeformWorkspace(user.id);
  const initialCoach = await generateCoachPayload(workspace.currentLog, workspace.plans, {
    history: workspace.history,
    profileName: workspace.profile?.displayName ?? user.email ?? null,
    modelOverride: workspace.settings?.analysisModel,
  });

  return (
    <div className="pb-6">
      <AppNavbar accountLabel={user.email ?? workspace.profile?.displayName ?? "User"} logoHref="/" />
      <PrimeformStudio
        initialLog={workspace.currentLog}
        initialHistory={workspace.history}
        initialPlans={workspace.plans}
        initialCoach={initialCoach}
        profileName={workspace.profile?.displayName ?? user.email ?? null}
        hasGroq={hasGroqConfig()}
        defaultModel={workspace.settings?.analysisModel || initialCoach.model}
        initialTab={readTab(params.tab)}
      />
    </div>
  );
}
