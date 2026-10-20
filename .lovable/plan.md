# Červená čára = skutečně dostupní lidé pro vybraný program

## Proč je teď čára rovná
Čára = počet všech aktivních konstruktérů ve filtru (včetně FREE, bez odešlých a celé dovolené). Hibler a Samko se do ní počítají už teď, i když jsou na BUCH (letectví). Proto se v lednu nic nezmění.

## Změna
- Při filtru Program (např. RAIL, MACH) odečíst od čáry lidi obsazené projekty jiných programů (BUCH, SAF, AIRB…), přepočteno na FTE podle hodin.
- Od ledna, kdy Hibler a Samko přejdou na FREE, čára stoupne zhruba o 2.
- Tooltip: Capacity + nový řádek „Blocked by other programs [FTE]".
- Při Custom / All zůstává čára jako dnes.

## Technické detaily
- `projectHoursFilter`: vedle maskovaných dat vrátit i hodiny mimo program na osobu/týden.
- `projectCapacitySummary`: nové pole `otherProgramFte` (hodiny mimo program / kapacita osoby, cap na 1 FTE).
- Graf: `capacity = maxEngineerCount − otherProgramFte`.
- Test: osoba na AERO do prosince, od ledna FREE → kapacita RAIL v lednu +1.
