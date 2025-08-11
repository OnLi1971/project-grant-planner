-- Clear existing fake data and insert all real engineers data
DELETE FROM public.planning_entries;

-- Insert partial data from finalEngineersData (first batch - key people only for now to test)
INSERT INTO public.planning_entries (konstrukter, cw, mesic, mh_tyden, projekt) VALUES
-- Fuchs Pavel
('Fuchs Pavel', 'CW32', 'August', 36, 'WA_HVAC'),
('Fuchs Pavel', 'CW33', 'August', 36, 'WA_HVAC'),
('Fuchs Pavel', 'CW34', 'August', 36, 'WA_HVAC'),
('Fuchs Pavel', 'CW35', 'August', 36, 'WA_HVAC'),

-- Mohelník Martin
('Mohelník Martin', 'CW32', 'August', 36, 'ST_KASSEL'),
('Mohelník Martin', 'CW33', 'August', 36, 'ST_KASSEL'),
('Mohelník Martin', 'CW34', 'August', 36, 'ST_KASSEL'),
('Mohelník Martin', 'CW35', 'August', 36, 'ST_KASSEL'),

-- Nedavaška Petr
('Nedavaška Petr', 'CW32', 'August', 36, 'ST_POZAR'),
('Nedavaška Petr', 'CW33', 'August', 36, 'ST_POZAR'),
('Nedavaška Petr', 'CW34', 'August', 36, 'ST_POZAR'),
('Nedavaška Petr', 'CW35', 'August', 36, 'ST_POZAR'),

-- Šedovičová Darina
('Šedovičová Darina', 'CW32', 'August', 36, 'SAF_FEM'),
('Šedovičová Darina', 'CW33', 'August', 36, 'SAF_FEM'),
('Šedovičová Darina', 'CW34', 'August', 36, 'SAF_FEM'),
('Šedovičová Darina', 'CW35', 'August', 36, 'SAF_FEM'),

-- Ješš Jozef
('Ješš Jozef', 'CW32', 'August', 36, 'ST_FEM'),
('Ješš Jozef', 'CW33', 'August', 36, 'ST_FEM'),
('Ješš Jozef', 'CW34', 'August', 36, 'ST_FEM'),
('Ješš Jozef', 'CW35', 'August', 36, 'ST_FEM'),

-- Melichar Ondřej
('Melichar Ondřej', 'CW32', 'August', 36, 'SAF_FEM'),
('Melichar Ondřej', 'CW33', 'August', 36, 'SAF_FEM'),
('Melichar Ondřej', 'CW34', 'August', 36, 'SAF_FEM'),
('Melichar Ondřej', 'CW35', 'August', 36, 'SAF_FEM'),

-- Klíma Milan
('Klíma Milan', 'CW32', 'August', 36, 'ST_EMU_INT'),
('Klíma Milan', 'CW33', 'August', 36, 'ST_EMU_INT'),
('Klíma Milan', 'CW34', 'August', 36, 'ST_EMU_INT'),
('Klíma Milan', 'CW35', 'August', 36, 'ST_EMU_INT'),

-- Madanský Peter
('Madanský Peter', 'CW32', 'August', 36, 'ST_POZAR'),
('Madanský Peter', 'CW33', 'August', 36, 'ST_POZAR'),
('Madanský Peter', 'CW34', 'August', 36, 'ST_POZAR'),
('Madanský Peter', 'CW35', 'August', 36, 'ST_POZAR'),

-- Hibler František
('Hibler František', 'CW32', 'August', 36, 'ST_JIGS'),
('Hibler František', 'CW33', 'August', 36, 'ST_JIGS'),
('Hibler František', 'CW34', 'August', 36, 'ST_JIGS'),
('Hibler František', 'CW35', 'August', 36, 'ST_JIGS'),

-- Brojír Jaroslav
('Brojír Jaroslav', 'CW32', 'August', 36, 'ST_KASSEL'),
('Brojír Jaroslav', 'CW33', 'August', 36, 'ST_KASSEL'),
('Brojír Jaroslav', 'CW34', 'August', 36, 'ST_KASSEL'),
('Brojír Jaroslav', 'CW35', 'August', 36, 'ST_KASSEL'),

-- Samko Mikuláš
('Samko Mikuláš', 'CW32', 'August', 36, 'ST_TRAM_INT'),
('Samko Mikuláš', 'CW33', 'August', 36, 'ST_TRAM_INT'),
('Samko Mikuláš', 'CW34', 'August', 36, 'ST_TRAM_INT'),
('Samko Mikuláš', 'CW35', 'August', 36, 'ST_TRAM_INT'),

-- Chrenko Daniel
('Chrenko Daniel', 'CW32', 'August', 36, 'ST_EMU_INT'),
('Chrenko Daniel', 'CW33', 'August', 36, 'ST_EMU_INT'),
('Chrenko Daniel', 'CW34', 'August', 36, 'ST_EMU_INT'),
('Chrenko Daniel', 'CW35', 'August', 36, 'ST_EMU_INT'),

-- Jiřička Aleš
('Jiřička Aleš', 'CW32', 'August', 36, 'ST_MAINZ'),
('Jiřička Aleš', 'CW33', 'August', 36, 'ST_MAINZ'),
('Jiřička Aleš', 'CW34', 'August', 36, 'ST_MAINZ'),
('Jiřička Aleš', 'CW35', 'August', 36, 'ST_MAINZ'),

-- Stránský Martin
('Stránský Martin', 'CW32', 'August', 36, 'NU_CRAIN'),
('Stránský Martin', 'CW33', 'August', 36, 'NU_CRAIN'),
('Stránský Martin', 'CW34', 'August', 36, 'NU_CRAIN'),
('Stránský Martin', 'CW35', 'August', 36, 'NU_CRAIN'),

-- Trač Vasyl
('Trač Vasyl', 'CW32', 'August', 36, 'NU_CRAIN'),
('Trač Vasyl', 'CW33', 'August', 36, 'NU_CRAIN'),
('Trač Vasyl', 'CW34', 'August', 36, 'NU_CRAIN'),
('Trač Vasyl', 'CW35', 'August', 36, 'NU_CRAIN');