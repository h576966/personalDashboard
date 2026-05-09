# Personal Dashboard

A family-focused personal dashboard for couples/parents. Local-first, AI-enhanced web app built
with Next.js, TypeScript, and Tailwind CSS.

## Quickstart

```bash
npm install
cp .env.example .env.local   # add Supabase, Brave, and DeepSeek credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Auth Setup

The dashboard uses Supabase Magic Links for a small allowlisted household. Configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HOUSEHOLD_ALLOWED_EMAILS`

In Supabase Auth redirect URLs, add:

- `http://localhost:3000/auth/callback`
- `https://<your-domain>/auth/callback`

## Current Features

**Clean Search:** Web search powered by the Brave Search API, re-ranked by relevance scoring.
Results are filtered for quality, scored by term matching, and optionally summarized by DeepSeek AI
with follow-up suggestions.

**Lists:** Shared household lists for groceries, errands, and to-dos. Existing task rows are
migrated into a default `To-do` list by migration `005`.

**Notes:** Freeform shared notes for drafts, reminders, and household reference material.

**Read Later:** Search results and news sources can be saved into a household reading queue,
then marked read, archived, or restored from the Archived view.

**News Briefing:** Curated news aggregation from configurable topics, trusted sources,
muted topics, watch topics, and feedback. Today's generated story cards are cached in
Supabase so normal page loads do not rebuild Brave and DeepSeek results. Feedback, saved
news links, and archived news links provide lightweight implicit personalization on refresh.
The active news path is the story-card briefing at `/api/news/briefings`.

**Nordic-First News:** News preferences include regional focus (`Norway + Sweden`, `Norway`,
`Sweden`, or `Global`) and generated summary language (`English`, `Norwegian`, or `Swedish`).
Trusted sources include a reproducible Nordic source pack that can be synced from the UI.

**Dashboard Layout:** A two-column responsive layout with:
- **Persistent Top Search** for news, notes, saved links, and web queries
- **News-First Main Workspace** where the daily briefing is the default landing view
- **Compact Dashboard Metrics** for stories, open list items, unread saved items, and notes
- **Section Rail** for navigation and lightweight module counters

Search results temporarily override the main workspace, while modules (e.g. News, Read Later)
control the default content.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui (Button, Input, Select), Geist font |
| Component Lib | shadcn/ui with ColorHunt 5-color palette (`--primary: 186 46% 38%`) |
| Database | Supabase Postgres |
| Search API | Brave Search API |
| AI API | DeepSeek Chat API |

## Product Principles

- **Single dashboard shell** — One layout with a persistent module sidebar instead of page navigation.
- **News-first landing** — The dashboard opens on the daily briefing while keeping household
  lists, notes, and read-later one click away.
- **Workspace-driven UI** — The main area adapts based on user actions (search vs module selection).
- **Useful data over decorative copy** — Counters and labels are preferred over ornamental status text.
- **Minimal but extensible modules** — Modules are compact in the sidebar and expand into the main area.
- **Shared household first** — One default household is used today, ready for login/member mapping later.
- **Mobile-aware** — Sidebar collapses into a horizontal module rail on smaller screens.
- **Precision over recall** — Quality filters and scoring prioritize useful results over volume.
- **Deterministic before AI** — Core functionality works without AI. AI enhances results
  (summaries, suggestions) but is never required.
- **Local-first workflow** — Schema and app code live in the repo; data persists in Supabase Postgres.
- **Developer-friendly config** — Topics, sources, and thresholds editable via the UI.

## Database Migrations

SQL migrations live in `src/lib/db/migrations/`. Apply pending migration files in Supabase
SQL Editor, then record them in `schema_migrations`:

```sql
INSERT INTO public.schema_migrations (version)
VALUES ('007_nordic_news_preferences')
ON CONFLICT (version) DO NOTHING;
```

Legacy schedule/task tables were replaced by household-scoped lists in migration `005` and dropped
in migration `006`. Prefer hiding or removing unused code first, then only drop tables after a
read-only audit confirms row counts, dependencies, and backup status. Use
`docs/supabase_cleanup_audit.sql` for the read-only database audit.

Migration `007` adds Nordic news preferences and expands the default trusted source pack. Existing
projects should run the migration, record it in `schema_migrations`, then use **News > Preferences >
Trusted sources > Sync defaults** to ensure the UI and database source list are aligned.

## Directory Structure

```
├── kilo.jsonc
├── AGENTS.md
├── README.md
├── DESIGN.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── components/
│   │   ├── DashboardShell.tsx  # Layout + state orchestration
│   │   ├── SearchModule.tsx    # Controlled search input
│   │   └── ...
│   ├── components/
│   │   └── ui/              # shadcn/ui primitives (Button, Input, Select)
│   └── lib/
│       └── utils.ts
├── scripts/
└── .kilo/
    ├── agents/
    ├── commands/
    ├── skills/
    └── rules/
```

## Philosophy

- **Local-first** — Everything lives in your repo.
- **Minimal** — Focused modules, clean layout, no unnecessary complexity.
- **Composable** — New modules can be added without restructuring the app.
- **Verified** — Every phase has a non-negotiable quality gate.
