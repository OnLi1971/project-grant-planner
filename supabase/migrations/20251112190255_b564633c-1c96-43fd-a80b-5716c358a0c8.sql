-- Step 1: Create function to calculate Monday from CW and year
CREATE OR REPLACE FUNCTION public.calculate_week_monday_from_cw(p_cw TEXT, p_year INT)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $$
DECLARE
  week_number INT;
BEGIN
  -- Extract week number from CW format (e.g., 'CW01' -> 1)
  week_number := substring(p_cw from 3)::INT;
  
  -- Calculate Monday of the ISO week using PostgreSQL's ISO week support
  -- Format: IYYY-IWW-ID where IYYY = ISO year, IWW = ISO week, ID = day of week (1=Monday)
  RETURN to_date(p_year::TEXT || '-W' || LPAD(week_number::TEXT, 2, '0') || '-1', 'IYYY-"W"IW-ID');
END;
$$;

-- Step 2: Add week_monday column to planning_entries
ALTER TABLE public.planning_entries 
ADD COLUMN IF NOT EXISTS week_monday DATE;

-- Step 3: Create trigger function to automatically set week_monday
CREATE OR REPLACE FUNCTION public.set_week_monday()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Automatically calculate week_monday from cw and year
  IF NEW.cw IS NOT NULL AND NEW.year IS NOT NULL THEN
    NEW.week_monday := calculate_week_monday_from_cw(NEW.cw, NEW.year);
  END IF;
  RETURN NEW;
END;
$$;

-- Step 4: Create trigger on planning_entries
DROP TRIGGER IF EXISTS trg_set_week_monday ON public.planning_entries;
CREATE TRIGGER trg_set_week_monday
  BEFORE INSERT OR UPDATE OF cw, year
  ON public.planning_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_week_monday();

-- Step 5: Backfill existing data
UPDATE public.planning_entries
SET week_monday = calculate_week_monday_from_cw(cw, year)
WHERE cw IS NOT NULL AND year IS NOT NULL;

-- Create index for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_planning_entries_week_monday 
ON public.planning_entries(week_monday);