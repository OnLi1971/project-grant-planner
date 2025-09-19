# Diagnostické požadavky pro CW31-2026 problém

## Problém
Po CW30-2026 vše padá na FREE místo zobrazení aktualizovaných projektů. CW30-2026 funguje, CW31-2026 a vyšší ne.

---

## 1) Datová vrstva (DB)

### A1. Srovnávací dump řádků z planning_entries
**Porovnat Friedlová (funguje) vs Fuchs (padá) pro týdny CW30-2026 a CW31-2026:**

```sql
SELECT 
    konstrukter,
    cw,
    year, 
    projekt,
    mh_tyden,
    updated_at,
    id
FROM planning_entries 
WHERE konstrukter IN ('Friedlová Michaela', 'Fuchs Pavel')
    AND ((cw = 'CW30' AND year = 2026) OR (cw = 'CW31' AND year = 2026))
ORDER BY konstrukter, cw;
```

### A2. EXPLAIN ANALYZE na planning_matrix view
**Pro konkrétní řádky:**

```sql
EXPLAIN ANALYZE 
SELECT * FROM planning_matrix 
WHERE konstrukter = 'Fuchs Pavel' 
    AND cw_full = 'CW31-2026';

EXPLAIN ANALYZE 
SELECT * FROM planning_matrix 
WHERE konstrukter = 'Friedlová Michaela' 
    AND cw_full = 'CW31-2026';
```

### A3. Duplicity & unikátnost
**Ověření, že neexistují duplicity:**

```sql
-- Kontrola duplicit pro Fuchs Pavel
SELECT konstrukter, cw, year, COUNT(*) 
FROM planning_entries 
WHERE konstrukter = 'Fuchs Pavel' 
    AND year IN (2025, 2026)
GROUP BY konstrukter, cw, year 
HAVING COUNT(*) > 1;

-- Kontrola duplicit pro Friedlová Michaela  
SELECT konstrukter, cw, year, COUNT(*) 
FROM planning_entries 
WHERE konstrukter = 'Friedlová Michaela' 
    AND year IN (2025, 2026)
GROUP BY konstrukter, cw, year 
HAVING COUNT(*) > 1;
```

---

## 2) View planning_matrix

### B1. SQL definice view
**Úplné znění view planning_matrix:**

```sql
\d+ planning_matrix
-- nebo
SELECT pg_get_viewdef('planning_matrix');
```

### B2. Agregace "FREE vs projekt"
**Jak view rozhoduje při více řádcích v týdnu? Doložit deterministické preferování ne-FREE projektů.**

Očekáváme ORDER BY nebo DISTINCT ON s preferencí ne-FREE projektů.

---

## 3) API/Network (po uložení)

### C1. Timeline dvou odpovědí po sobě
**Pro akci Fuchs CW31-2026 → ST_KASSEL:**

1. **Request A** (immediate after update):
   - Čas: `__:__:__`
   - Response hash/počet řádků: `___`
   
2. **Request B** (delayed/realtime):
   - Čas: `__:__:__` 
   - Response hash/počet řádků: `___`

**Který z nich UI aplikovalo?**

### C2. Důkaz přítomnosti v poslední odpovědi
**V poslední network response po refetchu musí být:**

```json
{
  "konstrukter": "Fuchs Pavel",
  "cw_full": "CW31-2026", 
  "projekt": "ST_KASSEL",
  // ...
}
```

---

## 4) Frontend (mapování a závody)

### D1. Ochrana proti "stale response"
**Implementovat requestId/AbortController:**

```typescript
const requestId = Date.now();
console.log(`Aplikuji response ${requestId}`);
// Při starší odpovědi:
console.log(`Ignoruji response ${oldId} < latest ${latestId}`);
```

**Log ze reprodukce, že starší odpověď není aplikována.**

### D2. Klíčování a osa týdnů
**Mapování výhradně přes (konstrukter, cw_full), ne přes index:**

```typescript
// Log hlavičky matice
console.log('Počet sloupců:', allWeeks.length);
console.log('První týden:', allWeeks[0]); 
console.log('Poslední týden:', allWeeks[allWeeks.length-1]);
console.log('Obsahuje CW31-2026:', allWeeks.includes('CW31-2026'));
console.log('Obsahuje CW32-2026:', allWeeks.includes('CW32-2026'));
```

### D3. Jediná revalidace
**Po UPDATE jen jeden refetch (realtime NEBO manuální), ne oba současně.**

---

## 5) Realtime

### E1. Subscription pouze na planning_entries
**Ne na view planning_matrix:**

```typescript
const subscription = supabase
  .channel('planning_entries_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'planning_entries' },
    handleChange
  )
  .subscribe();
```

### E2. Debounce 150-250ms
**Místo pevného 500ms sleep:**

```typescript
const debouncedReload = useCallback(
  debounce(() => loadPlanningData(), 200),
  []
);
```

**Žádné paralelní fetchy pro stejný klíč.**

---

## 6) Izolační testy (A/B porovnání)

### F1. Test bez Realtime
**Dočasně vypnout subscription, spustit sekvenční UPDATE → refetch:**

```typescript
// Vypnout realtime
// Udělat UPDATE
// Manuální refetch
// Zkontrolovat, zda funguje
```

**Pokud funguje → závod v UI.**

### F2. RPC cesta
**UPDATE přes RPC, které okamžitě vrátí finální řádek:**

```sql
CREATE OR REPLACE FUNCTION update_planning_entry_rpc(
  p_konstrukter text,
  p_cw text, 
  p_year integer,
  p_projekt text
) RETURNS TABLE (
  konstrukter text,
  cw_full text,
  projekt text,
  mh_tyden integer,
  mesic text
) AS $$
BEGIN
  UPDATE planning_entries 
  SET projekt = p_projekt
  WHERE konstrukter = p_konstrukter 
    AND cw = p_cw 
    AND year = p_year;
    
  RETURN QUERY
  SELECT pm.konstrukter, pm.cw_full, pm.projekt, pm.mh_tyden, pm.mesic
  FROM planning_matrix pm
  WHERE pm.konstrukter = p_konstrukter 
    AND pm.cw_full = p_cw || '-' || p_year;
END;
$$ LANGUAGE plpgsql;
```

**UI použije návratovou hodnotu k patch buňky; refetch jen jako potvrzení.**

---

## Proč tyto artefakty?

- **EXPLAIN + dumpy** ukážou, že DB/view je stabilní a nevytváří FREE "z ničeho"
- **Timeline requestů + requestId guard** rozhodne, jestli UI nepřepisuje nové starým  
- **A/B bez Realtime** izoluje, jestli je chyba jen v závodě
- **RPC návrat řádku** odstraňuje timing problém úplně (UI má "pravdu" hned)

---

## Krátká věta pro tým

**Potřebujeme prokazatelně vyloučit závod fetchů a nedeterministické chování view. Dodejte prosím (A1–A3, B1–B2, C1–C2, D1–D3, E1–E2) a proveďte izolační testy (F1–F2). Bez toho je 500ms delay jen náplast a bug se bude vracet při rozšíření na 2027.**