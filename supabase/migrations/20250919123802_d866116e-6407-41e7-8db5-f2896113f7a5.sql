-- Update unique constraint to include year to prevent cross-year conflicts
ALTER TABLE public.planning_entries
DROP CONSTRAINT IF EXISTS planning_entries_konstrukter_cw_key;

ALTER TABLE public.planning_entries
ADD CONSTRAINT planning_entries_konstrukter_cw_year_key UNIQUE (konstrukter, cw, year);

-- Ensure supporting index exists (safe if already created earlier)
CREATE INDEX IF NOT EXISTS idx_planning_entries_konstrukter_cw_year
ON public.planning_entries (konstrukter, cw, year);

-- Keep realtime working with full row data (no-op if already set)
ALTER TABLE public.planning_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_entries;