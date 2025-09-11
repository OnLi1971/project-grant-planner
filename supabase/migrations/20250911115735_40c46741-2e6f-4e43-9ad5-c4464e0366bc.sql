-- Drop existing dangerous policies for articles table
DROP POLICY IF EXISTS "Anyone can insert articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can update articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can delete articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can view articles" ON public.articles;

-- Create secure RLS policies for articles table
CREATE POLICY "Authenticated users can view articles" 
ON public.articles 
FOR SELECT 
USING (true);

CREATE POLICY "Editors and admins can insert articles" 
ON public.articles 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])))));

CREATE POLICY "Editors and admins can update articles" 
ON public.articles 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::user_role, 'editor'::user_role])))));

CREATE POLICY "Only admins can delete articles" 
ON public.articles 
FOR DELETE 
USING (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::user_role))));