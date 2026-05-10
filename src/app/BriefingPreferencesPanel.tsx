"use client";

import { useEffect, useState } from "react";
import NewsSourcesPanel from "./NewsSourcesPanel";
import MutedTopicsPanel from "./MutedTopicsPanel";
import WatchTopicsPanel from "./WatchTopicsPanel";
import { LANGUAGE_OPTIONS, type AppCopy, type AppLanguage } from "@/lib/i18n";

interface BriefingPreferences {
  id: string;
  blocked_categories: string[];
  blocked_keywords: string[];
  preferred_categories: string[];
  preferred_sources: string[];
  blocked_sources: string[];
  regional_focus: "nordic" | "norway" | "sweden" | "global";
  app_language: AppLanguage;
  summary_language: "en" | "no" | "sv";
}

interface ApiErrorBody {
  error?: string | {
    message?: string;
  };
}

interface BriefingPreferencesPanelProps {
  onClose: () => void;
  onSaved?: () => void | Promise<void>;
  copy: AppCopy;
}

function parseList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(value: string[]): string {
  return value.join(", ");
}

function errorMessage(data: ApiErrorBody, fallback: string): string {
  return typeof data.error === "string"
    ? data.error
    : data.error?.message ?? fallback;
}

export default function BriefingPreferencesPanel({ onClose, onSaved, copy }: BriefingPreferencesPanelProps) {
  const [prefs, setPrefs] = useState<BriefingPreferences | null>(null);
  const [blockedCategories, setBlockedCategories] = useState("");
  const [blockedKeywords, setBlockedKeywords] = useState("");
  const [preferredSources, setPreferredSources] = useState("");
  const [blockedSources, setBlockedSources] = useState("");
  const [regionalFocus, setRegionalFocus] = useState<BriefingPreferences["regional_focus"]>("nordic");
  const [appLanguage, setAppLanguage] = useState<AppLanguage>("en");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/briefing-preferences");
        const data = await res.json();

        if (!res.ok) throw new Error(errorMessage(data, "Failed to load preferences"));

        setPrefs(data);
        setBlockedCategories(listToText(data.blocked_categories ?? []));
        setBlockedKeywords(listToText(data.blocked_keywords ?? []));
        setPreferredSources(listToText(data.preferred_sources ?? []));
        setBlockedSources(listToText(data.blocked_sources ?? []));
        setRegionalFocus(data.regional_focus ?? "nordic");
        setAppLanguage(data.app_language ?? data.summary_language ?? "en");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load preferences");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPreferences();
  }, []);

  async function savePreferences() {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/briefing-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocked_categories: parseList(blockedCategories),
          blocked_keywords: parseList(blockedKeywords),
          preferred_sources: parseList(preferredSources),
          blocked_sources: parseList(blockedSources),
          regional_focus: regionalFocus,
          app_language: appLanguage,
          summary_language: appLanguage,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(errorMessage(data, "Failed to save preferences"));

      setPrefs(data);
      await onSaved?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {copy.preferences.title}
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {copy.preferences.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {copy.preferences.close}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{copy.preferences.loading}</p>
      ) : (
        <div className="mt-4 space-y-4">
          <NewsSourcesPanel onChanged={onSaved} copy={copy} />
          <MutedTopicsPanel onChanged={onSaved} copy={copy} />
          <WatchTopicsPanel onChanged={onSaved} copy={copy} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {copy.preferences.regionalFocus}
              </span>
              <select
                value={regionalFocus}
                onChange={(event) =>
                  setRegionalFocus(event.target.value as BriefingPreferences["regional_focus"])
                }
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="nordic">{copy.preferences.regions.nordic}</option>
                <option value="norway">{copy.preferences.regions.norway}</option>
                <option value="sweden">{copy.preferences.regions.sweden}</option>
                <option value="global">{copy.preferences.regions.global}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {copy.preferences.language}
              </span>
              <select
                value={appLanguage}
                onChange={(event) => setAppLanguage(event.target.value as AppLanguage)}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {copy.preferences.blockedCategories}
            </span>
            <textarea
              value={blockedCategories}
              onChange={(event) => setBlockedCategories(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="sports, celebrities, entertainment gossip"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {copy.preferences.blockedKeywords}
            </span>
            <textarea
              value={blockedKeywords}
              onChange={(event) => setBlockedKeywords(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="sports, celebrities, football"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {copy.preferences.preferredSources}
            </span>
            <input
              value={preferredSources}
              onChange={(event) => setPreferredSources(event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="reuters.com, apnews.com"
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {copy.preferences.blockedSources}
            </span>
            <input
              value={blockedSources}
              onChange={(event) => setBlockedSources(event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="example.com"
            />
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
            >
              {copy.preferences.cancel}
            </button>
            <button
              type="button"
              onClick={savePreferences}
              disabled={isSaving || !prefs}
              className="rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? copy.preferences.saving : copy.preferences.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
