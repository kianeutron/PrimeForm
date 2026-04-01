"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings2 } from "lucide-react";

type AppNavbarProps = {
  accountLabel: string;
  logoHref?: string;
  settingsHref?: string;
};

export function AppNavbar({
  accountLabel,
  logoHref = "/",
  settingsHref = "/settings",
}: AppNavbarProps) {
  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-[1780px] px-5 pt-4 sm:px-8 lg:px-12 xl:px-14">
      <nav className="flex items-center justify-between rounded-[1.8rem] border border-white/12 bg-[linear-gradient(180deg,rgba(18,24,36,0.82),rgba(9,12,20,0.92))] px-4 py-3 shadow-[0_24px_70px_rgba(0,0,0,0.38)] backdrop-blur-2xl sm:px-5">
        <Link href={logoHref} className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-1.5">
            <Image src="/primeform-mark.svg" alt="Primeform logo" width={44} height={44} className="h-full w-full" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-white">Primeform</span>
            <span className="block text-xs text-white/42">Face, Physic, Brain</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-right sm:block">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Account</div>
            <div className="mt-0.5 max-w-[220px] truncate text-sm font-medium text-white/82">{accountLabel}</div>
          </div>
          <Link
            href={settingsHref}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
            aria-label="Open settings"
          >
            <Settings2 className="h-5 w-5" strokeWidth={1.9} />
          </Link>
          <Link
            href="/auth/sign-out"
            className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-white/78 transition hover:border-white/20 hover:bg-white/[0.08]"
          >
            Sign out
          </Link>
        </div>
      </nav>
    </header>
  );
}
