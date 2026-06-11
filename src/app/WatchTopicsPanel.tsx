"use client";

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Check, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import type { AppCopy } from "@/lib/i18n";
import { normalizeDomain } from "@/lib/watchTopics/suggestions";

interface WatchTopic {
  id: string;
  name: string;
  queries: string[];
  sourceDomains: string[];
  enabled: boolean;
}

interface ApiResponse {
  topics?: WatchTopic[];
  topic?: WatchTopic;
  name?: string;
  queries?: string[];
  sourceDomains?: string[];
  fallback?: boolean;
  error?: string | {
    message?: string;
  };
}

interface WatchTopicsPanelProps {
  copy: AppCopy;
}

interface ChipOption {
  value: string;
  selected: boolean;
}

function errorMessage(data: ApiResponse, fallback: string): string {
  return typeof data.error === "string"
    ? data.error
    : data.error?.message ?? fallback;
}

function splitValues(value: string): string[] {
  return value
    .split("\n")
    .flatMap((line) => line.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function toChipOptions(values: string[]): ChipOption[] {
  const seen = new Set<string>();
  const options: ChipOption[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    options.push({ value: trimmed, selected: true });
  }

  return options;
}

function selectedValues(options: ChipOption[]): string[] {
  return options.filter((option) => option.selected).map((option) => option.value);
}

function addChipValues(
  setOptions: Dispatch<SetStateAction<ChipOption[]>>,
  values: string[],
) {
  setOptions((current) => {
    const seen = new Set(current.map((option) => option.value.toLowerCase()));
    const added = values
      .map((value) => value.trim())
      .filter((value) => value && !seen.has(value.toLowerCase()))
      .map((value) => {
        seen.add(value.toLowerCase());
        return { value, selected: true };
      });

    return [...current, ...added];
  });
}

function toggleChip(
  setOptions: Dispatch<SetStateAction<ChipOption[]>>,
  value: string,
) {
  setOptions((current) =>
    current.map((option) =>
      option.value === value ? { ...option, selected: !option.selected } : option,
    ),
  );
}

function ChipSection({
  title,
  options,
  onToggle,
  manualValue,
  onManualValueChange,
  onManualAdd,
  manualPlaceholder,
  addLabel,
}: {
  title: string;
  options: ChipOption[];
  onToggle: (value: string) => void;
  manualValue: string;
  onManualValueChange: (value: string) => void;
  onManualAdd: () => void;
  manualPlaceholder: string;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={option.selected}
            onClick={() => onToggle(option.value)}
            className={
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors " +
              (option.selected
                ? "border-primary/40 bg-muted text-primary-hover dark:border-primary dark:bg-primary-hover/20 dark:text-secondary"
                : "border-zinc-200 bg-white text-zinc-400 line-through dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500")
            }
          >
            {option.selected ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {option.value}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          value={manualValue}
          onChange={(event) => onManualValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onManualAdd();
            }
          }}
          placeholder={manualPlaceholder}
          className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={onManualAdd}
          disabled={!manualValue.trim()}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      </div>
    </div>
  );
}

export default function WatchTopicsPanel({ copy }: WatchTopicsPanelProps) {
  const [topics, setTopics] = useState<WatchTopic[]>([]);
  const [draftName, setDraftName] = useState("");
  const [draftQueries, setDraftQueries] = useState<ChipOption[]>([]);
  const [draftDomains, setDraftDomains] = useState<ChipOption[]>([]);
  const [draftManualQuery, setDraftManualQuery] = useState("");
  const [draftManualDomain, setDraftManualDomain] = useState("");
  const [draftUsedFallback, setDraftUsedFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQueries, setEditQueries] = useState<ChipOption[]>([]);
  const [editDomains, setEditDomains] = useState<ChipOption[]>([]);
  const [editManualQuery, setEditManualQuery] = useState("");
  const [editManualDomain, setEditManualDomain] = useState("");
  const [editUsedFallback, setEditUsedFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/watch-topics");
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to load watch topics"));
      setTopics(data.topics ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load watch topics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  function resetDraft() {
    setDraftName("");
    setDraftQueries([]);
    setDraftDomains([]);
    setDraftManualQuery("");
    setDraftManualDomain("");
    setDraftUsedFallback(false);
  }

  async function suggestTopic(target: "new" | "edit") {
    const topicName = target === "new" ? draftName.trim() : editName.trim();
    if (!topicName) return;

    setSuggestingId(target);
    setError(null);

    try {
      const res = await fetch("/api/watch-topics/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicName }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to suggest watch topic"));

      if (target === "new") {
        setDraftName(data.name ?? topicName);
        setDraftQueries(toChipOptions(data.queries ?? [topicName]));
        setDraftDomains(toChipOptions(data.sourceDomains ?? []));
        setDraftUsedFallback(data.fallback === true);
      } else {
        setEditName(data.name ?? topicName);
        setEditQueries(toChipOptions(data.queries ?? [topicName]));
        setEditDomains(toChipOptions(data.sourceDomains ?? []));
        setEditUsedFallback(data.fallback === true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suggest watch topic");
    } finally {
      setSuggestingId(null);
    }
  }

  function addManualQueries(
    value: string,
    setValue: Dispatch<SetStateAction<string>>,
    setOptions: Dispatch<SetStateAction<ChipOption[]>>,
  ) {
    addChipValues(setOptions, splitValues(value));
    setValue("");
  }

  function addManualDomains(
    value: string,
    setValue: Dispatch<SetStateAction<string>>,
    setOptions: Dispatch<SetStateAction<ChipOption[]>>,
  ) {
    addChipValues(
      setOptions,
      splitValues(value).map((domain) => normalizeDomain(domain)).filter(Boolean),
    );
    setValue("");
  }

  async function addTopic() {
    const trimmedName = draftName.trim();
    const queries = selectedValues(draftQueries);
    if (!trimmedName || queries.length === 0) return;

    setUpdatingId("new");
    setError(null);

    try {
      const res = await fetch("/api/watch-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          queries,
          sourceDomains: selectedValues(draftDomains),
        }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to save watch topic"));
      if (data.topic) setTopics((prev) => [...prev, data.topic!]);
      resetDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save watch topic");
    } finally {
      setUpdatingId(null);
    }
  }

  function startEdit(topic: WatchTopic) {
    setEditingId(topic.id);
    setEditName(topic.name);
    setEditQueries(toChipOptions(topic.queries));
    setEditDomains(toChipOptions(topic.sourceDomains));
    setEditManualQuery("");
    setEditManualDomain("");
    setEditUsedFallback(false);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditQueries([]);
    setEditDomains([]);
    setEditManualQuery("");
    setEditManualDomain("");
    setEditUsedFallback(false);
  }

  async function saveEdit(topic: WatchTopic) {
    const trimmedName = editName.trim();
    const queries = selectedValues(editQueries);
    if (!trimmedName || queries.length === 0) return;

    setUpdatingId(topic.id);
    setError(null);

    try {
      const res = await fetch(`/api/watch-topics/${topic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          queries,
          sourceDomains: selectedValues(editDomains),
        }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to update watch topic"));
      if (data.topic) {
        setTopics((prev) => prev.map((item) => (item.id === data.topic!.id ? data.topic! : item)));
      }
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update watch topic");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeTopic(topic: WatchTopic) {
    setUpdatingId(topic.id);
    setError(null);

    try {
      const res = await fetch(`/api/watch-topics/${topic.id}`, { method: "DELETE" });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok) throw new Error(errorMessage(data, "Failed to delete watch topic"));
      setTopics((prev) => prev.filter((item) => item.id !== topic.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete watch topic");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadTopics();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadTopics]);

  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {copy.watchTopics.watchTopics}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {copy.watchTopics.watchTopicsDescription}
        </p>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            value={draftName}
            onChange={(event) => {
              setDraftName(event.target.value);
              setDraftUsedFallback(false);
            }}
            placeholder={copy.watchTopics.watchTopicName}
            className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={() => suggestTopic("new")}
            disabled={!draftName.trim() || suggestingId === "new" || updatingId === "new"}
            className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {suggestingId === "new" ? copy.watchTopics.suggesting : copy.watchTopics.suggestWatchTopic}
          </button>
        </div>

        {draftUsedFallback && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {copy.watchTopics.suggestionFallback}
          </p>
        )}

        {draftQueries.length > 0 && (
          <div className="space-y-3">
            <ChipSection
              title={copy.watchTopics.suggestedSearchTerms}
              options={draftQueries}
              onToggle={(value) => toggleChip(setDraftQueries, value)}
              manualValue={draftManualQuery}
              onManualValueChange={setDraftManualQuery}
              onManualAdd={() => addManualQueries(draftManualQuery, setDraftManualQuery, setDraftQueries)}
              manualPlaceholder={copy.watchTopics.manualSearchTerm}
              addLabel={copy.watchTopics.addSearchTerm}
            />
            <ChipSection
              title={copy.watchTopics.suggestedSources}
              options={draftDomains}
              onToggle={(value) => toggleChip(setDraftDomains, value)}
              manualValue={draftManualDomain}
              onManualValueChange={setDraftManualDomain}
              onManualAdd={() => addManualDomains(draftManualDomain, setDraftManualDomain, setDraftDomains)}
              manualPlaceholder={copy.watchTopics.manualSourceDomain}
              addLabel={copy.watchTopics.addSourceDomain}
            />
            <button
              type="button"
              onClick={addTopic}
              disabled={
                updatingId === "new" ||
                !draftName.trim() ||
                selectedValues(draftQueries).length === 0
              }
              className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
            >
              <Check className="h-3.5 w-3.5" />
              {updatingId === "new" ? copy.watchTopics.adding : copy.watchTopics.saveWatchTopic}
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{copy.watchTopics.loadingWatchTopics}</p>
      ) : topics.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {copy.watchTopics.watchTopicsHint}
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              {editingId === topic.id ? (
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      value={editName}
                      onChange={(event) => {
                        setEditName(event.target.value);
                        setEditUsedFallback(false);
                      }}
                      placeholder={copy.watchTopics.watchTopicName}
                      className="w-full rounded-md border border-zinc-300 bg-white p-2 text-sm text-zinc-900 outline-none focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() => suggestTopic("edit")}
                      disabled={!editName.trim() || suggestingId === "edit" || updatingId === topic.id}
                      className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {suggestingId === "edit" ? copy.watchTopics.suggesting : copy.watchTopics.suggestWatchTopic}
                    </button>
                  </div>

                  {editUsedFallback && (
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      {copy.watchTopics.suggestionFallback}
                    </p>
                  )}

                  <ChipSection
                    title={copy.watchTopics.suggestedSearchTerms}
                    options={editQueries}
                    onToggle={(value) => toggleChip(setEditQueries, value)}
                    manualValue={editManualQuery}
                    onManualValueChange={setEditManualQuery}
                    onManualAdd={() => addManualQueries(editManualQuery, setEditManualQuery, setEditQueries)}
                    manualPlaceholder={copy.watchTopics.manualSearchTerm}
                    addLabel={copy.watchTopics.addSearchTerm}
                  />
                  <ChipSection
                    title={copy.watchTopics.suggestedSources}
                    options={editDomains}
                    onToggle={(value) => toggleChip(setEditDomains, value)}
                    manualValue={editManualDomain}
                    onManualValueChange={setEditManualDomain}
                    onManualAdd={() => addManualDomains(editManualDomain, setEditManualDomain, setEditDomains)}
                    manualPlaceholder={copy.watchTopics.manualSourceDomain}
                    addLabel={copy.watchTopics.addSourceDomain}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => saveEdit(topic)}
                      disabled={
                        updatingId === topic.id ||
                        !editName.trim() ||
                        selectedValues(editQueries).length === 0
                      }
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {updatingId === topic.id ? copy.watchTopics.saving : copy.watchTopics.save}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={updatingId === topic.id}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
                    >
                      <X className="h-3.5 w-3.5" />
                      {copy.watchTopics.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {topic.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {topic.queries.join(", ")}
                    </span>
                    {topic.sourceDomains.length > 0 && (
                      <span className="block truncate text-xs text-zinc-400 dark:text-zinc-500">
                        {topic.sourceDomains.join(", ")}
                      </span>
                    )}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(topic)}
                      disabled={updatingId === topic.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-primary disabled:opacity-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {copy.watchTopics.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTopic(topic)}
                      disabled={updatingId === topic.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {copy.watchTopics.remove}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
