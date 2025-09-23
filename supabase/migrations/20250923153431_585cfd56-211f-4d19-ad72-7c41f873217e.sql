-- Create planning entries for existing engineers who don't have any
DO $$
DECLARE
    engineer_record RECORD;
    cw INTEGER;
    yr INTEGER;
BEGIN
    -- Find engineers without any planning entries
    FOR engineer_record IN 
        SELECT e.id, e.display_name 
        FROM engineers e
        WHERE e.status != 'inactive'
        AND NOT EXISTS (
            SELECT 1 FROM planning_entries pe 
            WHERE pe.engineer_id = e.id
        )
    LOOP
        -- Generate weeks for 2025-2026 for each engineer without entries
        FOR yr IN 2025..2026 LOOP
            FOR cw IN 1..52 LOOP
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
                    engineer_record.id, 
                    engineer_record.display_name,
                    'CW' || LPAD(cw::text, 2, '0'), 
                    yr,
                    CASE 
                        WHEN cw <= 4 THEN '01'
                        WHEN cw <= 8 THEN '02'
                        WHEN cw <= 13 THEN '03'
                        WHEN cw <= 17 THEN '04'
                        WHEN cw <= 21 THEN '05'
                        WHEN cw <= 26 THEN '06'
                        WHEN cw <= 30 THEN '07'
                        WHEN cw <= 34 THEN '08'
                        WHEN cw <= 39 THEN '09'
                        WHEN cw <= 43 THEN '10'
                        WHEN cw <= 47 THEN '11'
                        ELSE '12'
                    END,
                    'FREE', 
                    36
                );
            END LOOP;
        END LOOP;
        
        RAISE NOTICE 'Created planning entries for engineer: %', engineer_record.display_name;
    END LOOP;
END $$;