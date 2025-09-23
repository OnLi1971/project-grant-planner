-- 1) Migrace: Napáruj NULL engineer_id podle display_name
UPDATE planning_entries pe
SET engineer_id = e.id
FROM engineers e
WHERE pe.engineer_id IS NULL
  AND normalize_name(e.display_name) = normalize_name(pe.konstrukter);

-- 2) Kontrola zbývajících nemapovaných záznamů
-- (pro diagnostiku - zobrazí konstruktery bez engineer_id)
DO $$
DECLARE
    unmapped_count INTEGER;
    unmapped_record RECORD;
BEGIN
    SELECT COUNT(*) INTO unmapped_count 
    FROM planning_entries 
    WHERE engineer_id IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE NOTICE 'Found % unmapped planning entries:', unmapped_count;
        FOR unmapped_record IN 
            SELECT konstrukter, COUNT(*) as count
            FROM planning_entries 
            WHERE engineer_id IS NULL 
            GROUP BY konstrukter 
            ORDER BY count DESC
        LOOP
            RAISE NOTICE '  - %: % entries', unmapped_record.konstrukter, unmapped_record.count;
        END LOOP;
    ELSE
        RAISE NOTICE 'All planning entries successfully mapped to engineer_id';
    END IF;
END $$;

-- 3) Přidání ochrany proti duplicitám
ALTER TABLE planning_entries 
ADD CONSTRAINT IF NOT EXISTS uq_planning_unique 
UNIQUE (engineer_id, cw, year);

-- 4) Index pro rychlost
CREATE INDEX IF NOT EXISTS ix_planning_eid_cw_year 
ON planning_entries(engineer_id, cw, year);

-- 5) Zajištění realtime pro planning_entries
ALTER TABLE planning_entries REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE planning_entries;