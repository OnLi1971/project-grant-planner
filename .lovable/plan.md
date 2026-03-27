

## Plan: Čisté řešení — sdílená utilita pro week-to-month mapování

### Problém
Aktuálně existují **3 nezávislé implementace** stejné logiky:

| Komponenta | Mapování | Svátky | Pracovní dny |
|---|---|---|---|
| `RevenueOverview.tsx` | Statická tabulka ~70 řádků (ř. 240-308) | Vlastní `publicHolidays` objekt (ř. 177-190) | Vlastní `getWorkingDaysInMonth` (ř. 221-236) |
| `ProjectAllocationDialog.tsx` | Dynamický výpočet přes `getISOWeekMonday` | Používá `workingDays.ts` | Používá `workingDays.ts` |
| `ExecutiveDashboard.tsx` | Další statická tabulka ~60 řádků (ř. 93-135) | Žádné | Žádné |

To je zdroj nekonzistencí — každá komponenta počítá jinak.

### Řešení: sdílená utilita

**1. Nová funkce v `src/utils/workingDays.ts`**

Přidat `getWeekToMonthFractions(cwKey: string): { monthKey: string; fraction: number }[]`
- Vstup: CW klíč z plánovacích dat (např. `"CW23-2026"`, `"CW44"`)  
- Výstup: pole `[{ monthKey: "červen_2026", fraction: 0.8 }, { monthKey: "květen_2026", fraction: 0.2 }]`
- Interně použije existující `getISOWeekMonday` a kalendářní dny (Po-Pá)
- Formát `monthKey` = `"měsíc_rok"` (kompatibilní s oběma komponentami)

**2. Upravit `RevenueOverview.tsx`**
- Smazat statickou `weekToMonthMapping` tabulku (~70 řádků)
- Smazat duplicitní `publicHolidays`, `getHolidaysInMonth`, `getWorkingDaysInMonth` (~60 řádků)
- Import `getWeekToMonthFractions` z `workingDays.ts`
- V `calculateMonthlyRevenueByProject` a `calculateMonthlyHoursByProject`: zavolat `getWeekToMonthFractions(cwKey)` místo `weekToMonthMapping[cwKey]`
- Holiday coefficient pro revenue (Kč): použít `getWorkingDaysInMonth` z `workingDays.ts` místo vlastní implementace

**3. Upravit `ExecutiveDashboard.tsx`**
- Smazat statickou `weekToMonthMapping` tabulku (~60 řádků) a `getWeekToMonthMapping2026`
- Import `getWeekToMonthFractions` z `workingDays.ts`

**4. `ProjectAllocationDialog.tsx` — beze změny**
- Už používá dynamický výpočet, ponechat jak je (formát `monthKey` je tam `"měsíc rok"` místo `"měsíc_rok"`, ale to je jen pro UI zobrazení)

### Výsledek
- Jeden zdroj pravdy pro week-to-month mapování (`workingDays.ts`)
- Jeden zdroj pravdy pro svátky a pracovní dny (`workingDays.ts`)
- Smazáno ~190 řádků duplicitního kódu
- Hodiny budou identické ve všech pohledech

### Dotčené soubory
- `src/utils/workingDays.ts` — nová funkce `getWeekToMonthFractions`
- `src/components/RevenueOverview.tsx` — refaktor, smazání duplikátů
- `src/components/ExecutiveDashboard.tsx` — refaktor, smazání duplikátů

