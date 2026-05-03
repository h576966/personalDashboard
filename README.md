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

- **One dynamic dashboard page** — A single page with expandable/collapsible modules, not
  separate navigation tabs.
- **Mobile-aware** — Responsive layout that works on phones and tablets.
- **Precision over recall** — Quality filters and scoring prioritize useful results over volume.
- **Deterministic before AI** — Core functionality works without AI. AI enhances results
  (summaries, suggestions) but is never required.
- **Local-first persistence** — SQLite for local storage.
- **Developer-friendly config** — Topics, sources, and thresholds editable via the UI, not
  config files.

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
│   │   │   └── ui/          # shadcn/ui primitives (Button, Input, Card)
│   │   └── ...
│   └── lib/
│       └── utils.ts         # cn() helper for shadcn/ui
├── scripts/
└── .kilo/
    ├── agents/
    ├── commands/
    ├── skills/
    └── rules/
```

## Philosophy

- **Local-first** — Everything lives in your repo.
- **Minimal** — Focused agents, few dependencies, convention over configuration.
- **Verified** — Every phase has a non-negotiable quality gate.
