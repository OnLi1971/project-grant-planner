

## Plan: Add Location field to Engineer card

The `engineers` table currently has no `location` column. We need to add it at the database level and then wire it through the full stack.

### 1. Database migration

Add a `location` column to the `engineers` table with a check constraint limiting values to `'PRG'`, `'PLZ'`, `'SK'`:

```sql
ALTER TABLE public.engineers 
  ADD COLUMN location text DEFAULT 'PRG' 
  CHECK (location IN ('PRG', 'PLZ', 'SK'));
```

Update both RPC functions (`engineers_create` and `engineers_update`) to accept a `p_location` parameter and set/update the column accordingly.

### 2. Update types and API layer

- **`src/services/engineersApi.ts`** — add `location?: 'PRG' | 'PLZ' | 'SK'` to `DatabaseEngineer`
- **`src/hooks/useEngineers.ts`** — add `location` to `UIEngineer`, pass it through in `select`, and accept it in `createEngineer` / `updateEngineer` (pass as `p_location` to RPC)

### 3. Update UI — `src/components/EngineerManagement.tsx`

- Add `location: 'PRG'` to `formData` state
- Add a `Location` Select field (options: PRG, PLZ, SK) in both Create and Edit dialogs — visible for all engineers (not just contractors)
- Show location in the table as a new column
- Pass location through `createEngineer` and `updateEngineer` calls

### Files changed
- New migration SQL file
- `src/services/engineersApi.ts`
- `src/hooks/useEngineers.ts`
- `src/components/EngineerManagement.tsx`

