# Personal Dashboard

A family-focused personal dashboard for couples/parents. Local-first, AI-enhanced web app built
with Next.js, TypeScript, and Tailwind CSS.

## Quickstart

```bash
npm install
cp .env.example .env   # add your BRAVE_API_KEY and DEEPSEEK_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Current Features

**Clean Search:** Web search powered by the Brave Search API, re-ranked by relevance scoring.
Results are filtered for quality, scored by term matching, and optionally summarized by DeepSeek AI
with follow-up suggestions.

**News Briefing:** Curated news aggregation from configurable topics. Each topic defines queries,
preferred/blocked sources, keywords, scoring thresholds, and per-topic limits. The UI shows
a tabbed view with today's briefing and a topic CRUD editor.

**Dashboard Layout:** A two-column responsive layout with:
- **Top Search Bar** for global queries
- **Main Workspace (≈70%)** where active content is rendered
- **Module Sidebar (≈30%)** for navigation between modules

Search results temporarily override the main workspace, while modules (e.g. News, Saved)
control the default content.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui (Button, Input, Select), Geist font |
| Component Lib | shadcn/ui with ColorHunt 5-color palette (`--primary: 186 46% 38%`) |
| Database | SQLite via better-sqlite3 |
| Search API | Brave Search API |
| AI API | DeepSeek Chat API |

## Product Principles

- **Single dashboard shell** — One layout with a persistent module sidebar instead of page navigation.
- **Workspace-driven UI** — The main area adapts based on user actions (search vs module selection).
- **Minimal but extensible modules** — Modules are compact in the sidebar and expand into the main area.
- **Mobile-aware** — Sidebar collapses into a horizontal module rail on smaller screens.
- **Precision over recall** — Quality filters and scoring prioritize useful results over volume.
- **Deterministic before AI** — Core functionality works without AI. AI enhances results
  (summaries, suggestions) but is never required.
- **Local-first persistence** — SQLite for local storage.
- **Developer-friendly config** — Topics, sources, and thresholds editable via the UI.

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
