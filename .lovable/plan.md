
## Plan: Opravit měsíční pohled v plánovací matici, aby čísla odpovídala realitě

### Co je teď špatně
V `ProjectAssignmentMatrix.tsx` jsou v měsíčním pohledu nekonzistentní výpočty:

1. **Počet hodin**
- Teď jen sčítá celé týdenní hodiny do měsíce
- Týdny na hraně měsíců se nerozdělují poměrově
- Proto jsou měsíční součty jiné než v Revenue / dialogu projektu

2. **Celkem FTE**
- V měsíčním pohledu se teď počítá jako `totalHours / 40`
- To je špatně, protože měsíc nemá kapacitu 40h, ale `pracovní dny × 8`
- Proto vycházejí nesmyslně vysoká nebo nízká čísla

3. **Vytížení**
- Tady už je logika lepší, ale běží odděleně od „Počet hodin“
- Výsledkem je, že jednotlivé summary řádky v měsíčním pohledu nejsou počítané ze stejného základu

4. **Rozdělení týdnů do měsíců**
- Měsíce se pořád skládají přes statické `monthWeekMapping`
- To není čisté a může to dělat chyby na přelomu měsíců/roků

### Navržené řešení

#### 1. Sjednotit měsíční alokaci na jednu sdílenou logiku
V `ProjectAssignmentMatrix.tsx` vytvořit jednu společnou měsíční agregaci, která:
- vezme každý týden
- podle skutečného ISO týdne spočítá, kolik pracovních dnů spadá do daného měsíce
- rozdělí hodiny poměrově stejně jako jinde v aplikaci

Použít existující utility z `workingDays.ts` místo ručního/statického mapování.

#### 2. Opravit řádek „Počet hodin“
Místo prostého součtu celých týdnů:
- počítat **poměrné měsíční hodiny**
- stejným způsobem jako v `ProjectAllocationDialog` a Revenue

Tím budou měsíční hodiny konzistentní napříč aplikací.

#### 3. Opravit řádek „Celkem FTE“
V měsíčním pohledu počítat:
- `FTE = měsíční produktivní hodiny / měsíční kapacita`
- kapacita = součet `(pracovní dny v měsíci podle země konstruktéra × 8)`

Tedy:
- ne fixních 40h
- ne fixních 168h bez vazby na vybrané lidi a konkrétní měsíc
- ale skutečná kapacita filtrovanych konstruktérů

#### 4. Opravit řádek „Vytížení“
Nechat business význam stejný, ale přepočet napojit na stejná agregovaná měsíční data jako „Počet hodin“ a „Celkem FTE“, aby:
- hodiny
- FTE
- utilization

vyšly ze stejného základu a neodporovaly si.

#### 5. Odstranit statické měsíční mapování
Nahradit `monthWeekMapping` tam, kde ovlivňuje měsíční výpočty a generování měsíců, dynamickou logikou odvozenou z data týdne.

To je čistější a odolnější i pro další roky.

### Dotčené soubory
- `src/components/ProjectAssignmentMatrix.tsx`
- případně drobné rozšíření `src/utils/workingDays.ts`, pokud bude potřeba pomocná utilita pro month labels / dynamic grouping

### Výsledek
Po opravě bude měsíční pohled:
- počítat hodiny správně
- mít smysluplné FTE
- mít konzistentní vytížení
- odpovídat stejné logice jako Revenue a dialog projektu
- nebýt závislý na křehké statické CW→month tabulce
