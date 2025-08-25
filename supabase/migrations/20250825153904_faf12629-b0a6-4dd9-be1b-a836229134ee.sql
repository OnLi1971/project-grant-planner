-- Insert initial projects data
INSERT INTO public.projects (name, code, customer_id, project_manager_id, program_id, status, project_type, average_hourly_rate) 
SELECT 
  'ST EMU INT', 'ST_EMU_INT', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'KaSo'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1200
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_EMU_INT')

UNION ALL SELECT 
  'ST TRAM INT', 'ST_TRAM_INT', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'JoMa'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1150
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_TRAM_INT')

UNION ALL SELECT 
  'ST MAINZ', 'ST_MAINZ', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'JoMa'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1300
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_MAINZ')

UNION ALL SELECT 
  'ST KASSEL', 'ST_KASSEL', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'JoMa'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1250
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_KASSEL')

UNION ALL SELECT 
  'ST BLAVA', 'ST_BLAVA', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'JoMa'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1180
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_BLAVA')

UNION ALL SELECT 
  'ST FEM', 'ST_FEM', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'PeNe'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1400
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_FEM')

UNION ALL SELECT 
  'ST POZAR', 'ST_POZAR', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'OnLi'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1100
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_POZAR')

UNION ALL SELECT 
  'NU CRAIN', 'NU_CRAIN', 
  (SELECT id FROM customers WHERE code = 'NUVIA'), 
  (SELECT id FROM project_managers WHERE name = 'PeMa'), 
  (SELECT id FROM programs WHERE code = 'MACH'), 
  'active', 'WP', 1350
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'NU_CRAIN')

UNION ALL SELECT 
  'WA HVAC', 'WA_HVAC', 
  (SELECT id FROM customers WHERE code = 'WABTEC'), 
  (SELECT id FROM project_managers WHERE name = 'DaAm'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1250
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'WA_HVAC')

UNION ALL SELECT 
  'FREE', 'FREE', 
  (SELECT id FROM customers WHERE code = 'NA'), 
  (SELECT id FROM project_managers WHERE name = 'N/A'), 
  (SELECT id FROM programs WHERE code = 'NA'), 
  'active', 'Hodinovka', NULL
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'FREE')

UNION ALL SELECT 
  'ST JIGS', 'ST_JIGS', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'KaSo'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1200
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_JIGS')

UNION ALL SELECT 
  'ST TRAM HS', 'ST_TRAM_HS', 
  (SELECT id FROM customers WHERE code = 'ST'), 
  (SELECT id FROM project_managers WHERE name = 'KaSo'), 
  (SELECT id FROM programs WHERE code = 'RAIL'), 
  'active', 'WP', 1150
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'ST_TRAM_HS')

UNION ALL SELECT 
  'SAF FEM', 'SAF_FEM', 
  (SELECT id FROM customers WHERE code = 'SAFRAN'), 
  (SELECT id FROM project_managers WHERE name = 'PeNe'), 
  (SELECT id FROM programs WHERE code = 'AERO'), 
  'active', 'WP', 1500
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'SAF_FEM')

UNION ALL SELECT 
  'DOVOLENÁ', 'DOVOLENÁ', 
  (SELECT id FROM customers WHERE code = 'NA'), 
  (SELECT id FROM project_managers WHERE name = 'N/A'), 
  (SELECT id FROM programs WHERE code = 'NA'), 
  'active', 'Hodinovka', NULL
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'DOVOLENÁ')

UNION ALL SELECT 
  'BUCH INT', 'BUCH_INT', 
  (SELECT id FROM customers WHERE code = 'BUCHER'), 
  (SELECT id FROM project_managers WHERE name = 'PaHo'), 
  (SELECT id FROM programs WHERE code = 'AERO'), 
  'active', 'WP', 1300
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'BUCH_INT')

UNION ALL SELECT 
  'SAF INT', 'SAF_INT', 
  (SELECT id FROM customers WHERE code = 'SAFRAN'), 
  (SELECT id FROM project_managers WHERE name = 'PaHo'), 
  (SELECT id FROM programs WHERE code = 'AERO'), 
  'active', 'WP', 1450
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'SAF_INT')

UNION ALL SELECT 
  'OVER', 'OVER', 
  (SELECT id FROM customers WHERE code = 'NA'), 
  (SELECT id FROM project_managers WHERE name = 'N/A'), 
  (SELECT id FROM programs WHERE code = 'NA'), 
  'active', 'Hodinovka', NULL
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'OVER')

UNION ALL SELECT 
  'AIRB INT', 'AIRB_INT', 
  (SELECT id FROM customers WHERE code = 'AIRBUS'), 
  (SELECT id FROM project_managers WHERE name = 'PaHo'), 
  (SELECT id FROM programs WHERE code = 'AERO'), 
  'active', 'WP', 1600
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE code = 'AIRB_INT');