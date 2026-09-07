ALTER TABLE public.planning_entries
  ADD COLUMN IF NOT EXISTS projekt_2 text,
  ADD COLUMN IF NOT EXISTS mh_tyden_2 integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_tentative_2 boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.log_planning_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.projekt IS DISTINCT FROM NEW.projekt THEN
    INSERT INTO public.planning_changes (planning_entry_id, engineer_id, konstrukter, cw, year, change_type, old_value, new_value, changed_by)
    VALUES (NEW.id, NEW.engineer_id, NEW.konstrukter, NEW.cw, NEW.year, 'project', OLD.projekt, NEW.projekt, auth.uid());
  END IF;

  IF OLD.mh_tyden IS DISTINCT FROM NEW.mh_tyden THEN
    INSERT INTO public.planning_changes (planning_entry_id, engineer_id, konstrukter, cw, year, change_type, old_value, new_value, changed_by)
    VALUES (NEW.id, NEW.engineer_id, NEW.konstrukter, NEW.cw, NEW.year, 'hours', OLD.mh_tyden::TEXT, NEW.mh_tyden::TEXT, auth.uid());
  END IF;

  IF OLD.is_tentative IS DISTINCT FROM NEW.is_tentative THEN
    INSERT INTO public.planning_changes (planning_entry_id, engineer_id, konstrukter, cw, year, change_type, old_value, new_value, changed_by)
    VALUES (NEW.id, NEW.engineer_id, NEW.konstrukter, NEW.cw, NEW.year, 'tentative', OLD.is_tentative::TEXT, NEW.is_tentative::TEXT, auth.uid());
  END IF;

  IF OLD.projekt_2 IS DISTINCT FROM NEW.projekt_2 THEN
    INSERT INTO public.planning_changes (planning_entry_id, engineer_id, konstrukter, cw, year, change_type, old_value, new_value, changed_by)
    VALUES (NEW.id, NEW.engineer_id, NEW.konstrukter, NEW.cw, NEW.year, 'project_2', OLD.projekt_2, NEW.projekt_2, auth.uid());
  END IF;

  IF OLD.mh_tyden_2 IS DISTINCT FROM NEW.mh_tyden_2 THEN
    INSERT INTO public.planning_changes (planning_entry_id, engineer_id, konstrukter, cw, year, change_type, old_value, new_value, changed_by)
    VALUES (NEW.id, NEW.engineer_id, NEW.konstrukter, NEW.cw, NEW.year, 'hours_2', OLD.mh_tyden_2::TEXT, NEW.mh_tyden_2::TEXT, auth.uid());
  END IF;

  RETURN NEW;
END;
$function$;