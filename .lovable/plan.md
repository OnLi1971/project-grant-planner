

## Přidat Trénink (školení) s vyhledáváním

### Co se vytvoří

**1. Databázová tabulka `engineer_training`**

| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | uuid PK | |
| engineer_id | uuid | vazba na engineers |
| name | text | Název školení |
| date_from | date | Od |
| date_to | date | Do |
| company_trainer | text | Firma/Školitel |
| has_exam | boolean | Zkouška (ano/ne) |
| notes | text | Poznámka |
| created_at | timestamptz | |

RLS: SELECT pro authenticated, INSERT/DELETE/UPDATE pro editors+admins.

**2. UI — záložka Trénink v profilu konstruktéra**

V dialogu úpravy konstruktéra (EngineerManagement) přidat sekci "Trénink" pod stávající znalosti. Tabulka s řádky: Název, Od, Do, Firma/Školitel, Zkouška, Poznámka. Tlačítko přidat/smazat řádek.

**3. Excel import**

Tlačítko "Importovat z Excelu" nad tabulkou tréninků. Použije knihovnu `xlsx` (SheetJS) pro client-side parsing. Uživatel nahraje .xlsx, systém naparsuje sloupce (Název školení, Od, Do, Firma/Školitel, Zkouška, Poznámka) a uloží do DB pro vybraného konstruktéra.

**4. Vyhledávání konstruktérů podle školení**

V EngineerManagement přidat filtr "Filtrovat podle školení" — textový input, který vyhledá v `engineer_training.name` a zobrazí pouze konstruktéry, kteří mají odpovídající školení. Použije Supabase join dotaz.

### Dotčené soubory

- **Nová migrace** — CREATE TABLE `engineer_training` + RLS policies
- **`src/hooks/useKnowledgeData.ts`** — nový hook `useEngineerTraining` (CRUD + search)
- **`src/components/EngineerManagement.tsx`** — sekce Trénink v editačním dialogu + filtr v seznamu
- **`package.json`** — přidat `xlsx` knihovnu pro Excel import
- **`src/components/TrainingImport.tsx`** — nová komponenta pro Excel upload + preview + uložení

### Technický detail

Vyhledávání: `supabase.from('engineer_training').select('engineer_id').ilike('name', '%query%')` → filtrovat seznam engineers podle nalezených engineer_id.

Excel parsing: `xlsx.read(file)` → extrahovat řádky → mapovat na sloupce → bulk insert do `engineer_training`.

