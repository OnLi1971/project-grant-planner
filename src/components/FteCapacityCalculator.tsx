import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CALENDAR_MAX_DATE,
  CALENDAR_MIN_DATE,
  calculateRangeFteCapacity,
} from '@/utils/fteCapacityCalendar';

interface FteCapacityCalculatorProps {
  fromDate: string;
  toDate: string;
  peopleInput: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onPeopleInputChange: (value: string) => void;
}

const fmtHours = (n: number) => {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded)
    ? rounded.toLocaleString('cs-CZ')
    : rounded.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const fmtPct = (n: number) =>
  n.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function FteCapacityCalculator({
  fromDate,
  toDate,
  peopleInput,
  onFromDateChange,
  onToDateChange,
  onPeopleInputChange,
}: FteCapacityCalculatorProps) {
  const parsedPeople = useMemo(() => {
    const normalized = peopleInput.trim().replace(',', '.');
    if (!normalized) return Number.NaN;
    return Number(normalized);
  }, [peopleInput]);

  const outcome = useMemo(
    () => calculateRangeFteCapacity(fromDate, toDate, parsedPeople),
    [fromDate, toDate, parsedPeople]
  );

  return (
    <section className="rounded-md border border-border bg-muted/25 p-4 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
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
        </div>

        {outcome.ok && outcome.data ? (
          <div className="rounded-md border border-border bg-background px-4 py-2.5 lg:min-w-[240px] text-left lg:text-right">
            <div className="text-xs text-muted-foreground">
              Výkonné MH ({fmtHours(outcome.data.peopleCount)} {outcome.data.peopleCount === 1 ? 'člověk' : 'lidí'})
            </div>
            <div className="text-2xl font-bold font-mono text-[hsl(var(--calendar-productive))]" data-testid="fte-calc-total-mh">
              {fmtHours(outcome.data.total.productiveHours)} MH
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
    </section>
  );
}