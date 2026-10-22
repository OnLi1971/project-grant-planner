import { fiscalQuarterLabel } from './fiscalQuarter';

const monthNames = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];

/** The revenue calendar uses the same fiscal labels as the capacity chart. */
export function revenueQuarterPeriods(startYear: number, endYear: number) {
  const groups = new Map<string, { key: string; label: string; months: string[]; dateRange: string }>();
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const label = fiscalQuarterLabel(`${year}-${String(month).padStart(2, '0')}`);
      let group = groups.get(label);
      if (!group) {
        const start = new Date(Date.UTC(year, month - 1, 1));
        const end = new Date(Date.UTC(year, month + 2, 0));
        const format = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
        group = { key: label, label, months: [], dateRange: `${format(start)} – ${format(end)} ${end.getUTCFullYear()}` };
        groups.set(label, group);
      }
      group.months.push(`${monthNames[month - 1]}_${year}`);
    }
  }
  return [...groups.values()];
}