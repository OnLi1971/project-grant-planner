-- Create table for tracking planning changes
CREATE TABLE public.planning_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_entry_id UUID NOT NULL,
  engineer_id UUID,
  konstrukter TEXT NOT NULL,
  cw TEXT NOT NULL,
  year INTEGER NOT NULL,
  change_type TEXT NOT NULL, -- 'project', 'hours', 'tentative'
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.planning_changes ENABLE ROW LEVEL SECURITY;

-- RLS policies for planning_changes
CREATE POLICY "Authenticated users can view planning changes"
  ON public.planning_changes
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index for faster queries
CREATE INDEX idx_planning_changes_engineer ON public.planning_changes(engineer_id);
CREATE INDEX idx_planning_changes_date ON public.planning_changes(changed_at);
CREATE INDEX idx_planning_changes_entry ON public.planning_changes(planning_entry_id);

-- Create trigger function to log changes
CREATE OR REPLACE FUNCTION public.log_planning_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log project changes
  IF OLD.projekt IS DISTINCT FROM NEW.projekt THEN
    INSERT INTO public.planning_changes (
      planning_entry_id,
      engineer_id,
      konstrukter,
      cw,
      year,
      change_type,
      old_value,
      new_value,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.engineer_id,
      NEW.konstrukter,
      NEW.cw,
      NEW.year,
      'project',
      OLD.projekt,
      NEW.projekt,
      auth.uid()
    );
  END IF;

  -- Log hours changes
  IF OLD.mh_tyden IS DISTINCT FROM NEW.mh_tyden THEN
    INSERT INTO public.planning_changes (
      planning_entry_id,
      engineer_id,
      konstrukter,
      cw,
      year,
      change_type,
      old_value,
      new_value,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.engineer_id,
      NEW.konstrukter,
      NEW.cw,
      NEW.year,
      'hours',
      OLD.mh_tyden::TEXT,
      NEW.mh_tyden::TEXT,
      auth.uid()
    );
  END IF;

  -- Log tentative status changes
  IF OLD.is_tentative IS DISTINCT FROM NEW.is_tentative THEN
    INSERT INTO public.planning_changes (
      planning_entry_id,
      engineer_id,
      konstrukter,
      cw,
      year,
      change_type,
      old_value,
      new_value,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.engineer_id,
      NEW.konstrukter,
      NEW.cw,
      NEW.year,
      'tentative',
      OLD.is_tentative::TEXT,
      NEW.is_tentative::TEXT,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on planning_entries
CREATE TRIGGER trigger_log_planning_changes
  AFTER UPDATE ON public.planning_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.log_planning_changes();