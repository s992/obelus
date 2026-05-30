CREATE OR REPLACE FUNCTION check_at_least_one_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin') OR (TG_OP = 'DELETE' AND OLD.role = 'admin')
  THEN
    IF (SELECT COUNT(*) FROM users WHERE role = 'admin') <= 1
    THEN
      RAISE EXCEPTION 'Cannot remove the last administrator';
    END IF;
  END IF;

  IF TG_OP = 'DELETE'
  THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
