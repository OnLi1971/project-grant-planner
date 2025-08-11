-- Aktualizace existujících záznamů s projekty z additionalEngineersData
-- Matta Jozef
UPDATE planning_entries SET projekt = 'ST_POZAR', mh_tyden = 36 WHERE konstrukter = 'Matta Jozef' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Matta Jozef' AND cw = 'CW52';

-- Pecinovský Pavel
UPDATE planning_entries SET projekt = 'ST_KASSEL', mh_tyden = 36 WHERE konstrukter = 'Pecinovský Pavel' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Pecinovský Pavel' AND cw = 'CW52';

-- Anovčín Branislav
UPDATE planning_entries SET projekt = 'WA_HVAC', mh_tyden = 36 WHERE konstrukter = 'Anovčín Branislav' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Anovčín Branislav' AND cw = 'CW52';

-- Břicháček Miloš
UPDATE planning_entries SET projekt = 'ST_BLAVA', mh_tyden = 36 WHERE konstrukter = 'Břicháček Miloš' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Břicháček Miloš' AND cw = 'CW52';

-- Fenyk Pavel
UPDATE planning_entries SET projekt = 'NU_CRAIN', mh_tyden = 36 WHERE konstrukter = 'Fenyk Pavel' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Fenyk Pavel' AND cw = 'CW52';

-- Kalafa Ján
UPDATE planning_entries SET projekt = 'ST_MAINZ', mh_tyden = 36 WHERE konstrukter = 'Kalafa Ján' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Kalafa Ján' AND cw = 'CW52';

-- Lengyel Martin
UPDATE planning_entries SET projekt = 'ST_KASSEL', mh_tyden = 36 WHERE konstrukter = 'Lengyel Martin' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Lengyel Martin' AND cw = 'CW52';

-- Aktualizace z finalEngineersData
-- Fuchs Pavel
UPDATE planning_entries SET projekt = 'WA_HVAC', mh_tyden = 36 WHERE konstrukter = 'Fuchs Pavel' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Fuchs Pavel' AND cw = 'CW52';

-- Mohelník Martin
UPDATE planning_entries SET projekt = 'ST_KASSEL', mh_tyden = 36 WHERE konstrukter = 'Mohelník Martin' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Mohelník Martin' AND cw = 'CW52';

-- Nedavaška Petr
UPDATE planning_entries SET projekt = 'ST_POZAR', mh_tyden = 36 WHERE konstrukter = 'Nedavaška Petr' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Nedavaška Petr' AND cw = 'CW52';

-- Šedovičová Darina
UPDATE planning_entries SET projekt = 'SAF_FEM', mh_tyden = 36 WHERE konstrukter = 'Šedovičová Darina' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Šedovičová Darina' AND cw = 'CW52';

-- Ješš Jozef
UPDATE planning_entries SET projekt = 'ST_FEM', mh_tyden = 36 WHERE konstrukter = 'Ješš Jozef' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Ješš Jozef' AND cw = 'CW52';

-- Melichar Ondřej
UPDATE planning_entries SET projekt = 'SAF_FEM', mh_tyden = 36 WHERE konstrukter = 'Melichar Ondřej' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Melichar Ondřej' AND cw = 'CW52';

-- Klíma Milan
UPDATE planning_entries SET projekt = 'ST_EMU_INT', mh_tyden = 36 WHERE konstrukter = 'Klíma Milan' AND cw IN ('CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51');
UPDATE planning_entries SET projekt = '', mh_tyden = 0 WHERE konstrukter = 'Klíma Milan' AND cw = 'CW52';