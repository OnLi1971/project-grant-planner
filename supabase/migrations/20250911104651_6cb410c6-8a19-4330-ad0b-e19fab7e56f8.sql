-- Convert English month names to Czech in planning_entries table
UPDATE planning_entries 
SET mesic = 'říjen' 
WHERE mesic = 'October';

UPDATE planning_entries 
SET mesic = 'listopad' 
WHERE mesic = 'November';

UPDATE planning_entries 
SET mesic = 'prosinec' 
WHERE mesic = 'December';