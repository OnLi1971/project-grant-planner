

## Plan: Opravit výpočet FTE pro zkrácené týdny (svátky)

Aktuálně se FTE počítá vždy jako `hodiny / 40`, i když týden má méně pracovních dnů. Například CW14* má 4 pracovní dny (max 32h), takže 29h by mělo být FTE ~0.9, ne 0.7.

### Princip opravy
FTE = hodiny / (počet_pracovních_dnů × 8). Pro plný týden (5 dnů) = hodiny/40, pro sváteční týden (4 dny) = hodiny/32.

### Změny

**1. `src/components/ProjectAllocationDialog.tsx` (ř. 461-464)**
- V řádku "Celkem FTE" pro týdenní view: místo dělení 40 použít `(holidayWeeks.get(col) || 5) * 8`
- Měsíční view zůstane beze změny (168 je průměr)

**2. `src/components/ProjectAssignmentMatrix.tsx` (ř. 1507-1532)**
- V "Celkem FTE" řádku pro weekly view: parsovat CW číslo a rok z názvu týdne, zavolat `getWorkingDaysInCW()`, dělit `workingDays * 8` místo 40
- Import `getWorkingDaysInCW` z `@/utils/workingDays`

### Dotčené soubory
- `src/components/ProjectAllocationDialog.tsx` — 1 řádek výpočtu
- `src/components/ProjectAssignmentMatrix.tsx` — 1 řádek výpočtu + import

