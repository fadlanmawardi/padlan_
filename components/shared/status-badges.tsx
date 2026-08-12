import { Badge } from "@/components/ui/badge";
import type {
  AttendanceStatus,
  BookStatus,
  CollectionStatus,
  FineStatus,
  LoanStatus,
  Role,
  StudentTaskState,
  UserStatus,
} from "@/types";

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  if (status === "returned") {
    return <Badge variant="successSoft">Dikembalikan</Badge>;
  }
  if (status === "overdue") {
    return <Badge variant="dangerSoft">Terlambat</Badge>;
  }
  return <Badge variant="infoSoft">Dipinjam</Badge>;
}

export function FineStatusBadge({ status }: { status: FineStatus }) {
  if (status === "paid") {
    return <Badge variant="successSoft">Lunas</Badge>;
  }
  return <Badge variant="warningSoft">Belum Dibayar</Badge>;
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  if (status === "active") {
    return <Badge variant="successSoft">Aktif</Badge>;
  }
  return <Badge variant="warningSoft">Nonaktif</Badge>;
}

export function BookStatusBadge({ status }: { status: BookStatus }) {
  if (status === "available") {
    return <Badge variant="successSoft">Tersedia</Badge>;
  }
  if (status === "borrowed") {
    return <Badge variant="infoSoft">Dipinjam</Badge>;
  }
  return <Badge variant="warningSoft">Tidak Tersedia</Badge>;
}

export function RoleBadge({ role }: { role: Role }) {
  if (role === "superadmin") {
    return <Badge>Super Admin</Badge>;
  }
  if (role === "admin") {
    return <Badge variant="infoSoft">Admin</Badge>;
  }
  return <Badge variant="successSoft">Siswa</Badge>;
}

export function AssignmentStatusBadge({
  status,
}: {
  status: "open" | "closed";
}) {
  if (status === "open") {
    return <Badge variant="successSoft">Aktif</Badge>;
  }
  return <Badge variant="warningSoft">Ditutup</Badge>;
}

export function StudentTaskStateBadge({ state }: { state: StudentTaskState }) {
  if (state === "submitted") {
    return <Badge variant="successSoft">Sudah dikumpulkan</Badge>;
  }
  if (state === "late") {
    return <Badge variant="dangerSoft">Terlambat</Badge>;
  }
  if (state === "in_progress") {
    return <Badge variant="infoSoft">Sedang dikerjakan</Badge>;
  }
  return <Badge variant="secondary">Belum dikerjakan</Badge>;
}

export function CollectionStatusBadge({ status }: { status: CollectionStatus }) {
  if (status === "submitted") {
    return <Badge variant="successSoft">Sudah dikumpulkan</Badge>;
  }
  if (status === "late") {
    return <Badge variant="warningSoft">Terlambat</Badge>;
  }
  return <Badge variant="dangerSoft">Belum mengumpulkan</Badge>;
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  if (status === "present") {
    return <Badge variant="successSoft">Hadir</Badge>;
  }
  if (status === "late") {
    return <Badge variant="warningSoft">Terlambat</Badge>;
  }
  if (status === "permission") {
    return <Badge variant="infoSoft">Izin</Badge>;
  }
  if (status === "sick") {
    return <Badge variant="warningSoft">Sakit</Badge>;
  }
  return <Badge variant="dangerSoft">Alpha</Badge>;
}
