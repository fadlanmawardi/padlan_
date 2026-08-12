export const KKM = 75;

export function gradePredicate(average: number): string {
  if (average >= 90) return "A";
  if (average >= 80) return "B";
  if (average >= 70) return "C";
  if (average >= 60) return "D";
  return "E";
}

export function gradePredicateLabel(predicate: string): string {
  const labels: Record<string, string> = {
    A: "Sangat Baik",
    B: "Baik",
    C: "Cukup",
    D: "Kurang",
    E: "Sangat Kurang",
  };
  return labels[predicate] ?? predicate;
}

export function isPassed(average: number): boolean {
  return average >= KKM;
}

export const DAY_NAMES = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export const DAY_NAMES_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((part) => Number(part) || 0);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function jsDayToIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  multiple_choice: "Pilihan Ganda",
  essay: "Essay",
  true_false: "Benar / Salah",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  mudah: "Mudah",
  sedang: "Sedang",
  sulit: "Sulit",
};
