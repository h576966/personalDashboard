"use client";

import { useEffect, useState } from "react";

interface BriefingPreferences {
  id: string;
  blocked_categories: string[];
  blocked_keywords: string[];
  preferred_categories: string[];
  preferred_sources: string[];
  blocked_sources: string[];
  prefer_global_source_mix: boolean;
}

interface BriefingPreferencesPanelProps {
  onClose: () => void;
  onSaved?: () => void;
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

export default function BriefingPreferencesPanel({ onClose, onSaved }: BriefingPreferencesPanelProps) {
  const [prefs, setPrefs] = useState<BriefingPreferences | null>(null);
  const [blockedKeywords, setBlockedKeywords] = useState("");
  const [preferredSources, setPreferredSources] = useState("");
  const [blockedSources, setBlockedSources] = useState("");
  const [preferGlobalSourceMix, setPreferGlobalSourceMix] = useState(true);
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

        if (!res.ok) throw new Error(data.error ?? "Failed to load preferences");

        setPrefs(data);
        setBlockedKeywords(listToText(data.blocked_keywords ?? []));
        setPreferredSources(listToText(data.preferred_sources ?? []));
        setBlockedSources(listToText(data.blocked_sources ?? []));
        setPreferGlobalSourceMix(Boolean(data.prefer_global_source_mix));
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
          blocked_keywords: parseList(blockedKeywords),
          preferred_sources: parseList(preferredSources),
          blocked_sources: parseList(blockedSources),
          prefer_global_source_mix: preferGlobalSourceMix,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to save preferences");

      setPrefs(data);
      onSaved?.();
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
            Briefing preferences
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Comma-separated filters used before the AI generates the briefing.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Close
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Loading preferences...</p>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Blocked keywords
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
              Preferred sources
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
              Blocked sources
            </span>
            <input
              value={blockedSources}
              onChange={(event) => setBlockedSources(event.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="example.com"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={preferGlobalSourceMix}
              onChange={(event) => setPreferGlobalSourceMix(event.target.checked)}
            />
            Prefer global source mix for broad news topics
          </label>

          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={savePreferences}
              disabled={isSaving || !prefs}
              className="rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save preferences"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
