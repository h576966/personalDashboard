# Design System & UI Conventions

## Visual Identity

- **Font:** Geist (Geist Sans for body, Geist Mono for code), loaded via `next/font/google`
  in `src/app/layout.tsx`. Applied through the `--font-geist-sans` and `--font-geist-mono`
  CSS variables via `@theme inline` in `globals.css`.
- **Dark mode:** Automatic via `@media (prefers-color-scheme: dark)`. No toggle.
- **Colors:** Zinc-gray background (`zinc-900` text, `zinc-100`/`zinc-800` surfaces) with
  teal accent via shadcn/ui semantic tokens. The ColorHunt palette (`#35858e #7da78c #c2d099
  #e6eec9`) maps to `--primary: 185 46% 38%` (`teal-700`, `#35858E`) in `globals.css`
  via real `:root` CSS variables. shadcn auto-derives hover, muted, and ring states
  from `--primary`. Custom surfaces (search bar, AI summary) consume the original
  `--color-teal-*` palette directly.
- **Error UI:** Red border + red background (`border-red-300 bg-red-50 dark:border-red-700
  dark:bg-red-900/20`).
- **AI Summary:** Teal-tinted card (`border-teal-100 bg-teal-50 dark:border-teal-900
  dark:bg-teal-950/20`).

## Layout Conventions

- Page containers: `max-w-3xl mx-auto px-4 py-12` with `flex flex-col` and `gap-6`/`gap-8`.
- Nav bar: `h-12`, `border-b`, `max-w-5xl mx-auto px-4`, flex layout with links on the right.
- Card surfaces: `rounded-md border border-zinc-200 bg-white p-4 shadow-sm
  dark:border-zinc-700 dark:bg-zinc-800`.
- Section headings: `text-xs font-semibold uppercase tracking-wider text-zinc-500
  dark:text-zinc-400`.

## Dashboard Interaction Model

The dashboard behaves like a **single dynamic workspace**, not a collection of separate pages.

### Core Principle

Avoid adding many top-level tabs. Prefer **modules/cards** that can collapse, expand, or become
the active focus area within the same workspace view.

### Default State

- Show the most useful **daily overview**.
- News Briefing is the default focus until a Family Today (combined schedule + tasks + notes) view exists.
- The user should see value immediately without clicking anything.

### Interaction States

- **Search:** If the user searches, expand Search results and give them more space. The rest
  of the dashboard recedes visually but remains accessible.
- **Topic Editor:** Open as an **editor panel or modal** that keeps the dashboard context
  visible. Do not take the user to a separate page.
- **Advanced Settings:** Group technical configuration (scoring thresholds, source filters,
  keywords) in expandable sections or secondary panels. Keep them visually subordinate to
  the daily overview.

### Mobile

- Use **stacked cards** in a single column.
- One active module at a time may dominate the screen.
- Avoid dense multi-column layouts at narrow widths (anything below `sm:`).

### Non-Technical User Accessibility

Assume a non-technical family member is the primary user. They should be able to:

- Read the briefing
- Add a topic
- Add a note
- Check the schedule
- Add a task

**Without understanding:** search operators, APIs, scoring thresholds, AI behavior, or any
system internals.

Implementation implications:

- Use **plain language** in all UI labels.
- Provide **presets** and **sensible defaults** for technical fields.
- Hide complexity behind expandable "Advanced" sections.
- Explain what the app _does_, not how it _works_.

### Core Mission

The app should **reduce daily coordination and information noise for a family** — not create
another system to manage. Every feature should be measured against: "Does this make family
life calmer and more organized, or does it add a new thing to track?"

## Component Patterns

### Status Union Type

All async UI states use a discriminated union type:

```typescript
type Status =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; data: SuccessData }
  | { type: "error"; message: string };
```

Render pattern (from `src/app/page.tsx`):

```typescript
if (status.type === "loading") return <Spinner />;
if (status.type === "error") return <ErrorCard message={status.message} />;
if (status.type === "success") return <Results data={status.data} />;
return <IdlePrompt />;
```

### Fetch → setState Pattern

```typescript
async function loadData() {
  setStatus({ type: "loading" });
  try {
    const res = await fetch("/api/...");
    if (!res.ok) {
      const err = await res.json();
      setStatus({ type: "error", message: err.error?.message ?? "Request failed" });
      return;
    }
    const data = await res.json();
    setStatus({ type: "success", data });
  } catch {
    setStatus({ type: "error", message: "Network error" });
  }
}
```

### Loading Spinner

```html
<div class="flex items-center gap-2 text-zinc-500">
  <span class="inline-block w-4 h-4 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
  <span>Loading...</span>
</div>
```

### Error Card

```html
<div class="w-full rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700
            dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
  {message}
</div>
```

### Result Card

```html
<li class="rounded-md border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200
          dark:border-zinc-700 dark:bg-zinc-800">
  <a href="{url}" target="_blank" rel="noopener noreferrer"
     class="text-base font-medium text-zinc-900 hover:text-teal-700 dark:text-zinc-100 dark:hover:text-teal-500">
    {title}
  </a>
  <p class="mt-1 text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">{description}</p>
</li>
```

## UI Elements Catalog

| Element | Classes |
|---------|---------|
| Primary button | `<Button>` (shadcn default variant, `bg-primary text-primary-foreground hover:bg-primary/90`) |
| Secondary button | `<Button variant="secondary">` (shadcn) or manual `rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-700` |
| Outline button | `<Button variant="outline">` with `text-primary border-primary/30 hover:bg-primary/5` for teal accent |
| Text input | `<Input>` (shadcn, `border-input focus-visible:ring-ring`) |
| Label | `mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400` |
| Tag/chip | `rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400` |
| Score badge | `shrink-0 rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-700 dark:text-zinc-300` |
| Active tab | `border-teal-600 text-teal-700 dark:text-teal-400` |
| Inactive tab | `border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300` |

## API Error Response Pattern

All API routes use a local `errorResponse()` helper returning `NextResponse<ErrorResponse>`
with shape `{ error: { message: string, code: string } }`. See `src/app/api/search/route.ts`
for the canonical reference.

## Anti-Patterns to Avoid

- Dense data tables — use card layouts instead.
- Developer-facing labels — text should be understandable by non-technical family members.
- Clutter — prioritize whitespace and scannability.
- Three or more levels of nesting in the UI — keep hierarchy flat.

## Mobile Awareness

- Responsive via `sm:` breakpoints (e.g., `sm:grid-cols-2` for form layouts).
- Comfortable touch targets (`py-2.5` minimum for buttons).
- Text never smaller than `text-xs`.
- Full-width containers on small screens (`w-full`, `max-w-3xl`).

## Design Constraints

- **Deterministic before AI** — Every feature must function without AI APIs. AI is an
  enhancement layer on top of a working core.
- **Advanced config behind sections** — Technical configuration (scoring thresholds,
  source filters, keywords) should be grouped in expandable sections or topic detail views,
  not in the main UI flow.
- **Family-friendly text** — UI labels must be understandable by non-technical users.
  Avoid acronyms (e.g., write "Past Week" not "pw").
- **API keys stay server-side** — Never expose API keys to the browser. Browser code calls
  local API routes, never third-party APIs directly.
- **Graceful AI fallback** — AI features (summaries, query rewriting) must fail silently
  with fallback. A DeepSeek outage should not break core functionality.
