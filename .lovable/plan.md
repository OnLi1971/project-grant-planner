

## Plan: Hvězdička a snížené hodiny ve svátečních týdnech v ProjectAllocationDialog

### Problém
V dialogu projektu (ProjectAllocationDialog) se u všech týdnů zobrazuje stejných 36h, i když týden obsahuje svátek a reálná kapacita je nižší (např. 28h = 4 pracovní dny × 7h denně, resp. 4/5 z 36h).

### Řešení

**1. Nová utilita v `src/utils/workingDays.ts`**

Přidat funkci `getWorkingDaysInCW(cwNumber: number, year: number, isSlovak?: boolean): number` — vrátí počet pracovních dnů (pondělí–pátek minus svátky) v daném kalendářním týdnu. Použije ISO week → Monday výpočet, pak projde 5 dnů a odfiltruje svátky.

Přidat helper `getHolidayWeeks(year: number): Map<string, number>` — vrátí mapu `CW{nn}-{yyyy}` → počet pracovních dnů, jen pro týdny kde je méně než 5.

**2. Změny v `src/components/ProjectAllocationDialog.tsx`**

- Import `getWorkingDaysInCW` z `workingDays.ts`
- Nový `useMemo` — `holidayWeeks: Map<string, number>` — projde všechny `weeks`, parsne CW číslo a rok, zavolá `getWorkingDaysInCW`, pokud < 5 pracovních dnů → uloží do mapy
- V header řádku (CW label, řádek ~336): pokud je týden v `holidayWeeks`, přidat hvězdičku: `CW14*`
- V buňce hodin (řádek ~385): pokud je týden v `holidayWeeks`, přepočítat hodiny: `Math.round(allocation.hours * workingDays / 5)` a přidat hvězdičku `*`
- V Celkem řádku: přepočítat column totals s holiday adjustmentem
- Do legendy přidat: `* Týden se svátkem (snížená kapacita)`

**3. Dotčené soubory**
- `src/utils/workingDays.ts` — nová funkce
- `src/components/ProjectAllocationDialog.tsx` — zobrazení hodin + hvězdička

### Poznámky
- Hodiny v DB (`mhTyden`) se nemění — úprava je čistě zobrazovací
- Koeficient: `workingDays / 5` (např. 4/5 = 0.8, takže 36h → 28.8h → 29h)

