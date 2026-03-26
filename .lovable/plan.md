

## Plan: Revenue se neaktualizuje po změně hodinové ceny projektu

### Problém
`RevenueOverview` a `ExecutiveDashboard` načtou data z tabulky `projects` pouze jednou při prvním renderování (`useEffect([], ...)`). Když uživatel změní hodinovou cenu v kartě projektu, revenue přehled stále pracuje se starými daty.

### Řešení
Přidat mechanismus pro znovunačtení dat po změně — buď automaticky, nebo manuálně.

### Změny

**1. `src/components/RevenueOverview.tsx`**
- Přidat tlačítko "Obnovit data" (refresh) vedle filtrů, které zavolá `loadData()` znovu
- Alternativně: přidat `projects` do Supabase realtime subscription — ale refresh tlačítko je jednodušší a spolehlivější

**2. `src/components/ExecutiveDashboard.tsx`**
- Stejná změna — přidat refresh tlačítko

### Technický detail
- Přidám `RefreshCw` ikonu z lucide-react vedle existujících filtrů
- Klik zavolá existující `loadData()` funkci
- Během načítání se ikona bude animovat (spin)

Dotčené soubory:
- `src/components/RevenueOverview.tsx`
- `src/components/ExecutiveDashboard.tsx`

