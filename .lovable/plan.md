

## Plan: Přidat řádek "Celkem konstruktérů" do ProjectAllocationDialog

Přidat nový souhrnný řádek pod "Celkem FTE", který zobrazí počet konstruktérů s nenulovou alokací v každém sloupci (týdnu/měsíci).

### Změna v `src/components/ProjectAllocationDialog.tsx`

**Za řádek Celkem FTE (ř. 469)** — vložit nový `<TableRow>`:

- Pro každý sloupec spočítat počet inženýrů, kteří mají `allocation.hours > 0`
- V posledním sloupci zobrazit celkový počet unikátních inženýrů (`engineers.length`)
- Styling: `bg-secondary/5` pro odlišení od FTE řádku

```tsx
<TableRow className="bg-secondary/5">
  <TableCell className="sticky left-0 bg-secondary/5 z-10 font-bold text-xs py-1 px-2">
    Celkem konstruktérů
  </TableCell>
  {displayColumns.map(col => {
    const count = engineers.filter(eng => allocationMatrix[eng]?.[col]?.hours > 0).length;
    return (
      <TableCell key={col} className="text-center font-bold text-xs py-1 px-1">
        {count}
      </TableCell>
    );
  })}
  <TableCell className="text-center font-bold bg-primary/10 text-primary text-xs py-1 px-1">
    {engineers.length}
  </TableCell>
</TableRow>
```

### Dotčený soubor
- `src/components/ProjectAllocationDialog.tsx` — 1 nový řádek (~15 řádků kódu)

