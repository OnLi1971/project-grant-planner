## Rozložení budgetu do měsíců se zachováním součtu

### Co přibude ve formuláři projektu (sekce Plán hodin)
1. **Výběr profilu rozdělení** vedle tlačítka „Rozdělit budget":
   - Rovnoměrně (dnešní chování)
   - Pomalý rozjezd: nejdřív méně hodin, později víc
   - S-křivka: pomalý start, vrchol uprostřed, doběh na konci
   - Útlum na konci: plný start, postupně méně
2. **Ruční úprava měsíce + zámek**: když přepíšeš hodiny v jednom měsíci, rozdíl se rozpočítá do ostatních nezamčených měsíců podle jejich poměru, takže součet = budget. Ikonou zámku si měsíc zafixuješ.
3. **Kontrola součtu**: pod tabulkou se ukáže „Součet / Budget", při rozdílu červeně, s tlačítkem „Dorovnat".
4. Malý sloupcový náhled průběhu hodin po měsících.

### Technicky
- Nová čistá utilita `src/utils/budgetDistribution.ts`: `distribute(budget, months, profile)` (váhy profilu → zaokrouhlení na celé hodiny metodou největšího zbytku, součet přesně = budget) a `rebalance(plan, editedMonth, newValue, locked, budget)`.
- Testy: každý profil dává přesný součet; pomalý rozjezd má první měsíc < poslední; rebalance drží součet a nemění zamčené měsíce.
- Úprava UI v `ProjectManagement.tsx`; ukládání do `project_monthly_plan` beze změny (zámek se neukládá).
