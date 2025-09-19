-- Fill missing planning entries for all engineers to ensure complete data coverage
-- Generate missing entries for CW32-52 2025 and CW01-52 2026

WITH 
engineer_list AS (
  SELECT DISTINCT konstrukter FROM planning_entries
),
required_weeks AS (
  -- CW32-52 for 2025 
  SELECT 
    cw_num,
    'CW' || LPAD(cw_num::text, 2, '0') as cw,
    2025 as year,
    CASE 
      WHEN cw_num <= 35 THEN 'srpen 2025'
      WHEN cw_num <= 39 THEN 'září 2025'
      WHEN cw_num <= 43 THEN 'říjen 2025'
      WHEN cw_num <= 47 THEN 'listopad 2025'
      ELSE 'prosinec 2025'
    END as mesic,
    CASE WHEN cw_num = 52 THEN 'DOVOLENÁ' ELSE 'FREE' END as projekt
  FROM generate_series(32, 52) as cw_num
  
  UNION ALL
  
  -- CW01-52 for 2026
  SELECT 
    cw_num,
    'CW' || LPAD(cw_num::text, 2, '0') as cw,
    2026 as year,
    CASE 
      WHEN cw_num <= 5 THEN 'leden 2026'
      WHEN cw_num <= 9 THEN 'únor 2026'
      WHEN cw_num <= 13 THEN 'březen 2026'
      WHEN cw_num <= 17 THEN 'duben 2026'
      WHEN cw_num <= 22 THEN 'květen 2026'
      WHEN cw_num <= 26 THEN 'červen 2026'
      WHEN cw_num <= 30 THEN 'červenec 2026'
      WHEN cw_num <= 35 THEN 'srpen 2026'
      WHEN cw_num <= 39 THEN 'září 2026'
      WHEN cw_num <= 43 THEN 'říjen 2026'
      WHEN cw_num <= 47 THEN 'listopad 2026'
      ELSE 'prosinec 2026'
    END as mesic,
    CASE WHEN cw_num = 52 THEN 'DOVOLENÁ' ELSE 'FREE' END as projekt
  FROM generate_series(1, 52) as cw_num
),
missing_entries AS (
  SELECT 
    e.konstrukter,
    w.cw,
    w.year,
    w.mesic,
    36 as mh_tyden,
    w.projekt
  FROM engineer_list e
  CROSS JOIN required_weeks w
  LEFT JOIN planning_entries pe ON 
    pe.konstrukter = e.konstrukter 
    AND pe.cw = w.cw 
    AND pe.year = w.year
  WHERE pe.id IS NULL
)
INSERT INTO planning_entries (konstrukter, cw, year, mesic, mh_tyden, projekt, created_by, updated_by)
SELECT konstrukter, cw, year, mesic, mh_tyden, projekt, null, null
FROM missing_entries;