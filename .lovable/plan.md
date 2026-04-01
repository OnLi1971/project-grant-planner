

## Přidat úrovně 1–5 k Software a PDM/PLM

### Co se změní

Ke každému přiřazení Software a PDM/PLM u konstruktéra přibude úroveň 1–5 (1 = nejhorší, 5 = nejlepší). Výchozí hodnota: 1.

### Databáze

Jedna migrace — přidání sloupce `level` (integer, default 1) do obou tabulek:
- `ALTER TABLE engineer_software ADD COLUMN level integer NOT NULL DEFAULT 1;`
- `ALTER TABLE engineer_pdm_plm ADD COLUMN level integer NOT NULL DEFAULT 1;`

### UI změny

**KnowledgeMultiSelect** se přepracuje — místo pouhého výběru ID se bude pracovat s `{ id: string, level: number }[]`. Po výběru položky se vedle badge zobrazí malý select/dropdown s hodnotami 1–5. Uživatel může měnit úroveň přímo v komponentě.

**EngineerManagement** — stav `selectedSoftware` a `selectedPdmPlm` se změní z `string[]` na `{ id: string, level: number }[]`.

**EngineerProfile** — u Software a PDM/PLM se vedle názvu zobrazí badge s úrovní (např. "CatiaV5 ⭐3").

### Hook změny

**useKnowledgeData.ts** — `useEngineerKnowledge`:
- Dotazy na `engineer_software` a `engineer_pdm_plm` budou vracet i `level`
- `saveAssignments` bude ukládat `level` spolu s ID

**useEngineerProfile.ts** — dotazy vrátí i level, profil zobrazí úroveň

### Dotčené soubory
- Nová migrace — ALTER TABLE pro oba sloupce
- `src/components/KnowledgeMultiSelect.tsx` — podpora levels
- `src/hooks/useKnowledgeData.ts` — načítání/ukládání levels
- `src/hooks/useEngineerProfile.ts` — načítání levels
- `src/pages/EngineerProfile.tsx` — zobrazení levels
- `src/components/EngineerManagement.tsx` — změna stavu na `{ id, level }[]`

