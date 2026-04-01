

## Odstranit Správa zdrojů + Správa uživatelů

### Co se odstraní

**1. Správa zdrojů** — kompletně smazat. Je to localStorage-based legacy komponenta s hardcoded daty. Veškerá funkcionalita je pokryta v "Správa konstruktérů" (EngineerManagement), která pracuje se Supabase.

**2. Správa uživatelů** — smazat. Zobrazuje "Nemáte oprávnění" protože RLS na tabulce `profiles` povoluje SELECT jen vlastního profilu nebo admina (ale admin check sám potřebuje SELECT). Navíc role se ukládají přímo na `profiles` tabulku. Pokud bude potřeba v budoucnu, lze reimplementovat správně.

### Změny

**`src/pages/Index.tsx`**:
- Odstranit importy `ResourceManagement` a `UserManagement`
- Odstranit záložky "Správa zdrojů" a "Správa uživatelů" z tab navigace
- Odstranit renderování těchto komponent z podmíněného bloku

**Smazat soubory**:
- `src/components/ResourceManagement.tsx`
- `src/components/UserManagement.tsx`

### Výsledek
Záložky "Správa zdrojů" a "Správa uživatelů" zmizí z navigace. Zůstane: Správa projektů, Správa licencí, Správa konstruktérů, Migrace dat, Správa znalostí.

