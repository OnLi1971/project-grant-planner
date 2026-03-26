

## Plan: Přepínač Hodiny / Kč v Revenue přehledu

### Co se změní

Přidání přepínače (toggle) do filtrovací oblasti, který přepne celý Revenue přehled mezi zobrazením v **Kč** (revenue) a **hodinách** (man-hours).

### Změny v `src/components/RevenueOverview.tsx`

**1. Nový stav**
- `displayUnit: 'kc' | 'hodiny'` (default `'kc'`)

**2. UI — přepínač ve filtrech (řádek ~870, vedle selektoru Měna)**
- Nový blok s labelem "Jednotky" a dvěma tlačítky nebo Select: "Kč" / "Hodiny"
- Když je vybrán "Hodiny", skrýt selektor Měny (CZK/USD je irelevantní)

**3. Paralelní výpočet hodin**
- Nová funkce `calculateMonthlyHoursByProject()` — stejná logika jako `calculateMonthlyRevenueByProject()`, ale místo `entry.mhTyden * hourlyRate * ratio * ...` vrací `entry.mhTyden * ratio * holidayCoefficient * probabilityCoefficient` (bez násobení sazbou)
- Memoizovaná proměnná `monthlyHoursByProject`
- Výběrová proměnná `activeData = displayUnit === 'kc' ? monthlyRevenueByProject : monthlyHoursByProject`

**4. Formátování**
- Nový formátovač `formatHours(value)` → např. `"125 h"`, pro zkrácený `"1.2k h"`
- Podmíněné použití: `displayUnit === 'kc' ? formatCurrency(value) : formatHours(value)`

**5. Ovlivněné části UI**
- **Celkový obrat** (řádek 957): text a hodnota
- **Graf** — YAxis tickFormatter, tooltip hodnoty, bar label (renderTotalLabel)
- **Detailní tabulka** — všechny buňky + celkový řádek

### Dotčené soubory
- `src/components/RevenueOverview.tsx` — jediný soubor

