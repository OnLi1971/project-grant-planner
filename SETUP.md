# Grant Planer - Supabase Setup Instructions

## 🚀 Kompletní průvodce nasazením

### 1. Supabase Setup

1. **Přihlaste se do Supabase**: https://supabase.com
2. **Vytvořte nový projekt** nebo použijte existující
3. **Spusťte SQL script** v Supabase SQL editoru:
   - Otevřete `database/schema.sql`
   - Zkopírujte celý obsah
   - Vložte do SQL editoru v Supabase
   - Spusťte script

### 2. Environment Variables

Vaše Supabase credentials najdete v: **Project Settings > API**

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Nastavení prvního admin uživatele

1. **Registrujte se** v aplikaci pomocí formuláře
2. **Najděte svoje User ID** v Supabase Auth > Users
3. **Spusťte SQL příkaz** v Supabase SQL editoru:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'YOUR_USER_ID_HERE';
```

### 4. Testování systému

Po dokončení setup můžete:
- ✅ Přihlásit se / registrovat nové uživatele
- ✅ Editovat plánování (pouze admin/editor)
- ✅ Zobrazit všechny výstupy
- ✅ Synchronizace v reálném čase mezi zařízeními

## 🔐 Systém oprávnění

### Admin
- Může vše: editovat, mazat, přidávat uživatele
- Může měnit role ostatních uživatelů

### Editor  
- Může editovat plánování
- Může přidávat nové konstruktéry
- Nemůže mazat data

### Viewer
- Pouze čtení
- Zobrazení všech výstupů a analýz

## 📊 Funkcionality

### Real-time Synchronizace
- Automatické aktualizace při změnách
- Spolupráce více uživatelů současně
- Bez konfliktů při editaci

### Cloud Storage
- Data uložena v Supabase PostgreSQL
- Automatické zálohy
- Přístup z jakéhokoli zařízení

### Bezpečnost
- Row Level Security (RLS)
- JWT autentifikace
- Šifrované spojení

## 🛠️ Údržba

### Zálohování
Supabase automaticky zálohuje data. Pro manuální zálohu:
1. Database > Backups v Supabase dashboard
2. Stáhněte backup dle potřeby

### Monitoring
- Sledujte použití v Supabase dashboard
- Nastavte alerty pro limity

### Aktualizace
- Aplikace se automaticky aktualizuje při změnách kódu
- Pro schema změny použijte migrations v Supabase

## 📈 Možná rozšíření

### Budoucí funkcionality
- Export do Excel/PDF
- Email notifikace při změnách
- Integrace s kalendáři
- API pro externí systémy
- Mobile aplikace

### Customizace
- Upravte `src/data/` soubory pro vlastní projekty
- Přidejte nové role v databázi
- Rozšiřte UI komponenty dle potřeby