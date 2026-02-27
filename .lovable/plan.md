

## Plán: Přidat počet konstruktérů do summary karet

### Změna v `src/components/FreeCapacityOverview.tsx`

#### 1. Rozšířit `summaryStats` o počty konstruktérů

Přidat do výpočtu sledování unikátních konstruktérů (celkem, finální, předběžné):

```tsx
const summaryStats = useMemo(() => {
  const HOURS_PER_WEEK = 36;
  let totalAllocatedWeeks = 0;
  let finalWeeks = 0;
  let tentativeWeeks = 0;
  const totalEngineersSet = new Set<string>();
  const finalEngineersSet = new Set<string>();
  const tentativeEngineersSet = new Set<string>();

  engineersWithFreeCapacity.forEach(engineer => {
    const relevantWeeks = engineer.weeks.filter(week => filteredWeeks.includes(week.cw));
    relevantWeeks.forEach(week => {
      const isFree = week.projekt === 'FREE' || week.projekt === '' || !week.projekt;
      if (!isFree) {
        totalAllocatedWeeks++;
        totalEngineersSet.add(engineer.konstrukter);
        if (week.isTentative) {
          tentativeWeeks++;
          tentativeEngineersSet.add(engineer.konstrukter);
        } else {
          finalWeeks++;
          finalEngineersSet.add(engineer.konstrukter);
        }
      }
    });
  });

  return {
    // ... existing fields ...
    totalEngineers: totalEngineersSet.size,
    finalEngineers: finalEngineersSet.size,
    tentativeEngineers: tentativeEngineersSet.size,
  };
}, [...]);
```

#### 2. Zobrazit počty v kartách

Pod každou kartou přidat řádek s počtem konstruktérů:

- **Celkem hodin**: `{summaryStats.totalEngineers} konstruktérů`
- **Finální**: `{summaryStats.finalEngineers} konstruktérů`
- **Předběžné**: `{summaryStats.tentativeEngineers} konstruktérů`

Formát: nový `<p className="text-xs text-muted-foreground">` pod existující řádek s týdny.

