/**
 * Lightweight runtime type assertion for database row mappings.
 *
 * When a DB schema change produces a mismatch, the error surfaces here
 * (at the mapping boundary) rather than as a cryptic property-access crash
 * in a React component or API handler.
 */

const TYPE_MAP: Record<string, (v: unknown) => boolean> = {
  string: (v): v is string => typeof v === "string",
  number: (v): v is number => typeof v === "number",
  boolean: (v): v is boolean => typeof v === "boolean",
  array: Array.isArray,
  object: (v): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v),
};

export function assertField<T>(
  row: Record<string, unknown>,
  field: string,
  type: string,
): T {
  const value = row[field];
  const check = TYPE_MAP[type];

  if (!check) {
    throw new Error(`assertField: unknown type "${type}" for field "${field}"`);
  }

  if (value === undefined || value === null) {
    throw new Error(
      `Database row missing required field "${field}": expected ${type}`,
    );
  }

  if (!check(value)) {
    throw new Error(
      `Database field "${field}" expected ${type}, got ${typeof value}`,
    );
  }

  return value as T;
}
