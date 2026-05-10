-- 009_app_language_preference: One user-facing app and summary language

ALTER TABLE briefing_preferences
  ADD COLUMN IF NOT EXISTS app_language TEXT NOT NULL DEFAULT 'en';

UPDATE briefing_preferences
SET app_language = CASE
  WHEN summary_language IN ('en', 'no', 'sv') THEN summary_language
  ELSE 'en'
END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'briefing_preferences_app_language_check'
  ) THEN
    ALTER TABLE briefing_preferences
      ADD CONSTRAINT briefing_preferences_app_language_check
      CHECK (app_language IN ('en', 'no', 'sv'));
  END IF;
END $$;
