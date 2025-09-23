-- Přidat UNIQUE constraint podle návodu (Fix F1) - bez IF NOT EXISTS
DO $$
BEGIN
    -- Zkusit přidat unique constraint, ignorovat pokud už existuje
    BEGIN
        ALTER TABLE planning_entries 
        ADD CONSTRAINT uq_planning_unique 
        UNIQUE (engineer_id, cw, year);
    EXCEPTION 
        WHEN duplicate_table THEN 
        -- Constraint už existuje, pokračovat
        NULL;
    END;
END $$;

-- Index pro rychlé lookupy podle návodu
CREATE INDEX IF NOT EXISTS ix_planning_eid_cw_year 
ON planning_entries(engineer_id, cw, year);