-- Clear existing sample data and insert real project data
DELETE FROM public.planning_entries;

-- Insert real planning data with actual project codes
INSERT INTO public.planning_entries (konstrukter, cw, mesic, mh_tyden, projekt) VALUES
-- Jan Novák - ST EMU INT projekt
('Jan Novák', 'CW32', 'August', 40, 'ST_EMU_INT'),
('Jan Novák', 'CW33', 'August', 40, 'ST_EMU_INT'),
('Jan Novák', 'CW34', 'August', 40, 'ST_EMU_INT'),
('Jan Novák', 'CW35', 'September', 40, 'ST_EMU_INT'),

-- Petr Svoboda - mix projektů
('Petr Svoboda', 'CW32', 'August', 40, 'FREE'),
('Petr Svoboda', 'CW33', 'August', 35, 'ST_TRAM_INT'),
('Petr Svoboda', 'CW34', 'August', 40, 'ST_TRAM_INT'),
('Petr Svoboda', 'CW35', 'September', 40, 'ST_MAINZ'),

-- Marie Svobodová - FEM projekty
('Marie Svobodová', 'CW32', 'August', 40, 'ST_FEM'),
('Marie Svobodová', 'CW33', 'August', 40, 'ST_FEM'),
('Marie Svobodová', 'CW34', 'August', 35, 'SAF_FEM'),
('Marie Svobodová', 'CW35', 'September', 40, 'SAF_FEM'),

-- Tomáš Novotný - WABTEC a NUVIA projekty
('Tomáš Novotný', 'CW32', 'August', 40, 'WA_HVAC'),
('Tomáš Novotný', 'CW33', 'August', 40, 'WA_HVAC'),
('Tomáš Novotný', 'CW34', 'August', 40, 'NU_CRAIN'),
('Tomáš Novotný', 'CW35', 'September', 40, 'NU_CRAIN'),

-- Jiří Procházka - AERO projekty
('Jiří Procházka', 'CW32', 'August', 40, 'SAF_INT'),
('Jiří Procházka', 'CW33', 'August', 40, 'SAF_INT'),
('Jiří Procházka', 'CW34', 'August', 32, 'DOVOLENÁ'),
('Jiří Procházka', 'CW35', 'September', 40, 'AIRB_INT'),

-- Pavel Krejčí - mix projektů
('Pavel Krejčí', 'CW32', 'August', 40, 'ST_KASSEL'),
('Pavel Krejčí', 'CW33', 'August', 40, 'ST_BLAVA'),
('Pavel Krejčí', 'CW34', 'August', 40, 'ST_JIGS'),
('Pavel Krejčí', 'CW35', 'September', 40, 'ST_TRAM_HS'),

-- Michal Dvořák - BUCHER projekt
('Michal Dvořák', 'CW32', 'August', 40, 'BUCH_INT'),
('Michal Dvořák', 'CW33', 'August', 40, 'BUCH_INT'),
('Michal Dvořák', 'CW34', 'August', 40, 'FREE'),
('Michal Dvořák', 'CW35', 'September', 40, 'OVER');