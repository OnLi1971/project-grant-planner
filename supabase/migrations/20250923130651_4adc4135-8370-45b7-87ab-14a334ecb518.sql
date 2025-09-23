-- Phase 1: Create engineer management system
-- 1) Create enum for engineer status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type typ JOIN pg_namespace ns ON ns.oid=typ.typnamespace
                 WHERE typ.typname='engineer_status') THEN
    CREATE TYPE engineer_status AS ENUM ('active','inactive','contractor','on_leave');
  END IF;
END$$;

-- 2) Create main engineers table
CREATE TABLE IF NOT EXISTS engineers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,                -- "Fuchs Pavel"
  slug TEXT NOT NULL,                        -- "fuchs-pavel" (bez diakritiky, lowercase)
  handle TEXT GENERATED ALWAYS AS            -- volitelné: třeba login krátký
    (regexp_replace(slug, '[^a-z0-9]+', '_', 'g')) STORED,
  email TEXT,
  status engineer_status NOT NULL DEFAULT 'active',
  department_id UUID,
  manager_id UUID,
  fte_percent INTEGER NOT NULL DEFAULT 100,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Create uniqueness constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_engineers_slug ON engineers(slug);
CREATE UNIQUE INDEX IF NOT EXISTS uq_engineers_email ON engineers((lower(email))) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_engineers_status ON engineers(status);
CREATE INDEX IF NOT EXISTS ix_engineers_department ON engineers(department_id);

-- 4) Create trigger for updated_at
CREATE OR REPLACE FUNCTION trg_set_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_engineers ON engineers;
CREATE TRIGGER set_updated_at_engineers 
  BEFORE UPDATE ON engineers
  FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- 5) Create normalization function for slug generation
CREATE OR REPLACE FUNCTION normalize_slug(p_name TEXT)
RETURNS TEXT 
LANGUAGE plpgsql AS $$
DECLARE 
  s TEXT;
BEGIN
  -- Remove diacritics and normalize (using simple translation)
  s := lower(translate(p_name, 
    'ÁÄĆČĎÉĚËÍÎĹĽŇÓÖŔŘŠŤÚŮÜÝŽáäćčďéěëíîĺľňóöŕřšťúůüýž',
    'AACCDEEEIILLNOORRSTUUUYZaaccdeeeiillnoorrstuuuyz'
  ));
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := trim(both '-' from s);
  RETURN s;
END $$;

-- 6) Create RPC for safe engineer creation
CREATE OR REPLACE FUNCTION engineers_create(
  p_display_name TEXT, 
  p_email TEXT DEFAULT NULL,
  p_status engineer_status DEFAULT 'active',
  p_fte INTEGER DEFAULT 100,
  p_department UUID DEFAULT NULL,
  p_manager UUID DEFAULT NULL
)
RETURNS engineers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_slug TEXT; 
  v_row engineers;
BEGIN
  IF p_display_name IS NULL OR length(trim(p_display_name)) = 0 THEN
    RAISE EXCEPTION 'display_name required';
  END IF;
  
  v_slug := normalize_slug(p_display_name);

  PERFORM 1 FROM engineers WHERE slug = v_slug;
  IF FOUND THEN
    RAISE EXCEPTION 'Engineer with slug % already exists', v_slug;
  END IF;

  INSERT INTO engineers(display_name, slug, email, status, fte_percent, department_id, manager_id)
  VALUES (p_display_name, v_slug, p_email, p_status, COALESCE(p_fte,100), p_department, p_manager)
  RETURNING * INTO v_row;

  RETURN v_row;
END $$;

-- 7) Create RPC for safe engineer updates
CREATE OR REPLACE FUNCTION engineers_update(
  p_id UUID, 
  p_display_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL, 
  p_status engineer_status DEFAULT NULL,
  p_fte INTEGER DEFAULT NULL, 
  p_department UUID DEFAULT NULL,
  p_manager UUID DEFAULT NULL
)
RETURNS engineers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  v_row engineers; 
  v_slug TEXT;
BEGIN
  SELECT * INTO v_row FROM engineers WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Engineer not found'; 
  END IF;

  IF p_display_name IS NOT NULL THEN
    v_slug := normalize_slug(p_display_name);
    IF EXISTS (SELECT 1 FROM engineers WHERE slug = v_slug AND id <> p_id) THEN
      RAISE EXCEPTION 'Slug % already exists', v_slug;
    END IF;
    v_row.display_name := p_display_name;
    v_row.slug := v_slug;
  END IF;

  IF p_email IS NOT NULL THEN v_row.email := p_email; END IF;
  IF p_status IS NOT NULL THEN v_row.status := p_status; END IF;
  IF p_fte IS NOT NULL THEN v_row.fte_percent := p_fte; END IF;
  IF p_department IS NOT NULL THEN v_row.department_id := p_department; END IF;
  IF p_manager IS NOT NULL THEN v_row.manager_id := p_manager; END IF;

  UPDATE engineers SET
    display_name = v_row.display_name, 
    slug = v_row.slug, 
    email = v_row.email,
    status = v_row.status, 
    fte_percent = v_row.fte_percent,
    department_id = v_row.department_id, 
    manager_id = v_row.manager_id
  WHERE id = p_id;

  RETURN v_row;
END $$;

-- 8) Add engineer_id column to planning_entries
ALTER TABLE planning_entries ADD COLUMN IF NOT EXISTS engineer_id UUID;

-- 9) Enable RLS on engineers table
ALTER TABLE engineers ENABLE ROW LEVEL SECURITY;

-- 10) Create RLS policies for engineers
CREATE POLICY "Authenticated users can view engineers" 
  ON engineers FOR SELECT 
  USING (true);

CREATE POLICY "Editors and admins can insert engineers" 
  ON engineers FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'editor'::user_role])
  ));

CREATE POLICY "Editors and admins can update engineers" 
  ON engineers FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY(ARRAY['admin'::user_role, 'editor'::user_role])
  ));

CREATE POLICY "Only admins can delete engineers" 
  ON engineers FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  ));