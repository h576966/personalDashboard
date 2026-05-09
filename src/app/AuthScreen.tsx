"use client";

import { useState } from "react";
import { ActionButton, InlineNotice } from "./components/ModuleChrome";
import { createClient } from "@/lib/supabase/client";

interface AuthScreenProps {
  deniedEmail?: string;
  initialMessage?: string;
}

export default function AuthScreen({ deniedEmail, initialMessage }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState(initialMessage ?? "");
  const isAuthConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isAuthConfigured) return;

    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setStatus("sent");
      setMessage("Check your email for the sign-in link.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send sign-in link");
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
          Personal Dashboard
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Sign in to Home
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Enter an allowlisted household email and we will send a one-time sign-in link.
        </p>

        {!isAuthConfigured && (
          <InlineNotice tone="warning" className="mt-4">
            Supabase Auth needs the public URL and publishable key in `.env.local`, then a dev
            server restart.
          </InlineNotice>
        )}

        {deniedEmail && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            {deniedEmail} is not allowed for this household.
          </div>
        )}

        <form onSubmit={signIn} className="mt-5 space-y-3">
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <ActionButton
            type="submit"
            disabled={status === "loading" || !isAuthConfigured}
            variant="primary"
            className="w-full"
          >
            {status === "loading" ? "Sending..." : "Send magic link"}
          </ActionButton>
        </form>

        {message && (
          <p
            className={
              "mt-4 rounded-md px-3 py-2 text-sm " +
              (status === "error"
                ? "border border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
                : "border border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300")
            }
          >
            {message}
          </p>
        )}

        {deniedEmail && (
          <button
            type="button"
            onClick={signOut}
            className="mt-4 text-sm font-medium text-primary hover:text-primary-hover"
          >
            Sign out and try another email
          </button>
        )}
      </div>
    </div>
  );
}
