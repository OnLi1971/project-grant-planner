-- Add company, hourly_rate and currency fields to engineers table
ALTER TABLE public.engineers 
ADD COLUMN company TEXT NOT NULL DEFAULT 'TM CZ',
ADD COLUMN hourly_rate DECIMAL(10,2),
ADD COLUMN currency TEXT CHECK (currency IN ('EUR', 'CZK'));

-- Add index for company filtering
CREATE INDEX idx_engineers_company ON public.engineers(company);

-- Update engineers_create function to handle new fields
CREATE OR REPLACE FUNCTION public.engineers_create(
  p_display_name text, 
  p_email text DEFAULT NULL::text, 
  p_status engineer_status DEFAULT 'active'::engineer_status, 
  p_fte integer DEFAULT 100, 
  p_department uuid DEFAULT NULL::uuid, 
  p_manager uuid DEFAULT NULL::uuid,
  p_company text DEFAULT 'TM CZ',
  p_hourly_rate decimal DEFAULT NULL,
  p_currency text DEFAULT NULL
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
  
  -- Validate currency if provided
  IF p_currency IS NOT NULL AND p_currency NOT IN ('EUR', 'CZK') THEN
    RAISE EXCEPTION 'currency must be EUR or CZK';
  END IF;
  
  v_slug := normalize_slug(p_display_name);

  PERFORM 1 FROM engineers WHERE slug = v_slug;
  IF FOUND THEN
    RAISE EXCEPTION 'Engineer with slug % already exists', v_slug;
  END IF;

  INSERT INTO engineers(display_name, slug, email, status, fte_percent, department_id, manager_id, company, hourly_rate, currency)
  VALUES (p_display_name, v_slug, p_email, p_status, COALESCE(p_fte,100), p_department, p_manager, p_company, p_hourly_rate, p_currency)
  RETURNING * INTO v_row;

  RETURN v_row;
END $function$;

-- Update engineers_update function to handle new fields
CREATE OR REPLACE FUNCTION public.engineers_update(
  p_id uuid, 
  p_display_name text DEFAULT NULL::text, 
  p_email text DEFAULT NULL::text, 
  p_status engineer_status DEFAULT NULL::engineer_status, 
  p_fte integer DEFAULT NULL::integer, 
  p_department uuid DEFAULT NULL::uuid, 
  p_manager uuid DEFAULT NULL::uuid,
  p_company text DEFAULT NULL::text,
  p_hourly_rate decimal DEFAULT NULL,
  p_currency text DEFAULT NULL::text
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

  -- Validate currency if provided
  IF p_currency IS NOT NULL AND p_currency NOT IN ('EUR', 'CZK') THEN
    RAISE EXCEPTION 'currency must be EUR or CZK';
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
    currency = v_row.currency
  WHERE id = p_id;

  RETURN v_row;
END $function$;