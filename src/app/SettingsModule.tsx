"use client";

import { useState } from "react";
import WatchTopicsPanel from "./WatchTopicsPanel";
import { ActionButton, InlineNotice, ModuleCard, ModuleHeader } from "./components/ModuleChrome";
import { LANGUAGE_OPTIONS, type AppCopy, type AppLanguage } from "@/lib/i18n";

interface SettingsModuleProps {
  userEmail: string;
  appLanguage: AppLanguage;
  copy: AppCopy;
  onPreferencesChanged: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
}

interface ApiErrorBody {
  error?: string | {
    message?: string;
  };
}

function errorMessage(data: ApiErrorBody, fallback: string): string {
  return typeof data.error === "string"
    ? data.error
    : data.error?.message ?? fallback;
}

export default function SettingsModule({
  userEmail,
  appLanguage,
  copy,
  onPreferencesChanged,
  onSignOut,
}: SettingsModuleProps) {
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);

  async function saveLanguage(nextLanguage: AppLanguage) {
    setIsSavingLanguage(true);
    setLanguageError(null);

    try {
      const res = await fetch("/api/app-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_language: nextLanguage,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(errorMessage(data, "Failed to save language"));

      await onPreferencesChanged();
    } catch (err) {
      setLanguageError(err instanceof Error ? err.message : "Failed to save language");
    } finally {
      setIsSavingLanguage(false);
    }
  }

  return (
    <section className="space-y-4">
      <ModuleCard>
        <ModuleHeader
          eyebrow={copy.settings.eyebrow}
          title={copy.settings.title}
          description={copy.settings.description}
        />

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div className="rounded-md border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {copy.settings.general}
            </p>

            <label className="mt-3 block">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {copy.settings.language}
              </span>
              <select
                value={appLanguage}
                disabled={isSavingLanguage}
                onChange={(event) => saveLanguage(event.target.value as AppLanguage)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {languageError && (
              <InlineNotice tone="error" className="mt-3">
                {languageError}
              </InlineNotice>
            )}
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {copy.settings.account}
            </p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {copy.settings.signedInAs}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {userEmail}
            </p>
            <ActionButton onClick={onSignOut} variant="secondary" className="mt-4">
              {copy.shell.signOut}
            </ActionButton>
          </div>
        </div>
      </ModuleCard>

      <WatchTopicsPanel copy={copy} />
    </section>
  );
}
