-- Update unique constraint to include year to prevent cross-year conflicts
ALTER TABLE public.planning_entries
DROP CONSTRAINT IF EXISTS planning_entries_konstrukter_cw_key;

ALTER TABLE public.planning_entries
ADD CONSTRAINT planning_entries_konstrukter_cw_year_key UNIQUE (konstrukter, cw, year);