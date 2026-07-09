import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RAIL_EL_ENGINEERS } from '@/constants/railElEngineers';
import { normalizeName } from '@/utils/nameNormalization';
import { getWeekToMonthFractions } from '@/utils/workingDays';

interface Props {
  viewType: 'mesic' | 'kvartal';
  selectedQuarters: string[];
  selectedMonths: string[];
}

const QUARTER_MONTHS: Record<string, string[]> = {
  'Q3-FY25': ['říjen_2025', 'listopad_2025', 'prosinec_2025'],
  'Q4-FY25': ['leden_2026', 'únor_2026', 'březen_2026'],
  'Q1-FY26': ['duben_2026', 'květen_2026', 'červen_2026'],
  'Q2-FY26': ['červenec_2026', 'srpen_2026', 'září_2026'],
  'Q3-FY26': ['říjen_2026', 'listopad_2026', 'prosinec_2026'],
};

const isRegime = (v: string | null) =>
  !v || v === 'FREE' || v === 'DOVOLENÁ' || v === 'DOVOLENA' || v === 'NEMOC' || v === 'OVER';
const isFreeish = (v: string | null) => !v || v === 'FREE';

export const PlanningChangesTrendChart: React.FC<Props> = ({ viewType, selectedQuarters, selectedMonths }) => {
  const [rows, setRows] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const allowed = new Set(RAIL_EL_ENGINEERS.map(n => normalizeName(n)));
      const { data } = await supabase
        .from('planning_changes')
        .select('konstrukter, cw, year, change_type, old_value, new_value, changed_at')
        .eq('change_type', 'project')
        .order('changed_at', { ascending: false })
        .limit(5000);
      setRows((data || []).filter((c: any) => allowed.has(normalizeName(c.konstrukter))));
      setLoading(false);
    })();
  }, []);

  const targetMonths = useMemo(() => {
    if (viewType === 'kvartal') {
      return new Set(selectedQuarters.flatMap(q => QUARTER_MONTHS[q] || []));
    }
    return new Set(selectedMonths);
  }, [viewType, selectedQuarters, selectedMonths]);

  const chartData = useMemo(() => {
    if (!rows) return [];
    const byWeek: Record<string, { key: string; sortKey: number; allocated: number; deallocated: number }> = {};
    for (const c of rows) {
      if (!c.cw || !c.year) continue;
      const cwKey = `${c.cw}-${c.year}`;
      const fractions = getWeekToMonthFractions(cwKey);
      if (fractions.length === 0) continue;
      if (targetMonths.size > 0) {
        const inPeriod = fractions.some(f => targetMonths.has(f.monthKey));
        if (!inPeriod) continue;
      }


      const alloc = isFreeish(c.old_value) && !isRegime(c.new_value);
      const dealloc = !isRegime(c.old_value) && isFreeish(c.new_value);
      if (!alloc && !dealloc) continue;

      const cwNum = parseInt(String(c.cw).replace('CW', ''), 10);
      const key = `${c.cw}/${c.year}`;
      const shortLabel = `${c.cw}/${String(c.year).slice(-2)}`;
      const sortKey = c.year * 100 + cwNum;
      if (!byWeek[key]) byWeek[key] = { key, sortKey, allocated: 0, deallocated: 0, shortLabel } as any;
      if (alloc) byWeek[key].allocated += 1;
      if (dealloc) byWeek[key].deallocated += 1;
    }
    return Object.values(byWeek)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ key, allocated, deallocated, shortLabel }: any) => ({
        week: shortLabel,
        fullWeek: key,
        Allocations: allocated,
        Deallocations: -deallocated,
        Net: allocated - deallocated,
      }));

  }, [rows, targetMonths]);

  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Planning Changes Trend (RAIL+EL, by week)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
            No planning changes for the selected period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} stackOffset="sign" margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) => [Math.abs(value), name]}
                labelFormatter={(l) => `Week ${l}`}
              />
              <Legend />
              <Bar dataKey="Allocations" stackId="s" fill="hsl(142 71% 45%)" />
              <Bar dataKey="Deallocations" stackId="s" fill="hsl(0 72% 55%)" />

            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
