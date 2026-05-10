"use client";

import { useState } from "react";
import { ActionButton, InlineNotice } from "./components/ModuleChrome";
import { getAppCopy } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

interface AuthScreenProps {
  deniedEmail?: string;
  initialMessage?: string;
  initialStatus?: "error" | "warning";
}

function getAuthCallbackUrl(): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const baseUrl =
    configuredSiteUrl && /^https?:\/\//.test(configuredSiteUrl)
      ? configuredSiteUrl
      : window.location.origin;

  return `${baseUrl.replace(/\/$/, "")}/auth/callback`;
}

export default function AuthScreen({ deniedEmail, initialMessage, initialStatus }: AuthScreenProps) {
  const copy = getAppCopy("en");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error" | "warning">(
    initialStatus ?? "idle",
  );
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
          emailRedirectTo: getAuthCallbackUrl(),
        },
      });

      if (error) throw error;

      setStatus("sent");
      setMessage(copy.auth.checkEmail);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : copy.auth.sendError);
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
          {copy.auth.product}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {copy.auth.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          {copy.auth.description}
        </p>

        {!isAuthConfigured && (
          <InlineNotice tone="warning" className="mt-4">
            {copy.auth.envNotice}
          </InlineNotice>
        )}

        {deniedEmail && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
            {copy.auth.denied(deniedEmail)}
          </div>
        )}

        <form onSubmit={signIn} className="mt-5 space-y-3">
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {copy.auth.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder={copy.auth.emailPlaceholder}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <ActionButton
            type="submit"
            disabled={status === "loading" || !isAuthConfigured}
            variant="primary"
            className="w-full"
          >
            {status === "loading" ? copy.auth.sending : copy.auth.sendMagicLink}
          </ActionButton>
        </form>

        {message && (
          <p
            className={
              "mt-4 rounded-md px-3 py-2 text-sm " +
              (status === "error"
                ? "border border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
                : status === "warning"
                  ? "border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
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
            {copy.auth.signOutTryAnother}
          </button>
        )}
      </div>
    </div>
  );
}
