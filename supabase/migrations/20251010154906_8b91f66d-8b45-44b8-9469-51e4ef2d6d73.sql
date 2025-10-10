-- Drop and recreate planning_matrix view to include contractor and on_leave statuses
DROP VIEW IF EXISTS public.planning_matrix;

CREATE OR REPLACE VIEW public.planning_matrix AS
SELECT 
  e.id AS engineer_id,
  e.display_name AS konstrukter,
  public.normalize_name(e.display_name) AS normalized_name,
  pe.cw,
  pe.year,
  (pe.cw || '-' || pe.year) AS cw_full,
  pe.mesic,
  pe.projekt,
  pe.mh_tyden,
  pe.updated_at,
  pe.id AS planning_entry_id
FROM public.engineers e
LEFT JOIN public.planning_entries pe ON e.id = pe.engineer_id
WHERE e.status IN ('active', 'contractor', 'on_leave')
ORDER BY e.display_name, pe.year, pe.cw;