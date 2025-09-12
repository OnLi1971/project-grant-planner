-- Add presales phase column to projects table
ALTER TABLE public.projects 
ADD COLUMN presales_phase text DEFAULT 'P0';

-- Add start_date and end_date for presales planning period (separate from general project dates)
ALTER TABLE public.projects 
ADD COLUMN presales_start_date date,
ADD COLUMN presales_end_date date;