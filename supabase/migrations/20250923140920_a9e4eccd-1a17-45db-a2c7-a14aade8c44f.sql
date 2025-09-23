-- Přidat UNIQUE constraint podle návodu (Fix F1)
ALTER TABLE planning_entries 
ADD CONSTRAINT IF NOT EXISTS uq_planning_unique 
UNIQUE (engineer_id, cw, year);

-- Index pro rychlé lookupy podle návodu
CREATE INDEX IF NOT EXISTS ix_planning_eid_cw_year 
ON planning_entries(engineer_id, cw, year);