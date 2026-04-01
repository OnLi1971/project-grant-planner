
CREATE TABLE public.engineer_language (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engineer_id uuid NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  language text NOT NULL,
  level text NOT NULL,
  test_year integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (engineer_id, language)
);

ALTER TABLE public.engineer_language ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view engineer_language"
ON public.engineer_language FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Editors can insert engineer_language"
ON public.engineer_language FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])));

CREATE POLICY "Editors can update engineer_language"
ON public.engineer_language FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])));

CREATE POLICY "Editors can delete engineer_language"
ON public.engineer_language FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])));
