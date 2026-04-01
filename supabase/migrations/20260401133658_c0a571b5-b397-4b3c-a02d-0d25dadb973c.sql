
CREATE TABLE public.engineer_training (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engineer_id uuid NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  name text NOT NULL,
  date_from date,
  date_to date,
  company_trainer text,
  has_exam boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_engineer_training_engineer_id ON public.engineer_training(engineer_id);
CREATE INDEX idx_engineer_training_name ON public.engineer_training USING gin(to_tsvector('simple', name));

ALTER TABLE public.engineer_training ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view engineer_training"
  ON public.engineer_training FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Editors can insert engineer_training"
  ON public.engineer_training FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  ));

CREATE POLICY "Editors can update engineer_training"
  ON public.engineer_training FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  ));

CREATE POLICY "Editors can delete engineer_training"
  ON public.engineer_training FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  ));
