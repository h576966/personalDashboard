-- 005_household_lists_read_later: Shared household, lists, and read-later status

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO households (name)
VALUES ('Home')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, email)
);

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS household_id UUID;

UPDATE notes
SET household_id = (SELECT id FROM households WHERE name = 'Home' LIMIT 1)
WHERE household_id IS NULL;

ALTER TABLE notes
  ALTER COLUMN household_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_household_id_fkey'
  ) THEN
    ALTER TABLE notes
      ADD CONSTRAINT notes_household_id_fkey
      FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE saved_items
  ADD COLUMN IF NOT EXISTS household_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unread';

UPDATE saved_items
SET household_id = (SELECT id FROM households WHERE name = 'Home' LIMIT 1)
WHERE household_id IS NULL;

UPDATE saved_items
SET status = 'unread'
WHERE status IS NULL OR status = '';

ALTER TABLE saved_items
  ALTER COLUMN household_id SET NOT NULL,
  ALTER COLUMN status SET DEFAULT 'unread',
  ALTER COLUMN status SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saved_items_household_id_fkey'
  ) THEN
    ALTER TABLE saved_items
      ADD CONSTRAINT saved_items_household_id_fkey
      FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'saved_items_status_check'
  ) THEN
    ALTER TABLE saved_items
      ADD CONSTRAINT saved_items_status_check
      CHECK (status IN ('unread', 'read', 'archived'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (household_id, name)
);

INSERT INTO lists (household_id, name, sort_order)
SELECT id, 'To-do', 0
FROM households
WHERE name = 'Home'
ON CONFLICT (household_id, name) DO NOTHING;

INSERT INTO lists (household_id, name, sort_order)
SELECT id, 'Shopping', 1
FROM households
WHERE name = 'Home'
ON CONFLICT (household_id, name) DO NOTHING;

CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO list_items (list_id, label, is_completed, sort_order, created_at, updated_at)
SELECT l.id, t.title, t.is_completed, t.sort_order, t.created_at, t.updated_at
FROM tasks t
CROSS JOIN LATERAL (
  SELECT lists.id
  FROM lists
  JOIN households ON households.id = lists.household_id
  WHERE households.name = 'Home' AND lists.name = 'To-do'
  LIMIT 1
) l
WHERE NOT EXISTS (
  SELECT 1
  FROM list_items li
  WHERE li.list_id = l.id
    AND li.label = t.title
    AND li.created_at = t.created_at
);

CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_notes_household_updated ON notes(household_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_saved_items_household_status ON saved_items(household_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_lists_household_sort ON lists(household_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_list_items_list_sort ON list_items(list_id, is_completed, sort_order, created_at);

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
