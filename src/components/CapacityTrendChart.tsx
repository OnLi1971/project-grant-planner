import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { usePlanning } from '@/contexts/PlanningContext';
import { RAIL_EL_ENGINEERS } from '@/constants/railElEngineers';
import { normalizeName } from '@/utils/nameNormalization';
import { getWorkingDaysInCW, getISOWeekMonday, getISOWeeksInYear } from '@/utils/workingDays';
import { format, getWeek } from 'date-fns';
import { BarChart3 } from 'lucide-react';

const HOURS_PER_DAY = 7.2;

const norm = (p?: string) =>
  (p || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
const isNonCounted = (p?: string) => {
  const a = norm(p);
  return a === 'FREE' || a === 'OVER' || a === 'DEPARTED' || a === '';
};
const isFullWeekLeave = (p?: string) => {
  const a = norm(p);
  return a === 'DOVOLENA' || a === 'NEMOC' || a === 'VACATION' || a === 'SICK LEAVE';
};
const productiveHours = (projekt?: string, hours?: number) =>
  isNonCounted(projekt) || isFullWeekLeave(projekt) ? 0 : hours || 0;

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const parseWeek = (cw: string) => {
  const m = cw.match(/CW(\d+)[-_](\d{4})/);
  return m ? { week: parseInt(m[1]), year: parseInt(m[2]) } : null;
};

const monthOfWeek = (cw: string) => {
  const p = parseWeek(cw);
  if (!p) return null;
  const monday = getISOWeekMonday(p.week, p.year);
  const thu = new Date(monday);
  thu.setDate(monday.getDate() + 3);
  return { month: thu.getMonth(), year: thu.getFullYear() };
};

interface Bucket {
  key: string;
  label: string;
  sort: number;
  maxHours: number;
  realHours: number;
  leaveHours: number;
  freeHours: number;
  engineers: Set<string>;
}

export const CapacityTrendChart: React.FC = () => {
  const { planningData } = usePlanning();
  const [view, setView] = useState<'weeks' | 'months'>('weeks');
  const [horizon, setHorizon] = useState<number>(26);

  const allowed = useMemo(
    () => new Set(RAIL_EL_ENGINEERS.map(n => normalizeName(n))),
    []
  );

  const weekKeys = useMemo(() => {
    const now = new Date();
    let w = getWeek(now, { weekStartsOn: 1, firstWeekContainsDate: 4 });
    let y = now.getFullYear();
    const list: string[] = [];
    for (let i = 0; i < horizon; i++) {
      list.push(`CW${String(w).padStart(2, '0')}-${y}`);
      w++;
      if (w > getISOWeeksInYear(y)) { w = 1; y++; }
    }
    return list;
  }, [horizon]);

  const data = useMemo(() => {
    const weekSet = new Set(weekKeys);
    const buckets = new Map<string, Bucket>();

    const bucketFor = (cw: string): Bucket | null => {
      const p = parseWeek(cw);
      if (!p) return null;
      if (view === 'weeks') {
        const key = cw;
        if (!buckets.has(key)) {
          const monday = getISOWeekMonday(p.week, p.year);
          const friday = new Date(monday);
          friday.setDate(monday.getDate() + 4);
          buckets.set(key, {
            key,
            label: `CW${String(p.week).padStart(2, '0')}`,
            sort: p.year * 100 + p.week,
            maxHours: 0, realHours: 0, leaveHours: 0, freeHours: 0,
            engineers: new Set(),
          });
          (buckets.get(key) as any).sub = `${format(monday, 'd.M.')}–${format(friday, 'd.M.')}`;
        }
        return buckets.get(key)!;
      }
      const mi = monthOfWeek(cw);
      if (!mi) return null;
      const key = `${mi.year}-${mi.month}`;
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          label: `${MONTHS_EN[mi.month]} ${String(mi.year).slice(-2)}`,
          sort: mi.year * 100 + mi.month,
          maxHours: 0, realHours: 0, leaveHours: 0, freeHours: 0,
          engineers: new Set(),
        });
      }
      return buckets.get(key)!;
    };

    // Group entries per engineer+week (primary + secondary rows already split)
    const perEngWeek = new Map<string, { projekt: string; hours: number; leaveDays: number; real: number }>();
    for (const e of planningData) {
      if (!allowed.has(normalizeName(e.konstrukter))) continue;
      if (!weekSet.has(e.cw)) continue;
      const k = `${normalizeName(e.konstrukter)}|${e.cw}`;
      const cur = perEngWeek.get(k);
      const real = productiveHours(e.projekt, e.mhTyden);
      if (!cur) {
        perEngWeek.set(k, {
          projekt: e.projekt,
          hours: e.mhTyden || 0,
          leaveDays: e.leaveDays || 0,
          real,
        });
      } else {
        cur.real += real;
        if (isFullWeekLeave(e.projekt)) cur.projekt = e.projekt;
        cur.leaveDays = Math.max(cur.leaveDays, e.leaveDays || 0);
      }
    }

    perEngWeek.forEach((v, k) => {
      const cw = k.split('|')[1];
      const p = parseWeek(cw);
      if (!p) return;
      const b = bucketFor(cw);
      if (!b) return;
      const workDays = getWorkingDaysInCW(p.week, p.year);
      const weekMax = workDays * HOURS_PER_DAY;
      if (norm(v.projekt) === 'DEPARTED') return;

      b.engineers.add(k.split('|')[0]);

      if (isFullWeekLeave(v.projekt)) {
        b.leaveHours += weekMax;
        return;
      }
      const real = Math.min(weekMax, v.real);
      // leave nesmí "sežrat" reálně naplánované hodiny (data mohou mít obojí)
      const partialLeave = Math.min(
        Math.min(workDays, v.leaveDays || 0) * HOURS_PER_DAY,
        Math.max(0, weekMax - real)
      );
      const engMax = Math.max(0, weekMax - partialLeave);
      b.leaveHours += partialLeave;
      b.maxHours += engMax;
      b.realHours += real;
      b.freeHours += Math.max(0, engMax - real);
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.sort - b.sort)
      .map(b => ({
        label: b.label,
        sub: (b as any).sub as string | undefined,
        'Real productive [MH]': Math.round(b.realHours),
        'Free capacity [MH]': Math.round(b.freeHours),
        'Leave [MH]': Math.round(b.leaveHours),
        'Utilization [%]': b.maxHours > 0 ? Math.round((b.realHours / b.maxHours) * 100) : 0,
        engineerCount: b.engineers.size,
        maxHours: Math.round(b.maxHours),
      }));
  }, [planningData, weekKeys, view, allowed]);

  const axisStyle = { fontSize: 13, fontWeight: 600, fill: 'hsl(var(--foreground))' };

  // Sloupce tabulky přesně pod sloupci grafu: pevná šířka kategorie + levý
  // sloupec tabulky stejně široký jako prostor vlevo od plotu grafu.
  const LABEL_COL = 190; // šířka sloupce "Metric"
  const AXIS_W = 48; // šířka obou os Y
  const colW = view === 'weeks' ? 62 : 92;
  const plotW = data.length * colW;
  const chartW = LABEL_COL + plotW + AXIS_W; // plot začíná na x = LABEL_COL
  const tableW = LABEL_COL + plotW;
  const wrapW = Math.max(chartW, 900);

  return (
    <Card className="shadow-card-custom">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Capacity Overview — RAIL + EL
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Real productive, free capacity and leave hours per {view === 'weeks' ? 'week' : 'month'} (100% = 7.2 h / working day)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={view === 'weeks' ? 'default' : 'outline'} onClick={() => setView('weeks')}>
              Weeks
            </Button>
            <Button size="sm" variant={view === 'months' ? 'default' : 'outline'} onClick={() => setView('months')}>
              Months
            </Button>
            <Button size="sm" variant="outline" onClick={() => setHorizon(h => (h === 26 ? 52 : 26))}>
              {horizon === 26 ? '6 months' : '12 months'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div style={{ width: wrapW, minWidth: '100%' }}>
          <ComposedChart width={chartW} height={460} data={data} margin={{ top: 16, right: 0, left: LABEL_COL - AXIS_W, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={axisStyle}
              tickLine={{ stroke: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--foreground))' }}
              angle={view === 'weeks' ? -45 : 0}
              textAnchor={view === 'weeks' ? 'end' : 'middle'}
              height={view === 'weeks' ? 60 : 40}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              width={AXIS_W}
              tick={axisStyle}
              tickLine={{ stroke: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--foreground))' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              width={AXIS_W}
              domain={[0, 120]}
              tick={axisStyle}
              tickLine={{ stroke: 'hsl(var(--foreground))' }}
              axisLine={{ stroke: 'hsl(var(--foreground))' }}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                color: 'hsl(var(--popover-foreground))',
                padding: '10px 12px',
              }}
              labelFormatter={(l, payload: any) => {
                const p = payload?.[0]?.payload;
                return p?.sub ? `${l} (${p.sub})` : l;
              }}
              formatter={(value: number, name: string, item: any) => {
                if (name === 'Utilization [%]') return [`${value}%`, name];
                return [`${value} h`, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 13, fontWeight: 600, paddingTop: 8 }} />
            <Bar yAxisId="left" dataKey="Real productive [MH]" stackId="a" fill="hsl(var(--primary))" />
            <Bar yAxisId="left" dataKey="Free capacity [MH]" stackId="a" fill="hsl(var(--chart-2, 142 71% 45%)" />
            <Bar yAxisId="left" dataKey="Leave [MH]" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="Utilization [%]"
              stroke="hsl(0 72% 55%)"
              strokeWidth={3}
              dot={{ r: 3 }}
            />
          </ComposedChart>

          <table
            className="text-sm border-collapse table-fixed"
            style={{ width: tableW }}
          >
            <thead>
              <tr>
                <th
                  className="border border-border p-2 text-left bg-muted/50"
                  style={{ width: LABEL_COL }}
                >
                  Metric
                </th>
                {data.map(d => (
                  <th key={d.label} className="border border-border p-1 text-center bg-muted/50 whitespace-nowrap overflow-hidden">
                    <div className="font-semibold">{d.label}</div>
                    {d.sub && <div className="text-[10px] text-muted-foreground">{d.sub}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {([
                ['Max productive hours', (d: any) => `${d.maxHours}h`],
                ['Real productive hours', (d: any) => `${d['Real productive [MH]']}h`],
                ['Free capacity [MH]', (d: any) => `${d['Free capacity [MH]']}h`],
                ['Leave [MH]', (d: any) => `${d['Leave [MH]']}h`],
                ['Engineer count', (d: any) => d.engineerCount],
                ['Utilization', (d: any) => `${d['Utilization [%]']}%`],
              ] as const).map(([label, fn]) => (
                <tr key={label}>
                  <td className="border border-border p-2 font-medium bg-background">{label}</td>
                  {data.map(d => (
                    <td key={d.label} className="border border-border p-1 text-center whitespace-nowrap">
                      {fn(d) as any}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CapacityTrendChart;
