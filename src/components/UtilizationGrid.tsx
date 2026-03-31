import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePlanning } from '@/contexts/PlanningContext';
import { useEngineers, UIEngineer } from '@/hooks/useEngineers';
import { useCustomEngineerViews } from '@/hooks/useCustomEngineerViews';
import { normalizeName } from '@/utils/nameNormalization';
import {
  getWorkingDaysInCW,
  getWorkingDaysInMonth,
  getISOWeekMonday,
  getWorkingDaysInWeekForMonth,
} from '@/utils/workingDays';
import { getWeek } from 'date-fns';
import { Calendar, BarChart3, Users, Save, Trash2, ChevronDown } from 'lucide-react';

// Regime activities excluded from utilization calculation
const REGIME_ACTIVITIES = ['FREE', 'OVER'];

// Company filter options
const companies = ['Všichni', 'MB Idea', 'AERTEC', 'TM-CZ'];

const engineerCompanyMapping: Record<string, string> = {
  'bohusik martin': 'MB Idea',
  'chrenko daniel': 'MB Idea',
  'chrenko peter': 'MB Idea',
  'pupava marian': 'MB Idea',
  'jurcisin peter': 'MB Idea',
  'ivan bellamy': 'AERTEC',
  'jose carreras': 'AERTEC',
  'marta lopez': 'AERTEC',
};

const getEngineerCompany = (name: string): string => {
  return engineerCompanyMapping[normalizeName(name)] || 'TM-CZ';
};

const getCurrentWeekAndYear = () => {
  const now = new Date();
  return {
    week: getWeek(now, { weekStartsOn: 1, firstWeekContainsDate: 4 }),
    year: now.getFullYear(),
  };
};

const getAllWeeks = (): string[] => {
  const { week: cw, year: cy } = getCurrentWeekAndYear();
  const weeks: string[] = [];
  let w = cw, y = cy;
  for (let i = 0; i < 52; i++) {
    weeks.push(`CW${w.toString().padStart(2, '0')}-${y}`);
    w++;
    if (w > 52) { w = 1; y++; }
  }
  return weeks;
};

const monthNumberToNameCZ: Record<number, string> = {
  1: 'leden', 2: 'únor', 3: 'březen', 4: 'duben', 5: 'květen', 6: 'červen',
  7: 'červenec', 8: 'srpen', 9: 'září', 10: 'říjen', 11: 'listopad', 12: 'prosinec',
};

const getMonthForWeek = (cwKey: string) => {
  const m = cwKey.match(/CW(\d+)-(\d+)/);
  if (!m) return null;
  const monday = getISOWeekMonday(parseInt(m[1]), parseInt(m[2]));
  const thu = new Date(monday);
  thu.setDate(monday.getDate() + 3);
  return { month: thu.getMonth() + 1, year: thu.getFullYear() };
};

interface MonthInfo {
  label: string;
  month: number;
  year: number;
  weeks: string[];
}

const generateMonths = (weeksList: string[]): MonthInfo[] => {
  const map = new Map<string, MonthInfo>();
  for (const cw of weeksList) {
    const mi = getMonthForWeek(cw);
    if (!mi) continue;
    const key = `${mi.month}-${mi.year}`;
    if (!map.has(key)) {
      map.set(key, {
        label: `${monthNumberToNameCZ[mi.month]} ${mi.year}`,
        month: mi.month,
        year: mi.year,
        weeks: [],
      });
    }
    map.get(key)!.weeks.push(cw);
  }
  return Array.from(map.values());
};

const getUtilizationColor = (pct: number): string => {
  if (pct < 20) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  if (pct < 80) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  if (pct <= 100) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
};

const parseCW = (cwKey: string): { cw: number; year: number } | null => {
  const m = cwKey.match(/CW(\d+)-(\d+)/);
  if (!m) return null;
  return { cw: parseInt(m[1]), year: parseInt(m[2]) };
};

export const UtilizationGrid: React.FC = () => {
  const { planningData } = usePlanning();
  const { engineers } = useEngineers();
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [companyFilter, setCompanyFilter] = useState('Všichni');
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);
  const [engineerSearch, setEngineerSearch] = useState('');
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null);
  const [customViewName, setCustomViewName] = useState('');
  const { customViews, saveView, deleteView } = useCustomEngineerViews();

  const allWeeks = useMemo(() => getAllWeeks(), []);
  const months = useMemo(() => generateMonths(allWeeks), [allWeeks]);

  // All active engineers after company filter (for checkbox list)
  const companyFilteredEngineers = useMemo(() => {
    let list = engineers.filter(e => e.status === 'active' || e.status === 'contractor');
    if (companyFilter !== 'Všichni') {
      list = list.filter(e => getEngineerCompany(e.jmeno) === companyFilter);
    }
    return list.sort((a, b) => a.jmeno.localeCompare(b.jmeno, 'cs'));
  }, [engineers, companyFilter]);

  const allEngineerNames = useMemo(() => companyFilteredEngineers.map(e => e.jmeno), [companyFilteredEngineers]);

  // Final filtered list (company + name selection)
  const filteredEngineers = useMemo(() => {
    if (selectedEngineers.length === 0) return companyFilteredEngineers;
    return companyFilteredEngineers.filter(e => selectedEngineers.includes(e.jmeno));
  }, [companyFilteredEngineers, selectedEngineers]);

  // Search-filtered list for the popover
  const searchFilteredNames = useMemo(() => {
    if (!engineerSearch) return allEngineerNames;
    const q = engineerSearch.toLowerCase();
    return allEngineerNames.filter(n => n.toLowerCase().includes(q));
  }, [allEngineerNames, engineerSearch]);

  const toggleEngineer = (name: string) => {
    setSelectedEngineers(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
    setSelectedViewId(null);
  };

  const loadCustomView = (viewId: string) => {
    const view = customViews.find(v => v.id === viewId);
    if (view) {
      setSelectedEngineers(view.engineers);
      setSelectedViewId(viewId);
    }
  };

  const handleSaveView = async () => {
    if (!customViewName.trim() || selectedEngineers.length === 0) return;
    const success = await saveView(customViewName.trim(), selectedEngineers);
    if (success) setCustomViewName('');
  };

  const handleDeleteView = async (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteView(viewId);
    if (selectedViewId === viewId) {
      setSelectedViewId(null);
      setSelectedEngineers([]);
    }
  };

  // Build hours lookup: engineerSlug -> cwKey -> totalHours (only project hours)
  const hoursMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const entry of planningData) {
      if (REGIME_ACTIVITIES.includes(entry.projekt)) continue;
      const slug = normalizeName(entry.konstrukter);
      if (!map.has(slug)) map.set(slug, new Map());
      const cwMap = map.get(slug)!;
      const hours = entry.mhTyden ?? 0;
      cwMap.set(entry.cw, (cwMap.get(entry.cw) || 0) + hours);
    }
    return map;
  }, [planningData]);

  const getEngineerHoursForWeek = (engineer: UIEngineer, cwKey: string): number => {
    const slug = normalizeName(engineer.jmeno);
    return hoursMap.get(slug)?.get(cwKey) || 0;
  };

  const isSlovak = (engineer: UIEngineer) => engineer.location === 'SK';

  // Weekly utilization
  // Proportional scaling: rawHours × (workingDays/5) / (workingDays×8) = rawHours / 40
  const getWeeklyUtilization = (engineer: UIEngineer, cwKey: string): number => {
    const hours = getEngineerHoursForWeek(engineer, cwKey);
    if (hours === 0) return 0;
    return (hours / 40) * 100;
  };

  // Monthly utilization with proportional splitting
  // Monthly: scale each week's hours proportionally, then sum for the month
  const getMonthlyUtilization = (engineer: UIEngineer, mi: MonthInfo): number => {
    const sk = isSlovak(engineer);
    const capacity = getWorkingDaysInMonth(mi.year, mi.month, sk) * 8;
    if (capacity === 0) return 0;

    let totalScaledHours = 0;
    for (const cwKey of mi.weeks) {
      const parsed = parseCW(cwKey);
      if (!parsed) continue;
      const weekHours = getEngineerHoursForWeek(engineer, cwKey);
      if (weekHours === 0) continue;

      // Scale hours proportionally: rawHours × (workingDays / 5)
      const workingDays = getWorkingDaysInCW(parsed.cw, parsed.year, sk);
      const scaledHours = weekHours * (workingDays / 5);

      // Split scaled hours into the month proportionally
      const monday = getISOWeekMonday(parsed.cw, parsed.year);
      const daysInMonth = getWorkingDaysInWeekForMonth(monday, mi.year, mi.month, sk);
      if (workingDays === 0) continue;
      totalScaledHours += scaledHours * (daysInMonth / workingDays);
    }

    return (totalScaledHours / capacity) * 100;
  };

  return (
    <Card className="mt-4 shadow-card-custom">
      <CardContent className="p-4">
        {/* Controls */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('weekly')}
              className="flex items-center gap-1.5 h-8 text-sm"
            >
              <Calendar className="h-3.5 w-3.5" />
              Týdny
            </Button>
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('monthly')}
              className="flex items-center gap-1.5 h-8 text-sm"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Měsíce
            </Button>
          </div>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {companies.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-auto text-xs text-muted-foreground">
            <span className="inline-block w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" /> &lt;20%
            <span className="inline-block w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700" /> 20-80%
            <span className="inline-block w-3 h-3 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700" /> 80-100%
            <span className="inline-block w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" /> &gt;100%
          </div>
        </div>

        {/* Grid — engineers on Y axis, time on X axis */}
        <div className="overflow-auto max-h-[70vh] border rounded-md">
          <table className="text-xs border-collapse w-max min-w-full">
            <thead className="sticky top-0 z-10 bg-card">
              <tr>
                <th className="sticky left-0 z-20 bg-card border px-3 py-2 text-left font-medium text-muted-foreground min-w-[140px]">
                  Konstruktér
                </th>
                {viewMode === 'weekly'
                  ? allWeeks.map(cwKey => {
                      const parsed = parseCW(cwKey);
                      return (
                        <th key={cwKey} className="border px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[55px] text-center">
                          {parsed ? `CW${parsed.cw}` : cwKey}
                        </th>
                      );
                    })
                  : months.map(mi => (
                      <th key={mi.label} className="border px-2 py-2 font-medium text-muted-foreground whitespace-nowrap min-w-[70px] text-center">
                        {mi.label}
                      </th>
                    ))}
              </tr>
            </thead>
            <tbody>
              {filteredEngineers.map(eng => (
                <tr key={eng.id} className="hover:bg-muted/30">
                  <td className="sticky left-0 z-[5] bg-card border px-3 py-1.5 font-medium text-muted-foreground whitespace-nowrap">
                    {eng.jmeno}
                  </td>
                  {viewMode === 'weekly'
                    ? allWeeks.map(cwKey => {
                        const pct = getWeeklyUtilization(eng, cwKey);
                        return (
                          <td key={cwKey} className={`border px-1 py-1.5 text-center font-mono ${getUtilizationColor(pct)}`}>
{`${Math.round(pct)}%`}
                          </td>
                        );
                      })
                    : months.map(mi => {
                        const pct = getMonthlyUtilization(eng, mi);
                        return (
                          <td key={mi.label} className={`border px-1 py-1.5 text-center font-mono ${getUtilizationColor(pct)}`}>
                            {`${Math.round(pct)}%`}
                          </td>
                        );
                      })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
