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
- `NEXT_PUBLIC_SITE_URL` (optional locally, recommended in production for stable Magic Link redirects)
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
- `NEXT_PUBLIC_SITE_URL` (set to your stable production domain, for example `https://personal-dashboard.vercel.app`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `HOUSEHOLD_ALLOWED_EMAILS`
- `BRAVE_API_KEY`
- `DEEPSEEK_API_KEY`
- `DEEPSEEK_MODEL` (optional, defaults to `deepseek-v4-flash`; use `deepseek-v4-pro` only if you need higher-quality, higher-cost refreshes)

Before deploying, apply all migrations in `src/lib/db/migrations/` through
`009_app_language_preference.sql` in Supabase and record each file name without `.sql` in
`schema_migrations`. You can run `npx tsx src/lib/db/migrate.ts` locally as a read-only audit
helper; it prints pending SQL but does not apply DDL.

In Supabase Auth, allow these redirect URLs:

- `http://localhost:3000/auth/callback`
- `https://<production-domain>/auth/callback`
- `https://*-<vercel-team-or-user>.vercel.app/auth/callback` if using Vercel preview deployments

Set `NEXT_PUBLIC_SITE_URL` to the stable production domain so Magic Links sent from preview or
deployment-specific URLs still return to the canonical app URL.

Post-deploy smoke checks:

- Signed-out users see the Magic Link auth screen.
- An allowlisted email can complete the `/auth/callback` flow.
- Lists, Notes, Read Later, and Settings load after login.
- Settings can create, edit, and remove watched topics.

Post-refactor stabilization smoke checks:

- Lists: create list, rename list, add item, verify non-empty list delete is blocked, clear/delete items, then delete empty list.
- Watched topics: enter a topic, generate suggested search terms/sources, deselect one chip, add one manual chip, save, edit, and delete it.
- Settings: change language and verify shell/module copy updates correctly.

## Current Features

**Clean Search:** A compact Web/Notes toggle keeps search explicit. Web search uses Brave,
quality filters, source diversity, freshness-aware caching, and automatic DeepSeek summaries
after results load. Notes search stays local to household notes.

**Lists:** Shared household lists for groceries, errands, and to-dos. Lists can be renamed, and
empty lists can be deleted. Existing task rows are migrated into a default `To-do` list by
migration `005`.

**Notes:** Freeform shared notes for drafts, reminders, and household reference material.

**Read Later:** Search results can be saved into a household reading queue, then marked read,
archived, or restored from the Archived view.

**Watched Topics:** Focused topics can be saved in Settings through an AI-assisted setup:
enter one topic, generate suggested search terms and source domains, then keep or remove
the selected chips before saving. Existing topics can be edited with the same chip editor.

**Settings:** General settings cover account and language, with watched-topic configuration
kept in the same section.

**Dashboard Layout:** A two-column responsive layout with:
- **Persistent Top Search** with Web and Notes modes
- **Lists-First Main Workspace** where household coordination is the default landing view
- **Section Rail** for navigation, lightweight module counters, and Settings

Search results temporarily override the main workspace. Web results can be saved to Read Later,
while Notes results show local note matches without searching saved links.

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
- **Lists-first landing** — The dashboard opens on household coordination while keeping notes,
  read-later, and settings one click away.
- **Workspace-driven UI** — The main area adapts based on user actions (search vs module selection).
- **Useful data over decorative copy** — Counters and labels are preferred over ornamental status text.
- **Minimal but extensible modules** — Modules are compact in the sidebar and expand into the main area.
- **Shared household first** — One default household is used today, ready for login/member mapping later.
- **Mobile-aware** — Sidebar collapses into a horizontal module rail on smaller screens.
- **Precision over recall** — Quality filters, dedupe, source diversity, and scoring prioritize
  useful results over volume.
- **Deterministic before AI** — Core functionality works without AI. AI enhances results
  (conditional query rewriting, summaries, watched-topic setup suggestions) but is never required.
- **Local-first workflow** — Schema and app code live in the repo; data persists in Supabase Postgres.
- **Developer-friendly config** — Language and watched topics are editable via Settings.

## Database Migrations

SQL migrations live in `src/lib/db/migrations/`. Apply pending migration files in Supabase
SQL Editor in filename order, then record each applied version in `schema_migrations`:

```sql
INSERT INTO public.schema_migrations (version)
VALUES ('009_app_language_preference')
ON CONFLICT (version) DO NOTHING;
```

Migrations are append-only project history. Do not edit a migration after it has been applied to
Supabase; add a new migration for schema changes instead.

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
