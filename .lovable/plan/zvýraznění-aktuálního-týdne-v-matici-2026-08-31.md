# Zvýraznění aktuálního týdne v matici

## Cíl
Graficky zvýraznit sloupec aktuálního týdne v Project Planning Matrix — **podbarvením celého sloupce**.

## Implementace

### `src/components/ProjectAssignmentMatrix.tsx`
1. Získat aktuální týden/rok pomocí existující funkce `getCurrentWeekAndYear()` (už v souboru je, ř. 91).
2. Pomocná funkce `isCurrentWeek(weekKey)` — porovná `CWXX-YYYY` klíč s aktuálním týdnem.
3. **Hlavička sloupce** (CW label + datum): přidat podkladovou třídu, pokud je to aktuální týden.
4. **Všechny buňky sloupce** (řádky konstruktérů i souhrnné řádky dole): stejný jemný podklad.
5. Barva: sémantický token `bg-accent/50` (v dark módu čitelný, funguje i v light), popř. `bg-planning-stripe`. Bez hardcoded barev — zachováno téma.
6. Funguje v týdenním i měsíčním pohledu: v měsíčním pohledu se podbarví sloupec měsíce, do kterého aktuální týden spadá.

## Ověření
- Preview: aktuální CW (CW36-2026) je podbarvený napříč řádky včetně souhrnných řádků (Free capacity, FTE, Leave…).
- Kontrola dark i light režimu.
