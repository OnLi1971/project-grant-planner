# Rozdělení týdne mezi dva projekty

Ano, technicky to jde. Dnes má každý konstruktér na daný týden jeden projekt a jeden počet hodin. Přidáme možnost rozdělit týden mezi dva projekty (např. 20 MH + 20 MH).

## Jak to bude fungovat

- V editoru plánování půjde u týdne zapnout „rozdělit týden“ a vybrat druhý projekt s jeho hodinami.
- V matici se taková buňka zobrazí jako dva řádky pod sebou, např. `PROJ_A 20` / `PROJ_B 20`, každý ve své barvě podle zákazníka.
- Obsazenost, volná kapacita, Leave i revenue se počítají ze součtu obou částí; hodiny každé části se ocení sazbou svého projektu (včetně historie sazeb a pravděpodobnosti).
- Dovolená/nemoc/FREE/OVER zůstávají nedělitelné (40 h režim).
- Vše stávající zůstává beze změny — týden bez rozdělení se chová jako dnes.

## Postup

1. Databáze: do `planning_entries` přidat volitelná pole pro druhou část týdne (druhý projekt, jeho hodiny, příznak předběžné rezervace). Tím se nezmění žádná stávající data ani unikátní klíč (konstruktér + týden + rok).
2. Načítání dat: doplnit druhou část do modelu týdne v aplikaci.
3. Editor plánování: přepínač rozdělení, druhý výběr projektu a hodin, kontrola součtu hodin proti kapacitě týdne.
4. Matice: vykreslení dvou řádků v buňce, tooltip s detailem, export do Excelu se dvěma projekty.
5. Výpočty: vytížení, volná kapacita, FTE a revenue projít tak, aby procházely obě části týdne.
6. Historie změn: logovat i změny druhé části.

## Technické detaily

- Migrace přidá `projekt_2 text`, `mh_tyden_2 integer default 0`, `is_tentative_2 boolean default false` do `public.planning_entries`; žádné nové tabulky, RLS zůstává.
- Trigger `log_planning_changes` rozšířit o nové sloupce.
- `usePlanningData` a `usePlanningMutations` (`buildUpsertRow`, upsert na `engineer_id,cw,year`) doplnit o druhý slot.
- Zavést sdílený helper `getWeekAssignments(entry)` vracející pole `{ projekt, hodiny, tentative }`, který použijí `ProjectAssignmentMatrix`, `UtilizationGrid`, `FreeCapacityOverview`, `RevenueOverview`, `ExecutiveDashboard`, `ProjectAllocationDialog` a AI analyzátory — aby výpočty nebyly duplicitně upravované na 10 místech.
