import { eachDayOfInterval, isWeekend } from 'date-fns';
import { isHoliday } from './workingDays';

export type SupportedCalendarYear = 2026 | 2027;

export interface MonthlyFteCapacity {
  monthIndex: number;
  monthName: string;
  weekdays: number;
  theoreticalHours: number;
  holidayDays: number;
  holidayHours: number;
  workingFundAfterHolidays: number;
  vacationHours: number;
  sickAndSickDayHours: number;
  productiveHours: number;
  utilizationPct: number;
}

export interface QuarterlyFteSummary {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  avgProductiveHours: number;
}

export interface AnnualFteCapacity {
  year: SupportedCalendarYear;
  months: MonthlyFteCapacity[];
  quarters: QuarterlyFteSummary[];
  theoreticalDays: number;
  theoreticalHours: number;
  holidayHours: number;
  workingFundAfterHolidays: number;
  vacationDays: number;
  vacationHours: number;
  sickDays: number;
  sickHours: number;
  sickDayDays: number;
  sickDayHours: number;
  totalSickAndSickDayHours: number;
  productiveHours: number;
  totalUtilizationPct: number;
  avgPerMonth: number;
}

const HOURS_PER_DAY = 8;
const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
] as const;

// Standard 1 FTE annual absence profile: 25 days vacation (200h), 5 days sick (40h) + 1 sick day (8h).
const VACATION_HOURS_BY_MONTH = [0, 16, 16, 0, 8, 16, 40, 40, 16, 8, 0, 40] as const;
const SICK_AND_SICK_DAY_HOURS_BY_MONTH = [16, 8, 8, 0, 0, 0, 0, 0, 0, 0, 8, 8] as const;
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

export function buildFteCapacityCalendar(year: SupportedCalendarYear): AnnualFteCapacity {
  const months: MonthlyFteCapacity[] = MONTH_NAMES.map((monthName, idx) => {
    const start = new Date(year, idx, 1);
    const end = new Date(year, idx + 1, 0);
    const days = eachDayOfInterval({ start, end });

    let weekdays = 0;
    let holidayDays = 0;
    for (const day of days) {
      if (!isWeekend(day)) {
        weekdays++;
        if (isHoliday(day, false)) holidayDays++;
      }
    }

    const theoreticalHours = weekdays * HOURS_PER_DAY;
    const holidayHours = holidayDays * HOURS_PER_DAY;
    const workingFundAfterHolidays = theoreticalHours - holidayHours;
    const vacationHours = VACATION_HOURS_BY_MONTH[idx] ?? 0;
    const sickAndSickDayHours = SICK_AND_SICK_DAY_HOURS_BY_MONTH[idx] ?? 0;
    const productiveHours = Math.max(0, workingFundAfterHolidays - vacationHours - sickAndSickDayHours);
    const utilizationPct = workingFundAfterHolidays > 0 ? (productiveHours / workingFundAfterHolidays) * 100 : 0;

    return {
      monthIndex: idx + 1,
      monthName,
      weekdays,
      theoreticalHours,
      holidayDays,
      holidayHours,
      workingFundAfterHolidays,
      vacationHours,
      sickAndSickDayHours,
      productiveHours,
      utilizationPct,
    };
  });

  const quarters: QuarterlyFteSummary[] = QUARTERS.map((quarter, qIdx) => {
    const slice = months.slice(qIdx * 3, qIdx * 3 + 3);
    const sum = slice.reduce((acc, m) => acc + m.productiveHours, 0);
    return { quarter, avgProductiveHours: sum / slice.length };
  });

  const theoreticalDays = months.reduce((acc, m) => acc + m.weekdays, 0);
  const theoreticalHours = months.reduce((acc, m) => acc + m.theoreticalHours, 0);
  const holidayHours = months.reduce((acc, m) => acc + m.holidayHours, 0);
  const workingFundAfterHolidays = months.reduce((acc, m) => acc + m.workingFundAfterHolidays, 0);
  const vacationHours = months.reduce((acc, m) => acc + m.vacationHours, 0);
  const totalSickAndSickDayHours = months.reduce((acc, m) => acc + m.sickAndSickDayHours, 0);
  const productiveHours = months.reduce((acc, m) => acc + m.productiveHours, 0);
  const totalUtilizationPct = workingFundAfterHolidays > 0 ? (productiveHours / workingFundAfterHolidays) * 100 : 0;

  return {
    year,
    months,
    quarters,
    theoreticalDays,
    theoreticalHours,
    holidayHours,
    workingFundAfterHolidays,
    vacationDays: 25,
    vacationHours,
    sickDays: 5,
    sickHours: 40,
    sickDayDays: 1,
    sickDayHours: 8,
    totalSickAndSickDayHours,
    productiveHours,
    totalUtilizationPct,
    avgPerMonth: productiveHours / 12,
  };
}