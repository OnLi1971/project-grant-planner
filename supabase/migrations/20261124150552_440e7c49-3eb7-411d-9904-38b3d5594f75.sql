CREATE INDEX IF NOT EXISTS idx_planning_changes_type_date
ON public.planning_changes (change_type, changed_at DESC);