-- Fix the trigger function and set admin role
-- Update handle_updated_at function to only update updated_at for profiles table
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    -- Only set updated_by for tables that have this column (planning_entries)
    IF TG_TABLE_NAME = 'planning_entries' THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$;

-- Set the first user as admin
UPDATE public.profiles 
SET role = 'admin'::public.user_role 
WHERE id = '4a28ab6c-7481-4d5c-acd5-1229386918a2';