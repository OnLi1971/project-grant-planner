
## Oprava přetrvávající ztráty focusu v poli Rok

### Co je skutečný problém
Předchozí oprava byla jen částečná:
- `key={row.uid}` je správně
- `test_year_str` jako string je také správně

Ale focus se pořád ztrácí, protože `LanguageEditor` je definovaný uvnitř `EngineerManagement` jako inline komponenta:

```tsx
const LanguageEditor = () => ( ... )
```

a pak se renderuje jako:

```tsx
<LanguageEditor />
```

Při každé změně stavu v `EngineerManagement` React vytvoří novou komponentu typu `LanguageEditor`, tím pádem její subtree remountne a input ztratí focus. Stejný problém platí i pro `KnowledgeFields`, které je také definované uvnitř a renderované jako komponenta.

### Co upravit

**Soubor: `src/components/EngineerManagement.tsx`**

1. Přesunout `LanguageEditor` mimo `EngineerManagement`
   - udělat z něj samostatnou top-level komponentu ve stejném souboru
   - předávat jí props:
     - `languageRows`
     - `setLanguageRows`

2. Nepoužívat uzavření přes parent scope
   - `LANGUAGES` a `LANG_LEVELS` přesunout mimo `EngineerManagement` na top-level
   - všechny handlery nechat běžet přes props/setter

3. Opravit i `KnowledgeFields`
   - buď:
     - převést ho na obyčejný JSX blok bez `<KnowledgeFields />`
     - nebo ho také přesunout mimo `EngineerManagement` a předat mu props
   - nejjednodušší a nejbezpečnější varianta: vložit jeho obsah přímo do create/edit dialogu místo inline komponenty

4. Zachovat dosavadní opravy
   - ponechat `key={row.uid}`
   - ponechat `test_year_str`
   - ponechat sanitaci `replace(/\D/g, '').slice(0, 4)`

### Výsledek
Po této úpravě se při psaní roku nebude řádek remountovat a input už nebude po každé číslici ztrácet focus.

### Dotčené části
- `src/components/EngineerManagement.tsx`
  - přesun `LanguageEditor` na top-level
  - přesun konstant pro jazyky/úrovně na top-level
  - odstranění inline `KnowledgeFields` komponenty nebo její přesun mimo parent
  - zachování stávající logiky `languageRows`

### Technické poznámky
- Problém není v `Input` komponentě
- Problém už primárně není ani v `key`
- Root cause je React remount inline komponent definovaných uvnitř parent render scope
- Pokud bude potřeba, stejný princip je vhodné aplikovat i na další editory v tomto souboru, ale pro opravu roku je kritický hlavně `LanguageEditor`
