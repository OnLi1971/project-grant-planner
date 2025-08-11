-- Set the first user as admin
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE id = '4a28ab6c-7481-4d5c-acd5-1229386918a2';