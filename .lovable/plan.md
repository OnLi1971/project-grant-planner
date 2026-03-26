

## Plan: Čisté řešení — "Hodinová cena" na kartě projektu = `hourly_rate` v DB

### Problém
Formulář v ProjectManagement pro Hodinovka projekty ukládá "Hodinová cena (Kč)" do DB sloupce `budget`. Revenue výpočet čte z `hourly_rate`. Tyto dva sloupce se nikdy nepotkají → projekt vypadne z revenue.

### Změny

**1. `src/components/ProjectManagement.tsx` — formulář**

- Přidat `hourlyRate` do `formData` stavu (nové pole, default 0)
- Rozdělit UI input na řádcích 954-967:
  - Pro **WP**: label "Budget (hodiny)" → `formData.budget`
  - Pro **Hodinovka**: label "Hodinová cena (Kč)" → `formData.hourlyRate`
- Při editaci (řádek 641): načítat `hourlyRate` z `project.hourly_rate`
- Při uložení (insert řádek 452, update řádek 412): zapisovat `hourly_rate: formData.projectType === 'Hodinovka' ? formData.hourlyRate : null`
- Pro WP ponechat `budget` a `average_hourly_rate` beze změny

**2. `src/components/ProjectManagement.tsx` — zobrazení v tabulce (řádky 1106-1130)**

- Pro Hodinovka zobrazovat `hourly_rate` místo `budget`

**3. Datová migrace (SQL insert tool)**

Zkopírovat existující data pro Hodinovka projekty:
```sql
UPDATE projects 
SET hourly_rate = budget 
WHERE project_type = 'Hodinovka' 
  AND hourly_rate IS NULL 
  AND budget IS NOT NULL;
```

**4. Beze změn**: `RevenueOverview.tsx` a `ExecutiveDashboard.tsx` — už správně čtou z `hourly_rate` pro Hodinovka a `average_hourly_rate` pro WP.

### Výsledek
Jedno pole na kartě ("Hodinová cena") → jedno pole v DB (`hourly_rate`) → jedno pole v revenue výpočtu. Žádné fallbacky.

