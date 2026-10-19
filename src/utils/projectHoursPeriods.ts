import { ENGINEERS } from '../data/engineersList';
import { getISOWeekMonday, isHoliday } from './workingDays';

const normalize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
const slovakEngineers = new Set(ENGINEERS.filter(e => e.spolecnost === 'MB idea SK, s.r.o.').map(e => normalize(e.jmeno)));

/** Working dates are shared by project allocation and capacity, including year-boundary holidays. */
export function projectWeekDays(week: string, name: string) {
  const match = week.match(/^CW(\d+)[-_](\d{4})$/);
  if (!match) return [];
  const monday = getISOWeekMonday(Number(match[1]), Number(match[2]));
  return Array.from({ length: 5 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return { date, working: !isHoliday(date, slovakEngineers.has(normalize(name))) };
  });
}