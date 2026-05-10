-- 008_richer_news_story_cards: Cached detail and optional source images

ALTER TABLE news_story_clusters
  ADD COLUMN IF NOT EXISTS story_breakdown JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_source TEXT NOT NULL DEFAULT '';
