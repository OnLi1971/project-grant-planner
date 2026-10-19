export type DistributionProfile = 'even' | 'ramp-up' | 's-curve' | 'ramp-down';

export interface MonthHours { month: string; hours: number }

export function profileWeights(n: number, profile: DistributionProfile): number[] {
  return Array.from({ length: n }, (_, i) => {
    const x = n === 1 ? 0.5 : i / (n - 1);
    switch (profile) {
      case 'ramp-up': return 0.4 + x;
      case 'ramp-down': return 1.4 - x;
      case 's-curve': return 0.3 + Math.sin(Math.PI * (0.1 + 0.8 * x));
      default: return 1;
    }
  });
}

/** Integer split by largest remainder; result sums exactly to total. */
export function splitByWeights(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!weights.length) return [];
  if (sum <= 0) return splitByWeights(total, weights.map(() => 1));
  const raw = weights.map(w => (total * w) / sum);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - Math.floor(r), i] as const).sort((a, b) => b[0] - a[0]);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) out[order[k][1]]++;
  return out;
}

export function distribute(budget: number, months: string[], profile: DistributionProfile): MonthHours[] {
  const hours = splitByWeights(Math.max(0, Math.round(budget)), profileWeights(months.length, profile));
  return months.map((month, i) => ({ month, hours: hours[i] }));
}

/** Set one month and redistribute the difference across unlocked other months so the total stays = budget. */
export function rebalance(plan: MonthHours[], index: number, value: number, locked: Set<string>, budget: number): MonthHours[] {
  const fixed = plan.map((m, i) => i === index || locked.has(m.month));
  const fixedSum = plan.reduce((s, m, i) => s + (i === index ? 0 : fixed[i] ? m.hours : 0), 0);
  const v = Math.max(0, Math.min(Math.round(value), budget - fixedSum));
  const freeIdx = plan.map((_, i) => i).filter(i => !fixed[i]);
  const result = plan.map((m, i) => (i === index ? { ...m, hours: v } : { ...m }));
  if (!freeIdx.length) return result;
  const remaining = Math.max(0, budget - fixedSum - v);
  const weights = freeIdx.map(i => plan[i].hours);
  const split = splitByWeights(remaining, weights);
  freeIdx.forEach((i, k) => { result[i].hours = split[k]; });
  return result;
}
