

## Fix: Vyloučit režimové aktivity z výpočtu vytížení

### Změna v `src/components/UtilizationGrid.tsx`

V `hoursMap` builderu (řádky 126-136):
1. Přeskočit entries s `projekt` = FREE, DOVOLENÁ, NEMOC, OVER
2. Změnit default `entry.mhTyden ?? 40` na `entry.mhTyden ?? 0`

```typescript
const REGIME_ACTIVITIES = ['FREE', 'DOVOLENÁ', 'NEMOC', 'OVER'];

const hoursMap = useMemo(() => {
  const map = new Map<string, Map<string, number>>();
  for (const entry of planningData) {
    if (REGIME_ACTIVITIES.includes(entry.projekt)) continue;
    const slug = normalizeName(entry.konstrukter);
    if (!map.has(slug)) map.set(slug, new Map());
    const cwMap = map.get(slug)!;
    const hours = entry.mhTyden ?? 0;
    cwMap.set(entry.cw, (cwMap.get(entry.cw) || 0) + hours);
  }
  return map;
}, [planningData]);
```

### Výsledek
- Ambrož CW14 s FREE → 0% (prázdná buňka)
- OVER, DOVOLENÁ, NEMOC se taky nepočítají
- Pouze skutečné projektové hodiny ovlivňují vytížení

