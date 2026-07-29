## Cíl

Tlačítko **Import dovolených (XLS)** v editoru plánování, které načte firemní evidenci dovolených a aktualizuje plán vybraných týdnů.

## Formát vstupu

Podle nahraného souboru:
- Řádky = konstruktéři ve tvaru `Příjmení Jméno (handle)`
- Sloupce = týdny; hlavička obsahuje číslo týdne (28., 29., …) a datum pondělí (6.7., 13.7., …), nad tím měsíc
- Buňka = 5 znaků za Po–Pá, např. `SDDDD`, `S————`, `DD—DD`, `———D—`
- Legenda: `D` řádná dovolená, `O` osobní volno, `N`/`NN` náhradní volno, `S` svátek, `—` běžný pracovní den

## Pravidla převodu (dle domluvy)

Počítají se jen kódy **D** a **O**. `N`, `NN` se ignorují. `S` (svátek) se ignoruje — svátky už řeší kalendář CZ/SK.

Pro každý pár konstruktér × týden:
- **5 dní volna** → týden se nastaví na `DOVOLENÁ`, 40 MH/týden (stávající pravidlo režimových aktivit)
- **1–4 dny volna** → projekt zůstane beze změny, sníží se hodiny: `MH = round(7,2 × (5 − dny volna))`, tedy 4 dny→7 h, 3 dny→14 h, 2 dny→22 h, 1 den→29 h
- **0 dní volna** → žádná změna (import nikdy nepřepisuje týden zpět na plnou kapacitu, aby nepřemazal ruční úpravy)

Pokud má konstruktér v daném týdnu už `NEMOC`/`FREE`/`OVER`, řádek se v náhledu označí jako konflikt a ve výchozím stavu se **neimportuje** (lze zaškrtnout).

## Průběh

1. Uživatel klikne na Import dovolených v editoru plánování
2. Vybere `.xlsx`/`.xls`
3. Zobrazí se dialog s náhledem: konstruktér | CW | dny volna | akce (DOVOLENÁ 40 h / hodiny 36→22) | stav (OK, konflikt, nenalezený konstruktér)
   - nahoře souhrn: X změn, Y konfliktů, Z nespárovaných jmen
   - řádky lze odškrtnout
4. Potvrzení uloží změny přes stávající `updatePlanningEntry` / `updatePlanningHours` (zůstane tak i historie změn v `planning_changes`)

## Technické detaily

- Nový soubor `src/components/VacationImport.tsx` (vzor: stávající `TrainingImport.tsx`, knihovna `xlsx` už je v projektu)
- Parsování: hlavička – najít řádek s čísly týdnů a řádek s datem pondělí; z data pondělí + roku odvodit `CW{nn}-{yyyy}` přes existující ISO logiku (`getISOWeekMonday`), aby seděl přechod roku
- Párování konstruktérů: primárně `handle` ze závorky proti `engineers.handle`, fallback normalizované jméno (`normalizeName`) proti `display_name`; nespárovaní se jen vypíšou, neimportují
- Import se omezí na týdny, které v plánu existují; neexistující se přeskočí s hláškou
- Žádné změny v databázi (nová tabulka není potřeba), zapisuje se do `planning_entries`
- Zapojení do `src/components/PlanningEditor.tsx` vedle stávajících akčních tlačítek
