-- Add knowledge management columns to engineers table
ALTER TABLE public.engineers
  ADD COLUMN software text DEFAULT NULL,
  ADD COLUMN pdm_plm text DEFAULT NULL,
  ADD COLUMN specialization text DEFAULT NULL;

-- Recreate engineers_create with new params
CREATE OR REPLACE FUNCTION public.engineers_create(
  p_display_name text, 
  p_email text DEFAULT NULL, 
  p_status engineer_status DEFAULT 'active', 
  p_fte integer DEFAULT 100, 
  p_department uuid DEFAULT NULL, 
  p_manager uuid DEFAULT NULL, 
  p_company text DEFAULT 'TM CZ', 
  p_hourly_rate numeric DEFAULT NULL, 
  p_currency text DEFAULT NULL,
  p_location text DEFAULT 'PRG',
  p_software text DEFAULT NULL,
  p_pdm_plm text DEFAULT NULL,
  p_specialization text DEFAULT NULL
)
RETURNS engineers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE 
  v_slug TEXT; 
  v_row engineers;
BEGIN
  IF p_display_name IS NULL OR length(trim(p_display_name)) = 0 THEN
    RAISE EXCEPTION 'display_name required';
  END IF;
  
  IF p_currency IS NOT NULL AND p_currency NOT IN ('EUR', 'CZK') THEN
    RAISE EXCEPTION 'currency must be EUR or CZK';
  END IF;

  IF p_location IS NOT NULL AND p_location NOT IN ('PRG', 'PLZ', 'SK') THEN
    RAISE EXCEPTION 'location must be PRG, PLZ or SK';
  END IF;
  
  v_slug := normalize_slug(p_display_name);

  PERFORM 1 FROM engineers WHERE slug = v_slug;
  IF FOUND THEN
    RAISE EXCEPTION 'Engineer with slug % already exists', v_slug;
  END IF;

  INSERT INTO engineers(display_name, slug, email, status, fte_percent, department_id, manager_id, company, hourly_rate, currency, location, software, pdm_plm, specialization)
  VALUES (p_display_name, v_slug, p_email, p_status, COALESCE(p_fte,100), p_department, p_manager, p_company, p_hourly_rate, p_currency, COALESCE(p_location, 'PRG'), p_software, p_pdm_plm, p_specialization)
  RETURNING * INTO v_row;

  RETURN v_row;
END $function$;

-- Recreate engineers_update with new params
CREATE OR REPLACE FUNCTION public.engineers_update(
  p_id uuid, 
  p_display_name text DEFAULT NULL, 
  p_email text DEFAULT NULL, 
  p_status engineer_status DEFAULT NULL, 
  p_fte integer DEFAULT NULL, 
  p_department uuid DEFAULT NULL, 
  p_manager uuid DEFAULT NULL, 
  p_company text DEFAULT NULL, 
  p_hourly_rate numeric DEFAULT NULL, 
  p_currency text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_software text DEFAULT NULL,
  p_pdm_plm text DEFAULT NULL,
  p_specialization text DEFAULT NULL
)
RETURNS engineers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE 
  v_row engineers; 
  v_slug TEXT;
BEGIN
  SELECT * INTO v_row FROM engineers WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Engineer not found'; 
  END IF;

  IF p_currency IS NOT NULL AND p_currency NOT IN ('EUR', 'CZK') THEN
    RAISE EXCEPTION 'currency must be EUR or CZK';
  END IF;

  IF p_location IS NOT NULL AND p_location NOT IN ('PRG', 'PLZ', 'SK') THEN
    RAISE EXCEPTION 'location must be PRG, PLZ or SK';
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
  IF p_company IS NOT NULL THEN v_row.company := p_company; END IF;
  IF p_hourly_rate IS NOT NULL THEN v_row.hourly_rate := p_hourly_rate; END IF;
  IF p_currency IS NOT NULL THEN v_row.currency := p_currency; END IF;
  IF p_location IS NOT NULL THEN v_row.location := p_location; END IF;
  IF p_software IS NOT NULL THEN v_row.software := p_software; END IF;
  IF p_pdm_plm IS NOT NULL THEN v_row.pdm_plm := p_pdm_plm; END IF;
  IF p_specialization IS NOT NULL THEN v_row.specialization := p_specialization; END IF;

  UPDATE engineers SET
    display_name = v_row.display_name, 
    slug = v_row.slug, 
    email = v_row.email,
    status = v_row.status, 
    fte_percent = v_row.fte_percent,
    department_id = v_row.department_id, 
    manager_id = v_row.manager_id,
    company = v_row.company,
    hourly_rate = v_row.hourly_rate,
    currency = v_row.currency,
    location = v_row.location,
    software = v_row.software,
    pdm_plm = v_row.pdm_plm,
    specialization = v_row.specialization
  WHERE id = p_id;

  RETURN v_row;
END $function$;