import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { appEnv, hasSupabaseAuthConfig } from "@/lib/env";

function assertSupabaseAuthConfig() {
  if (!hasSupabaseAuthConfig()) {
    throw new Error("Supabase Auth is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

export async function createSupabaseServerClient() {
  assertSupabaseAuthConfig();

  const cookieStore = await cookies();

  return createServerClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies directly. Middleware refreshes auth state.
        }
      },
    },
  });
}

function isMissingSessionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return name === "AuthSessionMissingError" || message.toLowerCase().includes("auth session missing");
}

export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      if (isMissingSessionError(error)) {
        return null;
      }

      throw error;
    }

    return user;
  } catch (error) {
    if (isMissingSessionError(error)) {
      return null;
    }

    throw error;
  }
}

export async function requireAuthenticatedUser(): Promise<User> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/auth/sign-in" as never);
  }

  return user;
}
