import { redirect } from "next/navigation";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { SettingsStudio } from "@/components/settings/settings-studio";
import { getPrimeformWorkspace } from "@/lib/db/workspace";
import { hasSupabaseAuthConfig } from "@/lib/env";
import { requireAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!hasSupabaseAuthConfig()) {
    redirect("/auth/sign-in?error=Supabase+Auth+is+not+configured." as never);
  }

  const user = await requireAuthenticatedUser();
  const workspace = await getPrimeformWorkspace(user.id);

  return (
    <div className="pb-6">
      <AppNavbar accountLabel={user.email ?? workspace.profile?.displayName ?? "User"} logoHref="/" settingsHref="/settings" />
      <SettingsStudio
        initialDisplayName={workspace.profile?.displayName ?? user.email ?? ""}
        initialTheme={workspace.settings?.theme ?? "dark"}
        initialFacePlan={workspace.plans.face}
        initialPhysicPlan={workspace.plans.physic}
      />
      <MobileBottomNav />
    </div>
  );
}
