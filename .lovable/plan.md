

## Plan: Oprava dat ST_EMU_INT v databázi

### Problém
Uživatel změnil hodinovou cenu z 1200 na 1100, ale změna šla do sloupce `budget` (starý kód), zatímco revenue čte z `hourly_rate` (stále 1200).

Kód formuláře je nyní správný (ukládá do `hourly_rate` pro Hodinovka). Problém je pouze v datech.

### Řešení

**1. SQL migrace** — opravit aktuální stav dat:
```sql
UPDATE projects 
SET hourly_rate = 1100 
WHERE code = 'ST_EMU_INT';
```

**2. Bezpečnostní sync** — pro všechny Hodinovka projekty, kde uživatel mohl mezitím změnit `budget`:
```sql
UPDATE projects 
SET hourly_rate = budget 
WHERE project_type = 'Hodinovka' 
  AND budget IS NOT NULL 
  AND hourly_rate IS NOT NULL 
  AND budget <> hourly_rate;
```

### Dotčené soubory
- Nová SQL migrace (jeden