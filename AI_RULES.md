# AI Coding Rules

This file extends the `.kilo/rules/*` conventions with product-specific rules for AI coding
agents. It does NOT repeat workflow rules found in `AGENTS.md` or `.kilo/rules/10-workflow.md`.


## Scope

These rules apply when implementing, modifying, or reviewing code in this repository.

## Must

- **Inspect existing repo structure first** — Read neighboring files before writing code.
  Match existing patterns, indentation, import style, and naming conventions exactly.
- **Reuse existing patterns** — Use the Status union type for async UI, the `errorResponse()`
  helper for API errors, `getSupabase()` singleton for database access, and `@/` import alias.
- **Keep API keys server-side** — Never expose `BRAVE_API_KEY` or `DEEPSEEK_API_KEY` to the
  browser. Browser code should only call local API routes, never third-party APIs directly.
- **Follow snake_case → camelCase mapping** — Database columns are `snake_case` in Supabase.
  The TypeScript `rowTo*()` converters must map to `camelCase` on public types (see
  `src/lib/db/topics.ts`, `src/lib/db/newsItems.ts`, etc. for the pattern).
- **Validate at API boundaries** — Use the `validateBody()` pattern from
  `src/app/api/search/route.ts` or inline field validation from
  `src/app/api/news/topics/[id]/route.ts`. Return 400 with `{ error: { message, code } }`.
- **Handle errors gracefully** — AI features (DeepSeek summaries, query rewriting) must fail
  silently with fallback. A DeepSeek outage should not break search functionality.

## Must Not

- **No large rewrites** — Do not rewrite files wholesale. Make targeted edits using existing
  patterns. One concept per file, max 500 lines.
- **No off-roadmap features** — Do not add features not listed in ROADMAP.md unless explicitly
  requested. Features outside the roadmap must be marked experimental/optional.
- **No plugin marketplace or general agent framework** — The dashboard is a concrete product,
  not a platform for plugins or AI agent orchestration.
- **No localStorage for persistent cross-device data** — localStorage is acceptable only for
  single-device preferences and prototypes. Persistent shared data uses Supabase Postgres
  (accessed server-side via API routes, never directly from the browser).
- **No new dependencies without discussion** — Adding npm packages requires explicit
  justification. Prefer built-in APIs and existing patterns.
- **No wildcard imports** — Always import specific named exports.

## Design Constraints

- **Deterministic before AI** — Every feature must function without AI APIs. AI is an
  enhancement layer on top of a working core.
- **Advanced config behind sections** — Technical configuration (scoring thresholds,
  source filters, keywords) should be grouped in expandable sections or topic detail views,
  not in the main UI flow.
- **Family-friendly text** — UI labels must be understandable by non-technical users.
  Avoid acronyms (e.g., write "Past Week" not "pw").

## Coding Conventions

- Import path alias: `@/` maps to `src/`.
- Async UI: use the **Status union type** (`idle | loading | success | error`).
- API errors: use the local `errorResponse()` helper with `{ error: { message, code } }`.
- Database: call `getSupabase()` from `@/lib/db/supabase` — do not create new clients.
  All DB modules (`src/lib/db/*.ts`) use this singleton.
- Tailwind: use `@theme inline` variables for fonts; prefer `dark:` variant over
  `prefers-color-scheme` in utility classes.
- Responsive: use `max-w-3xl mx-auto px-4` container; `sm:` breakpoints for grid layouts.
