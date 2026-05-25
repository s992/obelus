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

CREATE TABLE IF NOT EXISTS invite_link (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by UUID NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP DEFAULT NULL,
  used_by UUID DEFAULT NULL
);

DO $$ BEGIN
  ALTER TABLE config ADD CONSTRAINT updated_by_user_id FOREIGN KEY (updated_by) REFERENCES users (id);
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

ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_registration_status NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS  role user_role NOT NULL DEFAULT 'member';

INSERT INTO config (registration_strategy) VALUES ('open') ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE TRIGGER set_updated_at
BEFORE UPDATE ON config
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
