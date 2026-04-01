"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { appEnv, hasSupabaseAuthConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function authRedirect(path: string, key: "error" | "message", value: string) {
  const params = new URLSearchParams([[key, value]]);
  redirect(`${path}?${params.toString()}` as never);
}

async function resolveAuthOrigin() {
  const headerStore = await headers();
  return headerStore.get("origin") || appEnv.appUrl;
}

function requireConfiguredAuth() {
  if (!hasSupabaseAuthConfig()) {
    authRedirect("/auth/sign-in", "error", "Supabase Auth is not configured. Add NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

export async function signInAction(formData: FormData) {
  requireConfiguredAuth();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    authRedirect("/auth/sign-in", "error", "Email and password are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    authRedirect("/auth/sign-in", "error", error.message);
  }

  redirect("/" as never);
}

export async function signUpAction(formData: FormData) {
  requireConfiguredAuth();

  const displayName = String(formData.get("display_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!displayName || !email || !password || !confirmPassword) {
    authRedirect("/auth/sign-up", "error", "Display name, email, and both password fields are required.");
  }

  if (password.length < 8) {
    authRedirect("/auth/sign-up", "error", "Password must be at least 8 characters.");
  }

  if (password !== confirmPassword) {
    authRedirect("/auth/sign-up", "error", "Passwords do not match.");
  }

  const supabase = await createSupabaseServerClient();
  const origin = await resolveAuthOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/`,
      data: {
        name: displayName,
      },
    },
  });

  if (error) {
    authRedirect("/auth/sign-up", "error", error.message);
  }

  if (!data.session) {
    authRedirect(
      "/auth/sign-in",
      "message",
      "Check your email to confirm your account, then sign in.",
    );
  }

  redirect("/" as never);
}

export async function signOutAction() {
  requireConfiguredAuth();

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in" as never);
}

export async function verifyEmailAction({
  tokenHash,
  type,
  next,
}: {
  tokenHash: string;
  type: EmailOtpType;
  next: string;
}) {
  requireConfiguredAuth();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    authRedirect("/auth/sign-in", "error", "The confirmation link is invalid or has expired.");
  }

  redirect(next as never);
}
