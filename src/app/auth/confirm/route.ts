import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyEmailAction } from "@/app/auth/actions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=Missing+confirmation+token.", request.url));
  }

  await verifyEmailAction({
    tokenHash,
    type,
    next,
  });
}
