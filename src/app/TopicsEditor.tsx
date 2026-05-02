"use client";

import { useState, useEffect, FormEvent } from "react";
import {
  LANGUAGE_OPTIONS,
  COUNTRY_OPTIONS,
  TOPIC_PRESETS,
} from "@/lib/db/topics";

interface NewsTopic {
  id: string;
  name: string;
  description: string;
  queries: string[];
  country: string;
  region: string;
  language: string;
  preferredSources: string[];
  blockedSources: string[];
  requiredKeywords: string[];
  blockedKeywords: string[];
  maxItemsPerDay: number;
  minScore: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  queries: "",
  country: "",
  region: "",
  language: "",
  preferredSources: "",
  blockedSources: "",
  requiredKeywords: "",
  blockedKeywords: "",
  maxItemsPerDay: 5,
  minScore: 0,
};

/** Ensure the current value appears in the dropdown options (for backward compat). */
function mergeCurrentValue(
  options: { value: string; label: string }[],
  currentValue: string,
): { value: string; label: string }[] {
  if (!currentValue) return options;
  if (options.some((o) => o.value === currentValue)) return options;
  return [...options, { value: currentValue, label: currentValue }];
}

export default function TopicsEditor() {
  const [topics, setTopics] = useState<NewsTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function loadTopics() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/news/topics");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to load topics");
      }
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load topics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTopics();
  }, []);

  function hasAdvancedValues(topic: NewsTopic) {
    return (
      topic.country !== "" ||
      topic.region !== "" ||
      topic.preferredSources.length > 0 ||
      topic.blockedSources.length > 0 ||
      topic.requiredKeywords.length > 0 ||
      topic.blockedKeywords.length > 0 ||
      topic.maxItemsPerDay !== 5 ||
      topic.minScore !== 0
    );
  }

  function startEdit(topic: NewsTopic) {
    setEditingId(topic.id);
    setShowAdvanced(hasAdvancedValues(topic));
    setForm({
      name: topic.name,
      description: topic.description,
      queries: topic.queries.join("\n"),
      country: topic.country,
      region: topic.region,
      language: topic.language,
      preferredSources: topic.preferredSources.join("\n"),
      blockedSources: topic.blockedSources.join("\n"),
      requiredKeywords: topic.requiredKeywords.join("\n"),
      blockedKeywords: topic.blockedKeywords.join("\n"),
      maxItemsPerDay: topic.maxItemsPerDay,
      minScore: topic.minScore,
    });
  }

  function resetForm() {
    setEditingId(null);
    setShowAdvanced(false);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim(),
      queries: form.queries
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      country: form.country.trim(),
      region: form.region.trim(),
      language: form.language.trim(),
      preferredSources: form.preferredSources
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      blockedSources: form.blockedSources
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      requiredKeywords: form.requiredKeywords
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      blockedKeywords: form.blockedKeywords
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      maxItemsPerDay: form.maxItemsPerDay,
      minScore: form.minScore,
    };

    try {
      const url = editingId
        ? `/api/news/topics/${editingId}`
        : "/api/news/topics";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to save topic");
      }

      resetForm();
      await loadTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save topic");
    }
  }

  async function handleToggleEnabled(topic: NewsTopic) {
    const newEnabled = !topic.enabled;
    setTogglingId(topic.id);

    // Optimistic update
    setTopics((prev) =>
      prev.map((t) => (t.id === topic.id ? { ...t, enabled: newEnabled } : t)),
    );

    try {
      const res = await fetch(`/api/news/topics/${topic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newEnabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle topic");
      }
    } catch (err) {
      // Revert on error
      setTopics((prev) =>
        prev.map((t) =>
          t.id === topic.id ? { ...t, enabled: !newEnabled } : t,
        ),
      );
      setError(err instanceof Error ? err.message : "Failed to toggle topic");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this topic?")) return;

    try {
      const res = await fetch(`/api/news/topics/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? "Failed to delete topic");
      }
      await loadTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete topic");
    }
  }

  function updateForm(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handlePresetChange(presetLabel: string) {
    const preset = TOPIC_PRESETS.find((p) => p.label === presetLabel);
    if (preset) {
      updateForm("queries", preset.queries);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-zinc-500">
          <span className="inline-block w-4 h-4 border-2 border-zinc-300 border-t-teal-600 rounded-full animate-spin" />
          <span>Loading topics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="w-full rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Topic Form */}
      <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
        <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {editingId ? "Edit Topic" : "Create Topic"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Essential Fields ── */}
          <div className="space-y-4">
            {/* Preset selector */}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Topic preset
              </label>
              <select
                value=""
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="" disabled>
                  Select a preset...
                </option>
                {TOPIC_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                Selecting a preset will replace any existing search terms.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Topic name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  required
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  placeholder="e.g. Tech News"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Language
                </label>
                <select
                  value={form.language}
                  onChange={(e) => updateForm("language", e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  {mergeCurrentValue(LANGUAGE_OPTIONS, form.language).map(
                    (opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Search terms * (one per line)
              </label>
              <textarea
                value={form.queries}
                onChange={(e) => updateForm("queries", e.target.value)}
                required
                rows={3}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder={"latest AI news\nmachine learning breakthroughs"}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Short description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="Optional description"
              />
            </div>
          </div>

          {/* ── Advanced Toggle ── */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-700 transition-colors dark:text-zinc-400 dark:hover:text-zinc-300"
          >
            <span
              className={`inline-block transition-transform ${
                showAdvanced ? "rotate-90" : ""
              }`}
            >
              &#x25B6;
            </span>
            Advanced settings
          </button>

          {/* ── Advanced Fields ── */}
          {showAdvanced && (
            <div className="space-y-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Country
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) => updateForm("country", e.target.value)}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    {mergeCurrentValue(COUNTRY_OPTIONS, form.country).map(
                      (opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Region filter
                  </label>
                  <input
                    type="text"
                    value={form.region}
                    onChange={(e) => updateForm("region", e.target.value)}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    placeholder="e.g. EU"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Prefer these sources (one per line)
                  </label>
                  <textarea
                    value={form.preferredSources}
                    onChange={(e) =>
                      updateForm("preferredSources", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    placeholder="reuters.com&#10;apnews.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Ignore these sources (one per line)
                  </label>
                  <textarea
                    value={form.blockedSources}
                    onChange={(e) =>
                      updateForm("blockedSources", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    placeholder="spam-site.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Must include keywords (one per line)
                  </label>
                  <textarea
                    value={form.requiredKeywords}
                    onChange={(e) =>
                      updateForm("requiredKeywords", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    placeholder="keyword1"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Exclude keywords (one per line)
                  </label>
                  <textarea
                    value={form.blockedKeywords}
                    onChange={(e) =>
                      updateForm("blockedKeywords", e.target.value)
                    }
                    rows={3}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    placeholder="spam"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Articles per day
                  </label>
                  <input
                    type="number"
                    value={form.maxItemsPerDay}
                    onChange={(e) =>
                      updateForm(
                        "maxItemsPerDay",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    min={1}
                    max={100}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Quality threshold (0-10)
                  </label>
                  <input
                    type="number"
                    value={form.minScore}
                    onChange={(e) =>
                      updateForm(
                        "minScore",
                        parseInt(e.target.value, 10) || 0,
                      )
                    }
                    min={0}
                    max={10}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit buttons */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-md bg-teal-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
            >
              {editingId ? "Update Topic" : "Create Topic"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Topic List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Existing Topics ({topics.length})
        </h3>

        {topics.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No topics yet. Create one above.
          </p>
        )}

        {topics.map((topic) => (
          <div
            key={topic.id}
            className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  {topic.name}
                  {!topic.enabled && (
                    <span className="ml-2 rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                      Disabled
                    </span>
                  )}
                </h4>
                {topic.description && (
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {topic.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Inline enabled toggle */}
                <label
                  className={`relative inline-flex items-center cursor-pointer ${
                    togglingId === topic.id
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                  title={topic.enabled ? "Disable topic" : "Enable topic"}
                >
                  <input
                    type="checkbox"
                    checked={topic.enabled}
                    onChange={() => handleToggleEnabled(topic)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all dark:bg-zinc-600" />
                </label>
                <button
                  type="button"
                  onClick={() => startEdit(topic)}
                  className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(topic.id)}
                  className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {topic.queries.map((q, i) => (
                <span
                  key={i}
                  className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                >
                  {q}
                </span>
              ))}
            </div>
            <div className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              Max {topic.maxItemsPerDay}/day &middot; Min score{" "}
              {topic.minScore} &middot;
              {topic.preferredSources.length > 0 &&
                ` ${topic.preferredSources.length} preferred sources`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
