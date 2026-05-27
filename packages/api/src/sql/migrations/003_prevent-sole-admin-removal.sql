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

CREATE OR REPLACE TRIGGER ensure_admin_exists
BEFORE UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION check_at_least_one_admin();
