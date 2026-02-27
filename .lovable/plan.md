
## Plán: Agregace licencí se stejným názvem

### Problém
V databázi existují dvě licence se stejným názvem "SmarTeam Integrace":
- ID `55dd2775...` - 5 licencí, expirace 2026-09-02
- ID `da09847e...` - 15 licencí, expirace 2050-12-31

Systém aktuálně pracuje s každou licencí samostatně, takže limit je pouze 5 (první nalezená), místo celkových **20 licencí**.

### Řešení
Upravit logiku v `LicenseUsageChart.tsx` tak, aby agregovala licence se stejným názvem a sčítala jejich `totalSeats`.

### Technické změny

#### 1. Vytvořit agregované licence v `LicenseUsageChart.tsx`

```tsx
// Nový useMemo pro agregaci licencí se stejným názvem
const aggregatedLicenses = useMemo(() => {
  const licenseMap = new Map<string, {
    name: string;
    totalSeats: number;
    ids: string[];
    expirationDates: string[];
  }>();
  
  licenses.forEach(license => {
    const existing = licenseMap.get(license.name);
    if (existing) {
      // Přičíst licence se stejným názvem
      existing.totalSeats += license.totalSeats;
      existing.ids.push(license.id);
      existing.expirationDates.push(license.expirationDate);
    } else {
      licenseMap.set(license.name, {
        name: license.name,
        totalSeats: license.totalSeats,
        ids: [license.id],
        expirationDates: [license.expirationDate]
      });
    }
  });
  
  return Array.from(licenseMap.values());
}, [licenses]);
```

#### 2. Upravit dropdown pro výběr licence

Změnit z individuálních licencí na agregované:

```tsx
<Select value={selectedLicense} onValueChange={setSelectedLicense}>
  <SelectTrigger>
    <SelectValue placeholder="Vyberte licenci" />
  </SelectTrigger>
  <SelectContent>
    {aggregatedLicenses.map((license) => (
      <SelectItem key={license.name} value={license.name}>
        {license.name} ({license.totalSeats} licencí)
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### 3. Upravit `filteredChartData` pro použití agregovaného limitu

```tsx
const filteredChartData = useMemo(() => {
  if (!selectedLicense) return [];
  
  // Najít agregovanou licenci (součet všech se stejným názvem)
  const aggregatedLicense = aggregatedLicenses.find(l => l.name === selectedLicense);
  const totalAvailable = aggregatedLicense?.totalSeats || 0;
  
  const sourceData = viewMode === 'months' ? monthlyChartData : chartData;
  
  return sourceData.map(weekData => ({
    week: weekData.week,
    usage: weekData[selectedLicense] || 0,
    available: totalAvailable,  // Agregovaný limit
    licenseLimit: totalAvailable
  }));
}, [chartData, monthlyChartData, selectedLicense, aggregatedLicenses, viewMode]);
```

#### 4. Upravit výpočet `overAllocatedWeeks`

```tsx
const overAllocatedWeeks = useMemo(() => {
  const issues: { week: string; license: string; required: number; available: number }[] = [];
  
  chartData.forEach(weekData => {
    aggregatedLicenses.forEach(license => {
      const required = weekData[license.name] || 0;
      const available = license.totalSeats;  // Agregovaný počet
      if (required > available) {
        issues.push({
          week: weekData.week,
          license: license.name,
          required,
          available
        });
      }
    });
  });
  
  return issues;
}, [chartData, aggregatedLicenses]);
```

#### 5. Podobná úprava v `CurrentWeekLicenseUsage.tsx`

Stejná logika agregace pro zobrazení aktuálního týdne.

### Výsledek

| Před | Po |
|------|-----|
| Dropdown: "SmarTeam Integrace" (2x duplicitně) | Dropdown: "SmarTeam Integrace (20 licencí)" |
| Limit na grafu: 5 | Limit na grafu: 20 |
| Červené sloupce (přetížení) | Zelené sloupce (v limitu) |

### Poznámka k expiraci
Agregace sečte licence bez ohledu na expiraci. Pokud potřebuješ v budoucnu zohlednit expiraci (např. po 2026-09-02 bude jen 15 licencí), můžeme přidat logiku, která bude počítat dostupné licence podle data v daném týdnu.
