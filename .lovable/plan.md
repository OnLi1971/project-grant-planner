

## Plan: Změna defaultního pohledu Revenue na Měsíční 2026

### Změny

**`src/components/RevenueOverview.tsx`**

1. Změnit `defaultViewType` z `'kvartal'` na `'mesic'` (řádek 53)
2. Změnit `selectedMonths` default — pouze měsíce 2026 (řádky 62-66):
   ```
   'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
   'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
   ```
   (odebrat říjen–prosinec 2025)

**`src/pages/ManagerRevenueView.tsx`**

3. Změnit `defaultViewType="kvartal"` na `"mesic"` (řádek 41)

### Dotčené soubory
- `src/components/RevenueOverview.tsx` — default view type + default months
- `src/pages/ManagerRevenueView.tsx` — prop pro default view type

