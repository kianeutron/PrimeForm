import { redirect } from "next/navigation";
import { signInAction } from "@/app/auth/actions";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import { hasSupabaseAuthConfig } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({
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
      eyebrow="Sign In"
      title="Pick up where you left off."
      description="Sign in to log today, review your scores, and keep your momentum moving."
      alternateHref="/auth/sign-up"
      alternateText="Need an account?"
      alternateLabel="Create one"
      statusMessage={statusMessage}
      statusTone={error ? "error" : "message"}
    >
      <form action={signInAction} className="space-y-4">
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
            autoComplete="current-password"
            required
            minLength={8}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 py-3 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-400/40"
            placeholder="Your password"
          />
        </label>
        <AuthSubmitButton label="Sign in" pendingLabel="Signing in..." />
      </form>

      <p className="mt-5 text-sm text-white/50">
        By signing in you continue with Supabase Auth and Primeform&apos;s secure cookie session flow.
      </p>

      <p className="mt-6 text-sm text-white/55">
        New here?{" "}
        <a href="/auth/sign-up" className="font-medium text-cyan-200 transition hover:text-cyan-100">
          Create your account
        </a>
      </p>
    </AuthShell>
  );
}
