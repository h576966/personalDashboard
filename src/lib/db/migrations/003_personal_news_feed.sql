-- 003_personal_news_feed: Interests-adjacent controls, story cards, feedback, and watch topics

CREATE TABLE IF NOT EXISTS news_blocked_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL UNIQUE,
  keywords JSONB NOT NULL DEFAULT '[]',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_story_clusters (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  why_it_matters TEXT NOT NULL DEFAULT '',
  score NUMERIC NOT NULL DEFAULT 0,
  matched_interests JSONB NOT NULL DEFAULT '[]',
  is_watch_update BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_story_cluster_items (
  cluster_id TEXT NOT NULL REFERENCES news_story_clusters(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cluster_id, url)
);

CREATE TABLE IF NOT EXISTS news_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id TEXT NOT NULL,
  news_item_id UUID DEFAULT NULL REFERENCES news_items(id) ON DELETE SET NULL,
  vote TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  reason_tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS news_watch_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  queries JSONB NOT NULL DEFAULT '[]',
  source_domains JSONB NOT NULL DEFAULT '[]',
  last_seen_hash TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_blocked_topics_enabled ON news_blocked_topics(enabled);
CREATE INDEX IF NOT EXISTS idx_news_feedback_story_id ON news_feedback(story_id);
CREATE INDEX IF NOT EXISTS idx_news_watch_topics_enabled ON news_watch_topics(enabled);
CREATE INDEX IF NOT EXISTS idx_news_story_clusters_generated ON news_story_clusters(generated_at);
CREATE INDEX IF NOT EXISTS idx_news_story_cluster_items_cluster ON news_story_cluster_items(cluster_id);

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
