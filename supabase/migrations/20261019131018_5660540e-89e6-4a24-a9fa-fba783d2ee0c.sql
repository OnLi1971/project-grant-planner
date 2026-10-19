CREATE TABLE public.project_monthly_plan (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  hours INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (project_id, month)
);
GRANT SELECT ON public.project_monthly_plan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_monthly_plan TO authenticated;
GRANT ALL ON public.project_monthly_plan TO service_role;
ALTER TABLE public.project_monthly_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read project monthly plan" ON public.project_monthly_plan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and editors can manage project monthly plan" ON public.project_monthly_plan FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin'::public.user_role, 'editor'::public.user_role))) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin'::public.user_role, 'editor'::public.user_role)));
CREATE TRIGGER update_project_monthly_plan_updated_at BEFORE UPDATE ON public.project_monthly_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();