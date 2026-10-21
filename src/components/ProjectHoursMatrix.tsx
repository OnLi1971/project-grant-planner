import { useMemo, useState } from 'react';
import { format, getISOWeek, getISOWeekYear, addWeeks } from 'date-fns';
import { Grid3x3, History } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectHoursCatalog } from '@/hooks/useProjectHoursCatalog';
import { ProjectHoursFilter, type ProjectHoursFilterValue } from '@/components/ProjectHoursFilter';
import { filterProjectHoursEntries, otherProgramEntries } from '@/utils/projectHoursFilter';
import { readProjectHoursFilter, writeProjectHoursFilter } from '@/utils/projectHoursFilterStorage';
import { getISOWeekMonday } from '@/utils/workingDays';
import { monthKey, projectHours } from '@/utils/projectHours';
import { projectCapacitySummary, type CapacitySummary } from '@/utils/projectCapacitySummary';
import { projectDemand } from '@/utils/projectDemand';
import { useProjectMonthlyPlan } from '@/hooks/useProjectMonthlyPlan';
import { ProjectCapacityChart } from '@/components/ProjectCapacityChart';
import { planningEndYear } from '@/utils/planningHorizon';

const hoursLabel = (hours: number) => new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 }).format(hours);

export function ProjectHoursMatrix() {
  const { planningData, engineers } = usePlanning();
  const { data: catalog, isPending: catalogLoading, isError: catalogError } = useProjectHoursCatalog();
  const { data: monthlyDemand } = useProjectMonthlyPlan();
  const [mode, setMode] = useState<'weeks' | 'months'>('months');
  const [showHistory, setShowHistory] = useState(false);
  const [filter, setFilter] = useState<ProjectHoursFilterValue>(() => {
    try { return readProjectHoursFilter(window.localStorage); }
    catch { return { mode: 'program', programs: ['All'], engineers: [] }; }
  });
  const changeFilter = (value: ProjectHoursFilterValue) => {
    setFilter(value);
    try { writeProjectHoursFilter(window.localStorage, value); } catch { /* Storage may be blocked. */ }
  };
  const engineerNames = useMemo(() => [...new Set([...engineers.map(e => e.display_name), ...planningData.filter(e => !e.isSecondary).map(e => e.konstrukter)])].sort((a, b) => a.localeCompare(b)), [engineers, planningData]);
  const periods = useMemo(() => {
    const now = new Date();
    const currentMonday = getISOWeekMonday(getISOWeek(now), getISOWeekYear(now));
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartMonday = getISOWeekMonday(getISOWeek(firstOfMonth), getISOWeekYear(firstOfMonth));
    const start = showHistory ? addWeeks(currentMonday, -9) : monthStartMonday;
    const endYear = planningEndYear(now);
    const weeks: { key: string; label: string; sub: string; group: string; groupLabel: string; current: boolean }[] = [];
    for (let monday = start; getISOWeekYear(monday) <= endYear; monday = addWeeks(monday, 1)) {
      const thursday = new Date(monday); thursday.setDate(monday.getDate() + 3);
      const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
      const week = getISOWeek(monday);
      weeks.push({ key: `CW${String(week).padStart(2, '0')}-${getISOWeekYear(monday)}`, label: `CW${String(week).padStart(2, '0')}`, sub: `${format(monday, 'd.M.')}–${format(friday, 'd.M.')}`, group: monthKey(thursday), groupLabel: format(thursday, 'MMMM yyyy'), current: monday.getTime() === currentMonday.getTime() });
    }
    const months = new Map<string, { key: string; label: string; sub: string; current: boolean }>();
    for (const week of weeks) {
      const match = week.key.match(/CW(\d+)-(\d+)/);
      if (!match) continue;
      const monday = getISOWeekMonday(Number(match[1]), Number(match[2]));
      for (let day = 0; day < 5; day++) {
        const date = new Date(monday); date.setDate(date.getDate() + day);
        const key = monthKey(date);
        if (date.getFullYear() > endYear) continue;
        if (!showHistory && key < monthKey(now)) continue;
        months.set(key, { key, label: format(date, 'MMM yy'), sub: '', current: key === monthKey(now) });
      }
    }
    return { weeks, months: [...months.values()] };
  }, [showHistory]);
  const filteredData = useMemo(() => {
    if (!catalog) return [];
    return filterProjectHoursEntries(planningData, periods.weeks.map(w => w.key), filter, catalog.programByProject);
  }, [planningData, periods, filter, catalog]);
  const blockedData = useMemo(() => catalog ? otherProgramEntries(planningData, periods.weeks.map(w => w.key), filter, catalog.programByProject) : [], [planningData, periods, filter, catalog]);
  const rows = useMemo(() => projectHours(filteredData, periods.weeks.map(w => w.key), mode), [filteredData, periods, mode]);
  const codes = [...rows.keys()].sort((a, b) => a.localeCompare(b));
  const columns = mode === 'weeks' ? periods.weeks : periods.months;
  const groups = periods.weeks.reduce<{ key: string; label: string; count: number }[]>((all, week) => {
    const previous = all[all.length - 1];
    if (previous?.key === week.group) previous.count++;
    else all.push({ key: week.group, label: week.groupLabel, count: 1 });
    return all;
  }, []);
  const baseSummaries = useMemo(() => projectCapacitySummary(filteredData, engineers, periods.weeks.map(w => w.key), mode), [filteredData, engineers, periods, mode]);
  const demandRows = useMemo(() => {
    if (!monthlyDemand || !catalog) return new Map<string, Map<string, number>>();
    let demand = monthlyDemand;
    if (filter.mode === 'program' && !filter.programs.includes('All')) {
      demand = demand.filter(d => filter.programs.includes(catalog.programByProject.get(d.projectCode) || 'NA'));
    }
    return projectDemand(demand, periods.weeks.map(w => w.key), mode);
  }, [monthlyDemand, catalog, filter, periods, mode]);
  const chartDemand = useMemo(() => {
    if (!monthlyDemand || !catalog) return [];
    if (filter.mode === 'program' && !filter.programs.includes('All')) return monthlyDemand.filter(d => filter.programs.includes(catalog.programByProject.get(d.projectCode) || 'NA'));
    return monthlyDemand;
  }, [monthlyDemand, catalog, filter]);
  const demandCodes = [...demandRows.keys()].sort((a, b) => a.localeCompare(b));
  const demandFor = (period: string) => demandCodes.reduce((sum, code) => sum + (demandRows.get(code)?.get(period) || 0), 0);
  // Plan (demand) hours count as if they were a real order.
  const summaries = useMemo(() => {
    const out = new Map<string, CapacitySummary>();
    baseSummaries.forEach((s, period) => {
      const d = demandCodes.reduce((sum, code) => sum + (demandRows.get(code)?.get(period) || 0), 0);
      const fteHours = s.maxEngineerCount ? s.maxHours / s.maxEngineerCount : 0;
      const realHours = s.realHours + d;
      out.set(period, { ...s, realHours, freeHours: s.freeHours - d, freeFte: s.freeFte - (fteHours ? d / fteHours : 0), totalFte: s.totalFte + (fteHours ? d / fteHours : 0), utilization: s.maxHours ? (realHours / s.maxHours) * 100 : 0 });
    });
    return out;
  }, [baseSummaries, demandRows]);
  const totalFor = (period: string) => codes.reduce((sum, code) => sum + (rows.get(code)?.get(period) || 0), 0) + demandFor(period);
  const balanceFor = (period: string) => summaries.get(period)?.freeFte || 0;
  const metrics: { label: string; key: keyof CapacitySummary; unit: 'hours' | 'fte' | 'count' | 'percent' }[] = [
    { label: 'Free capacity [MH]', key: 'freeHours', unit: 'hours' },
    { label: 'Free capacity [FTE]', key: 'freeFte', unit: 'fte' },
    { label: 'Leave [FTE]', key: 'leaveFte', unit: 'fte' },
    { label: 'Leave [MH]', key: 'leaveHours', unit: 'hours' },
    { label: 'Max productive hours', key: 'maxHours', unit: 'hours' },
    { label: 'Real productive hours', key: 'realHours', unit: 'hours' },
    { label: 'Engineer count', key: 'engineerCount', unit: 'count' },
    { label: 'Max productive engineering count', key: 'maxEngineerCount', unit: 'fte' },
    { label: 'Total FTE', key: 'totalFte', unit: 'fte' },
    { label: 'Utilization', key: 'utilization', unit: 'percent' },
  ];
  const metricLabel = (value: number, unit: typeof metrics[number]['unit']) => unit === 'fte' ? value.toFixed(1) : unit === 'percent' ? `${Math.round(value)}%` : unit === 'hours' ? `${hoursLabel(value)}h` : String(value);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-2xl font-bold"><Grid3x3 className="h-5 w-5 text-primary" />Project Hours Matrix</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant={showHistory ? 'default' : 'outline'} size="sm" onClick={() => setShowHistory(v => !v)}><History className="mr-2 h-4 w-4" />Show history</Button>
              <Select value={mode} onValueChange={value => { if (value === 'weeks' || value === 'months') setMode(value); }}>
                <SelectTrigger className="w-32" aria-label="Period view"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="weeks">Weeks</SelectItem><SelectItem value="months">Months</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProjectHoursFilter value={filter} onChange={changeFilter} names={engineerNames} programs={catalog?.programs.map(p => p.code) || []} />
          <div className="overflow-auto max-h-[85vh]">
            <table className="w-full border-collapse text-xs" aria-label="Project planned hours">
              <thead className="sticky top-0 z-20">
                {mode === 'weeks' && <tr className="h-12">
                  <th className="border-2 border-border bg-background p-2 text-left sticky left-0 z-30 min-w-[200px] text-sm">Project</th>
                  {groups.map((group, index) => <th key={group.key} colSpan={group.count} className={`border-2 border-border bg-background p-2 text-center text-base text-primary ${index ? 'border-l-4 border-l-primary/50' : ''}`}>{group.label}</th>)}
                  <th className="border-2 border-border bg-background p-2 min-w-[90px] text-primary">Total [MH]</th>
                </tr>}
                <tr>
                  <th className="border-2 border-border p-1.5 bg-background text-left sticky left-0 z-30 min-w-[200px]">{mode === 'months' ? 'Project' : ''}</th>
                  {columns.map((period, index) => <th key={period.key} className={`border border-border p-1.5 text-center min-w-[90px] bg-background ${mode === 'weeks' && index > 0 && periods.weeks[index - 1]?.group !== periods.weeks[index]?.group ? 'border-l-4 border-l-primary/50' : ''}`}>
                    <div className="font-semibold text-primary">{period.label}</div>
                    {period.sub && <div className="text-[10px] text-muted-foreground whitespace-nowrap">{period.sub}</div>}
                  </th>)}
                  <th className="border border-border p-1.5 bg-background min-w-[90px]">{mode === 'months' ? 'Total [MH]' : ''}</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code, index) => <tr key={code} className={index % 2 ? 'bg-muted/30' : 'bg-background'}>
                  <th scope="row" className="border border-border p-1.5 text-left font-semibold sticky left-0 bg-inherit z-10 whitespace-nowrap">{code}</th>
                  {columns.map(period => {
                    const hours = rows.get(code)?.get(period.key) || 0;
                    return <td key={period.key} className={`border border-border p-1 text-center`}>
                      {hours > 0 ? <span data-project={code} className="project-hours-value inline-flex w-full justify-center rounded-md px-1.5 py-0.5 font-medium shadow-sm" title={`${code} · ${period.label}: ${hoursLabel(hours)} MH`}>{hoursLabel(hours)}</span> : <span className="text-muted-foreground">–</span>}
                    </td>;
                  })}
                  <td className="border border-border p-1.5 text-center font-bold bg-primary/5">{hoursLabel(columns.reduce((sum, p) => sum + (rows.get(code)?.get(p.key) || 0), 0))}</td>
                </tr>)}
                {codes.length === 0 && <tr><td colSpan={columns.length + 2} className="p-6 text-muted-foreground">{catalogLoading ? 'Loading projects…' : catalogError ? 'Unable to load projects.' : 'No planned project hours in this period.'}</td></tr>}
                {demandCodes.map(code => <tr key={`demand-${code}`} className="italic">
                  <th scope="row" className="border border-border p-1.5 text-left font-medium sticky left-0 bg-background z-10 whitespace-nowrap">{code} · plan</th>
                  {columns.map(period => {
                    const hours = demandRows.get(code)?.get(period.key) || 0;
                    return <td key={period.key} className={`border border-border p-1 text-center`}>
                      {hours > 0 ? <span data-project={code} className="project-plan-value inline-flex w-full justify-center rounded-md px-1.5 py-0.5 font-medium" title={`${code} demand · ${period.label}: ${hoursLabel(hours)} MH`}>{hoursLabel(hours)}</span> : <span className="text-muted-foreground">–</span>}
                    </td>;
                  })}
                  <td className="border border-border p-1.5 text-center font-semibold">{hoursLabel(columns.reduce((sum, p) => sum + (demandRows.get(code)?.get(p.key) || 0), 0))}</td>
                </tr>)}
                <tr className="bg-primary/5 border-t-2 border-primary/30 font-bold">
                  <th className="border border-border p-2 text-left sticky left-0 bg-background z-10">Total planned hours [MH]</th>
                  {columns.map(period => <td key={period.key} className="border border-border p-2 text-center" data-period={period.key}>{hoursLabel(totalFor(period.key))}</td>)}
                  <td className="border border-border p-2 text-center">{hoursLabel(columns.reduce((sum, p) => sum + totalFor(p.key), 0))}</td>
                </tr>
                {metrics.map(metric => <tr key={metric.key} className="bg-primary/5 font-semibold">
                  <th scope="row" className="border border-border p-2 text-left sticky left-0 bg-background z-10 whitespace-nowrap">{metric.label}</th>
                  {columns.map(period => <td key={period.key} className={`border border-border p-2 text-center`}>{metricLabel(summaries.get(period.key)?.[metric.key] || 0, metric.unit)}</td>)}
                  <td className="border border-border p-2 text-center">{metric.unit === 'hours' ? metricLabel(columns.reduce((sum, period) => sum + (summaries.get(period.key)?.[metric.key] || 0), 0), 'hours') : '–'}</td>
                </tr>)}
                {demandCodes.length > 0 && <>
                  <tr className="bg-primary/5 font-semibold">
                    <th scope="row" className="border border-border p-2 text-left sticky left-0 bg-background z-10 whitespace-nowrap">Planned demand [MH]</th>
                    {columns.map(period => <td key={period.key} className={`border border-border p-2 text-center`}>{hoursLabel(demandFor(period.key))}</td>)}
                    <td className="border border-border p-2 text-center">{hoursLabel(columns.reduce((sum, period) => sum + demandFor(period.key), 0))}</td>
                  </tr>
                  <tr className="bg-primary/5 font-bold">
                    <th scope="row" className="border border-border p-2 text-left sticky left-0 bg-background z-10 whitespace-nowrap">Balance [FTE]</th>
                    {columns.map(period => {
                      const balance = balanceFor(period.key);
                      return <td key={period.key} className={`border border-border p-2 text-center ${balance < 0 ? 'text-destructive' : 'text-chart-2'}`}>{balance.toFixed(1)}</td>;
                    })}
                    <td className="border border-border p-2 text-center">–</td>
                  </tr>
                </>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {catalog && <ProjectCapacityChart entries={filteredData} engineers={engineers} weeks={periods.weeks.map(w => w.key)} demand={chartDemand} statusByProject={catalog.statusByProject} blocked={blockedData} />}
    </div>
  );
}