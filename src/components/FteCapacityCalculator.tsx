import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CALENDAR_MAX_DATE,
  CALENDAR_MIN_DATE,
  calculateProjectCapacity,
} from '@/utils/fteCapacityCalendar';

const fmtHours = (n: number) => {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded)
    ? rounded.toLocaleString('cs-CZ')
    : rounded.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const fmtPct = (n: number) =>
  n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function FteCapacityCalculator() {
  const [fromDate, onFromDateChange] = useState('2027-01-01');
  const [toDate, onToDateChange] = useState('2027-12-31');
  const [peopleInput, onPeopleInputChange] = useState('1');
  const [rateInput, setRateInput] = useState('');
  const hourlyRate = rateInput.trim() ? Number(rateInput.trim().replace(',', '.')) : 0;
  const parsedPeople = useMemo(() => {
    const normalized = peopleInput.trim().replace(',', '.');
    if (!normalized) return Number.NaN;
    return Number(normalized);
  }, [peopleInput]);

  const outcome = useMemo(
    () => calculateProjectCapacity(fromDate, toDate, parsedPeople, hourlyRate),
    [fromDate, toDate, parsedPeople, hourlyRate]
  );

  return (
    <section className="mt-4 space-y-6 py-4">
      <h2 className="text-xl font-semibold">Výpočet projektu</h2>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1">
          <div className="space-y-1">
            <Label htmlFor="fte-calc-from" className="text-xs font-medium">Datum od</Label>
            <Input
              id="fte-calc-from"
              type="date"
              min={CALENDAR_MIN_DATE}
              max={CALENDAR_MAX_DATE}
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="h-9 bg-background"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fte-calc-to" className="text-xs font-medium">Datum do</Label>
            <Input
              id="fte-calc-to"
              type="date"
              min={CALENDAR_MIN_DATE}
              max={CALENDAR_MAX_DATE}
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="h-9 bg-background"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fte-calc-people" className="text-xs font-medium">Počet lidí (FTE)</Label>
            <Input
              id="fte-calc-people"
              type="text"
              inputMode="decimal"
              value={peopleInput}
              onChange={(e) => onPeopleInputChange(e.target.value)}
              placeholder="např. 5"
              className="h-9 bg-background font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="project-calc-rate" className="text-xs font-medium">Hodinová cena (Kč / MH)</Label>
            <Input id="project-calc-rate" type="text" inputMode="decimal" value={rateInput}
              onChange={e => setRateInput(e.target.value)} placeholder="Zadejte cenu"
              className="h-9 bg-background font-mono" />
          </div>
        </div>

        {outcome.ok && outcome.data ? (
          <div className="rounded-md border border-border bg-background px-4 py-2.5 lg:min-w-[240px] text-left lg:text-right">
            <div className="text-xs text-muted-foreground">
              Výkonné MH ({fmtHours(outcome.data.peopleCount)} {outcome.data.peopleCount === 1 ? 'člověk' : 'lidí'})
            </div>
            <div className="text-2xl font-bold font-mono text-[hsl(var(--calendar-productive))]" data-testid="fte-calc-total-mh">
              {fmtHours(outcome.data.total.productiveHours)} MH
            </div>
            <div className="text-lg font-semibold font-mono text-[hsl(var(--calendar-holiday))]" data-testid="project-calc-total-czk">
              {rateInput.trim() ? `${fmtHours(outcome.data.totalPrice)} Kč` : '— Kč'}
            </div>
          </div>
        ) : (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive lg:max-w-xs">
            {outcome.error}
          </div>
        )}
      </div>

      {outcome.ok && outcome.data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-border">
          <div>
            <div className="text-muted-foreground">Pracovní dny (po svátcích)</div>
            <div className="font-mono font-semibold text-sm">
              {outcome.data.workingDays} dnů <span className="text-muted-foreground font-normal">(svátky: {outcome.data.holidayDays})</span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Fond po svátcích</div>
            <div className="font-mono font-semibold text-sm">
              {fmtHours(outcome.data.total.workingFundAfterHolidays)} MH
              <span className="text-muted-foreground font-normal"> ({fmtHours(outcome.data.perFte.workingFundAfterHolidays)} / FTE)</span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Dovolená + Nemoc / SD</div>
            <div className="font-mono font-semibold text-sm">
              -{fmtHours(outcome.data.total.vacationHours + outcome.data.total.sickAndSickDayHours)} MH
              <span className="text-muted-foreground font-normal"> (-{fmtHours(outcome.data.perFte.vacationHours + outcome.data.perFte.sickAndSickDayHours)} / FTE)</span>
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Výkonné na 1 FTE</div>
            <div className="font-mono font-semibold text-sm">
              {fmtHours(outcome.data.perFte.productiveHours)} MH
              <span className="text-muted-foreground font-normal"> ({fmtPct(outcome.data.perFte.utilizationPct)} %)</span>
            </div>
          </div>
        </div>
      )}
      {outcome.ok && outcome.data && (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {(['productiveHours', 'price'] as const).map(key => (
              <div key={key} className="min-w-0">
                <h3 className="font-semibold mb-3">{key === 'productiveHours' ? 'Měsíční kapacita [MH]' : 'Měsíční hodnota [Kč]'}</h3>
                <div className="h-[340px] w-full" data-testid={`project-chart-${key}`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={outcome.data.months} margin={{ top: 16, right: 12, left: 4, bottom: 40 }}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" interval="preserveStartEnd" angle={-35} textAnchor="end" height={65} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <YAxis width={72} tickFormatter={n => new Intl.NumberFormat('cs-CZ', { notation: 'compact' }).format(n)} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip formatter={(value: number) => [fmtHours(value), key === 'productiveHours' ? 'MH' : 'Kč']}
                        contentStyle={{ background: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))', borderRadius: 6 }}
                        cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
                      <Bar dataKey={key} fill={key === 'productiveHours' ? 'hsl(var(--calendar-productive))' : 'hsl(var(--calendar-holiday))'} maxBarSize={48} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted">
                <tr><th className="p-3 text-left">Měsíc</th><th className="p-3 text-right">Výkonné MH</th><th className="p-3 text-right">Hodnota (Kč)</th></tr>
              </thead>
              <tbody>
                {outcome.data.months.map(month => (
                  <tr key={month.month} className="border-t border-border odd:bg-background even:bg-muted/25">
                    <td className="p-3">{month.label}</td>
                    <td className="p-3 text-right font-mono">{fmtHours(month.productiveHours)}</td>
                    <td className="p-3 text-right font-mono">{rateInput.trim() ? fmtHours(month.price) : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted font-semibold border-t border-border">
                <tr><td className="p-3">CELKEM</td><td className="p-3 text-right font-mono">{fmtHours(outcome.data.total.productiveHours)}</td><td className="p-3 text-right font-mono">{rateInput.trim() ? fmtHours(outcome.data.totalPrice) : '—'}</td></tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </section>
  );
}