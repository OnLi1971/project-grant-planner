

## Plan: Link Specializations to Oblast (parent-child relationship)

The user wants specializations to belong to a specific Oblast. Currently both are flat lists. We need to add an `oblast_id` foreign key to `knowledge_specialization` and update the UI accordingly.

### 1. Database migration

Add `oblast_id` column to `knowledge_specialization` referencing `knowledge_oblast`:

```sql
ALTER TABLE public.knowledge_specialization 
  ADD COLUMN oblast_id uuid REFERENCES public.knowledge_oblast(id) ON DELETE CASCADE;

-- Link existing specializations to correct oblasti
UPDATE public.knowledge_specialization SET oblast_id = (SELECT id FROM public.knowledge_oblast WHERE name = 'Kolejová vozidla') 
  WHERE name IN ('Hrubá stavba', 'Stanoviště strojvedoucího/kabina řidiče');

UPDATE public.knowledge_specialization SET oblast_id = (SELECT id FROM public.knowledge_oblast WHERE name = 'Obecné strojírenství') 
  WHERE oblast_id IS NULL;
```

### 2. KnowledgeManagement.tsx — Specializace tab update

Replace the simple `KnowledgeTab` for specializations with a custom component that:
- Shows a table with columns: **Název**, **Oblast** (badge/label)
- Add dialog includes an Oblast select dropdown + name input
- Edit dialog includes both fields
- Specializations are grouped or show their parent Oblast visually

### 3. EngineerManagement.tsx — Specialization editor update

When user selects an Oblast in a spec row, filter the Specializace dropdown to only show specializations belonging to that Oblast. This makes the relationship clear and prevents mismatches.

### 4. useKnowledgeData.ts

- Update the `KnowledgeItem` type to optionally include `oblast_id`
- Update the specialization add/update mutations to include `oblast_id`
- Add a query variant or extend existing one to fetch specializations with their oblast

### Files changed
- New migration SQL (add `oblast_id` to `knowledge_specialization`, update existing data)
- `src/hooks/useKnowledgeData.ts` — extend types and mutations for `oblast_id`
- `src/components/KnowledgeManagement.tsx` — custom Specializace tab with Oblast selector
- `src/components/EngineerManagement.tsx` — filter specializations by selected Oblast in spec rows

