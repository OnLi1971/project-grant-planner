

## Přidat specializace do tabulky knowledge_specialization

Z obrázku přidám 12 specializací pod oblast **Kolejová vozidla** (`cd53be8f-a205-45f7-84bb-6a5b9c55b930`).

### Data k vložení

| Číslo | Název |
|-------|-------|
| 1R | Hrubá stavba |
| 2R | Vnější opláštění a zasklení |
| 3R | Stanoviště strojvedoucího / kabina řidiče |
| 4R | Interiér - vybavení |
| 5R | Dveře, vstupy |
| 6R | Větrání, topení, klimatizace |
| 7R | Interiér - výstroj |
| 8R | Montáž elektro komponentů, kabeláž |
| 9R | Montáž vnější výstroje vozidla |
| 10R | Spřahovací zařízení, přechody |
| 11R | Podvozky, pohony |
| 12R | Zpracování dokumentace (katalogy, dokumenty potřebné k certifikaci) |

### Implementace

**Nová migrace** — jeden INSERT do `knowledge_specialization` s 12 řádky, každý s `oblast_id = 'cd53be8f-...'` a `name` ve formátu `"1R - Hrubá stavba"`.

### Dotčené soubory
- `supabase/migrations/` — nová migrace

