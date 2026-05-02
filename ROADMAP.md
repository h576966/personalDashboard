# Roadmap

## Current State

### Clean Search (v1) — Complete
- Web search via Brave Search API with relevance re-ranking.
- Query rewriting and result summarization via DeepSeek AI (graceful fallback).
- In-memory cache (60s TTL, 500 entries) for repeated queries.
- Filtered domain quality (blocked low-value sources, boosted knowledge sites).
- **Known gaps:** No pagination, no search history, no saved results.

### News Briefing (v1) — Complete
- Configurable topics with per-topic queries, sources, keywords, scoring, and limits.
- Brave Search per query → weighted scoring → dedup (URL hash + Dice coefficient).
- SQLite persistence with junction tables linking items to topics.
- Briefing UI with grouped-by-topic display and dismiss/save actions.
- Topic CRUD (create, read, update, delete) via TopicsEditor component.
- CLI script: `npm run news:fetch` triggers a headless briefing fetch.
- **Known gaps:** No scheduled/automatic fetching, no read/unread state, no push
  notifications.

## Implementation Constraints (All Future Features)

- **Local-first** — Everything must work offline with SQLite. External sync (Supabase/Neon)
  is a future addition for multi-device use.
- **Single-user by default** — Auth and multi-user support are not yet designed. CRDT-based
  sync would be needed for Shared Tasks/Notes.
- **No new heavy dependencies** — Prefer built-in APIs. Adding state management libraries,
  calendar libraries, etc. requires explicit discussion.
- **AI as enhancement only** — All core CRUD operations must work without AI APIs.

## Feature Priority

### 1. Family Schedule (Next)

**Description:** A shared family calendar with events, recurring patterns, and
reminders. The highest daily-value feature for a family dashboard.

**Key constraints:**
- Local SQLite storage initially (same `getDb()` pattern).
- Date/time handling with no external calendar library — use native `Date` + `Intl`.
- UI: month grid view + day list view, toggleable. Follow existing card-based layout.
- Event conflicts and overlap detection are stretch goals for v1.

**Dependencies:**
- New DB table (`events` or `schedule_items`) in `src/lib/db/index.ts`.
- New lib module: `src/lib/schedule/` with CRUD and query logic.
- New API routes: `src/app/api/schedule/` (GET, POST, PUT, DELETE).
- New client component: Calendar grid/list with inline add/edit.
- Existing patterns to reuse: Status union type, errorResponse helper, `@/` imports,
  DB singleton, snake_case → camelCase mapping.

**Likely files:**
- `src/lib/db/index.ts` (schema migration for events table)
- `src/lib/schedule/index.ts` (CRUD operations)
- `src/app/api/schedule/route.ts` (list + create)
- `src/app/api/schedule/[id]/route.ts` (update + delete)
- `src/app/schedule/page.tsx` (calendar UI)
- `.env.example` (no changes needed — already exists)

### 2. Shared Tasks / Checklist

**Description:** Collaborative task lists with check/uncheck, assignment, and due dates.
Reuses the schedule's date infrastructure.

**Key constraints:**
- Simple list-based UI (not kanban). Cards with checkboxes.
- Same DB persistence approach as News + Schedule.

### 3. Shared Notes

**Description:** Persistent markdown notes per family member. Simple CRUD with optional
AI summarization.

**Key constraints:**
- Plain markdown storage (no rich text editor). Textarea + preview.
- AI summarization reuses `src/lib/deepseek.ts` callDeepSeek pattern.
- No real-time collaboration in v1 — single-user edit with sync later.
