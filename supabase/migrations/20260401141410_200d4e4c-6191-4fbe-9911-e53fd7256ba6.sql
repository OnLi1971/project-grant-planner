ALTER TABLE engineer_software ADD COLUMN level integer NOT NULL DEFAULT 1;
ALTER TABLE engineer_pdm_plm ADD COLUMN level integer NOT NULL DEFAULT 1;

-- Add UPDATE policy for engineer_software (missing)
CREATE POLICY "Editors can update engineer_software"
ON public.engineer_software
FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])));

-- Add UPDATE policy for engineer_pdm_plm (missing)
CREATE POLICY "Editors can update engineer_pdm_plm"
ON public.engineer_pdm_plm
FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])));