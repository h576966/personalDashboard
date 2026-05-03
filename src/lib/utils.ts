import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize a Select value for API params.
 * Converts the "all" sentinel to `undefined` so the field is omitted from the request body.
 */
export function normalizeParam(value: string): string | undefined {
  return value && value !== "all" ? value : undefined;
}

/**
 * Normalize a Select value for database storage.
 * Converts the "all" sentinel to `""` so the DB stores an empty string (no filter).
 */
export function normalizeDbValue(value: string): string {
  return value !== "all" ? value : "";
}
