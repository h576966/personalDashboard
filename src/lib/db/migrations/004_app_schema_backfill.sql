-- 004_app_schema_backfill: Reproducible app tables and persisted briefing metadata

CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  score INTEGER DEFAULT NULL,
  source TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS briefing_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocked_categories JSONB NOT NULL DEFAULT '[]',
  blocked_keywords JSONB NOT NULL DEFAULT '[]',
  preferred_categories JSONB NOT NULL DEFAULT '[]',
  preferred_sources JSONB NOT NULL DEFAULT '[]',
  blocked_sources JSONB NOT NULL DEFAULT '[]',
  prefer_global_source_mix BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE news_story_clusters
  ADD COLUMN IF NOT EXISTS angles JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_saved_items_created ON saved_items(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_items_url_unique ON saved_items(url);
CREATE INDEX IF NOT EXISTS idx_briefing_preferences_created ON briefing_preferences(created_at);

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
