import DashboardShell from "./DashboardShell";
import AuthScreen from "./AuthScreen";
import { AuthError, getCurrentHousehold } from "@/lib/auth/household";

interface HomeProps {
  searchParams?: Promise<{ auth?: string }>;
}

function getAuthMessage(code: string | undefined): string | undefined {
  switch (code) {
    case "error":
    case "exchange_failed":
      return "That sign-in link expired or was already used. Request a new magic link.";
    case "missing_code":
      return "The sign-in link is incomplete. Request a new magic link from this browser.";
    case "session_missing":
      return "Sign-in did not complete. Request a new magic link and open it in the same browser.";
    case "denied":
      return "That email is not allowed for this household.";
    default:
      return undefined;
  }
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const authMessage = getAuthMessage(params?.auth);
  let household;

  try {
    household = await getCurrentHousehold();
  } catch (error) {
    if (error instanceof AuthError && error.status === 403) {
      return <AuthScreen deniedEmail={error.email ?? "This email"} />;
    }

    if (
      error instanceof Error &&
      error.message.includes("Missing public Supabase auth environment variables")
    ) {
      return (
        <AuthScreen
          initialMessage="Supabase Auth is not configured yet."
          initialStatus="warning"
        />
      );
    }

    if (error instanceof Error && error.message.includes("Missing SUPABASE_SERVICE_ROLE_KEY")) {
      return (
        <AuthScreen
          initialMessage="Supabase service role key is not configured yet."
          initialStatus="warning"
        />
      );
    }

    throw error;
  }

  if (!household) {
    return <AuthScreen initialMessage={authMessage} initialStatus={authMessage ? "error" : undefined} />;
  }

  return <DashboardShell userEmail={household.email} />;
}
