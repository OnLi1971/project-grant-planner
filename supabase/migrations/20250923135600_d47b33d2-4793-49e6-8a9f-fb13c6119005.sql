-- Update planning_entries to link legacy records with engineer_id
UPDATE planning_entries 
SET engineer_id = engineers.id
FROM engineers 
WHERE planning_entries.engineer_id IS NULL 
  AND planning_entries.konstrukter = engineers.display_name
  AND engineers.status = 'active';