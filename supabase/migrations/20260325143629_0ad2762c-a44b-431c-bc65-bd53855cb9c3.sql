
-- 1. Create knowledge_oblast table
CREATE TABLE public.knowledge_oblast (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.knowledge_oblast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view knowledge_oblast" ON public.knowledge_oblast FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors can insert knowledge_oblast" ON public.knowledge_oblast FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY(ARRAY['admin'::user_role, 'editor'::user_role])));
CREATE POLICY "Editors can update knowledge_oblast" ON public.knowledge_oblast FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY(ARRAY['admin'::user_role, 'editor'::user_role])));
CREATE POLICY "Admins can delete knowledge_oblast" ON public.knowledge_oblast FOR DELETE USING (is_admin());

-- 2. Pre-fill Oblast
INSERT INTO public.knowledge_oblast (name) VALUES ('Obecné strojírenství'), ('Kolejová vozidla');

-- 3. Pre-fill knowledge_specialization with values from screenshot
INSERT INTO public.knowledge_specialization (name) VALUES 
  ('Svařence turbínových těles a příslušenství'),
  ('Servis parních turbín'),
  ('Konstrukce a renovace turbín a turbínových těles'),
  ('Svařované konstrukce'),
  ('Zpracování dokumentace (katalogy, dokumenty potřebné k certifikaci, atd.)'),
  ('Hrubá stavba'),
  ('Stanoviště strojvedoucího/kabina řidiče')
ON CONFLICT (name) DO NOTHING;

-- 4. Drop old engineer_specialization and recreate with richer structure
DROP TABLE IF EXISTS public.engineer_specialization;

CREATE TABLE public.engineer_specialization (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  engineer_id uuid NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  oblast_id uuid NOT NULL REFERENCES public.knowledge_oblast(id) ON DELETE CASCADE,
  specialization_id uuid NOT NULL REFERENCES public.knowledge_specialization(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'A',
  granted_date date,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.engineer_specialization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view engineer_specialization" ON public.engineer_specialization FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors can insert engineer_specialization" ON public.engineer_specialization FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY(ARRAY['admin'::user_role, 'editor'::user_role])));
CREATE POLICY "Editors can delete engineer_specialization" ON public.engineer_specialization FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY(ARRAY['admin'::user_role, 'editor'::user_role])));
CREATE POLICY "Editors can update engineer_specialization" ON public.engineer_specialization FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY(ARRAY['admin'::user_role, 'editor'::user_role])));
