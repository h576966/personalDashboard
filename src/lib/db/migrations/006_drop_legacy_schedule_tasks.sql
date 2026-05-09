-- 006_drop_legacy_schedule_tasks: Remove unused manual schedule/task tables
--
-- These tables were replaced by household-scoped lists in migration 005.
-- Confirm both tables are empty before applying this migration to an existing database:
--
-- SELECT 'events' AS table_name, count(*) FROM public.events
-- UNION ALL
-- SELECT 'tasks' AS table_name, count(*) FROM public.tasks;

DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.tasks;
