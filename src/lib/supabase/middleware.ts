import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { appEnv, hasSupabaseAuthConfig } from "@/lib/env";

function isMissingSessionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  return name === "AuthSessionMissingError" || message.toLowerCase().includes("auth session missing");
}

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseAuthConfig()) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(appEnv.supabaseUrl, appEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (error) {
    if (!isMissingSessionError(error)) {
      throw error;
    }
  }

  return response;
}
