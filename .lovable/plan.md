
Opravím to jako problém vstupu a validace dat, ne jen jako kosmetiku.

1. Nahradím současné `type="date"` u `Datum udělení`
- V `src/components/EngineerManagement.tsx` už nebudu používat nativní browser date input, protože ten tady zjevně špatně interpretuje ruční psaní roku a ukládá rok `0002`.
- Místo toho použiju řízené pole:
  - textový vstup ve formátu `dd.MM.yyyy`, aby šel rok normálně napsat,
  - vedle toho kalendář přes existující `Calendar + Popover` pattern, který už v projektu je.
- V UI se bude zobrazovat český formát, ale do DB se bude ukládat vždy bezpečný ISO formát `yyyy-MM-dd`.

2. Přidám převod a validaci datumu před uložením
- Před `saveAssignments(...)` zvaliduji každý řádek specializace:
  - datum musí být buď prázdné, nebo validní datum,
  - rok musí být rozumný rozsah (např. 1900–2100),
  - při nevalidním datu se ukládání zablokuje a ukáže se přesná hláška s číslem řádku.
- Tím se zabrání tomu, aby se do DB znovu propsal nesmysl typu `0002-06-19`.

3. Zpevním i datovou vrstvu
- V `src/hooks/useKnowledgeData.ts` doplním normalizaci/guard před insertem do `engineer_specialization`, aby se tam neposlal nevalidní řetězec ani při budoucí změně UI.
- Tím bude ochrana dvojitá: ve formuláři i těsně před zápisem.

4. Opravím už uložená chybná data
- V DB už je aktuálně uložený minimálně jeden chybný záznam s rokem `0002` (`Fuchs Pavel / Hrubá stavba / 0002-06-19`).
- Přidám malou migraci, která:
  - opraví tento konkrétní chybný záznam na správný rok `2017`,
  - a zároveň přidá jednoduchou DB kontrolu, aby se absurdně nízké roky už nemohly uložit.

5. Otestuji tok editace konstruktéra
- Ověřím scénáře:
  - ruční zadání roku 2017,
  - výběr data z kalendáře,
  - uložení bez data,
  - znovuotevření dialogu a správné načtení uloženého datumu.

Dotčené soubory:
- `src/components/EngineerManagement.tsx`
- `src/hooks/useKnowledgeData.ts`
- nová malá migrace v `supabase/migrations/...`

Výsledek:
- rok půjde zadat správně,
- do databáze se bude ukládat správný formát,
- současná chyba `0002` zmizí i u už uloženého záznamu.
