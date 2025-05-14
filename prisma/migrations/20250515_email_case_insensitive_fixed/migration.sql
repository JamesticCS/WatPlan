-- First, create a function to handle case-insensitive email comparison
CREATE OR REPLACE FUNCTION normalize_email(email TEXT) 
RETURNS TEXT AS $$ 
BEGIN 
  RETURN lower(email); 
END; 
$$ LANGUAGE plpgsql;

-- Create a trigger function that normalizes email on insert or update
CREATE OR REPLACE FUNCTION normalize_email_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Only normalize if email is not null
  IF NEW.email IS NOT NULL THEN
    NEW.email = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on the User table
DROP TRIGGER IF EXISTS normalize_user_email ON "User";
CREATE TRIGGER normalize_user_email
BEFORE INSERT OR UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION normalize_email_trigger();