-- Add a year column to disambiguate CW across years
ALTER TABLE public.planning_entries
ADD COLUMN IF NOT EXISTS year integer;

-- Backfill year from mesic if possible, otherwise derive from CW number
UPDATE public.planning_entries
SET year = CASE
  WHEN mesic ILIKE '%2025%' THEN 2025
  WHEN mesic ILIKE '%2026%' THEN 2026
  ELSE CASE
    WHEN regexp_replace(cw, '[^0-9]', '', 'g')::int >= 32 THEN 2025
    ELSE 2026
  END
END
WHERE year IS NULL;

-- Make sure year is required moving forward
ALTER TABLE public.planning_entries
ALTER COLUMN year SET NOT NULL;

-- Index to speed up lookups by engineer/week/year
CREATE INDEX IF NOT EXISTS idx_planning_entries_konstrukter_cw_year
ON public.planning_entries (konstrukter, cw, year);

-- Optional: ensure full row data for realtime (safe if already set)
ALTER TABLE public.planning_entries REPLICA IDENTITY FULL;

-- Add table to realtime publication (no-op if already present)
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_entries;