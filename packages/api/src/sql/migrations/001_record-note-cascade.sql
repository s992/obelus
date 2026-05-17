DO $$ BEGIN
ALTER TABLE note
  DROP CONSTRAINT note_record_id_record_id_fkey,
  ADD CONSTRAINT note_record_id_record_id_fkey FOREIGN KEY (record_id) REFERENCES record (id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
