

## Detailní profil konstruktéra — nová stránka

### Co se vytvoří

Nová stránka `/engineer/:id` zobrazující kompletní profil konstruktéra s těmito sekcemi:

**Hlavička**
- Jméno, avatar (iniciály), status badge, firma, lokace, hodinová sazba

**Sekce v kartách:**

1. **Základní údaje** — firma, lokace, sazba, měna, datum nástupu/odchodu, status
2. **Software** — seznam přiřazeného SW (z `engineer_software` + `knowledge_software`)
3. **PDM/PLM** — seznam přiřazených systémů (z `engineer_pdm_plm` + `knowledge_pdm_plm`)
4. **Specializace** — tabulka: Oblast, Specializace, Úroveň (A-F), Datum udělení (z `engineer_specialization` + `knowledge_specialization` + `knowledge_oblast`)
5. **Trénink/Školení** — tabulka: Název, Od, Do, Firma/Školitel, Zkouška, Poznámka (z `engineer_training`)
6. **Aktuální plánování** — přehled aktuálních projektových přiřazení z `planning_entries`

### Implementace

**Nové soubory:**
- `src/pages/EngineerProfile.tsx` — hlavní stránka profilu
- `src/hooks/useEngineerProfile.ts` — hook stahující všechna data pro jednoho konstruktéra (engineer + software + PDM/PLM + specializace + tréninky + plánování)

**Upravené soubory:**
- `src/App.tsx` — přidat route `/engineer/:id`
- `src/components/EngineerManagement.tsx` — přidat odkaz/tlačítko na profil u každého konstruktéra v tabulce

### Technický detail

Hook `useEngineerProfile` provede paralelní dotazy:
```
1. engineers.select('*').eq('id', id)
2. engineer_software.select('software_id, knowledge_software(name)').eq('engineer_id', id)
3. engineer_pdm_plm.select('pdm_plm_id, knowledge_pdm_plm(name)').eq('engineer_id', id)
4. engineer_specialization.select('*, knowledge_specialization(name), knowledge_oblast(name)').eq('engineer_id', id)
5. engineer_training.select('*').eq('engineer_id', id)
6. planning_entries.select('*').eq('engineer_id', id).gte('year', currentYear)
```

Stránka bude responsivní — na mobilu (360px) sekce pod sebou, na desktopu grid layout. Tlačítko "Zpět" pro návrat do Engineer Management.

