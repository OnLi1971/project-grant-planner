
CREATE TABLE public.project_rate_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  valid_from DATE NOT NULL,
  hourly_rate NUMERIC,
  average_hourly_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, valid_from)
);

CREATE INDEX idx_project_rate_history_project ON public.project_rate_history(project_id, valid_from);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_rate_history TO authenticated;
GRANT ALL ON public.project_rate_history TO service_role;

ALTER TABLE public.project_rate_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rate history"
  ON public.project_rate_history FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert rate history"
  ON public.project_rate_history FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update rate history"
  ON public.project_rate_history FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rate history"
  ON public.project_rate_history FOR DELETE
  TO authenticated USING (true);
