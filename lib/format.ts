const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return dateFormatter.format(new Date(date));
}

export function formatDateTime(
  date: string | Date | null | undefined
): string {
  if (!date) return "-";
  return `${dateFormatter.format(new Date(date))}, ${timeFormatter.format(
    new Date(date)
  )}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function daysUntil(date: string | Date): number {
  const target = new Date(date).getTime();
  const now = new Date().getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function relativeTime(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return formatDate(date);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function getInitials(name: string): string {
  return initials(name);
}

export function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date);
}
