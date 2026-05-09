function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.HOUSEHOLD_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

export function isEmailAllowed(email: string): boolean {
  const allowed = allowedEmails();
  return allowed.size > 0 && allowed.has(normalizeEmail(email));
}

export function normalizedEmail(email: string): string {
  return normalizeEmail(email);
}
