"use client";

import { useEffect } from "react";
import type { ThemePreference } from "@/lib/db/types";

function resolveTheme(theme: ThemePreference) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  return theme;
}

export function applyThemePreference(theme: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = resolveTheme(theme);
  const root = document.documentElement;

  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
  root.classList.toggle("dark", resolvedTheme === "dark");
}

export function ThemeController({ initialTheme }: { initialTheme: ThemePreference }) {
  useEffect(() => {
    applyThemePreference(initialTheme);
  }, [initialTheme]);

  useEffect(() => {
    if (initialTheme !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => applyThemePreference("system");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [initialTheme]);

  return null;
}
