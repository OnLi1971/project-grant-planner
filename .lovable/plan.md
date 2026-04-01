

## Přidat specializace pro Obecné strojírenství

Nová migrace vloží 13 specializací pod oblast **Obecné strojírenství** (`51cb06e9-9a08-4291-8441-e3fb6f818f08`).

### Data k vložení

| Číslo | Název | sort_order |
|-------|-------|------------|
| 1M | Svařované konstrukce | 1 |
| 2M | Kinematické mechanismy, zdvihací zařízení, převody a pohony | 2 |
| 3M | Mechatronika | 3 |
| 4M | Nástroje a přípravky | 4 |
| 5M | Automatizované výrobní a dopravní linky | 5 |
| 6M | Technologie a podpora výroby | 6 |
| 7M | Konstrukce a renovace turbín a turbínových těles | 7 |
| 8M | Odlitky turbínových těles | 8 |
| 9M | Svařence turbínových těles a příslušenství | 9 |
| 10M | Turbínové lopatky a průtočná část | 10 |
| 11M | Turbínové ventily | 11 |
| 12M | Turbínové rotory | 12 |
| 13M | Servis parních turbín | 13 |

### Implementace

Jedna migrace — INSERT 13 řádků do `knowledge_specialization` s `oblast_id = '51cb06e9-...'`, `name` ve formátu `"1M - Svařované konstrukce"` a `sort_order` 1–13.

### Dotčené soubory
- `supabase/migrations/` — nová migrace

