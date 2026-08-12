"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export type AccentColor = "blue" | "green" | "purple";

export const ACCENT_OPTIONS: { value: AccentColor; label: string; swatch: string }[] = [
  { value: "blue", label: "Blue", swatch: "#2563eb" },
  { value: "green", label: "Green", swatch: "#10b981" },
  { value: "purple", label: "Purple", swatch: "#8b5cf6" },
];

const ACCENT_KEY = "sh-accent";

function readStoredAccent(): AccentColor {
  try {
    const stored = localStorage.getItem(ACCENT_KEY);
    if (stored === "blue" || stored === "green" || stored === "purple") {
      return stored;
    }
  } catch {
    // abaikan
  }
  return "blue";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = React.useState<AccentColor>("blue");

  React.useEffect(() => {
    setAccent(readStoredAccent());
  }, []);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-accent", accent);
  }, [accent]);

  const applyAccent = React.useCallback((next: AccentColor) => {
    setAccent(next);
    try {
      localStorage.setItem(ACCENT_KEY, next);
    } catch {
      // abaikan
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <AccentContext.Provider value={{ accent, setAccent: applyAccent }}>
        {children}
      </AccentContext.Provider>
    </NextThemesProvider>
  );
}

interface AccentContextValue {
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
}

const AccentContext = React.createContext<AccentContextValue | undefined>(
  undefined
);

export function useAccent(): AccentContextValue {
  const context = React.useContext(AccentContext);
  if (!context) {
    throw new Error("useAccent harus digunakan di dalam <ThemeProvider>");
  }
  return context;
}
