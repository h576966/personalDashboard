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

**Read Later:** Search results can be saved into a household reading queue, then marked read
or archived.

**News Briefing:** Curated news aggregation from configurable topics, trusted sources,
muted topics, watch topics, and feedback. Today's generated story cards are cached in
Supabase so normal page loads do not rebuild Brave and DeepSeek results.

**Dashboard Layout:** A two-column responsive layout with:
- **Top Search Bar** for global queries
- **Main Workspace (≈70%)** where active content is rendered
- **Module Sidebar (≈30%)** for navigation between modules

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
- **Workspace-driven UI** — The main area adapts based on user actions (search vs module selection).
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
VALUES ('006_drop_legacy_schedule_tasks')
ON CONFLICT (version) DO NOTHING;
```

Legacy schedule/task tables were replaced by household-scoped lists in migration `005` and dropped
in migration `006`. Prefer hiding or removing unused code first, then only drop tables after a
read-only audit confirms row counts, dependencies, and backup status. Use
`docs/supabase_cleanup_audit.sql` for the read-only database audit.

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
│   │   │   └── ui/          # shadcn/ui primitives (Button, Input, Select)
│   │   ├── DashboardShell.tsx  # Layout + state orchestration
│   │   ├── SearchModule.tsx    # Controlled search input
│   │   └── ...
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
