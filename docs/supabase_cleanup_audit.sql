-- Read-only Supabase cleanup audit.
-- Run this in the Supabase SQL Editor before dropping any table or index.
-- Current expected legacy cleanup:
-- - events and tasks were replaced by household-scoped lists in migration 005.
-- - migration 006 drops events/tasks only after row counts are confirmed empty.
-- - migration 007 is additive for Nordic news preferences and source defaults.
-- - news_items, news_runs, and news_topic_items are legacy news-fetch tables from
--   the pre-story-card pipeline. They remain in historical migrations; do not drop
--   them unless this audit confirms no rows, dependencies, or backups are needed.

SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

SELECT
  relname AS table_name,
  n_live_tup AS estimated_rows,
  n_dead_tup AS estimated_dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY relname;

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
