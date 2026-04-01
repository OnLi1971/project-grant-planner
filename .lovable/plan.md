

## Zobrazení odchodu konstruktéra v matici, editoru a utilization gridu

### Co se změní

Když má konstruktér nastaven `end_date` (datum odchodu), všechny týdny **po tomto datu** se zobrazí jako neaktivní s červeným křížkem ✕ místo "FREE". Buňky nebudou editovatelné.

### Implementace

**1. Rozšířit `EngineerInfo` o `end_date`** (`src/types/planning.ts`)
- Přidat `end_date?: string | null` do `EngineerInfo`

**2. Propsat `end_date` do PlanningContext** (`src/hooks/usePlanningData.ts`)
- V mappingu `uiEngineers` → `EngineerInfo` přidat `end_date: e.endDate`

**3. Helper funkce — `isEngineerDeparted(engineerName, weekCW, engineers)`**
- Porovná `end_date` s pondělkem daného týdne
- Pokud pondělí > end_date → vrátí `true`
- Bude sdílená utility (nebo inline v komponentách)

**4. ProjectAssignmentMatrix** (`src/components/ProjectAssignmentMatrix.tsx`)
- V `matrixData` useMemo: pokud `isEngineerDeparted` → projekt = `'DEPARTED'`, hours = 0
- V `monthlyData` useMemo: stejná logika
- Přidat styl pro `'DEPARTED'` v `getProjectBadgeStyle` — šedé pozadí s červeným ✕
- V renderování buněk: pro `DEPARTED` zobrazit ✕ ikonu, zakázat kliknutí
- Ve free/tentative počítání: ignorovat DEPARTED konstruktéry

**5. PlanningEditor** (`src/components/PlanningEditor.tsx`)
- V renderování týdenních buněk: pokud `isEngineerDeparted` → zobrazit červený ✕, zakázat editaci
- Nepovolit otevření editačního dialogu pro tyto buňky

**6. UtilizationGrid** (`src/components/UtilizationGrid.tsx`)
- Pro týdny po odchodu: ignorovat v kalkulaci vytížení (0h kapacita i 0h alokace)
- Zobrazit ✕ místo procent

### Vizuální podoba buňky po odchodu

```text
┌─────────┐
│    ✕     │  šedé pozadí, červený křížek, kurzor not-allowed
└─────────┘
```

### Dotčené soubory
- `src/types/planning.ts`
- `src/hooks/usePlanningData.ts`
- `src/components/ProjectAssignmentMatrix.tsx`
- `src/components/PlanningEditor.tsx`
- `src/components/UtilizationGrid.tsx`

