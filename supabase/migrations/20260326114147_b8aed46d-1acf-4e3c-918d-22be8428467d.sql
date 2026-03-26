-- Sync hourly_rate from budget for Hodinovka projects where they diverge
UPDATE projects 
SET hourly_rate = budget 
WHERE project_type = 'Hodinovka' 
  AND budget IS NOT NULL 
  AND hourly_rate IS NOT NULL 
  AND budget <> hourly_rate;