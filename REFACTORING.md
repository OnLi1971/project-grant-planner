# Engineer Loading Refactoring

## Problém
Aplikace měla dva nezávislé systémy pro načítání inženýrů:
1. `useEngineers.ts` - vlastní fetch s useEffect
2. `usePlanningData.ts` - další samostatný fetch

To způsobovalo race conditions, kdy contractors mizeli po F5 kvůli:
- Duplicitnímu načítání dat
- Nestabilnímu query key
- Přepisování stavu při paralelních fetchích

## Řešení
Implementace **jediného zdroje pravdy** pomocí React Query.

### Vytvořené/změněné soubory:

#### 1. `src/constants/statuses.ts` (NOVÝ)
```typescript
export const ACTIVE_ENGINEER_STATUSES = ['active', 'contractor'] as const;
export type EngineerStatus = typeof ACTIVE_ENGINEER_STATUSES[number];
```
- Centralizovaná definice aktivních statusů
- Používá se všude v aplikaci
- Zajišťuje konzistentní filtraci

#### 2. `src/services/engineersApi.ts` (NOVÝ)
```typescript
export type DatabaseEngineer = { ... };
export async function fetchEngineers(statuses: readonly EngineerStatus[]): Promise<DatabaseEngineer[]>
```
- Jediné API pro načítání inženýrů
- Čistá separace concerns
- Exportuje DatabaseEngineer type

#### 3. `src/hooks/useEngineers.ts` (PŘEPSÁN)
**Před:**
- useState + useEffect
- Duplikovaný fetch
- Žádná cache

**Po:**
- React Query s `useQuery`
- Query key: `['engineers', 'active,contractor']` (stabilní)
- Konfigurace: `staleTime: 60s`, `gcTime: 5min`, `refetchOnWindowFocus: false`
- Automatická deduplikace
- `invalidateQueries` po create/update

#### 4. `src/hooks/usePlanningData.ts` (UPRAVENO)
**Před:**
```typescript
const [engineers, setEngineers] = useState<EngineerInfo[]>([]);
const loadEngineers = async () => { /* vlastní fetch */ }
```

**Po:**
```typescript
const { engineers: uiEngineers = [] } = useEngineers();
const engineers: EngineerInfo[] = useMemo(() => 
  uiEngineers.map(e => ({ id: e.id, display_name: e.jmeno, ... }))
, [uiEngineers]);

const loadEngineers = useCallback(async () => engineers, [engineers]); // no-op pro kompatibilitu
```
- Konzumuje data z React Query cache
- Žádný vlastní fetch
- `loadEngineers` je no-op wrapper

#### 5. `src/contexts/PlanningContext.tsx` (UPRAVENO)
- Odstraněn samostatný `useEffect` pro načítání inženýrů
- Data přicházejí automaticky z React Query cache
- Zachována normalizace jmen pro diacritiku

### Výhody řešení:

✅ **Jediný fetch** - pouze jeden HTTP request pro inženýry  
✅ **Stabilní cache** - contractors zůstávají viditelní po F5  
✅ **Žádné race conditions** - React Query deduplikuje paralelní requesty  
✅ **Centralizované filtry** - `ACTIVE_ENGINEER_STATUSES` všude  
✅ **Automatická invalidace** - po create/update se cache aktualizuje  
✅ **Backwards compatible** - existující kód funguje beze změn  

### Co se nezměnilo (zachována funkcionalita):

- PlanningEditor, PlanningTable - fungují stejně
- EngineerManagement - používá useEngineers
- Všechny update/create operace
- Realtime subscriptions
- Race condition protection v usePlanningData

### Kontrolní seznam:

- [x] Vytvořit constants/statuses.ts
- [x] Vytvořit services/engineersApi.ts  
- [x] Přepsat useEngineers.ts na React Query
- [x] Upravit usePlanningData.ts (konzumuje cache)
- [x] Odstranit duplikovaný fetch z PlanningContext
- [x] Export DatabaseEngineer ze správného místa
- [x] Zachovat backwards compatibility
- [x] Žádný dead code

### Test:
1. Otevři aplikaci → vidíš contractors i active inženýry
2. Přiřaď contractora na projekt → změna se projeví okamžitě
3. F5 → contractor zůstává na projektu (ne FREE)
4. Network tab → jen 1 request na engineers
