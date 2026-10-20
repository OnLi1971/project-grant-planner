import { useMemo } from 'react';
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
}

const HUES = [190, 160, 205, 40, 220, 130, 280, 10, 330, 60, 100, 250];
const colorFor = (code: string, i: number) => {
  return getExactProjectColor(code) || `hsl(${HUES[i % HUES.length]} 70% 55%)`;
};

/** Monthly FTE per project (Delivery + Presales stacked) vs. max productive engineer count. */
export function ProjectCapacityChart({ entries, engineers, weeks, demand, statusByProject, blocked = [] }: Props) {
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
      const s = summary.get(m)!;
      const fteHours = s.maxEngineerCount ? s.maxHours / s.maxEngineerCount : 0;
      const row: Record<string, number | string> = { month: format(new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1), 'MMM yy'), capacity: 0, blockedFte: 0 };
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
          <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color, opacity: p.presales ? 0.6 : 1 }} />{p.code}</span>
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
      <CardHeader><CardTitle className="text-xl">Capacity vs. demand [FTE]</CardTitle></CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip content={renderTooltip as never} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
              {projects.map((p, i) => <Bar key={p.code} dataKey={p.code} stackId="a" fill={p.color} fillOpacity={p.presales ? 0.55 : 1} stroke={p.presales ? p.color : undefined} strokeDasharray={p.presales ? '3 2' : undefined}>
                {i === projects.length - 1 && <LabelList dataKey="total" position="top" fill="hsl(var(--foreground))" fontSize={11} fontWeight={700} />}
              </Bar>)}
              <Line dataKey="capacity" name="Max productive engineering count" type="monotone" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Plné sloupce = Delivery, průhledné s čárkovaným okrajem = Presales, červená čára = Max productive engineering count.</p>
      </CardContent>
    </Card>
  );
}
