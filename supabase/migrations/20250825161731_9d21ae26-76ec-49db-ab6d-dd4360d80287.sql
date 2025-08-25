-- Insert NEMOC and OVER projects if they don't exist
INSERT INTO public.projects (name, code, customer_id, project_manager_id, program_id, status, project_type) 
SELECT 
  'NEMOC', 'NEMOC', 
  (SELECT id FROM customers WHERE code = 'NA'), 
  (SELECT id FROM project_managers WHERE name = 'N/A'), 
  (SELECT id FROM programs WHERE code = 'NA'), 
  'active', 'Hodinovka'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'NEMOC')

UNION ALL SELECT 
  'OVER', 'OVER', 
  (SELECT id FROM customers WHERE code = 'NA'), 
  (SELECT id FROM project_managers WHERE name = 'N/A'), 
  (SELECT id FROM programs WHERE code = 'NA'), 
  'active', 'Hodinovka'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'OVER');