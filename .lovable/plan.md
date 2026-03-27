

## Plan: Zaokrouhlit hodiny na celá čísla

Problém je floating point aritmetika při proporcionálním dělení týdnů mezi měsíce (`hours * fraction` = čísla jako 50.4, 158.4, 691.199999...).

### Změny v `src/components/ProjectAllocationDialog.tsx`

**1. Zaokrouhlit hodiny v buňkách (ř. 439)**
- Přidat `Math.round()` kolem `allocation.hours` i pro monthly view (ne jen pro holiday adjustment)
- Změna: `Math.round(allocation.hours)` jako fallback místo `allocation.hours`

**2. Zaokrouhlit row totals (ř. 289)**
- Celý součet zaokrouhlit: výsledek `totals[eng]` obalit `Math.round()`

**3. Zaokrouhlit column totals (ř. 304)**
- Celý součet zaokrouhlit: výsledek `totals[col]` obalit `Math.round()`

**4. Zaokrouhlit grand total (ř. 478)**
- `Math.round(Object.values(columnTotals).reduce(...))`

### Dotčený soubor
- `src/components/ProjectAllocationDialog.tsx` — 4 místa, drobné úpravy

