

## Plán: Oprava statistik - odstranění limitu 500 záznamů

### Problém

Funkce `loadChanges()` na řádku 71 má `.limit(500)`, což znamená, že se načte maximálně 500 záznamů. Statistiky se počítají z tohoto omezeného datasetu. Za 3 měsíce je pravděpodobně mnohem víc než 500 změn, takže statistiky ukazují neúplná data (např. jen 10 alokací místo skutečného počtu).

### Řešení

Oddělit načítání dat pro statistiky od historie změn:

1. **Přidat samostatnou funkci `loadStatsChanges()`** která:
   - Načítá data **bez limitu** (s paginací po 1000 záznamech, podobně jako v `usePlanningData`)
   - Filtruje pouze podle data statistického období (ne podle filtrů historie)
   - Načítá pouze `change_type`, `old_value`, `new_value`, `konstrukter`, `changed_at` (bez joinu na profiles)

2. **Přidat nový state `statsChanges`** pro data statistik, oddělený od `changes` (historie)

3. **Upravit `statistics` useMemo** aby používal `statsChanges` místo `changes`

4. **Spouštět `loadStatsChanges()`** při otevření dialogu a při změně `statsTimeRange` / `statsCustomDateFrom` / `statsCustomDateTo` — rovnou s date filtrem v query, aby se tahal jen relevantní rozsah

### Technické detaily

**Nová funkce `loadStatsChanges`:**
- Query s `.gte('changed_at', startDate)` a `.lte('changed_at', endDate)` přímo v SQL
- Paginace: smyčka po 1000 záznamech dokud nejsou všechna data
- Bez `.limit()` omezení na celkový počet
- Filtruje pouze `change_type in ('project', 'tentative')`

**Historie (`loadChanges`) zůstane s limitem 500** — pro zobrazení posledních změn to stačí.

### Soubor
- `src/components/PlanningHistoryDialog.tsx`

