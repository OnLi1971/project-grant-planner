

## Plan: Add "Správa znalostí" section to Engineer card

Add three new text fields (Software, PDM/PLM, Odborná specializace) to the engineer profile, grouped under a "Správa znalostí" heading in the Create/Edit dialogs.

### 1. Database migration

Add three text columns to `engineers` table:

```sql
ALTER TABLE public.engineers
  ADD COLUMN software text DEFAULT NULL,
  ADD COLUMN pdm_plm text DEFAULT NULL,
  ADD COLUMN specialization text DEFAULT NULL;
```

Update `engineers_create` and `engineers_update` RPCs to accept `p_software`, `p_pdm_plm`, `p_specialization` parameters.

### 2. Types and API layer

- **`src/services/engineersApi.ts`** — add `software`, `pdm_plm`, `specialization` to `DatabaseEngineer`
- **`src/hooks/useEngineers.ts`** — add fields to `UIEngineer`, pass through in `select`, `createEngineer`, `updateEngineer`

### 3. UI — `src/components/EngineerManagement.tsx`

- Add `software`, `pdmPlm`, `specialization` to `formData` state
- Add a "Správa znalostí" section with a heading/separator in Create and Edit dialogs containing three Input fields
- Show these fields as columns in the engineers table (or as expandable detail)
- Pass values through create/update calls

### Files changed
- New migration SQL file
- `src/services/engineersApi.ts`
- `src/hooks/useEngineers.ts`
- `src/components/EngineerManagement.tsx`

