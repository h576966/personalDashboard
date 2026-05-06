-- 002_news_sources: Curated source pool for the personal intelligence feed

CREATE TABLE IF NOT EXISTS news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL DEFAULT 'global',
  language TEXT NOT NULL DEFAULT 'en',
  tags JSONB NOT NULL DEFAULT '[]',
  quality_score NUMERIC NOT NULL DEFAULT 0.8,
  default_enabled BOOLEAN NOT NULL DEFAULT true,
  user_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS tags JSONB NOT NULL DEFAULT '[]';
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS quality_score NUMERIC NOT NULL DEFAULT 0.8;
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS default_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE news_sources ADD COLUMN IF NOT EXISTS user_enabled BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_sources_domain_unique ON news_sources(domain);
CREATE INDEX IF NOT EXISTS idx_news_sources_user_enabled ON news_sources(user_enabled);
CREATE INDEX IF NOT EXISTS idx_news_sources_region ON news_sources(region);
CREATE INDEX IF NOT EXISTS idx_news_sources_tags ON news_sources USING GIN (tags);

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
