UPDATE public.planning_entries
SET leave_days = CASE mh_tyden WHEN 7 THEN 4 WHEN 14 THEN 3 WHEN 22 THEN 2 WHEN 29 THEN 1 END
WHERE leave_days = 0
  AND mh_tyden IN (7, 14, 22, 29)
  AND upper(coalesce(projekt, '')) NOT IN ('FREE', 'DOVOLENÁ', 'NEMOC', 'OVER');

UPDATE public.planning_entries
SET leave_days = 5
WHERE leave_days = 0 AND upper(coalesce(projekt, '')) = 'DOVOLENÁ';