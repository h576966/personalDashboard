import DashboardShell from "./DashboardShell";
import AuthScreen from "./AuthScreen";
import { AuthError, getCurrentHousehold } from "@/lib/auth/household";

interface HomeProps {
  searchParams?: Promise<{ auth?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const authMessage =
    params?.auth === "error"
      ? "That sign-in link could not be used."
      : params?.auth === "denied"
        ? "That email is not allowed for this household."
        : undefined;
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
      return <AuthScreen initialMessage="Supabase Auth is not configured yet." />;
    }

    throw error;
  }

  if (!household) {
    return <AuthScreen initialMessage={authMessage} />;
  }

  return <DashboardShell userEmail={household.email} />;
}
