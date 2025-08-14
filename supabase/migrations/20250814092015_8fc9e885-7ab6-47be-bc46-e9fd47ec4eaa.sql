-- Fix security issue: Restrict planning_entries access to authenticated users only
-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Everyone can view planning entries" ON public.planning_entries;

-- Create a new restrictive SELECT policy that requires authentication
CREATE POLICY "Authenticated users can view planning entries" 
ON public.planning_entries 
FOR SELECT 
TO authenticated
USING (true);