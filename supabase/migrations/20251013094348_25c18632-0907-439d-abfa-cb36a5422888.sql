-- Normalizovat existující data v planning_entries - přidat rok k měsícům, které ho nemají
UPDATE planning_entries
SET mesic = CASE
  WHEN mesic = 'leden' OR mesic = '01' THEN 
    CASE WHEN year = 2025 THEN 'leden 2025' WHEN year = 2026 THEN 'leden 2026' ELSE mesic END
  WHEN mesic = 'únor' OR mesic = '02' THEN 
    CASE WHEN year = 2025 THEN 'únor 2025' WHEN year = 2026 THEN 'únor 2026' ELSE mesic END
  WHEN mesic = 'březen' OR mesic = '03' THEN 
    CASE WHEN year = 2025 THEN 'březen 2025' WHEN year = 2026 THEN 'březen 2026' ELSE mesic END
  WHEN mesic = 'duben' OR mesic = '04' THEN 
    CASE WHEN year = 2025 THEN 'duben 2025' WHEN year = 2026 THEN 'duben 2026' ELSE mesic END
  WHEN mesic = 'květen' OR mesic = '05' THEN 
    CASE WHEN year = 2025 THEN 'květen 2025' WHEN year = 2026 THEN 'květen 2026' ELSE mesic END
  WHEN mesic = 'červen' OR mesic = '06' THEN 
    CASE WHEN year = 2025 THEN 'červen 2025' WHEN year = 2026 THEN 'červen 2026' ELSE mesic END
  WHEN mesic = 'červenec' OR mesic = '07' THEN 
    CASE WHEN year = 2025 THEN 'červenec 2025' WHEN year = 2026 THEN 'červenec 2026' ELSE mesic END
  WHEN mesic = 'srpen' OR mesic = '08' THEN 
    CASE WHEN year = 2025 THEN 'srpen 2025' WHEN year = 2026 THEN 'srpen 2026' ELSE mesic END
  WHEN mesic = 'září' OR mesic = '09' THEN 
    CASE WHEN year = 2025 THEN 'září 2025' WHEN year = 2026 THEN 'září 2026' ELSE mesic END
  WHEN mesic = 'říjen' OR mesic = '10' THEN 
    CASE WHEN year = 2025 THEN 'říjen 2025' WHEN year = 2026 THEN 'říjen 2026' ELSE mesic END
  WHEN mesic = 'listopad' OR mesic = '11' THEN 
    CASE WHEN year = 2025 THEN 'listopad 2025' WHEN year = 2026 THEN 'listopad 2026' ELSE mesic END
  WHEN mesic = 'prosinec' OR mesic = '12' THEN 
    CASE WHEN year = 2025 THEN 'prosinec 2025' WHEN year = 2026 THEN 'prosinec 2026' ELSE mesic END
  ELSE mesic
END
WHERE mesic NOT LIKE '% 20%';  -- Pouze záznamy, které nemají rok v názvu

-- Aktualizovat trigger pro nové konstruktéry, aby generoval měsíce s rokem
CREATE OR REPLACE FUNCTION public.create_planning_entries_for_new_engineer()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    cw INTEGER;
    yr INTEGER;
    month_name TEXT;
BEGIN
    -- Generate weeks for current and future years (2025-2026)
    FOR yr IN 2025..2026 LOOP
        FOR cw IN 1..52 LOOP
            -- Determine month name with year based on calendar week
            month_name := CASE 
                WHEN cw <= 4 THEN 'leden'
                WHEN cw <= 8 THEN 'únor'
                WHEN cw <= 13 THEN 'březen'
                WHEN cw <= 17 THEN 'duben'
                WHEN cw <= 21 THEN 'květen'
                WHEN cw <= 26 THEN 'červen'
                WHEN cw <= 30 THEN 'červenec'
                WHEN cw <= 34 THEN 'srpen'
                WHEN cw <= 39 THEN 'září'
                WHEN cw <= 43 THEN 'říjen'
                WHEN cw <= 47 THEN 'listopad'
                ELSE 'prosinec'
            END || ' ' || yr;  -- Add year to month name
            
            INSERT INTO planning_entries (
                engineer_id, 
                konstrukter, 
                cw, 
                year, 
                mesic,
                projekt, 
                mh_tyden
            )
            VALUES (
                NEW.id, 
                NEW.display_name,
                'CW' || LPAD(cw::text, 2, '0'), 
                yr,
                month_name,
                'FREE', 
                36
            );
        END LOOP;
    END LOOP;

    RETURN NEW;
END;
$$;