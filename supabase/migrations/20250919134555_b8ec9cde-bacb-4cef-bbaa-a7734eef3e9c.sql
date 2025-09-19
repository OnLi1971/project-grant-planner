-- Krok 1: Normalizační funkce pro jména konstruktérů
CREATE OR REPLACE FUNCTION normalize_name(name TEXT) 
RETURNS TEXT AS $$
  SELECT trim(lower(translate(name, 
    'ÁÄĆČĎÉĚËÍÎĹĽŇÓÖŔŘŠŤÚŮÜÝŽáäćčďéěëíîĺľňóöŕřšťúůüýž',
    'AACCDEEEIILLNOORRSTUUUYZaaccdeeeiillnoorrstuuuyz'
  )));
$$ LANGUAGE SQL IMMUTABLE;

-- Krok 2: Standardizace CW formátů na CW-YYYY
UPDATE planning_entries 
SET cw = CASE 
  WHEN cw ~ '^CW[0-9]{2}$' AND year IS NOT NULL THEN cw || '-' || year::text
  WHEN cw ~ '^CW[0-9]{2}$' THEN 
    CASE 
      WHEN CAST(SUBSTRING(cw FROM 3) AS INTEGER) >= 32 THEN cw || '-2025'
      ELSE cw || '-2026'
    END
  ELSE cw
END
WHERE cw NOT LIKE '%-%';

-- Krok 3: Přidat UNIQUE constraint pro zabránění duplicit
ALTER TABLE planning_entries 
ADD CONSTRAINT unique_konstrukter_cw_year 
UNIQUE (konstrukter, cw, year);

-- Krok 4: Vytvořit view pro planning matrix s normalizovanými jmény
CREATE OR REPLACE VIEW planning_matrix AS
WITH all_weeks AS (
  SELECT 
    'CW' || LPAD(week_num::text, 2, '0') || '-' || year_val::text as cw_full,
    year_val,
    CASE 
      WHEN year_val = 2025 THEN
        CASE 
          WHEN week_num <= 35 THEN 'srpen 2025'
          WHEN week_num <= 39 THEN 'září 2025'
          WHEN week_num <= 43 THEN 'říjen 2025'
          WHEN week_num <= 47 THEN 'listopad 2025'
          ELSE 'prosinec 2025'
        END
      ELSE -- 2026
        CASE 
          WHEN week_num <= 5 THEN 'leden 2026'
          WHEN week_num <= 9 THEN 'únor 2026'
          WHEN week_num <= 13 THEN 'březen 2026'
          WHEN week_num <= 17 THEN 'duben 2026'
          WHEN week_num <= 22 THEN 'květen 2026'
          WHEN week_num <= 26 THEN 'červen 2026'
          WHEN week_num <= 30 THEN 'červenec 2026'
          WHEN week_num <= 35 THEN 'srpen 2026'
          WHEN week_num <= 39 THEN 'září 2026'
          WHEN week_num <= 43 THEN 'říjen 2026'
          WHEN week_num <= 47 THEN 'listopad 2026'
          ELSE 'prosinec 2026'
        END
    END as mesic
  FROM generate_series(32, 52) as week_num, generate_series(2025, 2025) as year_val
  UNION ALL
  SELECT 
    'CW' || LPAD(week_num::text, 2, '0') || '-' || year_val::text as cw_full,
    year_val,
    CASE 
      WHEN week_num <= 5 THEN 'leden 2026'
      WHEN week_num <= 9 THEN 'únor 2026'
      WHEN week_num <= 13 THEN 'březen 2026'
      WHEN week_num <= 17 THEN 'duben 2026'
      WHEN week_num <= 22 THEN 'květen 2026'
      WHEN week_num <= 26 THEN 'červen 2026'
      WHEN week_num <= 30 THEN 'červenec 2026'
      WHEN week_num <= 35 THEN 'srpen 2026'
      WHEN week_num <= 39 THEN 'září 2026'
      WHEN week_num <= 43 THEN 'říjen 2026'
      WHEN week_num <= 47 THEN 'listopad 2026'
      ELSE 'prosinec 2026'
    END as mesic
  FROM generate_series(1, 52) as week_num, generate_series(2026, 2026) as year_val
),
all_engineers AS (
  SELECT DISTINCT konstrukter, normalize_name(konstrukter) as normalized_name 
  FROM planning_entries
)
SELECT 
  ae.konstrukter,
  ae.normalized_name,
  aw.cw_full,
  aw.year_val as year,
  aw.mesic,
  COALESCE(pe.mh_tyden, 36) as mh_tyden,
  COALESCE(pe.projekt, 
    CASE WHEN aw.cw_full LIKE '%-CW52-%' THEN 'DOVOLENÁ' ELSE 'FREE' END
  ) as projekt,
  pe.updated_at,
  pe.id as planning_entry_id
FROM all_engineers ae
CROSS JOIN all_weeks aw
LEFT JOIN planning_entries pe ON 
  pe.konstrukter = ae.konstrukter 
  AND pe.cw = aw.cw_full 
  AND pe.year = aw.year_val
WHERE aw.year_val >= 2025
ORDER BY ae.konstrukter, aw.year_val, aw.cw_full;