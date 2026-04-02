

## Přidání filtrů do Engineer Management

### Problém
V tabulce konstruktérů je aktuálně jen filtr podle školení. Chybí filtry podle lokace, software, PDM/PLM, specializace, jazyka a statusu.

### Řešení

**Soubor: `src/components/EngineerManagement.tsx`**

1. **Přidat stavové proměnné pro nové filtry:**
   - `filterLocation: string` (PRG/PLZ/SK/all)
   - `filterStatus: string` (active/inactive/contractor/on_leave/all)
   - `filterSoftware: string` (textový vyhledávací vstup)
   - `filterPdmPlm: string` (textový vyhledávací vstup)
   - `filterSpecialization: string` (textový vyhledávací vstup)
   - `filterLanguage: string` (textový vyhledávací vstup)

2. **Načíst data o SW, PDM/PLM, specializacích a jazycích pro všechny inženýry** z junction tabulek (`engineer_software`, `engineer_pdm_plm`, `engineer_specialization`, `engineer_language`) jedním hromadným dotazem, aby bylo možné filtrovat podle těchto atributů.

3. **Přidat řádek s filtry** nad tabulku (pod stávající filtr školení):
   - Select dropdown pro **Lokaci** (PRG/PLZ/SK/Vše)
   - Select dropdown pro **Status** (active/contractor/inactive/on_leave/Vše)
   - Textové pole pro **Software** (filtruje jména z `engineer_software`)
   - Textové pole pro **PDM/PLM** (filtruje z `engineer_pdm_plm`)
   - Textové pole pro **Specializace** (filtruje z `engineer_specialization`)
   - Textové pole pro **Jazyk** (filtruje z `engineer_language`)
   - Tlačítko "Zrušit filtry" pro reset všech filtrů

4. **Rozšířit logiku `filteredEngineers`:**
   - Stávající filtr školení zůstane
   - Přidá se řetězení `.filter()` pro každý aktivní filtr
   - Pro SW/PDM/PLM/specializace/jazyk se porovná proti načteným junction datům

5. **Aktualizovat text počítadla** aby zobrazoval počet filtrovaných vs. celkových

### Technické detaily
- Junction data se načtou přes `useQuery` s klíčem `['engineer-filters-data']`
- Dotazy: `engineer_software` JOIN `knowledge_software`, `engineer_pdm_plm` JOIN `knowledge_pdm_plm`, `engineer_specialization` JOIN `knowledge_specialization`, `engineer_language`
- Filtrování probíhá na klientovi (case-insensitive `includes`)
- Dropdowny používají stávající `Select` komponentu z UI knihovny

