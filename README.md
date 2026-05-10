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

## Vercel Deployment

Vercel should detect this as a standard Next.js app. Use Node 20 and set these environment
variables in Vercel for Production, Preview, and Development as needed:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HOUSEHOLD_ALLOWED_EMAILS`
- `BRAVE_API_KEY`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL` (optional, defaults to `deepseek-chat`)

Before deploying, apply all migrations in `src/lib/db/migrations/` through
`009_app_language_preference.sql` in Supabase and record each file name without `.sql` in
`schema_migrations`. You can run `npx tsx src/lib/db/migrate.ts` locally as a read-only audit
helper; it prints pending SQL but does not apply DDL.

In Supabase Auth, allow these redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://<production-domain>/auth/callback`
- `https://*-<vercel-team-or-user>.vercel.app/auth/callback` if using Vercel preview deployments

Post-deploy smoke checks:

- Signed-out users see the Magic Link auth screen.
- An allowlisted email can complete the `/auth/callback` flow.
- News opens from cache without triggering a refresh.
- Manual News refresh completes.
- Lists, Notes, Read Later, and Settings load after login.

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
Richer story cards can include expandable detail and optional source-provided images. The
active news path is the story-card briefing at `/api/news/briefings`.

**Settings:** App and news configuration lives in a dedicated Settings section. General settings
cover account and language, while News settings cover regional focus, trusted sources, muted topics,
watch topics, interests, and briefing filters.

**Nordic-First News:** News settings include regional focus (`Norway + Sweden`, `Norway`,
`Sweden`, or `Global`). The app language preference supports `English`, `Norwegian`, and
`Swedish`, and intentionally controls both active UI copy and generated news summaries in v1.
Trusted sources include a reproducible Nordic source pack that can be synced from the UI.

**Dashboard Layout:** A two-column responsive layout with:
- **Persistent Top Search** for news, notes, saved links, and web queries
- **News-First Main Workspace** where the daily briefing is the default landing view
- **Section Rail** for navigation, lightweight module counters, and Settings

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

- **Single dashboard shell** — One layout with a persistent section rail instead of page navigation.
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
- **Developer-friendly config** — Topics, sources, language, and thresholds editable via Settings.

## Database Migrations

SQL migrations live in `src/lib/db/migrations/`. Apply pending migration files in Supabase
SQL Editor, then record them in `schema_migrations`:

```sql
INSERT INTO public.schema_migrations (version)
VALUES ('009_app_language_preference')
ON CONFLICT (version) DO NOTHING;
```

Legacy schedule/task tables were replaced by household-scoped lists in migration `005` and dropped
in migration `006`. Prefer hiding or removing unused code first, then only drop tables after a
read-only audit confirms row counts, dependencies, and backup status. Use
`docs/supabase_cleanup_audit.sql` for the read-only database audit.

Migration `007` adds Nordic news preferences and expands the default trusted source pack. Existing
projects should run the migration, record it in `schema_migrations`, then use **Settings > News >
Trusted sources > Sync defaults** to ensure the UI and database source list are aligned.

Migration `008` adds cached story detail and optional source image metadata for richer news cards.
Migration `009` adds the user-facing app language preference; in v1 the selected app language also
sets the generated news summary language and is managed from Settings.

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
