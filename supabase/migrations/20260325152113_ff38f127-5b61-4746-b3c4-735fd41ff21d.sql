
-- Fix known bad record with year 0002
UPDATE public.engineer_specialization 
SET granted_date = '2017-06-19'
WHERE granted_date = '0002-06-19';

-- Add validation trigger to prevent dates with unreasonable years
CREATE OR REPLACE FUNCTION public.validate_granted_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.granted_date IS NOT NULL THEN
    IF EXTRACT(YEAR FROM NEW.granted_date) < 1900 OR EXTRACT(YEAR FROM NEW.granted_date) > 2100 THEN
      RAISE EXCEPTION 'granted_date year must be between 1900 and 2100, got %', EXTRACT(YEAR FROM NEW.granted_date);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_granted_date ON public.engineer_specialization;
CREATE TRIGGER trg_validate_granted_date
  BEFORE INSERT OR UPDATE ON public.engineer_specialization
  FOR EACH ROW EXECUTE FUNCTION public.validate_granted_date();
