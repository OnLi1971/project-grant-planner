import { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
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
}

/** Monthly FTE demand split into Realizace / Presales vs. max productive engineer count. */
export function ProjectCapacityChart({ entries, engineers, weeks, demand, statusByProject }: Props) {
  const data = useMemo(() => {
    const current = monthKey(new Date());
    const hours = projectHours(entries, weeks, 'months');
    const plan = projectDemand(demand, weeks, 'months');
    const summary = projectCapacitySummary(entries, engineers, weeks, 'months');
    const months = [...summary.keys()].filter(m => m >= current).sort();
    const isPresales = (code: string) => (statusByProject.get(code) || '').toLowerCase().includes('pre');
    return months.map(m => {
      const s = summary.get(m)!;
      const fteHours = s.maxEngineerCount ? s.maxHours / s.maxEngineerCount : 0;
      let real = 0, pre = 0;
      const add = (code: string, h: number) => { if (isPresales(code)) pre += h; else real += h; };
      hours.forEach((byMonth, code) => add(code, byMonth.get(m) || 0));
      plan.forEach((byMonth, code) => add(code, byMonth.get(m) || 0));
      const toFte = (h: number) => (fteHours ? Math.round((h / fteHours) * 10) / 10 : 0);
      const [y, mo] = m.split('-').map(Number);
      return { month: format(new Date(y, mo - 1, 1), 'MMM yy'), realizace: toFte(real), presales: toFte(pre), capacity: s.maxEngineerCount };
    });
  }, [entries, engineers, weeks, demand, statusByProject]);

  return (
    <Card>
      <CardHeader><CardTitle className="text-xl">Capacity vs. demand [FTE]</CardTitle></CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} />
              <Legend />
              <Bar dataKey="realizace" name="Realizace" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="presales" name="Presales" stackId="a" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              <Line dataKey="capacity" name="Max productive engineering count" type="monotone" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
