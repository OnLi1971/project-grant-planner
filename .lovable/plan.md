

## Plan: Správa znalostí jako master-data s výběrem

Místo volného textu na kartě konstruktéra vytvoříme **číselníky** (master tabulky) pro Software, PDM/PLM a Specializace. V "Správa znalostí" sekci se budou spravovat tyto seznamy, a na kartě konstruktéra se budou hodnoty vybírat ze Select dropdownu.

### 1. Database — 3 nové tabulky + vazební tabulky

Vytvoříme tři master tabulky:
- `knowledge_software` (id, name, created_at)
- `knowledge_pdm_plm` (id, name, created_at)
- `knowledge_specialization` (id, name, created_at)

A tři vazební (many-to-many) tabulky pro přiřazení ke konstruktérům:
- `engineer_software` (engineer_id, software_id)
- `engineer_pdm_plm` (engineer_id, pdm_plm_id)
- `engineer_specialization` (engineer_id, specialization_id)

RLS: authenticated SELECT, admin/editor INSERT/UPDATE/DELETE.

Stávající textové sloupce `software`, `pdm_plm`, `specialization` na tabulce `engineers` ponecháme (zpětná kompatibilita), ale nebudou se dále používat v UI.

### 2. Nová komponenta — `KnowledgeManagement.tsx`

CRUD rozhraní se třemi záložkami (Software, PDM/PLM, Specializace):
- Tabulka se seznamem položek
- Přidat / Editovat / Smazat položku
- Jednoduchý formulář s polem "Název"

### 3. Index.tsx — nový tab "Správa znalostí"

Přidáme tlačítko `Správa znalostí` do management view (vedle Správa konstruktérů) a renderujeme `KnowledgeManagement`.

Aktualizujeme `managementView` state typ o `'knowledge'`.

### 4. EngineerManagement.tsx — změna textových polí na multi-select

V sekci "Správa znalostí" dialogu nahradíme tři Input pole za Select komponenty, které načítají data z master tabulek. Každé pole umožní výběr více hodnot (multi-select pomocí checkboxů v Popover+Command pattern).

Při uložení konstruktéra se zapíší vazby do vazebních tabulek (upsert pattern — smazat staré, vložit nové).

### 5. Hooks — `useKnowledgeData.ts`

Nový hook pro CRUD operace nad master tabulkami + hook pro načtení přiřazených znalostí ke konstruktérovi.

### Soubory ke změně/vytvoření
- Nová migrace SQL (tabulky + RLS)
- `src/hooks/useKnowledgeData.ts` (nový)
- `src/components/KnowledgeManagement.tsx` (nový)
- `src/components/EngineerManagement.tsx` (změna Input → multi-select)
- `src/pages/Index.tsx` (přidání tabu)

