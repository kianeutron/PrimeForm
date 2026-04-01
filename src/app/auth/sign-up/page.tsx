import { redirect } from "next/navigation";
import { signUpAction } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { hasSupabaseAuthConfig } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  if (hasSupabaseAuthConfig()) {
    const user = await getAuthenticatedUser().catch(() => null);
    if (user) {
      redirect("/");
    }
  }

  const params = await searchParams;
  const error = readParam(params.error);
  const message = readParam(params.message);
  const statusMessage =
    error || message || (!hasSupabaseAuthConfig() ? "Add NEXT_PUBLIC_SUPABASE_ANON_KEY to enable Supabase Auth." : null);

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Build your Prime Form."
      description="Create your account and start tracking Face, Physic, and Brain in one place."
      alternateHref="/auth/sign-in"
      alternateText="Already have an account?"
      alternateLabel="Sign in"
      statusMessage={statusMessage}
      statusTone={error ? "error" : "message"}
    >
      <form action={signUpAction} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-white/70">Display name</span>
          <input
            name="display_name"
            type="text"
            autoComplete="name"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
            placeholder="Kian"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-white/70">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
            placeholder="you@example.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-white/70">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
            placeholder="At least 8 characters"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-white/70">Confirm password</span>
          <input
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
            placeholder="Repeat the password"
          />
        </label>
        <AuthSubmitButton label="Create account" pendingLabel="Creating account..." />
      </form>

      <p className="mt-5 text-sm text-white/50">
        If email confirmation is enabled in Supabase Auth, you&apos;ll get a verification link before the first full sign in.
      </p>

      <p className="mt-6 text-sm text-white/55">
        Already registered?{" "}
        <a href="/auth/sign-in" className="font-medium text-cyan-200 transition hover:text-cyan-100">
          Sign in
        </a>
      </p>
    </AuthShell>
  );
}
