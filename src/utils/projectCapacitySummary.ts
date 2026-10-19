import type { EngineerInfo, PlanningEntry } from '../types/planning';
import { getISOWeekMonday, isHoliday } from './workingDays';
import { isHoursProject, monthKey } from './projectHours';

export interface CapacitySummary {
  freeHours: number; freeFte: number; leaveHours: number; leaveFte: number;
  maxHours: number; realHours: number; engineerCount: number; totalFte: number; utilization: number;
}
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const identity = (name: string) => normalize(name);
const isLeave = (code: string) => ['DOVOLENA', 'NEMOC', 'VACATION', 'SICK LEAVE'].includes(normalize(code));

export function projectCapacitySummary(entries: PlanningEntry[], engineers: EngineerInfo[], weeks: string[], mode: 'weeks' | 'months') {
  const people = new Map<string, EngineerInfo | undefined>();
  const byPersonWeek = new Map<string, PlanningEntry>();
  const departed = new Map<string, number>();
  for (const entry of entries) {
    if (entry.isSecondary) continue;
    const name = identity(entry.konstrukter);
    people.set(name, engineers.find(e => e.id === entry.engineer_id || identity(e.display_name) === name));
    const match = entry.cw.match(/^CW(\d+)[-_](\d{4})$/);
    if (!match) continue;
    const week = `CW${match[1].padStart(2, '0')}-${match[2]}`;
    byPersonWeek.set(`${name}|${week}`, entry);
    if (normalize(entry.projekt) === 'DEPARTED') {
      const date = getISOWeekMonday(Number(match[1]), Number(match[2])).getTime();
      departed.set(name, Math.min(departed.get(name) ?? Infinity, date));
    }
  }
  const buckets = new Map<string, { days: number; people: Map<string, { max: number; real: number; leave: number }> }>();
  for (const week of weeks) {
    const match = week.match(/^CW(\d+)[-_](\d{4})$/);
    if (!match) continue;
    const monday = getISOWeekMonday(Number(match[1]), Number(match[2]));
    const targets = new Map<string, { days: number; fraction: number }>();
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday); date.setDate(monday.getDate() + i);
      const key = mode === 'weeks' ? week : monthKey(date);
      const target = targets.get(key) || { days: 0, fraction: 0 };
      if (!isHoliday(date)) target.days++;
      target.fraction += 0.2;
      targets.set(key, target);
    }
    const workingDays = [...targets.values()].reduce((sum, t) => sum + t.days, 0);
    for (const [period, target] of targets) {
      const bucket = buckets.get(period) || { days: 0, people: new Map() };
      bucket.days += target.days;
      for (const [name, engineer] of people) {
        const end = engineer?.end_date ? new Date(`${engineer.end_date}T00:00:00`).getTime() : Infinity;
        if (monday.getTime() > end || monday.getTime() >= (departed.get(name) ?? Infinity)) continue;
        const entry = byPersonWeek.get(`${name}|${week}`);
        if (entry && normalize(entry.projekt) === 'DEPARTED') continue;
        const raw = entry ? (isHoursProject(entry.projekt) ? entry.mhTyden || 0 : 0) + (isHoursProject(entry.projekt2 || '') ? entry.mhTyden2 || 0 : 0) : 0;
        const leaveDays = entry && isLeave(entry.projekt) ? workingDays : Math.min(workingDays, Math.max(0, entry?.leaveDays || 0));
        const leaveHours = workingDays > 0 ? leaveDays * 7.2 * target.days / workingDays : 0;
        const person = bucket.people.get(name) || { max: 0, real: 0, leave: 0 };
        person.max += Math.max(0, target.days * 7.2 - leaveHours);
        person.real += raw * target.fraction;
        person.leave += leaveHours;
        bucket.people.set(name, person);
      }
      buckets.set(period, bucket);
    }
  }
  const result = new Map<string, CapacitySummary>();
  for (const [period, bucket] of buckets) {
    const people = [...bucket.people.values()];
    const maxHours = people.reduce((sum, p) => sum + p.max, 0);
    const realHours = people.reduce((sum, p) => sum + p.real, 0);
    const leaveHours = people.reduce((sum, p) => sum + p.leave, 0);
    const freeHours = people.reduce((sum, p) => sum + Math.max(0, p.max - p.real), 0);
    const cappedReal = people.reduce((sum, p) => sum + Math.min(p.real, p.max), 0);
    const denominator = bucket.days * 7.2;
    result.set(period, { freeHours, freeFte: denominator ? freeHours / denominator : 0, leaveHours, leaveFte: denominator ? leaveHours / denominator : 0, maxHours, realHours, engineerCount: people.filter(p => p.real > 0).length, totalFte: denominator ? realHours / denominator : 0, utilization: maxHours ? cappedReal / maxHours * 100 : 0 });
  }
  return result;
}