import { customers, projects } from '@/data/projectsData';

// Definice barev pro jednotlivé zákazníky
const CUSTOMER_COLORS = {
  'ST': {
    primary: 'hsl(213 88% 45%)',    // Modrá
    light: 'hsl(213 75% 60%)',
    dark: 'hsl(213 95% 35%)',
    accent: 'hsl(213 70% 70%)'
  },
  'NUVIA': {
    primary: 'hsl(48 96% 53%)',     // Žlutá
    light: 'hsl(48 85% 65%)',
    dark: 'hsl(48 100% 45%)',
    accent: 'hsl(48 75% 75%)'
  },
  'WABTEC': {
    primary: 'hsl(142 80% 35%)',    // Zelená
    light: 'hsl(142 70% 50%)',
    dark: 'hsl(142 85% 25%)',
    accent: 'hsl(142 60% 60%)'
  },
  'BUCHER': {
    primary: 'hsl(0 84% 60%)',      // Červená
    light: 'hsl(0 75% 70%)',
    dark: 'hsl(0 90% 50%)',
    accent: 'hsl(0 65% 80%)'
  },
  'SAFRAN': {
    primary: 'hsl(262 83% 58%)',    // Fialová
    light: 'hsl(262 70% 70%)',
    dark: 'hsl(262 90% 45%)',
    accent: 'hsl(262 60% 80%)'
  },
  'AIRBUS': {
    primary: 'hsl(200 85% 50%)',    // Cyan
    light: 'hsl(200 75% 65%)',
    dark: 'hsl(200 90% 40%)',
    accent: 'hsl(200 65% 75%)'
  },
  'N/A': {
    primary: 'hsl(220 8% 46%)',     // Šedá
    light: 'hsl(220 8% 60%)',
    dark: 'hsl(220 8% 35%)',
    accent: 'hsl(220 8% 75%)'
  }
};

// Získání barvy zákazníka podle kódu
export const getCustomerColor = (customerCode: string, variant: 'primary' | 'light' | 'dark' | 'accent' = 'primary'): string => {
  const colors = CUSTOMER_COLORS[customerCode as keyof typeof CUSTOMER_COLORS];
  return colors ? colors[variant] : CUSTOMER_COLORS['N/A'][variant];
};

// Získání barvy projektu na základě zákazníka
export const getProjectColor = (projectCode: string, variant: 'primary' | 'light' | 'dark' | 'accent' = 'primary'): string => {
  // Najdeme projekt
  const project = projects.find(p => p.code === projectCode);
  if (!project) {
    return CUSTOMER_COLORS['N/A'][variant];
  }

  // Najdeme zákazníka
  const customer = customers.find(c => c.id === project.customerId);
  if (!customer) {
    return CUSTOMER_COLORS['N/A'][variant];
  }

  // Vrátíme barvu zákazníka
  return getCustomerColor(customer.code, variant);
};

// Získání barvy podle zákazníka ID
export const getColorByCustomerId = (customerId: string, variant: 'primary' | 'light' | 'dark' | 'accent' = 'primary'): string => {
  const customer = customers.find(c => c.id === customerId);
  if (!customer) {
    return CUSTOMER_COLORS['N/A'][variant];
  }
  return getCustomerColor(customer.code, variant);
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

// Získání zákazníka podle projektu kódu
export const getCustomerByProjectCode = (projectCode: string) => {
  const project = projects.find(p => p.code === projectCode);
  if (!project) return null;
  
  return customers.find(c => c.id === project.customerId) || null;
};