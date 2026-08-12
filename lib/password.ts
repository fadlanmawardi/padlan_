import type { PasswordStrength } from "@/types";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function evaluatePassword(password: string): PasswordStrength {
  const hasMin = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const met = [hasMin, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  let label: PasswordStrength["label"] = "Weak";
  if (met >= 4 && password.length >= 10) label = "Strong";
  else if (met >= 3) label = "Medium";

  return {
    score: met,
    label,
    requirements: { hasMin, hasUpper, hasLower, hasNumber },
  };
}

export function passwordErrors(password: string): string[] {
  const errors: string[] = [];
  if (!password) return errors;
  if (password.length < 8) errors.push("Minimal 8 karakter");
  if (!/[A-Z]/.test(password)) errors.push("Minimal satu huruf besar");
  if (!/[a-z]/.test(password)) errors.push("Minimal satu huruf kecil");
  if (!/\d/.test(password)) errors.push("Minimal satu angka");
  return errors;
}

export const STRENGTH_STYLES: Record<
  PasswordStrength["label"],
  { bar: string; text: string }
> = {
  Weak: {
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
  },
  Medium: {
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  Strong: {
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
};
