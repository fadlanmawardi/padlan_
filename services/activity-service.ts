import type { Activity, ActivityType } from "@/types";
import { dbActivities, delay } from "./store";

export async function getActivities(limit = 10): Promise<Activity[]> {
  await delay(300);
  return [...dbActivities]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
    .map((a) => ({ ...a }));
}

export async function logActivity(
  type: ActivityType,
  message: string,
  user: string
): Promise<Activity> {
  const activity: Activity = {
    id: `act-${Date.now()}`,
    type,
    message,
    user,
    timestamp: new Date().toISOString(),
  };
  dbActivities.unshift(activity);
  return { ...activity };
}
