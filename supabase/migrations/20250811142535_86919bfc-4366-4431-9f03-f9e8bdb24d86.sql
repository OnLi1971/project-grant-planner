-- Aktualizace všech záznamů s 0 hodinami na 36 hodin pro August týdny
UPDATE planning_entries 
SET mh_tyden = 36 
WHERE cw IN ('CW32', 'CW33', 'CW34', 'CW35') 
AND mh_tyden = 0;