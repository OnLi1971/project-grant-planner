

## Plan: Oprava logiky hodinové sazby pro revenue

Problém: Pro projekty typu "Hodinovka" se v revenue výpočtu používá `average_hourly_rate` nebo `budget`, ale správně se má brát pole `hourly_rate` (= "Hodinová cena" na kartě projektu). Pro "WP" projekty zůstává `average_hourly_rate` ("Průměrná hodinová cena").

### Změny v `src/components/RevenueOverview.tsx`

1. Přidat `hourly_rate` do `DatabaseProject` interface a do Supabase select query
2. Upravit logiku určení sazby:
   - **WP**: `average_hourly_rate` (beze změny)
   - **Hodinovka**: `hourly_rate` (nově), bez fallbacku na budget/default
3. Aktualizovat stejnou logiku i v pre-sales sekci
4. Uprav