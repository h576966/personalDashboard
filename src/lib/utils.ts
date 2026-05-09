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
