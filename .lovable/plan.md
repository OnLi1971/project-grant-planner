

## Plan: Žlutý otazník u předběžných rezervací

Přidat zpět žlutý `[?]` indikátor vedle názvu projektu u tentative řádků — bez dalšího stylování (žádné žluté pozadí, okraje ani text).

### Změna v `src/components/PlanningEditor.tsx`

**Řádek ~833-835** — přidat `[?]` před název projektu:

```tsx
<span className="font-medium">
  {week.is_tentative && (
    <span className="text-yellow-600 dark:text-yellow-400 mr-1 font-bold">[?]</span>
  )}
  {week.projekt || 'FREE'}
</span>
```

### Dotčený soubor
- `src/components/PlanningEditor.tsx` — 1 místo, cca 3 řádky

