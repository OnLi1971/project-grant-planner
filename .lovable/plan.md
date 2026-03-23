

## Plán: Oprava thresholdu částečné volné kapacity na 30h

### Problém
Aktuální kód v `ProjectAssignmentMatrix.tsx` (řádky 661 a 679) používá `< 40` jako threshold. Uživatel chce `< 30` — zobrazit jako částečně volné jen ty, kteří mají méně než 30h/týden na projektu.

### Změna

**`src/components/ProjectAssignmentMatrix.tsx`** — 2 místa:
- Řádek 661: změnit `projectData.hours < 40` → `projectData.hours < 30`
- Řádek 679: změnit `projectData.hours < 40` → `projectData.hours < 30`
- Oba řádky: výpočet volných hodin zůstává `40 - projectData.hours`

**`src/components/ProjectAllocationDialog.tsx`** — legenda:
- Aktualizovat text legendy u žluté barvy na "Částečná volná kapacita (< 30h/týden)"

