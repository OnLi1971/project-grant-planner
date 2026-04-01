

## Dvě úpravy: Datum odchodu konstruktéra + Červený křížek při editaci

### 1. Datum odchodu (end_date) v EngineerManagement

Tabulka `engineers` už má sloupec `end_date`, ale RPC funkce `engineers_update` a `engineers_create` ho nepropsují a UI ho nezobrazuje.

**Změny:**

**A) Migrace** — rozšířit obě RPC funkce o parametr `p_end_date date DEFAULT NULL`:
- `engineers_create`: přidat `p_end_date` parametr, zapsat do INSERT
- `engineers_update`: přidat `p_end_date` parametr, pokud není NULL, nastavit `v_row.end_date`

**B) `src/hooks/useEngineers.ts`**:
- Přidat `endDate?: string` do `UIEngineer`
- Namapovat `engineer.end_date` → `endDate` v select transformaci
- Předat `p_end_date` v `createEngineer` a `updateEngineer`

**C) `src/components/EngineerManagement.tsx`**:
- Přidat `endDate: ''` do formData
- V create/edit dialogu přidat pole „Datum odchodu" s `DatePickerCell` (už existuje v komponentě)
- V tabulce zobrazit sloupec „Odchod" s datem (pokud je nastaveno)
- Při otevření edit dialogu naplnit `endDate` z engineera

### 2. Červený křížek při editaci v PlanningEditor

V `src/components/PlanningEditor.tsx` — když se edituje buňka (projekt nebo hodiny), přidat červený X button vedle inputu:

- U editace **projektu**: vedle SelectTriggeru přidat `<Button>` s červeným `<X>` ikonou → kliknutí nastaví projekt na `FREE` a zavře editaci
- U editace **hodin**: vedle Input přidat červený X → kliknutí nastaví hodiny na `0` a zavře editaci
- Také u **needitovaných buněk** s hodnotou (projekt !== FREE): zobrazit malý červený křížek pro rychlé smazání

### Dotčené soubory
- `supabase/migrations/` — nová migrace pro RPC funkce
- `src/hooks/useEngineers.ts`
- `src/components/EngineerManagement.tsx`
- `src/components/PlanningEditor.tsx`

