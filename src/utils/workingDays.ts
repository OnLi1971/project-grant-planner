import { eachDayOfInterval, isWeekend, format } from 'date-fns';

// České státní svátky 2025-2026
const czechHolidays2025 = [
  '2025-01-01', // Nový rok
  '2025-04-18', // Velký pátek
  '2025-04-21', // Velikonoční pondělí
  '2025-05-01', // Svátek práce
  '2025-05-08', // Den vítězství
  '2025-07-05', // Cyril a Metoděj
  '2025-07-06', // Jan Hus
  '2025-09-28', // Den české státnosti
  '2025-10-28', // Den vzniku samostatného československého státu
  '2025-11-17', // Den boje za svobodu a demokracii
  '2025-12-24', // Štědrý den
  '2025-12-25', // 1. svátek vánoční
  '2025-12-26', // 2. svátek vánoční
];

const czechHolidays2026 = [
  '2026-01-01', // Nový rok
  '2026-04-03', // Velký pátek
  '2026-04-06', // Velikonoční pondělí
  '2026-05-01', // Svátek práce
  '2026-05-08', // Den vítězství
  '2026-07-05', // Cyril a Metoděj
  '2026-07-06', // Jan Hus
  '2026-09-28', // Den české státnosti
  '2026-10-28', // Den vzniku samostatného československého státu
  '2026-11-17', // Den boje za svobodu a demokracii
  '2026-12-24', // Štědrý den
  '2026-12-25', // 1. svátek vánoční
  '2026-12-26', // 2. svátek vánoční
];

// Slovenské státní svátky 2025-2026
const slovakHolidays2025 = [
  '2025-01-01', // Nový rok
  '2025-01-06', // Zjavenie Pána
  '2025-04-18', // Veľký piatok
  '2025-04-21', // Veľkonočný pondelok
  '2025-05-01', // Sviatok práce
  '2025-05-08', // Deň víťazstva nad fašizmom
  '2025-07-05', // Sviatok svätého Cyrila a Metoda
  '2025-08-29', // Výročie SNP
  '2025-09-01', // Deň Ústavy SR
  '2025-09-15', // Sedembolestná Panna Mária
  '2025-11-01', // Sviatok Všetkých svätých
  '2025-11-17', // Deň boja za slobodu a demokraciu
  '2025-12-24', // Štedrý deň
  '2025-12-25', // 1. sviatok vianočný
  '2025-12-26', // 2. sviatok vianočný
];

const slovakHolidays2026 = [
  '2026-01-01', // Nový rok
  '2026-01-06', // Zjavenie Pána
  '2026-04-03', // Veľký piatok
  '2026-04-06', // Veľkonočný pondelok
  '2026-05-01', // Sviatok práce
  '2026-05-08', // Deň víťazstva nad fašizmom
  '2026-07-05', // Sviatok svätého Cyrila a Metoda
  '2026-08-29', // Výročie SNP
  '2026-09-01', // Deň Ústavy SR
  '2026-09-15', // Sedembolestná Panna Mária
  '2026-11-01', // Sviatok Všetkých svätých
  '2026-11-17', // Deň boja za slobodu a demokraciu
  '2026-12-24', // Štedrý deň
  '2026-12-25', // 1. sviatok vianočný
  '2026-12-26', // 2. sviatok vianočný
];

const allCzechHolidays = [...czechHolidays2025, ...czechHolidays2026];
const allSlovakHolidays = [...slovakHolidays2025, ...slovakHolidays2026];

/**
 * Zjistí, zda je daný den státní svátek
 */
export const isHoliday = (date: Date, isSlovak: boolean = false): boolean => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const holidays = isSlovak ? allSlovakHolidays : allCzechHolidays;
  return holidays.includes(dateStr);
};

/**
 * Spočítá počet pracovních dnů v měsíci (pondělí-pátek, minus svátky)
 */
export const getWorkingDaysInMonth = (year: number, month: number, isSlovak: boolean = false): number => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  
  const allDays = eachDayOfInterval({ start, end });
  
  return allDays.filter(day => {
    if (isWeekend(day)) return false;
    if (isHoliday(day, isSlovak)) return false;
    return true;
  }).length;
};

/**
 * Parsuje název měsíce ve formátu "listopad 2025" a vrátí počet pracovních dnů
 */
export const getWorkingDaysFromMonthName = (monthName: string, isSlovak: boolean = false): number => {
  const monthMap: { [key: string]: number } = {
    'leden': 1, 'únor': 2, 'březen': 3, 'duben': 4, 'květen': 5, 'červen': 6,
    'červenec': 7, 'srpen': 8, 'září': 9, 'říjen': 10, 'listopad': 11, 'prosinec': 12
  };
  
  const parts = monthName.toLowerCase().split(' ');
  if (parts.length !== 2) return 0;
  
  const monthNum = monthMap[parts[0]];
  const year = parseInt(parts[1]);
  
  if (!monthNum || !year) return 0;
  
  return getWorkingDaysInMonth(year, monthNum, isSlovak);
};

/**
 * Vypočítá maximální hodinovou kapacitu pro měsíc
 * @param workingDays počet pracovních dnů
 * @param hoursPerDay hodin za den (standardně 8)
 */
export const getMonthlyCapacity = (workingDays: number, hoursPerDay: number = 8): number => {
  return workingDays * hoursPerDay;
};

/**
 * Spočítá, kolik pracovních dnů z daného týdne (Monday-Friday) spadá do daného měsíce
 * @param weekMonday Pondělí daného týdne
 * @param year Rok měsíce
 * @param month Číslo měsíce (1-12)
 * @param isSlovak Počítat slovenské svátky
 * @returns Počet pracovních dnů z týdne, které spadají do měsíce
 */
export const getWorkingDaysInWeekForMonth = (
  weekMonday: Date,
  year: number,
  month: number,
  isSlovak: boolean = false
): number => {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  
  // Týden = pondělí až pátek (5 dnů)
  const weekDays: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(weekMonday);
    day.setDate(weekMonday.getDate() + i);
    weekDays.push(day);
  }
  
  // Spočítej, kolik z těch 5 dnů je v daném měsíci a není svátek
  return weekDays.filter(day => {
    if (day < monthStart || day > monthEnd) return false;
    if (isHoliday(day, isSlovak)) return false;
    return true;
  }).length;
};
