"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSearch, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { PageLoader } from "@/components/shared/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/components/auth/auth-provider";
import { formatDateTime, getInitials } from "@/lib/format";
import { getAuditEntries } from "@/services/community-service";
import type { AuditEntry } from "@/types";

export function AuditLogView() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [search, setSearch] = useState("");
  const isSuperAdmin = user?.role === "superadmin";

  const load = useCallback(async () => {
    const list = await getAuditEntries(100);
    setEntries(list);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!entries) return <PageLoader />;

  const filtered = entries.filter(
    (entry) =>
      entry.actor.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Audit"
        description="Jejak aktivitas administratif dan keamanan sistem."
      />

      <div className="max-w-sm">
        <Input
          placeholder="Cari aktor, aksi, atau target…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!isSuperAdmin ? (
        <div className="bg-muted/40 text-muted-foreground flex items-center gap-2 rounded-xl border px-4 py-3 text-sm">
          <ShieldCheck className="size-4" />
          Log audit hanya dapat diakses oleh Super Admin.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="Tidak ada catatan"
          description="Tidak ada entri log yang cocok."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="divide-y">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
                    {getInitials(entry.actor)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{entry.actor}</span>{" "}
                    <span className="text-muted-foreground">
                      {entry.action}
                    </span>{" "}
                    <span className="font-medium">“{entry.target}”</span>
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {formatDateTime(entry.timestamp)}
                  </p>
                </div>
                <Badge variant="outline">{entry.action.split(" ")[0]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
