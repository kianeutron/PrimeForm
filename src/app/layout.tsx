import type { Metadata } from "next";
import { ThemeController } from "@/components/theme/theme-controller";
import type { ThemePreference } from "@/lib/db/types";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Primeform",
  description: "Track your Face, Physic, and Brain daily. Become your Prime Form.",
};

async function getInitialTheme(): Promise<ThemePreference> {
  const user = await getAuthenticatedUser().catch(() => null);
  if (!user) {
    return "dark";
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("profile_settings")
    .select("theme")
    .eq("user_id", user.id)
    .maybeSingle<{ theme: ThemePreference }>();

  if (result.error) {
    return "dark";
  }

  return result.data?.theme ?? "dark";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialTheme = await getInitialTheme();

  return (
    <html lang="en" data-theme={initialTheme === "system" ? "dark" : initialTheme} className={initialTheme === "light" ? "" : "dark"} suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <ThemeController initialTheme={initialTheme} />
        {children}
      </body>
    </html>
  );
}
