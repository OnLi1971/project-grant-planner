-- Create table for storing custom engineer views
CREATE TABLE public.custom_engineer_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  selected_engineers TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.custom_engineer_views ENABLE ROW LEVEL SECURITY;

-- Users can view their own views
CREATE POLICY "Users can view their own custom views"
ON public.custom_engineer_views
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own views
CREATE POLICY "Users can insert their own custom views"
ON public.custom_engineer_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own views
CREATE POLICY "Users can update their own custom views"
ON public.custom_engineer_views
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own views
CREATE POLICY "Users can delete their own custom views"
ON public.custom_engineer_views
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_engineer_views_updated_at
BEFORE UPDATE ON public.custom_engineer_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();