-- Delete existing planning entries with generic names and insert real engineer names from actual data
DELETE FROM public.planning_entries WHERE konstrukter IN (
  'Pospíšil Jaroslav', 'Novák Tomáš', 'Svoboda Jan', 'Dvořák Pavel', 'Procházka Martin',
  'Krejčí David', 'Horák Petr', 'Veselý Michal', 'Černý Filip', 'Mareš Lukáš', 
  'Fiala Jakub', 'Pokorný Ondřej', 'Sedlák Roman', 'Doležal Vojtěch', 'Navrátil Adam',
  'Kratochvíl Daniel', 'Beneš Stanislav', 'Růžička Matěj', 'Urban Richard', 'Blažek Jiří', 'Konečný Václav'
);

-- Insert real engineer names from additionalEngineersData.ts
INSERT INTO public.planning_entries (konstrukter, cw, mesic, mh_tyden, projekt) VALUES
-- Matta Jozef
('Matta Jozef', 'CW32', 'August', 36, 'ST_POZAR'),
('Matta Jozef', 'CW33', 'August', 36, 'ST_POZAR'),
('Matta Jozef', 'CW34', 'August', 36, 'ST_POZAR'),
('Matta Jozef', 'CW35', 'August', 36, 'ST_POZAR'),

-- Pecinovský Pavel  
('Pecinovský Pavel', 'CW32', 'August', 36, 'ST_KASSEL'),
('Pecinovský Pavel', 'CW33', 'August', 36, 'ST_KASSEL'),
('Pecinovský Pavel', 'CW34', 'August', 36, 'ST_KASSEL'),
('Pecinovský Pavel', 'CW35', 'August', 36, 'ST_KASSEL'),

-- Anovčín Branislav
('Anovčín Branislav', 'CW32', 'August', 36, 'WA_HVAC'),
('Anovčín Branislav', 'CW33', 'August', 36, 'WA_HVAC'),
('Anovčín Branislav', 'CW34', 'August', 36, 'WA_HVAC'),
('Anovčín Branislav', 'CW35', 'August', 36, 'WA_HVAC'),

-- Břicháček Miloš
('Břicháček Miloš', 'CW32', 'August', 36, 'ST_BLAVA'),
('Břicháček Miloš', 'CW33', 'August', 36, 'ST_BLAVA'),
('Břicháček Miloš', 'CW34', 'August', 36, 'ST_BLAVA'),
('Břicháček Miloš', 'CW35', 'August', 36, 'ST_BLAVA'),

-- Fenyk Pavel
('Fenyk Pavel', 'CW32', 'August', 36, 'NU_CRAIN'),
('Fenyk Pavel', 'CW33', 'August', 36, 'NU_CRAIN'),
('Fenyk Pavel', 'CW34', 'August', 36, 'NU_CRAIN'),
('Fenyk Pavel', 'CW35', 'August', 36, 'NU_CRAIN'),

-- Kalafa Ján
('Kalafa Ján', 'CW32', 'August', 36, 'ST_MAINZ'),
('Kalafa Ján', 'CW33', 'August', 36, 'ST_MAINZ'),
('Kalafa Ján', 'CW34', 'August', 36, 'ST_MAINZ'),
('Kalafa Ján', 'CW35', 'August', 36, 'ST_MAINZ'),

-- Lengyel Martin
('Lengyel Martin', 'CW32', 'August', 36, 'ST_KASSEL'),
('Lengyel Martin', 'CW33', 'August', 36, 'ST_KASSEL'),
('Lengyel Martin', 'CW34', 'August', 36, 'ST_KASSEL'),
('Lengyel Martin', 'CW35', 'August', 36, 'ST_KASSEL'),

-- Additional engineers from finalEngineersData.ts
-- Brojír Jaroslav
('Brojír Jaroslav', 'CW32', 'August', 36, 'SAF_INT'),
('Brojír Jaroslav', 'CW33', 'August', 36, 'SAF_INT'),
('Brojír Jaroslav', 'CW34', 'August', 36, 'SAF_INT'),
('Brojír Jaroslav', 'CW35', 'August', 36, 'SAF_INT'),

-- Samko Mikuláš
('Samko Mikuláš', 'CW32', 'August', 36, 'BUCH_INT'),
('Samko Mikuláš', 'CW33', 'August', 36, 'BUCH_INT'),
('Samko Mikuláš', 'CW34', 'August', 36, 'BUCH_INT'),
('Samko Mikuláš', 'CW35', 'August', 36, 'BUCH_INT'),

-- Chrenko Daniel
('Chrenko Daniel', 'CW32', 'August', 36, 'AIRB_INT'),
('Chrenko Daniel', 'CW33', 'August', 36, 'AIRB_INT'),
('Chrenko Daniel', 'CW34', 'August', 36, 'AIRB_INT'),
('Chrenko Daniel', 'CW35', 'August', 36, 'AIRB_INT'),

-- Jiřička Aleš
('Jiřička Aleš', 'CW32', 'August', 36, 'ST_EMU_INT'),
('Jiřička Aleš', 'CW33', 'August', 36, 'ST_EMU_INT'),
('Jiřička Aleš', 'CW34', 'August', 36, 'ST_EMU_INT'),
('Jiřička Aleš', 'CW35', 'August', 36, 'ST_EMU_INT'),

-- Stránský Martin
('Stránský Martin', 'CW32', 'August', 36, 'ST_TRAM_INT'),
('Stránský Martin', 'CW33', 'August', 36, 'ST_TRAM_INT'),
('Stránský Martin', 'CW34', 'August', 36, 'ST_TRAM_INT'),
('Stránský Martin', 'CW35', 'August', 36, 'ST_TRAM_INT'),

-- Trač Vasyl
('Trač Vasyl', 'CW32', 'August', 36, 'ST_TRAM_HS'),
('Trač Vasyl', 'CW33', 'August', 36, 'ST_TRAM_HS'),
('Trač Vasyl', 'CW34', 'August', 36, 'ST_TRAM_HS'),
('Trač Vasyl', 'CW35', 'August', 36, 'ST_TRAM_HS');