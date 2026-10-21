export interface PeriodProject { code: string; presales: boolean; fte: number }

/** Builds an English, rule-based summary of one chart period (FTE values). */
export function capacityPeriodSummary(label: string, projects: PeriodProject[], capacity: number, blocked = 0): string {
  const r = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  const delivery = projects.filter(p => !p.presales).reduce((s, p) => s + p.fte, 0);
  const presales = projects.filter(p => p.presales).reduce((s, p) => s + p.fte, 0);
  const demand = delivery + presales;
  const diff = capacity - demand;
  const parts = [`${label}: Demand is ${r(demand)} FTE (Delivery ${r(delivery)}, Presales ${r(presales)}) against ${r(capacity)} FTE available capacity.`];
  if (Math.abs(diff) < 0.05) parts.push('Demand exactly matches capacity.');
  else if (diff > 0) parts.push(`Surplus of ${r(diff)} FTE – free engineers available for new work.`);
  else parts.push(`Shortage of ${r(-diff)} FTE – additional engineers or re-planning needed.`);
  const top = [...projects].sort((a, b) => b.fte - a.fte).slice(0, 3);
  if (top.length) parts.push(`Largest projects: ${top.map(p => `${p.code} ${r(p.fte)}`).join(', ')}.`);
  if (blocked > 0) parts.push(`${r(blocked)} FTE is blocked by other programs.`);
  if (capacity > 0) parts.push(`Without presales the team is at ${Math.round((delivery / capacity) * 100)} % of capacity.`);
  return parts.join(' ');
}
