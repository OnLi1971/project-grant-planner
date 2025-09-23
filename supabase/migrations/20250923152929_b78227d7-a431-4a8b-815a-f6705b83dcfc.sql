-- Fix the function to include proper search_path for security
CREATE OR REPLACE FUNCTION create_planning_entries_for_new_engineer()
RETURNS TRIGGER AS $$
DECLARE
    cw INTEGER;
    yr INTEGER;
BEGIN
    -- Generate weeks for current and future years (2025-2026)
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
                NEW.id, 
                NEW.display_name,
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;