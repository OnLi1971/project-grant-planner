import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FteCapacityCalculator } from '@/components/FteCapacityCalculator';
import { buildFteCapacityCalendar, type MonthlyFteCapacity, type SupportedCalendarYear } from '@/utils/fteCapacityCalendar';

const YEARS: SupportedCalendarYear[] = [2026, 2027];
const fmtInt = (n: number) => Math.round(n).toLocaleString('cs-CZ');
const fmtDec = (n: number, digits = 1) => n.toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const fmtQuarter = (n: number) => Number.isInteger(n) ? fmtInt(n) : fmtDec(n, 1);

interface BarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: number | string;
  index?: number;
  months: MonthlyFteCapacity[];
}

function renderProductiveBarLabel({ x, y, width, height, value, index, months }: BarLabelProps) {
  const nx = Number(x ?? 0);
  const ny = Number(y ?? 0);
  const nw = Number(width ?? 0);
  const nh = Number(height ?? 0);
  if (nh < 28 || nw < 22) return null;
  const pct = index !== undefined ? Math.round(months[index]?.utilizationPct ?? 0) : 0;
  const cx = nx + nw / 2;
  const cy = ny + nh / 2;
  return (
    <text x={cx} y={cy} textAnchor="middle" fill="hsl(var(--success-foreground))" fontSize={10} fontWeight={700}>
      <tspan x={cx} dy="-0.35em">{value} h</tspan>
      <tspan x={cx} dy="1.25em">({pct}%)</tspan>
    </text>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: { payload: MonthlyFteCapacity }[];
  label?: string;
}

function renderCalendarTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded-md border border-border bg-popover p-3 text-popover-foreground shadow-lg text-xs min-w-[200px] space-y-1">
      <div className="font-bold border-b border-border pb-1">{label} ({row.weekdays} prac. dnů)</div>
      <div className="flex justify-between gap-4"><span>Výkonné hodiny</span><span className="font-mono font-semibold">{row.productiveHours} h ({Math.round(row.utilizationPct)}%)</span></div>
      <div className="flex justify-between gap-4"><span>Dovolená</span><span className="font-mono">{row.vacationHours} h</span></div>
      <div className="flex justify-between gap-4"><span>Nemoc + Sick Day</span><span className="font-mono">{row.sickAndSickDayHours} h</span></div>
      <div className="flex justify-between gap-4"><span>Svátky</span><span className="font-mono">{row.holidayHours} h</span></div>
      <div className="flex justify-between gap-4 border-t border-border pt-1 font-semibold"><span>Fond po svátcích</span><span className="font-mono">{row.workingFundAfterHolidays} h</span></div>
    </div>
  );
}

export function FteCapacityCalendar() {
  const [year, setYear] = useState<SupportedCalendarYear>(2027);
  const [fromDate, setFromDate] = useState('2027-01-01');
  const [toDate, setToDate] = useState('2027-12-31');
  const [peopleInput, setPeopleInput] = useState('1');
  const cal = useMemo(() => buildFteCapacityCalendar(year), [year]);

  const handleYearChange = (nextYear: SupportedCalendarYear) => {
    setYear(nextYear);
    setFromDate(`${nextYear}-01-01`);
    setToDate(`${nextYear}-12-31`);
  };

  return (
    <div className="mt-4 space-y-4">
      <Card className="shadow-card-custom">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
          <CardTitle className="text-xl">Měsíční kapacita {year} (1 FTE)</CardTitle>
          <div className="flex items-center gap-1">
            {YEARS.map((y) => (
              <Button key={y} size="sm" variant={year === y ? 'default' : 'outline'} onClick={() => handleYearChange(y)} className="h-8 px-4">
                {y}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <FteCapacityCalculator
            fromDate={fromDate}
            toDate={toDate}
            peopleInput={peopleInput}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onPeopleInputChange={setPeopleInput}
          />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-6 space-y-5 min-w-0">
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-muted text-foreground border-b border-border">
                    <th className="p-2 text-left font-semibold">Měsíc</th>
                    <th className="p-2 text-right font-semibold">Svátky (h)</th>
                    <th className="p-2 text-right font-semibold">Pracovní fond po svátcích (h)</th>
                    <th className="p-2 text-right font-semibold">Dovolená (h)</th>
                    <th className="p-2 text-right font-semibold">Nemoc + Sick Day (h)</th>
                    <th className="p-2 text-right font-semibold">Výkonné hodiny</th>
                    <th className="p-2 text-right font-semibold">Využití fondu</th>
                    <th className="p-2 text-center font-semibold border-l border-border" colSpan={2}>Průměr Q</th>
                  </tr>
                </thead>
                <tbody>
                  {cal.months.map((m, idx) => {
                    const quarter = idx % 3 === 0 ? cal.quarters[idx / 3] : undefined;
                    return (
                      <tr key={m.monthIndex} className="border-b border-border odd:bg-background even:bg-muted/30">
                        <td className="px-2 py-1.5 font-medium whitespace-nowrap">{m.monthName}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{m.holidayHours}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{m.workingFundAfterHolidays}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{m.vacationHours}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{m.sickAndSickDayHours}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold">{m.productiveHours}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{Math.round(m.utilizationPct)}%</td>
                        {quarter && (
                          <>
                            <td rowSpan={3} className="px-2 py-1.5 text-center font-mono font-semibold border-l border-border bg-[hsl(var(--calendar-highlight))] text-[hsl(var(--calendar-highlight-foreground))]">
                              {fmtQuarter(quarter.avgProductiveHours)}
                            </td>
                            <td rowSpan={3} className="px-2 py-1.5 text-center font-semibold border-l border-border bg-muted/40">
                              {quarter.quarter}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-bold border-t-2 border-border">
                    <td className="px-2 py-2">CELKEM</td>
                    <td className="px-2 py-2 text-right font-mono">{fmtInt(cal.holidayHours)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmtInt(cal.workingFundAfterHolidays)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmtInt(cal.vacationHours)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmtInt(cal.totalSickAndSickDayHours)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmtInt(cal.productiveHours)}</td>
                    <td className="px-2 py-2 text-right font-mono">{fmtDec(cal.totalUtilizationPct, 2)}%</td>
                    <td colSpan={2} className="px-2 py-2 text-center font-mono border-l border-border bg-[hsl(var(--calendar-highlight))] text-[hsl(var(--calendar-highlight-foreground))]">
                      Ø {fmtDec(cal.avgPerMonth, 1)} h/měs.
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="max-w-sm rounded-md border border-border overflow-hidden">
              <div className="px-3 py-2 bg-muted font-semibold text-sm border-b border-border">Finální roční souhrn {year}</div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-1.5 text-left font-semibold">Položka</th>
                    <th className="px-3 py-1.5 text-right font-semibold">Hodiny</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border"><td className="px-3 py-1.5">Teoretický fond ({cal.theoreticalDays} dnů)</td><td className="px-3 py-1.5 text-right font-mono">{fmtInt(cal.theoreticalHours)}</td></tr>
                  <tr className="border-b border-border"><td className="px-3 py-1.5">Státní svátky</td><td className="px-3 py-1.5 text-right font-mono">-{fmtInt(cal.holidayHours)}</td></tr>
                  <tr className="border-b border-border bg-muted/40 font-semibold"><td className="px-3 py-1.5">Fond po svátcích</td><td className="px-3 py-1.5 text-right font-mono">{fmtInt(cal.workingFundAfterHolidays)}</td></tr>
                  <tr className="border-b border-border"><td className="px-3 py-1.5">Dovolená ({cal.vacationDays} dní)</td><td className="px-3 py-1.5 text-right font-mono">-{fmtInt(cal.vacationHours)}</td></tr>
                  <tr className="border-b border-border"><td className="px-3 py-1.5">Nemoc ({cal.sickDays} dní)</td><td className="px-3 py-1.5 text-right font-mono">-{fmtInt(cal.sickHours)}</td></tr>
                  <tr className="border-b border-border"><td className="px-3 py-1.5">Sick Day ({cal.sickDayDays} den)</td><td className="px-3 py-1.5 text-right font-mono">-{fmtInt(cal.sickDayHours)}</td></tr>
                  <tr className="bg-muted font-bold text-sm"><td className="px-3 py-2">Výkonná kapacita {year}</td><td className="px-3 py-2 text-right font-mono">{fmtInt(cal.productiveHours)} h</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:col-span-6 min-w-0">
            <h3 className="text-base font-semibold text-center mb-2">Kapacita 1 FTE v roce {year}</h3>
            <div className="h-[460px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cal.months} margin={{ top: 12, right: 12, left: 4, bottom: 48 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="monthName" angle={-35} textAnchor="end" interval={0} height={60} tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                  <YAxis domain={[0, 200]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} label={{ value: 'Hodiny', angle: -90, position: 'insideLeft', style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 } }} />
                  <Tooltip content={renderCalendarTooltip as never} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                  <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 12, fontSize: 12 }} />
                  <Bar dataKey="productiveHours" name="Výkonné hodiny" stackId="fte" fill="hsl(var(--calendar-productive))" stroke="hsl(var(--foreground) / 0.35)" strokeWidth={1}>
                    <LabelList dataKey="productiveHours" content={(props) => renderProductiveBarLabel({ ...props, months: cal.months })} />
                  </Bar>
                  <Bar dataKey="vacationHours" name="Dovolená" stackId="fte" fill="hsl(var(--calendar-vacation))" stroke="hsl(var(--foreground) / 0.35)" strokeWidth={1} />
                  <Bar dataKey="sickAndSickDayHours" name="Nemoc + Sick Day" stackId="fte" fill="hsl(var(--calendar-sick))" stroke="hsl(var(--foreground) / 0.35)" strokeWidth={1} />
                  <Bar dataKey="holidayHours" name="Svátky" stackId="fte" fill="hsl(var(--calendar-holiday))" stroke="hsl(var(--foreground) / 0.35)" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}