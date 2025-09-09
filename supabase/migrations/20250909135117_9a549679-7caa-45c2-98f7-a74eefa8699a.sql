-- Oprava ST BLAVA projektu - přesunutí hodinové sazby do správného pole
UPDATE projects 
SET 
  budget = 1150,
  average_hourly_rate = NULL
WHERE code = 'ST_BLAVA' AND project_type = 'Hodinovka';