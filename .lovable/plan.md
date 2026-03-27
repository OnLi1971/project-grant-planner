

## Plan: Proporcionální rozdělení hodin přechodových týdnů mezi měsíce

Aktuálně se celý týden (např. CW14) přiřadí jednomu měsíci podle statické tabulky `monthWeekMapping`. Přechodové týdny (např. pondělí-středa v březnu, čtvrtek-pátek v dubnu) by měly rozdělit hodiny proporcionálně podle pracovních dnů.

### Princip

Pro každý týden spočítat, kolik jeho pracovních dnů (Po-Pá minus svátky) spadá do kterého měsíce pomocí existující funkce `getWorkingDaysInWeekForMonth()`. Hodiny pak rozdělit poměrně.

Příklad: CW14-2025 má pondělí 31.3. (březen) a úterý-pátek 1.-4.4. (duben). Pokud inženýr má 40h, do března půjde 8h (1/5) a do dubna 32h (4/5).

### Změny v `src/components/ProjectAllocationDialog.tsx`

**1. Import** — přidat `getISOWeekMonday`, `getWorkingDaysInWeekForMonth` z `@/utils/workingDays`

**2. Nahradit statickou `monthWeekMapping` tabulku** dynamickým mapováním:
- Pro každý týden (CW+rok) spočítat pondělí pomocí `getISOWeekMonday`
- Zjistit, do jakých měsíců spadají pracovní dny (typicky 1-2 měsíce)
- Pokud týden spadá do dvou měsíců, rozdělit hodiny proporcionálně

**3. Upravit `monthsData` useMemo (ř. 119-152)**:
- Místo jednoznačného `weekToMonth[week] = monthKey` vytvořit `weekToMonths[week] = [{ monthKey, fraction }]`
- Každý týden může mít 1-2 cílové měsíce s podílem

**4. Upravit `monthlyAllocationMatrix` useMemo (ř. 184-215)**:
- Místo `matrix[eng][month].hours += a.hours` použít `matrix[eng][m.monthKey].hours += a.hours * m.fraction`
- weekCount přičítat proporcionálně

**5. Zachovat `monthWeekMapping` pro `monthGroups`** (header weekly view) — tam se stále používá pro seskupení sloupců, ale přechodové týdny se přiřadí měsíci, kde mají více dnů

### Dotčený soubor
- `src/components/ProjectAllocationDialog.tsx` — import + 2 useMemo bloky

### Poznámka
Funkce `getWorkingDaysInWeekForMonth` a `getISOWeekMonday` už existují v `workingDays.ts` a jsou otestované.

