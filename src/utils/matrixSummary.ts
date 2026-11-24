import { isEngineerDepartedForWeek } from '@/utils/engineerDeparture';
import { getISOWeekMonday, getWorkingDaysInCW, getWorkingDaysInWeekForMonth } from '@/utils/workingDays';
import { normalizeName } from '@/utils/nameNormalization';

export interface MatrixCellData {
  projekt: string;
  isTentative: boolean;
  hours: number;
  leaveDays: number;
  projekt2?: string | null;
  isTentative2?: boolean;
  hours2?: number;
}

export type MatrixDataMap = Record<string, Record<string, MatrixCellData>>;

export interface WeekSummaryStats {
  freeMh: number;
  freeFte: number;
  leaveFte: number;
  leaveMh: number;
  maxProductive: number;
  realProductive: number;
  engineerCount: number;
  totalFte: number;
  utilization: number;
}

export interface MonthSummaryStats {
  fte: number;
  hours: number;
  engineerCount: number;
  maxProductive: number;
  realProductive: number;
  leaveFte: number;
  leaveMh: number;
  freeMh: number;
  freeFte: number;
  utilization: number;
}

const MONTH_NAME_TO_NUMBER: Record<string, number> = {
  leden: 1,
  únor: 2,
  březen: 3,
  duben: 4,
  květen: 5,
  červen: 6,
  červenec: 7,
  srpen: 8,
  září: 9,
  říjen: 10,
  listopad: 11,
  prosinec: 12,
};

const MB_IDEA_ENGINEERS = new Set([
  'bohusik martin',
  'chrenko daniel',
  'chrenko peter',
  'pupava marian',
  'jurcisin peter',
]);

export const isSlovakMatrixEngineer = (displayName: string): boolean =>
  MB_IDEA_ENGINEERS.has(normalizeName(displayName));

export const normActivity = (p?: string): string =>
  (p || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

export const isNonCountedActivity = (p?: string): boolean => {
  const a = normActivity(p);
  return a === 'FREE' || a === 'OVER' || a === 'DEPARTED' || a === '';
};

export const isFullWeekActivity = (p?: string): boolean => {
  const a = normActivity(p);
  return a === 'DOVOLENA' || a === 'NEMOC';
};

export const getEffectiveHours = (projekt?: string, hours?: number): number => {
  if (isNonCountedActivity(projekt)) return 0;
  const h = hours || 0;
  return isFullWeekActivity(projekt) ? h * (36 / 40) : h;
};

export const getProductiveHours = (projekt?: string, hours?: number): number => {
  if (isNonCountedActivity(projekt) || isFullWeekActivity(projekt)) return 0;
  return hours || 0;
};

const getWeekMaxPerEngineer = (weekKey: string): number => {
  const m = weekKey.match(/CW(\d+)[-_](\d{4})/);
  if (!m) return 36;
  return getWorkingDaysInCW(parseInt(m[1], 10), parseInt(m[2], 10)) * 7.2;
};

export function computeWeeklyMatrixStats(
  weeks: string[],
  filteredEngineers: string[],
  matrixData: MatrixDataMap
): Record<string, WeekSummaryStats> {
  const result: Record<string, WeekSummaryStats> = {};

  for (const week of weeks) {
    const weekMax = getWeekMaxPerEngineer(week);
    const workDays = weekMax / 7.2;
    let freeMh = 0;
    let leaveFte = 0;
    let leaveMh = 0;
    let maxProductive = 0;
    let realProductive = 0;
    let engineerCount = 0;
    let effectiveHoursTotal = 0;
    let utilRealHours = 0;

    for (const engineer of filteredEngineers) {
      const pd = matrixData[engineer]?.[week];
      if (!pd) continue;

      const act = normActivity(pd.projekt);
      const fullWeekLeave = isFullWeekActivity(pd.projekt);

      if (pd.projekt !== 'DEPARTED') {
        engineerCount += 1;
      }

      if (fullWeekLeave) {
        leaveFte += 1;
        leaveMh += weekMax;
      } else if (workDays > 0) {
        const clampedLeaveDays = Math.min(workDays, pd.leaveDays || 0);
        leaveFte += clampedLeaveDays / workDays;
        leaveMh += clampedLeaveDays * 7.2;
      }

      const prodHours = getProductiveHours(pd.projekt, pd.hours);
      realProductive += prodHours;
      effectiveHoursTotal += getEffectiveHours(pd.projekt, pd.hours);

      if (act !== 'DEPARTED' && !fullWeekLeave) {
        const partialLeave = Math.min(workDays, pd.leaveDays || 0) * 7.2;
        const engMax = Math.max(0, weekMax - partialLeave);
        maxProductive += engMax;
        freeMh += Math.max(0, engMax - prodHours);
        utilRealHours += Math.min(engMax, prodHours);
      }
    }

    result[week] = {
      freeMh,
      freeFte: weekMax > 0 ? freeMh / weekMax : 0,
      leaveFte,
      leaveMh,
      maxProductive,
      realProductive,
      engineerCount,
      totalFte: weekMax > 0 ? effectiveHoursTotal / weekMax : 0,
      utilization: maxProductive > 0 ? Math.round((utilRealHours / maxProductive) * 100) : 0,
    };
  }

  return result;
}

export function computeMonthlyMatrixStats(
  months: { name: string; weeks: string[] }[],
  weeks: string[],
  filteredEngineers: string[],
  matrixData: MatrixDataMap,
  endDateMap: Record<string, string | null>,
  displayNameMap: Record<string, string>
): Record<string, MonthSummaryStats> {
  const parsedWeeks = weeks
    .map((week) => {
      const match = week.match(/CW(\d+)-(\d+)/);
      if (!match) return null;
      const monday = getISOWeekMonday(parseInt(match[1], 10), parseInt(match[2], 10));
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      return {
        week,
        monday,
        startYm: monday.getFullYear() * 12 + monday.getMonth() + 1,
        endYm: friday.getFullYear() * 12 + friday.getMonth() + 1,
      };
    })
    .filter((w): w is NonNullable<typeof w> => w !== null);

  const engineerMeta = filteredEngineers.map((engineer) => ({
    engineer,
    endDate: endDateMap[engineer] || null,
    isSlovak: isSlovakMatrixEngineer(displayNameMap[engineer] || engineer),
  }));

  const result: Record<string, MonthSummaryStats> = {};

  for (const month of months) {
    const [mName, yStr] = month.name.toLowerCase().split(' ');
    const mNum = MONTH_NAME_TO_NUMBER[mName];
    const mYear = parseInt(yStr, 10);
    const targetYm = mNum && mYear ? mYear * 12 + mNum : -1;

    const overlappingWeeks = targetYm > 0
      ? parsedWeeks
          .filter((w) => targetYm >= w.startYm && targetYm <= w.endYm)
          .map((w) => ({
            week: w.week,
            daysCZ: getWorkingDaysInWeekForMonth(w.monday, mYear, mNum, false),
            daysSK: getWorkingDaysInWeekForMonth(w.monday, mYear, mNum, true),
          }))
          .filter((w) => w.daysCZ > 0 || w.daysSK > 0)
      : [];

    let fte = 0;
    let hours = 0;
    let engineerCount = 0;
    let maxProductive = 0;
    let realProductive = 0;
    let leaveFte = 0;
    let leaveMh = 0;

    for (const { engineer, endDate, isSlovak } of engineerMeta) {
      let capacityDays = 0;
      let engHours = 0;
      let leaveDays = 0;
      const engWeeks = matrixData[engineer];

      for (const ow of overlappingWeeks) {
        if (endDate && isEngineerDepartedForWeek(endDate, ow.week)) continue;
        const daysInMonth = isSlovak ? ow.daysSK : ow.daysCZ;
        capacityDays += daysInMonth;
        if (daysInMonth === 0) continue;

        const pd = engWeeks?.[ow.week];
        const eff = getEffectiveHours(pd?.projekt, pd?.hours);
        if (eff > 0) engHours += eff * (daysInMonth / 5);

        const fullWeekLeave = isFullWeekActivity(pd?.projekt);
        const partialLeave = fullWeekLeave ? 0 : Math.min(daysInMonth, (pd?.leaveDays || 0) * (daysInMonth / 5));
        if (fullWeekLeave) leaveDays += daysInMonth;
        else leaveDays += partialLeave;

        if (!fullWeekLeave && normActivity(pd?.projekt) !== 'DEPARTED') {
          const engMax = Math.max(0, (daysInMonth - partialLeave) * 7.2);
          maxProductive += engMax;
          realProductive += Math.min(engMax, getProductiveHours(pd?.projekt, pd?.hours) * (daysInMonth / 5));
        }
      }

      if (capacityDays === 0) continue;
      engineerCount += 1;
      leaveFte += leaveDays / capacityDays;
      leaveMh += leaveDays * 7.2;
      hours += engHours;
      fte += engHours / (capacityDays * 7.2);
    }

    const freeMh = Math.max(0, maxProductive - realProductive);
    const freeFte = maxProductive > 0
      ? Math.max(0, (maxProductive - realProductive) / maxProductive) * engineerCount
      : 0;
    const utilization = maxProductive > 0 ? Math.round((realProductive / maxProductive) * 100) : 0;

    result[month.name] = {
      fte,
      hours,
      engineerCount,
      maxProductive,
      realProductive,
      leaveFte,
      leaveMh,
      freeMh,
      freeFte,
      utilization,
    };
  }

  return result;
}