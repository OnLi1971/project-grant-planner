ALTER TABLE public.planning_entries ADD COLUMN IF NOT EXISTS leave_days smallint NOT NULL DEFAULT 0;

DROP VIEW public.planning_matrix;

CREATE VIEW public.planning_matrix AS
 SELECT e.id AS engineer_id,
    e.display_name AS konstrukter,
    normalize_name(e.display_name) AS normalized_name,
    pe.cw,
    pe.year,
    (pe.cw || '-'::text) || pe.year AS cw_full,
    pe.mesic,
    pe.projekt,
    pe.mh_tyden,
    pe.is_tentative,
    pe.updated_at,
    pe.id AS planning_entry_id,
    COALESCE(pe.leave_days, 0::smallint) AS leave_days
   FROM engineers e
     LEFT JOIN planning_entries pe ON e.id = pe.engineer_id
  WHERE e.status = ANY (ARRAY['active'::engineer_status, 'contractor'::engineer_status, 'on_leave'::engineer_status])
  ORDER BY e.display_name, pe.year, pe.cw;

GRANT SELECT ON public.planning_matrix TO anon, authenticated;
GRANT ALL ON public.planning_matrix TO service_role;