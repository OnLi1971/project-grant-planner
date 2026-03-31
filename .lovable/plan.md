

## Plan: Nová komponenta „Vytížení" (Utilization Grid)

### Co se přidá
Nový tab „Vytížení" vedle „Matice projektů" a „Revenue" v sekci Výstupy. Bude to tabulka/grid kde:
- **Osa X**: konstruktéři (sloupce)
- **Osa Y**: čas — týdny (výchozí), přepínatelné na měsíce
- **Buňky**: procento vytížení = `alokované hodiny / max kapacita × 100`
  - Týden: max = 40h (nebo 32h pokud svátek)
  - Měsíc: max = počet pracovních dnů × 8h

### Technické detaily

**Nový soubor: `src/components/UtilizationGrid.tsx`**
- Použije stejný `usePlanning()` context jako ostatní výstupy
- Použije `useEngineers()` pro seznam konstruktérů
- Sdílené utility z `workingDays.ts`: `getWorkingDaysInCW`, `getWorkingDaysInMonth`, `getISOWeekMonday`, `getWorkingDaysInWeekForMonth`
- Přepínač týdny/měsíce (toggle nahoře)
- Barevné kódování buněk: zelená (<80%), žlutá (80-100%), červená (>100%)
- Sticky první sloupec (čas) a první řádek (konstruktéři)
- Generování týdnů/měsíců stejnou logikou jako `ProjectAssignmentMatrix` (`getAllWeeks`, `generateMonths`)
- Filtry: společnost (MB Idea / AERTEC / TM-CZ / Všichni)

**Výpočet:**
```
// Týdenní
weekCapacity = getWorkingDaysInCW(cwNum, year, isSlovak) * 8
utilization = allocatedHours / weekCapacity * 100

// Měsíční (s proporcionálním dělením přechodových týdnů)
monthCapacity = getWorkingDaysInMonth(year, month, isSlovak) * 8
proportionalHours = Σ(weekHours * daysInMonth/totalWeekDays)
utilization = proportionalHours / monthCapacity * 100
```

**Úprava: `src/pages/Index.tsx`**
- Přidat třetí tlačítko „Vytížení" do výstupů (vedle Matice projektů a Revenue)
- Rozšířit `outputView` state o `'utilization'`
- Import a renderování `<UtilizationGrid />`

### Dotčené soubory
- `src/components/UtilizationGrid.tsx` — nová komponenta
- `src/pages/Index.tsx` — přidání tabu

