CREATE TYPE judgment AS ENUM('accepted', 'rejected', 'mixed');

CREATE TYPE record_status AS ENUM('planned', 'reading', 'finished');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  user_name TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  public BOOLEAN DEFAULT FALSE NOT NULL
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

ALTER TABLE note
ADD CONSTRAINT note_record_id_record_id_fkey FOREIGN key (record_id) REFERENCES record (id);

ALTER TABLE note
ADD CONSTRAINT note_user_id_user_id_fkey FOREIGN key (user_id) REFERENCES users (id);

ALTER TABLE record
ADD CONSTRAINT record_user_id_user_id_fkey FOREIGN key (user_id) REFERENCES users (id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at
BEFORE UPDATE ON record
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
