

## Plán: Přidat řádek měsíců nad týdenní hlavičky v ProjectAllocationDialog

### Změna v `src/components/ProjectAllocationDialog.tsx`

Přidat nový `<TableRow>` nad stávající řádek s CW hlavičkami (jen v `viewMode === 'weeks'`). Tento řádek bude obsahovat sloučené buňky (`colSpan`) pro každý měsíc, seskupené podle `monthWeekMapping`.

#### Implementace

1. **Vypočítat měsíční skupiny z `weeks`** — seskupit po sobě jdoucí týdny do měsíců pomocí existujícího `monthWeekMapping`, spočítat `colSpan` pro každý měsíc.

2. **Přidat nový `<TableRow>` do `<TableHeader>`** před stávající řádek s CW:

```tsx
<TableHeader className="sticky top-0 bg-background z-10">
  {viewMode === 'weeks' && (
    <TableRow>
      <TableHead className="sticky left-0 bg-background z-20" />
      {monthGroups.map(group => (
        <TableHead 
          key={group.name} 
          colSpan={group.colSpan} 
          className="text-center text-[10px] font-semibold border-b py-1 px-0"
        >
          {group.name}
        </TableHead>
      ))}
      <TableHead className="bg-muted/30" />
    </TableRow>
  )}
  {/* existující řádek s CW hlavičkami */}
  <TableRow>...</TableRow>
</TableHeader>
```

3. **`monthGroups` useMemo** — iteruje přes `weeks` (sorted), mapuje každý na měsíc+rok, seskupuje sousední stejné měsíce do jedné skupiny s `colSpan`:

```tsx
const monthGroups = useMemo(() => {
  const groups: { name: string; colSpan: number }[] = [];
  weeks.forEach(week => {
    const match = week.match(/CW(\d+)-(\d+)/);
    if (match) {
      const monthInfo = monthWeekMapping[match[1]];
      const label = `${monthInfo?.name || '?'} ${match[2]}`;
      if (groups.length > 0 && groups[groups.length - 1].name === label) {
        groups[groups.length - 1].colSpan++;
      } else {
        groups.push({ name: label, colSpan: 1 });
      }
    }
  });
  return groups;
}, [weeks]);
```

