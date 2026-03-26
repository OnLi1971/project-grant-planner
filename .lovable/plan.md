

## Plan: Odstranit speciální formátování předběžných rezervací v PlanningEditor

Řádky s `is_tentative` budou vypadat stejně jako běžné řádky — žádné žluté pozadí, čárkované okraje, `[?]` indikátor ani žlutý text.

### Změny v `src/components/PlanningEditor.tsx`

**1. Řádek tabulky (ř. 720-722)** — odstranit tentative větev z className:
- Smazat `week.is_tentative ? 'border-l-4 border-l-yellow-400 border-dashed bg-yellow-50/50 dark:bg-yellow-900/20' :` 
- Tentative řádky budou používat stejné zebra-striping jako ostatní

**2. Projekt div (ř. 828-830)** — odstranit tentative styling:
- Smazat `${week.is_tentative ? 'border-2 border-dashed border-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/30' : ''}`

**3. `[?]` indikátor (ř. 838-840)** — smazat celý blok:
```tsx
{week.is_tentative && (
  <span className="text-yellow-600 ...">[?]</span>
)}
```

**4. Text projektu (ř. 841)** — odstranit žlutý text:
- Smazat `${week.is_tentative ? 'text-yellow-700 dark:text-yellow-300' : ''}`

**5. Badge funkce `getProjectBadge` (ř. 385-386)** — odstranit dashed border:
- Změnit `const baseClassName = isTentative ? 'border-[3px] border-dashed !border-yellow-400' : '';` na `const baseClassName = '';`
- Nebo úplně přestat předávat `isTentative` do badge

### Dotčený soubor
- `src/components/PlanningEditor.tsx`

### Poznámka
Data `is_tentative` zůstanou v DB beze změny — pouze se odstraní vizuální rozlišení. Legenda "Předběžná rezervace" (ř. 675-678) bude také odstraněna, protože už nebude relevantní.

