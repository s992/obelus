DO $$ BEGIN
  CREATE TYPE import_failure_reason AS ENUM('already_exists', 'cannot_find');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE goodreads_import_failure ADD COLUMN IF NOT EXISTS reason import_failure_reason DEFAULT NULL;
