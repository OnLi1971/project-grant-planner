-- Clean up duplicate planning entries and standardize CW format
-- Step 1: Create temporary table with cleaned data (keep only latest entry per engineer/week/year)
CREATE TEMP TABLE cleaned_entries AS
WITH ranked_entries AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY normalize_name(konstrukter), 
      CASE 
        WHEN cw LIKE '%-20%' THEN split_part(cw, '-', 1)
        ELSE cw 
      END,
      year
      ORDER BY updated_at DESC, id DESC
    ) as rn
  FROM planning_entries
)
SELECT 
  id,
  konstrukter,
  CASE 
    WHEN cw LIKE '%-20%' THEN split_part(cw, '-', 1)
    ELSE cw 
  END as cw,
  year,
  mesic,
  projekt,
  mh_tyden,
  created_at,
  updated_at,
  created_by,
  updated_by
FROM ranked_entries 
WHERE rn = 1;

-- Step 2: Delete all current entries
DELETE FROM planning_entries;

-- Step 3: Insert cleaned entries back
INSERT INTO planning_entries (id, konstrukter, cw, year, mesic, projekt, mh_tyden, created_at, updated_at, created_by, updated_by)
SELECT id, konstrukter, cw, year, mesic, projekt, mh_tyden, created_at, updated_at, created_by, updated_by
FROM cleaned_entries;

-- Step 4: Update planning_matrix view to handle the standardized CW format
CREATE OR REPLACE VIEW public.planning_matrix AS
WITH all_weeks AS (
  -- Weeks CW32-52 for 2025
  SELECT 
    'CW' || LPAD(week_num::text, 2, '0') AS cw,
    'CW' || LPAD(week_num::text, 2, '0') || '-' || year_val::text AS cw_full,
    year_val AS year,
    CASE 
      WHEN week_num BETWEEN 32 AND 35 THEN 'srpen 2025'
      WHEN week_num BETWEEN 36 AND 39 THEN 'září 2025'
      WHEN week_num BETWEEN 40 AND 43 THEN 'říjen 2025'
      WHEN week_num BETWEEN 44 AND 47 THEN 'listopad 2025'
      ELSE 'prosinec 2025'
    END AS mesic
  FROM generate_series(32, 52) AS week_num
  CROSS JOIN (SELECT 2025 AS year_val) y
  UNION ALL
  -- Weeks CW01-52 for 2026
  SELECT 
    'CW' || LPAD(week_num::text, 2, '0') AS cw,
    'CW' || LPAD(week_num::text, 2, '0') || '-' || year_val::text AS cw_full,
    year_val AS year,
    CASE 
      WHEN week_num BETWEEN 1 AND 5 THEN 'leden 2026'
      WHEN week_num BETWEEN 6 AND 9 THEN 'únor 2026'
      WHEN week_num BETWEEN 10 AND 13 THEN 'březen 2026'
      WHEN week_num BETWEEN 14 AND 17 THEN 'duben 2026'
      WHEN week_num BETWEEN 18 AND 22 THEN 'květen 2026'
      WHEN week_num BETWEEN 23 AND 26 THEN 'červen 2026'
      WHEN week_num BETWEEN 27 AND 30 THEN 'červenec 2026'
      WHEN week_num BETWEEN 31 AND 35 THEN 'srpen 2026'
      WHEN week_num BETWEEN 36 AND 39 THEN 'září 2026'
      WHEN week_num BETWEEN 40 AND 43 THEN 'říjen 2026'
      WHEN week_num BETWEEN 44 AND 47 THEN 'listopad 2026'
      ELSE 'prosinec 2026'
    END AS mesic
  FROM generate_series(1, 52) AS week_num
  CROSS JOIN (SELECT 2026 AS year_val) y
),
all_engineers AS (
  SELECT DISTINCT pe.konstrukter, normalize_name(pe.konstrukter) AS normalized_name
  FROM planning_entries pe
)
SELECT 
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
LEFT JOIN planning_entries pe
  ON normalize_name(pe.konstrukter) = ae.normalized_name
  AND pe.year = aw.year
  AND pe.cw = aw.cw
ORDER BY ae.konstrukter, aw.year, aw.cw_full;