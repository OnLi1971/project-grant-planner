# Diagnostic SQL Queries for Contractor Planning Issue

## Issue Summary
Contractors from MB Idea (5 people) and AERTEC (José Carreras, Marta López) remain "FREE" after project assignment, while Ivan Bellamy works correctly.

Root cause: Name normalization not covering Spanish characters (ñ, ó with accents) and whitespace anomalies → engineer_id stays null → UI patch fails.

## SQL Queries to Run in Supabase SQL Editor

### 1. Check Status of Problematic Engineers
```sql
SELECT 
  id, 
  display_name, 
  slug, 
  status,
  company
FROM public.engineers
WHERE display_name IN (
  'José Carreras','Jose Carreras',
  'Marta López','Marta Lopez',
  'Peter Jurčišin','Peter Jurcisin',
  'Daniel Chrenko','Peter Chrenko',
  'Marián Púpava','Marian Pupava',
  'Martin Bohušík','Martin Bohusik',
  'Ivan Bellamy'
)
ORDER BY display_name;
```

### 2. Check DB Normalization Output
```sql
SELECT 
  display_name,
  public.normalize_name(display_name) AS normalized_db,
  slug,
  status
FROM public.engineers
WHERE display_name IN (
  'José Carreras','Jose Carreras',
  'Marta López','Marta Lopez',
  'Peter Jurčišin','Peter Jurcisin',
  'Daniel Chrenko','Peter Chrenko',
  'Marián Púpava','Marian Pupava',
  'Martin Bohušík','Martin Bohusik',
  'Ivan Bellamy'
)
ORDER BY display_name;
```

### 3. Check Planning Entries (verify project assignments in DB)
```sql
SELECT 
  pe.engineer_id,
  pe.konstrukter,
  pe.cw,
  pe.year,
  pe.projekt,
  pe.mh_tyden,
  pe.updated_at,
  e.display_name AS engineer_display_name,
  e.status AS engineer_status
FROM public.planning_entries pe
LEFT JOIN public.engineers e ON pe.engineer_id = e.id
WHERE pe.konstrukter IN (
  'José Carreras','Jose Carreras',
  'Marta López','Marta Lopez',
  'Peter Jurčišin','Peter Jurcisin',
  'Daniel Chrenko','Peter Chrenko',
  'Marián Púpava','Marian Pupava',
  'Martin Bohušík','Martin Bohusik',
  'Ivan Bellamy'
)
  AND pe.year IN (2025, 2026)
  AND pe.cw IN ('CW41', 'CW42', 'CW43')
ORDER BY pe.updated_at DESC;
```

### 4. Find Entries with NULL engineer_id
```sql
SELECT 
  konstrukter,
  cw,
  year,
  projekt,
  mh_tyden,
  updated_at
FROM public.planning_entries
WHERE engineer_id IS NULL
  AND konstrukter IN (
    'José Carreras','Jose Carreras',
    'Marta López','Marta Lopez',
    'Peter Jurčišin','Peter Jurcisin',
    'Daniel Chrenko','Peter Chrenko',
    'Marián Púpava','Marian Pupava',
    'Martin Bohušík','Martin Bohusik'
  )
  AND year IN (2025, 2026)
ORDER BY updated_at DESC
LIMIT 50;
```

### 5. Check All Contractors Status
```sql
SELECT 
  display_name,
  slug,
  status,
  company,
  fte_percent,
  created_at
FROM public.engineers
WHERE status IN ('contractor', 'on_leave')
ORDER BY company, display_name;
```

## Expected Results

### What to Look For:
1. **Query 1 & 5**: Verify all contractors have status = 'contractor' or 'active' (not 'on_leave' or 'inactive')
2. **Query 2**: Check if DB normalize_name() handles Spanish characters correctly
3. **Query 3**: Verify projekt is saved in DB (not 'FREE') but engineer_id might be NULL
4. **Query 4**: If many NULL engineer_id for Spanish names → name matching is broken

### Success Criteria:
- All contractors visible in Query 1 with correct status
- Query 3 shows projekt values (not FREE) after assignment
- Query 4 shows NO or few NULL engineer_id after fix
- Ivan Bellamy has engineer_id populated, others might have NULL (before fix)

## After Code Fix - Retest Steps:
1. Assign projects to José Carreras, Marta López in UI (CW41-2025)
2. Run Query 3 → verify projekt is saved AND engineer_id is populated
3. Hard refresh page → projects should remain (not revert to FREE)
4. Check console logs for "✅ Engineer found" messages
5. Verify UI cells update immediately (no FREE flash)