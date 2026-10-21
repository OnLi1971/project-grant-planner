import { useId, useMemo, useState } from 'react';
import { capacityPeriodSummary } from '@/utils/capacityPeriodSummary';
import { toQuarterRows } from '@/utils/fiscalQuarter';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } from 'recharts';
import { format } from 'date-fns';
import { getExactProjectColor } from '@/utils/colorSystem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EngineerInfo, PlanningEntry } from '@/types/planning';
import { monthKey, projectHours } from '@/utils/projectHours';
import { projectCapacitySummary } from '@/utils/projectCapacitySummary';
import { projectDemand, type MonthlyDemand } from '@/utils/projectDemand';

interface Props {
  entries: PlanningEntry[];
  engineers: EngineerInfo[];
  weeks: string[];
  demand: MonthlyDemand[];
  statusByProject: Map<string, string>;
  blocked?: PlanningEntry[];
  /** Table geometry: left offset of first month column and month column width. */
  align?: { first: number; col: number } | null;
}

const HUES = [190, 160, 205, 40, 220, 130, 280, 10, 330, 60, 100, 250];
const colorFor = (code: string, i: number) => {
  return getExactProjectColor(code) || `hsl(${HUES[i % HUES.length]} 70% 55%)`;
};

/** Monthly FTE per project (Delivery + Presales stacked) vs. max productive engineer count. */
export function ProjectCapacityChart({ entries, engineers, weeks, demand, statusByProject, blocked = [], align }: Props) {
  const patternPrefix = useId().replace(/:/g, '');
  const { data, projects } = useMemo(() => {
    const current = monthKey(new Date());
    const hours = projectHours(entries, weeks, 'months');
    const plan = projectDemand(demand, weeks, 'months');
    const blockedHours = projectHours(blocked, weeks, 'months');
    const summary = projectCapacitySummary(entries, engineers, weeks, 'months');
    const months = [...summary.keys()].filter(m => m >= current).sort();
    const codes = [...new Set([...hours.keys(), ...plan.keys()])];
    const isPresales = (code: string) => (statusByProject.get(code) || '').toLowerCase().includes('pre');
    const totals = new Map<string, number>();
    const data = months.map(m => {
      const s = summary.get(m);
      if (!s) return { month: m, key: m, capacity: 0, blockedFte: 0, total: 0 };
      const fteHours = s.maxEngineerCount ? s.maxHours / s.maxEngineerCount : 0;
      const row: Record<string, number | string> = { month: format(new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1), 'MMM yy'), key: m, capacity: 0, blockedFte: 0 };
      const b = [...blockedHours.values()].reduce((sum, r) => sum + (r.get(m) || 0), 0);
      const blockedFte = fteHours ? Math.min(s.maxEngineerCount, b / fteHours) : 0;
      row.blockedFte = Math.round(blockedFte * 10) / 10;
      row.capacity = Math.round((s.maxEngineerCount - blockedFte) * 10) / 10;
      let total = 0;
      codes.forEach(code => {
        const h = (hours.get(code)?.get(m) || 0) + (plan.get(code)?.get(m) || 0);
        const fte = fteHours ? Math.round((h / fteHours) * 10) / 10 : 0;
        if (fte > 0) { row[code] = fte; total += fte; totals.set(code, (totals.get(code) || 0) + fte); }
      });
      row.total = Math.round(total * 10) / 10;
      return row;
    });
    const used = codes.filter(c => totals.get(c));
    const ordered = [...used.filter(c => !isPresales(c)), ...used.filter(isPresales)]
      .map((code, i) => ({ code, presales: isPresales(code), color: colorFor(code, i) }));
    return { data, projects: ordered };
  }, [entries, engineers, weeks, demand, statusByProject, blocked]);
  const [period, setPeriod] = useState<'months' | 'quarters'>('months');
  const chartData = useMemo(() => period === 'quarters' ? toQuarterRows(data as Record<string, number | string>[]) : data, [data, period]);
  const [selected, setSelected] = useState<string | null>(null);
  const aligned = !!align && period === 'months';
  const selectedRow = selected ? (chartData as Record<string, number | string>[]).find(r => r.month === selected) : undefined;

  const renderTooltip = ({ active, payload, label }: { active?: boolean; payload?: { payload: Record<string, number> }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload;
    const group = (presales: boolean) => projects.filter(p => p.presales === presales && row[p.code]).sort((a, b) => row[b.code] - row[a.code]);
    const block = (title: string, items: typeof projects) => {
      if (!items.length) return null;
      const sum = items.reduce((s, p) => s + row[p.code], 0);
      return <div className="mt-2">
        <div className="text-xs font-semibold text-muted-foreground mb-1">{title} ({sum.toFixed(1)} FTE)</div>
        {items.map(p => <div key={p.code} className="flex items-center justify-between gap-6 text-xs">
          <span className="flex items-center gap-2"><svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" aria-hidden="true"><rect width="12" height="12" fill={p.color} fillOpacity={p.presales ? 0.25 : 1} />{p.presales && <path d="M-3 3L3-3M0 12L12 0M9 15L15 9" stroke={p.color} strokeWidth="2" />}</svg>{p.code}</span>
          <span className="font-mono">{row[p.code].toFixed(1)} FTE</span>
        </div>)}
      </div>;
    };
    return <div className="rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg min-w-[220px]">
      <div className="font-bold border-b border-border pb-1">Month: {label}</div>
      {block('DELIVERY', group(false))}
      {block('PRESALES', group(true))}
      <div className="mt-2 border-t border-border pt-1 flex justify-between text-xs font-bold"><span>Total:</span><span className="font-mono">{Number(row.total).toFixed(1)} FTE</span></div>
      <div className="flex justify-between text-xs text-destructive"><span>Capacity:</span><span className="font-mono">{row.capacity} FTE</span></div>
      {row.blockedFte > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Blocked by other programs:</span><span className="font-mono">{row.blockedFte} FTE</span></div>}
    </div>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0"><CardTitle className="text-xl">Capacity vs. demand [FTE]</CardTitle>
        <div className="flex gap-1">{(['months', 'quarters'] as const).map(p => <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'} onClick={() => { setPeriod(p); setSelected(null); }}>{p === 'months' ? 'Months' : 'Quarters'}</Button>)}</div>
      </CardHeader>
      <CardContent>
        <div data-capacity-export>
        {aligned ? <div data-chart-scroll className="overflow-hidden h-96 w-full">
            <ComposedChart width={align ? align.first + chartData.length * align.col : 0} height={384} data={chartData} margin={{ top: 20, right: 0, left: Math.max(0, (align?.first ?? 50) - 50), bottom: 0 }} style={{ cursor: 'pointer' }} onClick={(e: { activeLabel?: string } | null) => e?.activeLabel && setSelected(e.activeLabel)}>
              <defs>
                {projects.filter(p => p.presales).map(p => <pattern key={p.code} id={`${patternPrefix}-${p.code}`} width="7" height="7" patternUnits="userSpaceOnUse">
                  <rect width="7" height="7" fill={p.color} fillOpacity={0.22} />
                  <path d="M-2 2L2-2M0 7L7 0M5 9L9 5" stroke={p.color} strokeWidth="1.5" />
                </pattern>)}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis width={50} stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip content={renderTooltip as never} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              {projects.map((p, i) => <Bar key={p.code} dataKey={p.code} stackId="a" fill={p.presales ? `url(#${patternPrefix}-${p.code})` : p.color} stroke={p.presales ? p.color : undefined} strokeDasharray={p.presales ? '3 2' : undefined}>
                {i === projects.length - 1 && <LabelList dataKey="total" position="top" fill="hsl(var(--foreground))" fontSize={11} fontWeight={700} />}
              </Bar>)}
              <Line dataKey="capacity" name="Max productive engineering count" type="monotone" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
        </div> : <div className="h-96 w-full">
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }} style={{ cursor: 'pointer' }} onClick={(e: { activeLabel?: string } | null) => e?.activeLabel && setSelected(e.activeLabel)}>
              <defs>
                {projects.filter(p => p.presales).map(p => <pattern key={p.code} id={`${patternPrefix}-${p.code}`} width="7" height="7" patternUnits="userSpaceOnUse">
                  <rect width="7" height="7" fill={p.color} fillOpacity={0.22} />
                  <path d="M-2 2L2-2M0 7L7 0M5 9L9 5" stroke={p.color} strokeWidth="1.5" />
                </pattern>)}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip content={renderTooltip as never} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              {projects.map((p, i) => <Bar key={p.code} dataKey={p.code} stackId="a" fill={p.presales ? `url(#${patternPrefix}-${p.code})` : p.color} stroke={p.presales ? p.color : undefined} strokeDasharray={p.presales ? '3 2' : undefined}>
                {i === projects.length - 1 && <LabelList dataKey="total" position="top" fill="hsl(var(--foreground))" fontSize={11} fontWeight={700} />}
              </Bar>)}
              <Line dataKey="capacity" name="Max productive engineering count" type="monotone" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>}
        <div data-capacity-legend className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-2"><svg width="18" height="14" aria-hidden="true"><rect width="18" height="14" fill="hsl(var(--muted-foreground))" /></svg>Delivery</span>
          <span className="flex items-center gap-2"><svg width="18" height="14" aria-hidden="true"><rect width="18" height="14" fill="hsl(var(--muted))" /><path d="M-4 4L4-4M0 14L14 0M7 14L21 0M14 14L28 0" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" /></svg>Presales</span>
          <span className="flex items-center gap-2"><svg width="18" height="14" aria-hidden="true"><path d="M0 7H18" stroke="hsl(var(--destructive))" strokeWidth="3" /></svg>Max engineers available</span>
        </div>
        </div>
        {selectedRow && <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-sm">
          <div className="mb-1 flex items-center justify-between font-semibold"><span>Summary – {String(selectedRow.month)}</span>
            <button type="button" aria-label="Close summary" className="text-muted-foreground hover:text-foreground" onClick={() => setSelected(null)}>✕</button></div>
          <p className="text-muted-foreground">{capacityPeriodSummary(String(selectedRow.month), projects.filter(p => Number(selectedRow[p.code]) > 0).map(p => ({ code: p.code, presales: p.presales, fte: Number(selectedRow[p.code]) })), Number(selectedRow.capacity), Number(selectedRow.blockedFte))}</p>
        </div>}
        {!selectedRow && <p className="mt-2 text-xs text-muted-foreground">Click a column to see a summary of the period.</p>}
      </CardContent>
    </Card>
  );
}
