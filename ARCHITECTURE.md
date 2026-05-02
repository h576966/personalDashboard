# Architecture

## Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── search/route.ts          # POST /api/search
│   │   └── news/
│   │       ├── briefing/route.ts     # GET  /api/news/briefing
│   │       ├── fetch/route.ts        # POST /api/news/fetch
│   │       ├── topics/
│   │       │   ├── route.ts          # GET,POST /api/news/topics
│   │       │   └── [id]/route.ts     # GET,PUT,DELETE /api/news/topics/:id
│   │       └── items/[id]/route.ts   # PATCH /api/news/items/:id
│   ├── news/
│   │   ├── page.tsx                  # News page client component
│   │   ├── Briefing.tsx              # Briefing list sub-component
│   │   └── TopicsEditor.tsx          # Topic CRUD sub-component
│   ├── page.tsx                      # Search page (home)
│   ├── layout.tsx                    # Root layout + nav bar
│   └── globals.css                   # Tailwind 4 theme + dark mode
└── lib/
    ├── brave.ts                      # Brave Search API client
    ├── cache.ts                      # In-memory search cache (Map, 500 items, 60s TTL)
    ├── deepseek.ts                   # DeepSeek API client (rewriteQuery, summarizeResults)
    ├── search/
    │   ├── index.ts                  # processSearchResults: filter → score → sort
    │   ├── filter.ts                 # stripHtml, filterResults (blocked domains, URL dedup)
    │   ├── score.ts                  # scoreResult: term-match + quality + domain boost
    │   └── quality.ts               # BLOCKED_DOMAINS, BOOSTED_DOMAINS, isBlocked, isBoosted
    ├── news/
    │   ├── index.ts                  # processBriefing: orchestrator for news pipeline
    │   ├── fetch.ts                  # fetchTopicNews: one topic → Brave search → score
    │   ├── score.ts                  # scoreNewsItem: weighted point scoring per topic
    │   └── deduplicate.ts           # Dice coefficient dedup within batch + DB
    └── db/
        ├── index.ts                  # getDb() singleton, 4-table schema, migration
        ├── topics.ts                 # NewsTopic CRUD (getTopics, createTopic, updateTopic, deleteTopic)
        └── newsItems.ts             # NewsItem/BriefingItem/run read/write, linkItemToTopic
```

## Data Flows

### Search flow

```
User query → POST /api/search
  → Validate body (query, count, freshness)
  → Check in-memory cache (key = query|count|freshness)
  → [DeepSeek] rewriteQuery (fall back to original on error)
  → [Brave API] searchBrave(query, count, freshness)
  → processSearchResults:
       filterResults (stripHtml, block domains, dedup URLs)
       scoreResult (term-match, qualityHeuristics, domain boost)
       sort by score descending
  → [DeepSeek] summarizeResults (top 5, fall back silently on error)
  → Cache result, return JSON
```

### News fetch + score + dedup + persist flow

```
POST /api/news/fetch → processBriefing()
  → createRun() in news_runs table
  → For each enabled topic:
       fetchTopicNews(topic):
         For each query → searchBrave(query, 10, "pw")
         scoreNewsItem (weighted: +30 query match, +20 preferred domain, +15 recent, etc.)
         Return {topicId, topicName, items}
       Apply per-topic: filter by minScore, sort, limit to maxItemsPerDay
  → Flatten all scored items
  → Dedup against DB: getSeenItemByUrl, getSeenItemByTitleHash
  → Cross-item dedup: Dice coefficient > 0.85
  → Enforce global daily limit (50)
  → Persist: insertNewsItem + linkItemToTopic
  → markRunComplete
```

## API Route Inventory

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/search` | Search web with Brave + DeepSeek summary |
| GET | `/api/news/briefing` | Get today's briefing items |
| POST | `/api/news/fetch` | Trigger a new briefing fetch |
| GET | `/api/news/topics` | List all news topics |
| POST | `/api/news/topics` | Create a news topic |
| GET | `/api/news/topics/:id` | Get a single topic |
| PUT | `/api/news/topics/:id` | Update a topic |
| DELETE | `/api/news/topics/:id` | Delete a topic |
| PATCH | `/api/news/items/:id` | Update item status (dismiss/save/hide) |

## Database Schema (SQLite, `data/news.db`)

```
news_topics         news_items           news_topic_items     news_runs
┌─────────────┐    ┌──────────────┐     ┌──────────────┐    ┌─────────────┐
│ id (PK)     │    │ id (PK)      │     │ topic_id (FK)│    │ id (PK)     │
│ name        │    │ title        │     │ item_id (FK) │    │ started_at  │
│ description │    │ url (UNIQUE) │     │ score        │    │ completed_at│
│ queries     │◄──►│ title_hash   │     │ run_id (FK)  │    │ status      │
│ country     │    │ description  │     └──────────────┘    │ item_count  │
│ region      │    │ source       │                         │ error       │
│ language    │    │ score        │                         └─────────────┘
│ preferred_  │    │ first_seen_at│
│   sources   │    │ last_seen_at │
│ blocked_    │    │ status       │
│   sources   │    └──────────────┘
│ required_   │
│   keywords  │
│ blocked_    │
│   keywords  │
│ max_items_  │
│   per_day   │
│ min_score   │
│ enabled     │
│ created_at  │
│ updated_at  │
└─────────────┘
```

**Naming convention:** SQL columns are `snake_case`. TypeScript row→model converters
(e.g., `rowToTopic` in `topics.ts`, `rowToNewsItem` in `newsItems.ts`) map to `camelCase`
on the public types. New DB modules should follow this pattern.

## Runtime Notes

- All API routes run on the **Node.js runtime** (no Edge runtime).
- `better-sqlite3` is **synchronous** — DB calls block the event loop but are fast for
  single-user local use.
- The DB uses a **singleton pattern**: `getDb()` → calls `applyMigrations()` on first init.
  Any module accessing the DB just calls `getDb()` — no need to pass a db handle around.
