

## Plán: Přidat řádek s počtem konstruktérů (FTE) pod Celkem

### Změna v `src/components/ProjectAllocationDialog.tsx`

#### 1. Přidat výpočet `columnEngineerCounts`

Nový `useMemo` – pro každý sloupec (týden/měsíc) spočítá počet unikátních konstruktérů s nenulovými hodinami:

```tsx
const columnEngineerCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  displayColumns.forEach(col => {
    counts[col] = engineers.filter(eng => 
      (allocationMatrix[eng]?.[col]?.hours || 0) > 0
    ).length;
  });
  return counts;
}, [engineers, displayColumns, allocationMatrix]);
```

#### 2. Přidat nový řádek `FTE` pod řádek `Celkem`

Nový `<TableRow>` hned za stávající "Celkem" řádek (řádky ~386-398):

```tsx
<TableRow className="bg-muted/40 border-t">
  <TableCell className="sticky left-0 bg-muted/40 z-10 font-bold text-xs py-1 px-2">
    FTE
  </TableCell>
  {displayColumns.map(col => (
    <TableCell key={col} className="text-center font-bold text-xs py-1 px-1 text-blue-600">
      {columnEngineerCounts[col] || 0}
    </TableCell>
  ))}
  <TableCell className="text-center font-bold bg-primary/10 text-xs py-1 px-1">
    {stats.uniqueEngineers}
  </TableCell>
</TableRow>
```

Výsledek: pod řádkem "Celkem 280h / 968h / 2584h" bude řádek "FTE 2 / 7 / 15" (počet konstruktérů s alokací v daném období).

