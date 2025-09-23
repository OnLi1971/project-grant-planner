-- Oprava view planning_matrix - přidat engineer_id a joinovat podle něj místo konstrukter
DROP VIEW IF EXISTS planning_matrix;

CREATE OR REPLACE VIEW planning_matrix AS
WITH all_weeks AS (
  -- CW32-52 pro 2025
  SELECT 
    'CW' || LPAD(week_num::text, 2, '0') AS cw,
    'CW' || LPAD(week_num::text, 2, '0') || '-2025' AS cw_full,
    2025 AS year,
    CASE 
      WHEN week_num >= 32 AND week_num <= 35 THEN 'srpen 2025'
      WHEN week_num >= 36 AND week_num <= 39 THEN 'září 2025'
      WHEN week_num >= 40 AND week_num <= 43 THEN 'říjen 2025'
      WHEN week_num >= 44 AND week_num <= 47 THEN 'listopad 2025'
      ELSE 'prosinec 2025'
    END AS mesic
  FROM generate_series(32, 52) week_num
  
  UNION ALL
  
  -- CW01-52 pro 2026
  SELECT 
    'CW' || LPAD(week_num::text, 2, '0') AS cw,
    'CW' || LPAD(week_num::text, 2, '0') || '-2026' AS cw_full,
    2026 AS year,
    CASE 
      WHEN week_num >= 1 AND week_num <= 5 THEN 'leden 2026'
      WHEN week_num >= 6 AND week_num <= 9 THEN 'únor 2026'
      WHEN week_num >= 10 AND week_num <= 13 THEN 'březen 2026'
      WHEN week_num >= 14 AND week_num <= 17 THEN 'duben 2026'
      WHEN week_num >= 18 AND week_num <= 22 THEN 'květen 2026'
      WHEN week_num >= 23 AND week_num <= 26 THEN 'červen 2026'
      WHEN week_num >= 27 AND week_num <= 30 THEN 'červenec 2026'
      WHEN week_num >= 31 AND week_num <= 35 THEN 'srpen 2026'
      WHEN week_num >= 36 AND week_num <= 39 THEN 'září 2026'
      WHEN week_num >= 40 AND week_num <= 43 THEN 'říjen 2026'
      WHEN week_num >= 44 AND week_num <= 47 THEN 'listopad 2026'
      ELSE 'prosinec 2026'
    END AS mesic
  FROM generate_series(1, 52) week_num
),
all_engineers AS (
  -- Čteme z engineers tabulky místo planning_entries pro konzistenci
  SELECT 
    e.id AS engineer_id,
    e.display_name AS konstrukter,
    normalize_name(e.display_name) AS normalized_name
  FROM engineers e 
  WHERE e.status = 'active'
)
SELECT 
  ae.engineer_id,
  ae.konstrukter,
  ae.normalized_name,
  aw.cw_full,
  aw.year,
  aw.mesic,
  COALESCE(pe.mh_tyden, 36) AS mh_tyden,
  COALESCE(pe.projekt, 'FREE') AS projekt,
  pe.updated_at,
  pe.id AS planning_entry_id
FROM all_engineers ae
CROSS JOIN all_weeks aw
LEFT JOIN planning_entries pe ON pe.engineer_id = ae.engineer_id 
                               AND pe.year = aw.year 
                               AND pe.cw = aw.cw
ORDER BY ae.konstrukter, aw.year, aw.cw_full;