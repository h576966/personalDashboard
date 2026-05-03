"use client";

import { useState } from "react";
import Spinner from "./components/Spinner";
import ErrorCard from "./components/ErrorCard";
import { type Status } from "./components/Status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeParam } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/db/topics";
import { Clock, Globe } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  score: number;
}

interface ErrorResponse {
  error: {
    message: string;
    code: string;
  };
}

interface SuccessData {
  results: SearchResult[];
  summary?: string;
  suggestions?: string[];
  rewrittenQuery?: string;
}

export default function SearchModule() {
  const [query, setQuery] = useState("");
  const [freshness, setFreshness] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState<Status<SuccessData>>({ type: "idle" });

  async function performSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setStatus({ type: "loading" });

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmed,
          freshness: normalizeParam(freshness),
          country: normalizeParam(country),
        }),
      });

      if (!res.ok) {
        const err: ErrorResponse = await res.json();
        setStatus({
          type: "error",
          message: err.error?.message ?? `Request failed (${res.status})`,
        });
        return;
      }

      const data: SuccessData = await res.json();
      setStatus({ type: "success", data });
    } catch {
      setStatus({
        type: "error",
        message: "Network error — could not reach the server",
      });
    }
  }

  function handleSuggestionClick(suggestion: string) {
    setQuery(suggestion);
    performSearch(suggestion);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(query);
    }
  }

  return (
    <>
      <div className="bg-primary-hover border-b border-primary-hover/70 dark:border-primary-hover/80">
        <div className="flex flex-wrap items-center gap-2 mx-auto max-w-5xl px-4 py-2">
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            className="flex-1 min-w-[280px] h-11 border-primary bg-white dark:bg-zinc-800 dark:text-zinc-100"
            disabled={status.type === "loading"}
          />
          <Button
            type="button"
            onClick={() => performSearch(query)}
            disabled={!query.trim() || status.type === "loading"}
            size="sm"
            className="h-11 bg-accent text-accent-foreground hover:bg-muted hover:text-muted-foreground"
          >
            {status.type === "loading" ? "..." : "Go"}
          </Button>
            {/* Freshness */}
          <div className="flex items-center gap-1">
            <span className="text-white">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <Select value={freshness} onValueChange={setFreshness} disabled={status.type === "loading"}>
              <SelectTrigger className="rounded-md bg-primary-hover border border-primary px-2 py-1 h-auto text-xs text-white focus:ring-primary w-[110px] [&>svg]:text-white">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent className="w-[110px] min-w-[110px] bg-accent border-accent text-black">
                <SelectItem value="all" className="text-black focus:bg-white focus:text-black text-xs">Any time</SelectItem>
                <SelectItem value="pd" className="text-black focus:bg-white focus:text-black text-xs">Past Day</SelectItem>
                <SelectItem value="pw" className="text-black focus:bg-white focus:text-black text-xs">Past Week</SelectItem>
                <SelectItem value="pm" className="text-black focus:bg-white focus:text-black text-xs">Past Month</SelectItem>
                <SelectItem value="py" className="text-black focus:bg-white focus:text-black text-xs">Past Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
            {/* Region */}
          <div className="flex items-center gap-1">
            <span className="text-white">
              <Globe className="w-3.5 h-3.5" />
            </span>
            <Select value={country} onValueChange={setCountry} disabled={status.type === "loading"}>
              <SelectTrigger className="rounded-md bg-primary-hover border border-primary px-2 py-1 h-auto text-xs text-white focus:ring-primary w-[140px] [&>svg]:text-white">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent className="w-[140px] min-w-[140px] bg-accent border-accent text-black max-h-[200px]">
                {COUNTRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-black focus:bg-white focus:text-black text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>
      {status.type !== "idle" && (
        <div className="max-w-5xl mx-auto px-6 pb-8 pt-6">
          {status.type === "loading" && (
            <Spinner label="Searching..." />
          )}

          {status.type === "error" && (
            <ErrorCard message={status.message} />
          )}

          {status.type === "success" && (
            <div className="w-full space-y-4">
              {status.data.summary && (
                <div className="rounded-md border border-muted bg-muted p-4 dark:border-primary-hover dark:bg-primary-hover/20">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
                    AI Summary
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {status.data.summary}
                  </p>
                  {status.data.rewrittenQuery &&
                    status.data.rewrittenQuery !== query.trim() && (
                      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 italic">
                        Showing results for: {status.data.rewrittenQuery}
                      </p>
                    )}
                </div>
              )}

              {status.data.suggestions &&
                status.data.suggestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {status.data.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50 hover:border-secondary hover:text-primary transition-colors dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-primary dark:hover:text-secondary"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {status.data.results.length} result
                {status.data.results.length !== 1 ? "s" : ""}
              </p>

              {status.data.results.length === 0 ? (
                <p className="text-zinc-500 dark:text-zinc-400">
                  No results found.
                </p>
              ) : (
                <ul className="space-y-4">
                  {status.data.results.map((r) => (
                    <li
                      key={r.url}
                      className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 dark:border-zinc-700 dark:bg-zinc-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-zinc-900 hover:text-primary dark:text-zinc-100 dark:hover:text-secondary"
                        >
                          {r.title}
                        </a>
                        <span className="shrink-0 rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300">
                          {r.score}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">
                        {r.description}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400 truncate dark:text-zinc-500">
                        {r.url}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
