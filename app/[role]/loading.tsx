import { StatCardsSkeleton } from "@/components/shared/table-skeleton";

export default function RoleLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <StatCardsSkeleton count={4} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-xl border bg-card lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-xl border bg-card" />
      </div>
    </div>
  );
}
