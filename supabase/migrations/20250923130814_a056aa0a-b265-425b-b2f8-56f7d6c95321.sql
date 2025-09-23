-- Fix remaining security warnings - update existing functions with proper search_path

-- Fix cleanup_expired_idempotency_keys function
CREATE OR REPLACE FUNCTION public.cleanup_expired_idempotency_keys()
RETURNS void
LANGUAGE sql
SET search_path = public
AS $function$
  DELETE FROM idempotency_keys WHERE expires_at < now();
$function$;

-- Fix handle_new_user function  
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'viewer'::public.user_role
    );
    RETURN NEW;
END;
$function$;

-- Fix handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    -- Only set updated_by for tables that have this column (planning_entries)
    IF TG_TABLE_NAME = 'planning_entries' THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$function$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
$function$;