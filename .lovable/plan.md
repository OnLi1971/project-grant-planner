

## Plan: Restructure Specialization to include Oblast, Level, and Date

The current `knowledge_specialization` table is a simple name list. The user wants a richer structure matching their existing system (visible in the screenshot), with Oblast (area), Odborná specializace (specialization name), Úroveň A-F (level), and Datum udělení (date granted).

### 1. Database changes

**Rename/restructure `knowledge_specialization`** — keep it as the master list of specialization names.

**Create new `knowledge_oblast` table** — master list of Oblast values (areas/domains):
```sql
CREATE TABLE public.knowledge_oblast (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
```
Pre-fill with: `Obecné strojírenství`, `Kolejová vozidla`.

**Replace `engineer_specialization` junction table** with a richer structure:
```sql
DROP TABLE IF EXISTS public.engineer_specialization;
CREATE TABLE public.engineer_specialization (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  engineer_id uuid NOT NULL REFERENCES public.engineers(id) ON DELETE CASCADE,
  oblast_id uuid NOT NULL REFERENCES public.knowledge_oblast(id) ON DELETE CASCADE,
  specialization_id uuid NOT NULL REFERENCES public.knowledge_specialization(id) ON DELETE CASCADE,
  level text NOT NULL DEFAULT 'A' CHECK (level IN ('A','B','C','D','E','F')),
  granted_date date,
  created_at timestamptz DEFAULT now()
);
```
RLS policies: same pattern (authenticated SELECT, editor/admin INSERT/UPDATE/DELETE).

**Pre-fill `knowledge_specialization`** with values from the screenshot:
- Svařence turbínových těles a příslušenství
- Servis parních turbín
- Konstrukce a renovace turbín a turbínových těles
- Svařované konstrukce
- Zpracování dokumentace (katalogy, dokumenty potřebné k certifikaci, atd.)
- Hrubá stavba
- Stanoviště strojvedoucího/kabina řidiče

### 2. Add Oblast tab to KnowledgeManagement

Add a 4th tab "Oblast" to the `KnowledgeManagement` component for CRUD on `knowledge_oblast`. Update `useKnowledgeData` to support the new table.

### 3. Update EngineerManagement specialization section

Replace the simple multi-select for specializations with a **table-based editor** in the engineer dialog:
- Each row: Oblast (select from `knowledge_oblast`), Specializace (select from `knowledge_specialization`), Úroveň (select A-F), Datum udělení (date input)
- "Přidat řádek" button to add new entries
- Delete button per row
- Load/save from the new `engineer_specialization` table

### 4. Update hooks

- **`useKnowledgeData.ts`**: Add `knowledge_oblast` support. Update `useEngineerKnowledge` to load/save the new structured specialization data (oblast_id, specialization_id, level, granted_date) instead of simple IDs.

### Files changed
- New migration SQL (drop old junction, create new tables, seed data, RLS)
- `src/hooks/useKnowledgeData.ts` — add oblast support, restructure specialization assignments
- `src/components/KnowledgeManagement.tsx` — add Oblast tab (now 4 tabs)
- `src/components/EngineerManagement.tsx` — replace specialization multi-select with table editor

