# Max productive engineering count bez lidí na dovolené

## Jak se to počítá teď
Počítá se každý konstruktér ve filtru, který má v daném měsíci nebo týdnu aspoň jeden pracovní den. Patří sem i lidé na FREE a lidé na dovolené či nemoci. Nepočítají se jen ti, kdo už odešli. Proto je v prosinci 38, i když Leave = 11,9 FTE.

## Změna
- Počet se bude uvádět v FTE: dostupné hodiny po odečtení dovolené / kapacita daného člověka.
- Příklad: 38 lidí, z toho 11,9 FTE na dovolené, dá zhruba 26,1.
- Podle stejné hodnoty se posune i červená čára v grafu.

## Technické detaily
- `projectCapacitySummary`: `maxEngineerCount = Σ max / capacity` místo počtu lidí s kapacitou > 0.
- Zobrazení s jedním desetinným místem.
- Doplnit test: osoba s celotýdenní dovolenou nesníží počet o víc než 1, polovina dovolené sníží o 0,5.
