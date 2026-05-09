-- 007_nordic_news_preferences: Nordic-first briefing defaults

ALTER TABLE briefing_preferences
  ADD COLUMN IF NOT EXISTS regional_focus TEXT NOT NULL DEFAULT 'nordic',
  ADD COLUMN IF NOT EXISTS summary_language TEXT NOT NULL DEFAULT 'en';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'briefing_preferences_regional_focus_check'
  ) THEN
    ALTER TABLE briefing_preferences
      ADD CONSTRAINT briefing_preferences_regional_focus_check
      CHECK (regional_focus IN ('nordic', 'norway', 'sweden', 'global'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'briefing_preferences_summary_language_check'
  ) THEN
    ALTER TABLE briefing_preferences
      ADD CONSTRAINT briefing_preferences_summary_language_check
      CHECK (summary_language IN ('en', 'no', 'sv'));
  END IF;
END $$;

INSERT INTO news_sources (
  name,
  domain,
  region,
  language,
  tags,
  quality_score,
  default_enabled,
  user_enabled
)
VALUES
  ('Aftenposten', 'aftenposten.no', 'norway', 'no', '["norway","nordic","general","politics","society"]', 0.84, true, true),
  ('VG', 'vg.no', 'norway', 'no', '["norway","nordic","general","breaking"]', 0.78, true, true),
  ('Dagens Naeringsliv', 'dn.no', 'norway', 'no', '["norway","finance","business","markets"]', 0.84, true, true),
  ('Teknisk Ukeblad', 'tu.no', 'norway', 'no', '["norway","technology","energy","industry"]', 0.81, true, true),
  ('Digi.no', 'digi.no', 'norway', 'no', '["norway","technology","ai","software"]', 0.8, true, true),
  ('Sveriges Radio', 'sverigesradio.se', 'sweden', 'sv', '["sweden","nordic","general","politics","society"]', 0.86, true, true),
  ('Svenska Dagbladet', 'svd.se', 'sweden', 'sv', '["sweden","nordic","general","politics","business"]', 0.82, true, true),
  ('Dagens Industri', 'di.se', 'sweden', 'sv', '["sweden","finance","business","markets"]', 0.82, true, true),
  ('Ny Teknik', 'nyteknik.se', 'sweden', 'sv', '["sweden","technology","industry","innovation"]', 0.8, true, true),
  ('Omni', 'omni.se', 'sweden', 'sv', '["sweden","nordic","general","briefing"]', 0.76, true, true),
  ('Yle News', 'yle.fi', 'nordic', 'en', '["nordic","finland","general","politics","society"]', 0.82, true, true),
  ('DR Nyheder', 'dr.dk', 'nordic', 'da', '["nordic","denmark","general","politics","society"]', 0.82, true, true)
ON CONFLICT (domain) DO UPDATE SET
  name = EXCLUDED.name,
  region = EXCLUDED.region,
  language = EXCLUDED.language,
  tags = EXCLUDED.tags,
  quality_score = EXCLUDED.quality_score,
  default_enabled = EXCLUDED.default_enabled,
  updated_at = now();
