

## Problém: Měsíční vytížení nesedí kvůli přiřazení týdnů k měsícům

### Příčina
Funkce `getMonthForWeek` přiřadí každý týden **jednomu** měsíci podle čtvrtka. Např. CW27 (29.6.–3.7.) má čtvrtek 2.7. → je přiřazen červenci. Ale 2 pracovní dny z CW27 spadají do června → ty se **ztratí**.

Důsledek: červen má kapacitu 22 dnů (176h), ale dostane hodiny jen z CW23–CW26 (4 plné týdny = 144h) → 144/176 = **82%** místo 90%.

### Řešení
V `getMonthlyUtilization` iterovat přes **všechny týdny** (`allWeeks`), ne jen přes `mi.weeks`. Pro každý týden spočítat kolik jeho pracovních dnů spadá do daného měsíce přes `getWorkingDaysInWeekForMonth`. Tím se hranice měsíců správně pokryjí — každý týden přispěje do obou měsíců poměrně.

### Změna v `src/components/UtilizationGrid.tsx`

Funkce `getMonthlyUtilization` — změnit `mi.weeks` → `allWeeks`:

```typescript
const getMonthlyUtilization = (engineer: UIEngineer, mi: MonthInfo): number => {
  const sk = isSlovak(engineer);
  const capacity = getWorkingDaysInMonth(mi.year, mi.month, sk) * 8;
  if (capacity === 0) return 0;

  let totalScaledHours = 0;
  for (const cwKey of allWeeks) {  // ← ALL weeks, not mi.weeks
    const parsed = parseCW(cwKey);
    if (!parsed) continue;
    const weekHours = getEngineerHoursForWeek(engineer, cwKey);
    if (weekHours === 0) continue;

    const monday = getISOWeekMonday(parsed.cw, parsed.year);
    const daysInMonth = getWorkingDaysInWeekForMonth(monday, mi.year, mi.month, sk);
    if (daysInMonth === 0) continue;  // week has no days in this month

    const workingDays = getWorkingDaysInCW(parsed.cw, parsed.year, sk);
    if (workingDays === 0) continue;

    const scaledHours = weekHours * (workingDays / 5);
    totalScaledHours += scaledHours * (daysInMonth / workingDays);
  }

  return (totalScaledHours / capacity) * 100;
};
```

### Výsledek
Při konstantních 36h/týden bude měsíční vytížení vždy **90%** bez ohledu na to, jak týdny padají na hranice měsíců.

