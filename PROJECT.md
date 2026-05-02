# Personal Dashboard — Product Overview

A family-focused personal dashboard for couples/parents. Local-first, AI-enhanced web app built
with Next.js, TypeScript, and Tailwind CSS.

## Current Features

### Clean Search (`/`)
Web search powered by the Brave Search API, re-ranked by relevance scoring. Search results are
filtered for quality (blocked low-value domains, boosted knowledge sites), scored by term matching
and heuristics, and optionally summarized by DeepSeek AI with follow-up suggestions.

Key files: `src/app/page.tsx`, `src/app/api/search/route.ts`, `src/lib/search/`, `src/lib/brave.ts`

### News Briefing (`/news`)
Curated news aggregation from configurable topics. Each topic defines queries, preferred/blocked
sources, keywords, scoring thresholds, and per-topic limits. A `processBriefing()` orchestrator
fetches from Brave Search, scores items per-topic, deduplicates (URL hash + Dice coefficient),
filters by score, and persists results to SQLite. The UI shows a tabbed view with today's briefing
and a topic CRUD editor.

Key files: `src/app/news/page.tsx`, `src/app/api/news/`, `src/lib/news/`, `src/lib/db/`

## Planned Features

- **Family Schedule** — Shared calendar/events for the household.
- **Shared Tasks / Checklist** — Collaborative task lists.
- **Shared Notes** — Persistent markdown notes per family member.

## Product Principles

- **One dynamic dashboard page** — A single page with expandable/collapsible modules, not
  separate navigation tabs.
- **Mobile-aware** — Responsive layout that works on phones and tablets.
- **Precision over recall** — Quality filters and scoring prioritize useful results over volume.
- **Deterministic before AI** — Core functionality works without AI. AI enhances results
  (summaries, suggestions) but is never required.
- **Local-first persistence** — SQLite for local storage; external database (Supabase/Neon)
  when multi-device sharing is needed.
- **Developer-friendly config** — Topics, sources, and thresholds editable via the UI, not
  config files.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, Geist font |
| Database | SQLite via better-sqlite3 |
| Search API | Brave Search API |
| AI API | DeepSeek Chat API |

## Current State

The current UI is two separate pages (Search and News) with a nav bar. The aspirational
full-dashboard UI (single page with modules) is not yet built — see DESIGN.md for the
target state.
