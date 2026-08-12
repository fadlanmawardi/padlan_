"use client";

import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { getActivities } from "@/services/activity-service";
import type { Activity } from "@/types";

export function ActivityTimeline() {
  const [activities, setActivities] = useState<Activity[] | null>(null);

  const load = useCallback(async () => {
    const list = await getActivities(50);
    setActivities(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!activities) return <PageLoader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aktivitas"
        description="Rekam jejak aktivitas terbaru di seluruh aplikasi."
      />
      {activities.length === 0 ? (
        <EmptyState
          icon={History}
          title="Belum ada aktivitas"
          description="Aktivitas akan tercatat di sini."
        />
      ) : (
        <div className="rounded-xl border bg-card p-2">
          <ActivityFeed activities={activities} />
        </div>
      )}
    </div>
  );
}
