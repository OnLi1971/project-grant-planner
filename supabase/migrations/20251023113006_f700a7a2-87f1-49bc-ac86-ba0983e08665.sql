-- Add parent_opportunity column to projects table
ALTER TABLE projects 
ADD COLUMN parent_opportunity TEXT;

COMMENT ON COLUMN projects.parent_opportunity IS 'Parent opportunity code or ID - can be selected from existing projects or manually entered';