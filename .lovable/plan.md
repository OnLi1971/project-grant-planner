

## Přidat Jazyk (Language) do profilu konstruktéra

### Co se vytvoří

Nová sekce "Jazyk" v editačním dialogu konstruktéra a na kartě profilu. Jazyky jsou pevně dané (English, German, Russian), úrovně A1–C2, a datum testování ve formátu rok (např. 2023).

### Databáze

Nová tabulka `engineer_language`:

| Sloupec | Typ | Popis |
|---------|-----|-------|
| id | uuid PK | gen_random_uuid() |
| engineer_id | uuid NOT NULL | vazba na engineers |
| language | text NOT NULL | English / German / Russian |
| level | text NOT NULL | A1, A2, B1, B2, C1, C2 |
| test_year | integer | Rok testování (např. 2023) |
| created_at | timestamptz | now() |

RLS: SELECT pro authenticated, INSERT/UPDATE/DELETE pro editors+admins (stejný vzor jako ostatní junction tabulky).

### UI změny

**EngineerManagement** — nová sekce `LanguageEditor` v `KnowledgeFields`, umístěná před Správou znalostí (před Software). Tabulka s řádky: Jazyk (select: English/German/Russian), Úroveň (select: A1–C2), Rok testování (input number). Tlačítko "Přidat řádek" a mazání.

**EngineerProfile** — nová karta "Jazyky" zobrazující přiřazené jazyky s úrovní a rokem.

### Hook změny

**useKnowledgeData.ts** — rozšířit `useEngineerKnowledge`:
- Přidat dotaz na `engineer_language` v paralelním Promise.all
- Přidat `languages` do výstupu
- Rozšířit `saveAssignments` o ukládání jazyků (delete + insert)

**useEngineerProfile.ts** — přidat dotaz na `engineer_language`, zobrazit v profilu

### Dotčené soubory
- Nová migrace — CREATE TABLE + RLS policies
- `src/hooks/useKnowledgeData.ts` — načítání/ukládání jazyků
- `src/hooks/useEngineerProfile.ts` — načítání jazyků pro profil
- `src/components/EngineerManagement.tsx` — LanguageEditor + stav `languageRows`
- `src/pages/EngineerProfile.tsx` — zobrazení jazyků

