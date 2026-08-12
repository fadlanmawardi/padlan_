import type { Settings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { delay } from "./store";

let currentSettings: Settings = { ...DEFAULT_SETTINGS };

export async function getSettings(): Promise<Settings> {
  await delay(150);
  return { ...currentSettings };
}

export async function updateSettings(
  patch: Partial<Settings>
): Promise<Settings> {
  await delay();
  currentSettings = { ...currentSettings, ...patch };
  return { ...currentSettings };
}

export async function resetSettings(): Promise<Settings> {
  await delay();
  currentSettings = { ...DEFAULT_SETTINGS };
  return { ...currentSettings };
}
