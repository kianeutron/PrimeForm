"use client";

import { Brain, History, House, SquarePen } from "lucide-react";
import Link from "next/link";

export type AppTab = "overview" | "log" | "coach" | "history" | "settings";

type MobileBottomNavProps = {
  activeTab?: AppTab;
  onDashboardTabChange?: (tab: Exclude<AppTab, "settings">) => void;
};

const dashboardTabs: Array<{
  id: Exclude<AppTab, "settings">;
  label: string;
  href: string;
  icon: typeof House;
}> = [
  { id: "overview", label: "Overview", href: "/?tab=overview", icon: House },
  { id: "log", label: "Log", href: "/?tab=log", icon: SquarePen },
  { id: "coach", label: "Coach", href: "/?tab=coach", icon: Brain },
  { id: "history", label: "History", href: "/?tab=history", icon: History },
];

export function MobileBottomNav({ activeTab, onDashboardTabChange }: MobileBottomNavProps) {
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 xl:hidden">
      <nav className="mx-auto flex max-w-xl items-center justify-between rounded-[1.8rem] border border-white/15 bg-[linear-gradient(180deg,rgba(19,24,36,0.78),rgba(9,12,20,0.9))] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
        {dashboardTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (onDashboardTabChange) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onDashboardTabChange(tab.id)}
                className={`flex min-w-0 flex-1 items-center justify-center rounded-[1.1rem] px-2 py-3 transition ${
                  isActive ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-white/48"
                }`}
                aria-current={isActive ? "page" : undefined}
                aria-label={tab.label}
                title={tab.label}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.9} />
              </button>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex min-w-0 flex-1 items-center justify-center rounded-[1.1rem] px-2 py-3 transition ${
                isActive ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-white/48"
              }`}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              title={tab.label}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.9} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
