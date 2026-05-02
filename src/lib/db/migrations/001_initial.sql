-- 001_initial: Create all 7 tables for the personal dashboard

-- Schema migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- news_topics: migrated from SQLite, id → UUID, JSON string columns → JSONB
CREATE TABLE IF NOT EXISTS news_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  queries JSONB NOT NULL DEFAULT '[]',
  country TEXT DEFAULT '',
  region TEXT DEFAULT '',
  language TEXT DEFAULT '',
  preferred_sources JSONB DEFAULT '[]',
  blocked_sources JSONB DEFAULT '[]',
  required_keywords JSONB DEFAULT '[]',
  blocked_keywords JSONB DEFAULT '[]',
  max_items_per_day INTEGER DEFAULT 10,
  min_score INTEGER DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- news_items: id → UUID, TIMESTAMPTZ, UNIQUE on url
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  canonical_url TEXT DEFAULT '',
  title_hash TEXT DEFAULT '',
  content_hash TEXT DEFAULT '',
  description TEXT DEFAULT '',
  source TEXT DEFAULT '',
  score INTEGER NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'shown'
);

-- news_topic_items: junction table with UUID FKs
CREATE TABLE IF NOT EXISTS news_topic_items (
  topic_id UUID NOT NULL REFERENCES news_topics(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES news_items(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  run_id UUID DEFAULT NULL,
  PRIMARY KEY (topic_id, item_id)
);

-- news_runs: id → UUID
CREATE TABLE IF NOT EXISTS news_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  item_count INTEGER DEFAULT 0,
  error TEXT DEFAULT NULL
);

-- events: family schedule
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tasks: shared checklist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date TIMESTAMPTZ,
  assigned_to TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notes: shared markdown notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for news tables
CREATE INDEX IF NOT EXISTS idx_news_items_url ON news_items(url);
CREATE INDEX IF NOT EXISTS idx_news_items_title_hash ON news_items(title_hash);
CREATE INDEX IF NOT EXISTS idx_news_items_status ON news_items(status);
CREATE INDEX IF NOT EXISTS idx_news_topic_items_topic ON news_topic_items(topic_id);
CREATE INDEX IF NOT EXISTS idx_news_topic_items_run ON news_topic_items(run_id);
