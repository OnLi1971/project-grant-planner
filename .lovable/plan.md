

## Plan: Poměrově snížit hodiny v Utilization Gridu podle délky týdne

### Problém
Uživatel zadává 36h jako standard pro plný týden (5 prac. dnů). V krátkém týdnu (např. CW14 = 4 dny) se ale bere 36h doslova → 36/32 = 112%, což je zavádějící.

### Řešení
V `src/components/UtilizationGrid.tsx` v `hoursMap` builderu — při sčítání hodin za týden zároveň uložit „normalizované" hodiny:

```
effectiveHours = hours × (workingDaysInCW / 5)
```

Takže 36h v 4-denním týdnu → 36 × 4/5 = 28.8h. Utilizace = 28.8/32 = 90%.

### Implementace
V `hoursMap` useMemo (cca řádek 126):
1. Pro každý entry parsovat CW číslo a rok
2. Zjistit `getWorkingDaysInCW(cw, year, isSlovak)` — ale protože v hoursMap ještě neznáme konkrétního inženýra, použijeme CZ svátky jako default (SK vs CZ rozdíl je minimální, většina svátků se překrývá)
3. Spočítat `scaledHours = hours × (workingDays / 5)`
4. Sčítat scaledHours místo raw hours

Alternativně (čistší): scaling provést až v `getWeeklyUtilization` a `getMonthlyUtilization`, kde už známe inženýra a jeho lokaci. To je lepší — scale při výpočtu utilizace, ne při agregaci.

**Finální přístup** — upravit `getEngineerHoursForWeek` nebo přímo `getWeeklyUtilization`/`getMonthlyUtilization`:

```typescript
// V getWeeklyUtilization:
const rawHours = getEngineerHoursForWeek(engineer, cwKey);
const workingDays = getWorkingDaysInCW(parsed.cw, parsed.year, isSlovak(engineer));
const scaledHours = rawHours * (workingDays / 5);
const capacity = workingDays * 8;
// utilization = scaledHours / capacity * 100
// Zjednodušeně: (rawHours * workingDays/5) / (workingDays * 8) = rawHours / 40
```

Pozor — po zjednodušení vychází `rawHours / 40 × 100` vždy, což znamená, že 36h = 90% bez ohledu na svátky. To dává smysl: uživatel říká „36h je můj standard pro plný týden" → utilizace = 36/40 = 90%.

Pro **měsíční** pohled se to přirozeně propaguje přes proportional splitting (už existující logika).

### Dotčený soubor
- `src/components/UtilizationGrid.tsx` — úprava `getWeeklyUtilization` a `getMonthlyUtilization`

