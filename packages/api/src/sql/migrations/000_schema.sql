DO $$ BEGIN
  CREATE TYPE judgment AS ENUM('accepted', 'rejected', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE record_status AS ENUM('planned', 'reading', 'finished');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE registration_strategy AS ENUM('open', 'closed', 'requires_approval', 'invite_link');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_registration_status AS ENUM('active', 'disabled', 'pending_approval');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS config (
  id BOOLEAN PRIMARY KEY DEFAULT true CHECK (id = TRUE),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by UUID DEFAULT NULL,
  registration_strategy registration_strategy NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  user_name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  public BOOLEAN DEFAULT FALSE NOT NULL,
  status user_registration_status NOT NULL DEFAULT 'active',
  role user_role NOT NULL
);

CREATE TABLE IF NOT EXISTS record (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL,
  book_id INTEGER NOT NULL,
  finished_at TIMESTAMP,
  judgment judgment,
  started_at TIMESTAMP,
  status record_status NOT NULL,
  CONSTRAINT record_user_id_book_id_unique UNIQUE (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS note (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goodreads_import (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP DEFAULT NULL,
  success_count INTEGER DEFAULT NULL,
  job_id TEXT NOT NULL,
  user_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS goodreads_import_failure (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  import_id UUID NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS migration (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invite_link (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP DEFAULT NULL,
  used_by UUID DEFAULT NULL
);

DO $$ BEGIN
  ALTER TABLE config ADD CONSTRAINT updated_by_user_id FOREIGN KEY (updated_by) REFERENCES users (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE note ADD CONSTRAINT note_record_id_record_id_fkey FOREIGN KEY (record_id) REFERENCES record (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE note ADD CONSTRAINT note_record_id_record_id_fkey FOREIGN KEY (record_id) REFERENCES record (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE note ADD CONSTRAINT note_user_id_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE record ADD CONSTRAINT record_user_id_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE goodreads_import ADD CONSTRAINT goodreads_import_user_id_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE goodreads_import_failure ADD CONSTRAINT goodreads_import_failure_import_id_fky FOREIGN KEY (import_id) REFERENCES goodreads_import (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invite_link ADD CONSTRAINT invite_link_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invite_link ADD CONSTRAINT invite_link_used_by_fkey FOREIGN KEY (used_by) REFERENCES users (id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_at_least_one_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin') OR TG_OP = 'DELETE'
  THEN
    IF (SELECT COUNT(*) FROM users WHERE role = 'admin') <= 1
    THEN
      RAISE EXCEPTION 'Cannot remove the last administrator';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at
BEFORE UPDATE ON config
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at
BEFORE UPDATE ON record
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER ensure_admin_exists
BEFORE UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION check_at_least_one_admin();
