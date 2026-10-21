/** Indian fiscal quarter label (FY starts April, labeled by starting year), e.g. 2026-10 -> "Q3-FY26". */
export function fiscalQuarterLabel(monthKey: string): string {
  const y = Number(monthKey.slice(0, 4));
  const m = Number(monthKey.slice(5, 7));
  const fy = m >= 4 ? y : y - 1;
  const q = m >= 4 ? Math.floor((m - 4) / 3) + 1 : 4;
  return `Q${q}-FY${String(fy).slice(2)}`;
}

/** Averages numeric FTE values of monthly rows into fiscal quarters (FTE per quarter = mean of its months). */
export function toQuarterRows(rows: Record<string, number | string>[]): Record<string, number | string>[] {
  const groups = new Map<string, Record<string, number | string>[]>();
  rows.forEach(r => {
    const label = fiscalQuarterLabel(String(r.key));
    groups.set(label, [...(groups.get(label) || []), r]);
  });
  return [...groups.entries()].map(([label, items]) => {
    const out: Record<string, number | string> = { month: label, key: label };
    const keys = new Set(items.flatMap(i => Object.keys(i).filter(k => typeof i[k] === 'number')));
    keys.forEach(k => {
      const v = items.reduce((s, i) => s + (Number(i[k]) || 0), 0) / items.length;
      out[k] = Math.round(v * 10) / 10;
    });
    return out;
  });
}
