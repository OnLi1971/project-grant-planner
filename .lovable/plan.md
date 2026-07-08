# AI Revenue Analyst – plán implementace

## Cíl
Přidat do `RevenueOverview` AI panel, který umožní srovnávat kvartály, analyzovat top projekty a klást vlastní dotazy na základě aktuálních revenue dat.

## Backend – Supabase Edge Function

1. **Název:** `ai-revenue-analyze`
2. **Závislosti:** `ai`, `@ai-sdk/openai-compatible` (npm install)
3. **Setup:** Vytvořit `supabase/functions/_shared/ai-gateway.ts` s `createLovableAiGatewayProvider`
4. **Logika funkce:**
   - Přijme POST `{ data: serializedRevenueData, question: string }`
   - Sestaví prompt: kontext revenue dat (kvartály, projekty, měsíce) + dotaz uživatele
   - Zavolá `generateText` s modelem `google/gemini-3-flash-preview`
   - Vrátí `{ analysis: string }`
5. **CORS:** Použít `corsHeaders` z `@supabase/supabase-js`
6. **Secrets:** `LOVABLE_API_KEY` (zajistit přes `ai_gateway--create` a `ai_gateway--enable`)

## Frontend – AI Panel v RevenueOverview

1. **Umístění:** Nová sekce pod existujícími filtry – skládací panel nebo card.
2. **Komponenta:** `RevenueAIAnalyzer` (nový soubor)
3. **Přednastavená tlačítka:**
   - `Compare Q3 & Q4` – předvyplní dotaz a pošle data za Q3 a Q4
   - `Top Projects Analysis` – analýza top projektů za vybrané období
   - `Revenue Trend` – komentář k trendu revenue
4. **Vlastní dotaz:** Text input s placeholderem „Ask anything about revenue…“
5. **Seriálování dat:** Vybraná data z `RevenueOverview` (quarterly/monthly revenue by project) se zkomprimují do JSON a pošlou do edge function.

## Výstup – text + vizuální graf

1. **Textová část:** AI odpověď se zobrazí jako markdown (pomocí `react-markdown` nebo prostého `<pre>` – podle toho, co je v projektu).
2. **Graf:** Vedle/pod textem se vykreslí **kontextový graf** z existujících dat, ke kterým se AI vyjadřuje.
   - Pokud dotaz srovnává Q3 a Q4 → zobrazí se sloupcový graf Q3 vs Q4 revenue.
   - Pokud dotaz analyzuje top projekty → zobrazí se Pie/Bar chart top projektů.
   - Graf se vybere automaticky podle typu dotazu (frontend má přehled o datech, AI jen komentuje).

## Flow příkladu „Compare Q3 & Q4“

1. Uživatel klikne na tlačítko `Compare Q3 & Q4`.
2. Frontend vezme aktuální quarterly data za Q3 a Q4, serializuje je.
3. Pošle do edge function s dotazem: *"Compare Q3 and Q4 revenue. Identify key differences, growth/decline drivers, and highlight top projects in each quarter."*
4. AI vrátí textovou analýzu.
5. Frontend zobrazí text + pod ním sloupcový graf Q3 vs Q4 revenue (z existujících dat).

## Technické detaily

- **Model:** `google/gemini-3-flash-preview` (default, dostatečný pro analýzu strukturovaných dat)
- **Knihovny:** `ai`, `@ai-sdk/openai-compatible`
- **Stávající kód:** Znovu použijeme `recharts` grafy a filtry z `RevenueOverview.tsx`
- **Supabase Edge Function:** Deploy automatický přes Lovable
- **Auth:** Edge function může být `verify_jwt = false` (data jsou stejná jako na frontendu), JWT ověření není nutné pro čistě analytický endpoint