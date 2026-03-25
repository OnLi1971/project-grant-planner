
-- Master tables for knowledge management
CREATE TABLE public.knowledge_software (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.knowledge_pdm_plm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.knowledge_specialization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Junction tables (many-to-many)
CREATE TABLE public.engineer_software (
  engineer_id uuid NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  software_id uuid NOT NULL REFERENCES public.knowledge_software(id) ON DELETE CASCADE,
  PRIMARY KEY (engineer_id, software_id)
);

CREATE TABLE public.engineer_pdm_plm (
  engineer_id uuid NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  pdm_plm_id uuid NOT NULL REFERENCES public.knowledge_pdm_plm(id) ON DELETE CASCADE,
  PRIMARY KEY (engineer_id, pdm_plm_id)
);

CREATE TABLE public.engineer_specialization (
  engineer_id uuid NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  specialization_id uuid NOT NULL REFERENCES public.knowledge_specialization(id) ON DELETE CASCADE,
  PRIMARY KEY (engineer_id, specialization_id)
);

-- RLS on master tables
ALTER TABLE public.knowledge_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_pdm_plm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_specialization ENABLE ROW LEVEL SECURITY;

-- RLS on junction tables
ALTER TABLE public.engineer_software ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_pdm_plm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineer_specialization ENABLE ROW LEVEL SECURITY;

-- SELECT policies (authenticated)
CREATE POLICY "Authenticated can view knowledge_software" ON public.knowledge_software FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view knowledge_pdm_plm" ON public.knowledge_pdm_plm FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view knowledge_specialization" ON public.knowledge_specialization FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view engineer_software" ON public.engineer_software FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view engineer_pdm_plm" ON public.engineer_pdm_plm FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can view engineer_specialization" ON public.engineer_specialization FOR SELECT TO authenticated USING (true);

-- INSERT policies (admin/editor)
CREATE POLICY "Editors can insert knowledge_software" ON public.knowledge_software FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can insert knowledge_pdm_plm" ON public.knowledge_pdm_plm FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can insert knowledge_specialization" ON public.knowledge_specialization FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can insert engineer_software" ON public.engineer_software FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can insert engineer_pdm_plm" ON public.engineer_pdm_plm FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can insert engineer_specialization" ON public.engineer_specialization FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));

-- UPDATE policies (admin/editor) - master tables only
CREATE POLICY "Editors can update knowledge_software" ON public.knowledge_software FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can update knowledge_pdm_plm" ON public.knowledge_pdm_plm FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can update knowledge_specialization" ON public.knowledge_specialization FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));

-- DELETE policies (admin only for master, admin/editor for junction)
CREATE POLICY "Admins can delete knowledge_software" ON public.knowledge_software FOR DELETE USING (is_admin());
CREATE POLICY "Admins can delete knowledge_pdm_plm" ON public.knowledge_pdm_plm FOR DELETE USING (is_admin());
CREATE POLICY "Admins can delete knowledge_specialization" ON public.knowledge_specialization FOR DELETE USING (is_admin());
CREATE POLICY "Editors can delete engineer_software" ON public.engineer_software FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can delete engineer_pdm_plm" ON public.engineer_pdm_plm FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
CREATE POLICY "Editors can delete engineer_specialization" ON public.engineer_specialization FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','editor')));
