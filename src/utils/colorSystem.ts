// Definice barev pro jednotlivé zákazníky s odstíny pro projekty
const CUSTOMER_COLORS = {
  'ST': {
    primary: 'hsl(213 88% 45%)',    // Modrá
    light: 'hsl(213 75% 60%)',
    dark: 'hsl(213 95% 35%)',
    accent: 'hsl(213 70% 70%)',
    // Odstíny pro různé projekty
    shades: [
      'hsl(211 100% 50%)',      // ST projekt 1 - klasická modrá
      'hsl(211 100% 43%)',      // ST projekt 2 - tmavší modrá
      'hsl(211 100% 56%)',      // ST projekt 3 - světlejší modrá
      'hsl(211 100% 35%)',      // ST projekt 4 - tmavá modrá
      'hsl(188 95% 50%)',       // ST projekt 5 - cyan
      'hsl(211 100% 71%)',      // ST projekt 6 - světlá modrá
      'hsl(231 83% 53%)',       // ST projekt 7 - indigo
      'hsl(197 71% 52%)',       // ST projekt 8 - sky blue
      'hsl(211 100% 27%)',      // ST projekt 9 - velmi tmavá modrá
    ]
  },
  'NUVIA': {
    primary: 'hsl(48 96% 53%)',     // Žlutá
    light: 'hsl(48 85% 65%)',
    dark: 'hsl(48 100% 45%)',
    accent: 'hsl(48 75% 75%)',
    // Odstíny žluté pro NUVIA projekty
    shades: [
      'hsl(48 96% 53%)',        // základní žlutá
      'hsl(48 100% 45%)',       // tmavší žlutá
      'hsl(45 93% 47%)',        // oranžovo-žlutá
      'hsl(48 85% 65%)',        // světlejší žlutá
      'hsl(42 87% 55%)',        // zlatá
    ]
  },
  'WABTEC': {
    primary: 'hsl(142 80% 35%)',    // Zelená
    light: 'hsl(142 70% 50%)',
    dark: 'hsl(142 85% 25%)',
    accent: 'hsl(142 60% 60%)',
    // Odstíny zelené pro WABTEC projekty
    shades: [
      'hsl(142 80% 35%)',       // základní zelená
      'hsl(142 85% 25%)',       // tmavší zelená
      'hsl(142 70% 50%)',       // světlejší zelená
      'hsl(160 84% 39%)',       // teal zelená
      'hsl(125 65% 45%)',       // travní zelená
    ]
  },
  'BUCHER': {
    primary: 'hsl(0 84% 60%)',      // Červená
    light: 'hsl(0 75% 70%)',
    dark: 'hsl(0 90% 50%)',
    accent: 'hsl(0 65% 80%)',
    // Odstíny červené pro BUCHER projekty
    shades: [
      'hsl(0 84% 60%)',         // základní červená
      'hsl(0 90% 50%)',         // tmavší červená
      'hsl(0 75% 70%)',         // světlejší červená
      'hsl(348 83% 47%)',       // růžovo-červená
      'hsl(14 91% 56%)',        // oranžovo-červená
    ]
  },
  'SAFRAN': {
    primary: 'hsl(262 83% 58%)',    // Fialová
    light: 'hsl(262 70% 70%)',
    dark: 'hsl(262 90% 45%)',
    accent: 'hsl(262 60% 80%)',
    // Odstíny fialové pro SAFRAN projekty
    shades: [
      'hsl(262 83% 58%)',       // základní fialová
      'hsl(262 90% 45%)',       // tmavší fialová
      'hsl(262 70% 70%)',       // světlejší fialová
      'hsl(271 81% 56%)',       // více fialová
      'hsl(250 84% 54%)',       // modro-fialová
    ]
  },
  'AIRBUS': {
    primary: 'hsl(200 85% 50%)',    // Cyan
    light: 'hsl(200 75% 65%)',
    dark: 'hsl(200 90% 40%)',
    accent: 'hsl(200 65% 75%)',
    // Odstíny cyan pro AIRBUS projekty
    shades: [
      'hsl(200 85% 50%)',       // základní cyan
      'hsl(200 90% 40%)',       // tmavší cyan
      'hsl(200 75% 65%)',       // světlejší cyan
      'hsl(180 83% 47%)',       // teal
      'hsl(220 91% 50%)',       // modro-cyan
    ]
  },
  'Zakazni Airbus': {
    primary: 'hsl(200 85% 50%)',    // Cyan (stejné jako AIRBUS)
    light: 'hsl(200 75% 65%)',
    dark: 'hsl(200 90% 40%)',
    accent: 'hsl(200 65% 75%)',
    // Odstíny cyan pro Zakazni Airbus projekty
    shades: [
      'hsl(200 85% 50%)',       // základní cyan
      'hsl(200 90% 40%)',       // tmavší cyan
      'hsl(200 75% 65%)',       // světlejší cyan
      'hsl(180 83% 47%)',       // teal
      'hsl(220 91% 50%)',       // modro-cyan
    ]
  },
  'N/A': {
    primary: 'hsl(220 8% 46%)',     // Šedá
    light: 'hsl(220 8% 60%)',
    dark: 'hsl(220 8% 35%)',
    accent: 'hsl(220 8% 75%)',
    // Odstíny šedé pro neznámé projekty
    shades: [
      'hsl(220 8% 46%)',        // základní šedá
      'hsl(220 8% 35%)',        // tmavší šedá
      'hsl(220 8% 60%)',        // světlejší šedá
      'hsl(215 16% 47%)',       // modro-šedá
      'hsl(220 8% 25%)',        // velmi tmavá šedá
    ]
  }
};

// Mapování projektů na zákazníky (statické fallback)
const PROJECT_TO_CUSTOMER_MAP: { [key: string]: string } = {
  'ST_EMU_INT': 'ST',
  'ST_TRAM_INT': 'ST',
  'ST_MAINZ': 'ST',
  'ST_KASSEL': 'ST',
  'ST_BLAVA': 'ST',
  'ST_FEM': 'ST',
  'ST_POZAR': 'ST',
  'ST_JIGS': 'ST',
  'ST_TRAM_HS': 'ST',
  'ST_ELEKTRO': 'ST',
  'NU_CRAIN': 'NUVIA',
  'WA_HVAC': 'WABTEC',
  'SAF_FEM': 'SAFRAN',
  'AIRB_INT': 'Zakazni Airbus'
};

// Získání barvy zákazníka podle kódu
export const getCustomerColor = (customerCode: string, variant: 'primary' | 'light' | 'dark' | 'accent' = 'primary'): string => {
  const colors = CUSTOMER_COLORS[customerCode as keyof typeof CUSTOMER_COLORS];
  return colors ? colors[variant] : CUSTOMER_COLORS['N/A'][variant];
};

// Získání barvy projektu na základě zákazníka a jeho odstínů
export const getProjectColor = (projectCode: string, variant: 'primary' | 'light' | 'dark' | 'accent' = 'primary'): string => {
  // Najdeme zákazníka pro tento projekt
  const customerCode = PROJECT_TO_CUSTOMER_MAP[projectCode];
  
  if (customerCode) {
    const customerColors = CUSTOMER_COLORS[customerCode as keyof typeof CUSTOMER_COLORS];
    
    if (customerColors && customerColors.shades) {
      // Vytvoříme hash z kódu projektu pro konzistentní přiřazení barvy
      let hash = 0;
      for (let i = 0; i < projectCode.length; i++) {
        const char = projectCode.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Použijeme hash pro výběr odstínu z dostupných odstínů zákazníka
      const shadeIndex = Math.abs(hash) % customerColors.shades.length;
      return customerColors.shades[shadeIndex];
    }
    
    // Fallback na základní barvu zákazníka
    return customerColors[variant];
  }

  // Pokud jsme nenašli zákazníka, použijeme N/A barvu
  return CUSTOMER_COLORS['N/A'][variant];
};

// Získání barvy podle zákazníka ID (fallback implementace)
export const getColorByCustomerId = (customerId: string, variant: 'primary' | 'light' | 'dark' | 'accent' = 'primary'): string => {
  return CUSTOMER_COLORS['N/A'][variant];
};

// Získání barvy s indexem pro fallback (pro zachování kompatibility)
export const getProjectColorWithIndex = (projectCode: string, index: number, variant: 'primary' | 'light' | 'dark' | 'accent' = 'primary'): string => {
  const projectColor = getProjectColor(projectCode, variant);
  
  // Pokud jsme nenašli projekt/zákazníka, použijeme index pro náhradní barvu
  if (projectColor === CUSTOMER_COLORS['N/A'][variant]) {
    const fallbackColors = [
      'hsl(213 88% 45%)',    // primary
      'hsl(35 80% 55%)',     // orange
      'hsl(262 83% 58%)',    // purple
      'hsl(142 80% 35%)',    // green
      'hsl(0 84% 60%)',      // red
      'hsl(48 96% 53%)',     // yellow
      'hsl(200 85% 50%)',    // cyan
      'hsl(280 75% 55%)',    // violet
      'hsl(15 85% 55%)',     // orange-red
      'hsl(120 70% 45%)',    // lime
      'hsl(300 70% 50%)',    // magenta
      'hsl(190 80% 45%)',    // teal
    ];
    return fallbackColors[index % fallbackColors.length];
  }
  
  return projectColor;
};

// Seznam všech dostupných barev zákazníků
export const getAllCustomerColors = () => {
  return Object.entries(CUSTOMER_COLORS).map(([code, colors]) => ({
    code,
    ...colors
  }));
};

// Získání zákazníka podle projektu kódu (fallback implementace)
export const getCustomerByProjectCode = (projectCode: string) => {
  const customerCode = PROJECT_TO_CUSTOMER_MAP[projectCode];
  if (customerCode) {
    return {
      id: customerCode,
      code: customerCode,
      name: customerCode
    };
  }
  return null;
};