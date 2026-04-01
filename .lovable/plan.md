

## Oprava ztráty focusu při psaní roku u jazyků

### Problém
Při psaní roku testování u jazyka se po každé číslici ztratí focus z inputu. Příčina: řádky používají `key={i}` (index) a hodnota se parsuje přes `parseInt` při každém stisku klávesy, což způsobí re-mount komponenty.

### Řešení

**Soubor: `src/components/EngineerManagement.tsx`**

1. Přidat každému řádku jazyku unikátní `uid` (generované při vytvoření řádku přes `crypto.randomUUID()`)
2. Změnit `key={i}` na `key={row.uid}`
3. Změnit `test_year` z `number | null` na `string` pro interní stav — parsovat na číslo až při ukládání
4. Input onChange: `e.target.value.replace(/\D/g, '').slice(0, 4)` místo `parseInt`

Tyto změny zajistí, že se komponenta nebude re-mountovat a focus zůstane v inputu.

