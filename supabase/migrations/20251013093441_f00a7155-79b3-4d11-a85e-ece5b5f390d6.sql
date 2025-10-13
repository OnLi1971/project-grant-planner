-- Update Púpava Marián to contractor status with MB Idea company
UPDATE engineers 
SET 
  status = 'contractor',
  company = 'MB idea SK, s.r.o.'
WHERE display_name = 'Púpava Marián';

-- Update Ivan Bellamy to contractor status with AERTEC company
UPDATE engineers 
SET 
  status = 'contractor',
  company = 'AERTEC'
WHERE display_name = 'Ivan Bellamy';