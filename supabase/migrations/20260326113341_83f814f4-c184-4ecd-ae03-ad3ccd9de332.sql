UPDATE projects 
SET hourly_rate = budget 
WHERE project_type = 'Hodinovka' 
  AND hourly_rate IS NULL 
  AND budget IS NOT NULL;