## Oprava: Převzít plán zachová předběžnou rezervaci

### Problém
Ve funkci `copyPlan` v `src/components/PlanningEditor.tsx` (řádek 439) se při kopírování projektu nepředává příznak `is_tentative`. Výsledkem je, že předběžné rezervace zdrojového konstruktéra se u cílového uloží jako plné (potvrzené) alokace.

### Řešení
Upravit volání `updatePlanningEntry` v `copyPlan` tak, aby předávalo i `sourceWeek.is_tentative`:

```ts
await updatePlanningEntry(
  to,
  sourceWeek.cw,
  sourceWeek.projekt || 'FREE',
  sourceWeek.is_tentative || false  // nově
);
```

Funkce `updatePlanningEntry` v `PlanningContext` už čtvrtý argument `isTentative` podporuje, takže žádné další změny nejsou potřeba.

### Dotčené soubory
- `src/components/PlanningEditor.tsx` – jeden řádek v `copyPlan`